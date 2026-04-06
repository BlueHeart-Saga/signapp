import os
import stripe
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
from bson import ObjectId
import asyncio
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status, Request
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict, ValidationInfo

from database import db
from routes.auth import get_current_user

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Configure router
router = APIRouter(prefix="/subscription", tags=["Subscription"])
logger = logging.getLogger(__name__)

# ============================================
# ASYNC DATABASE HELPER FUNCTIONS
# ============================================

async def db_find_one(collection, filter):
    """Run find_one in thread pool"""
    return await asyncio.to_thread(collection.find_one, filter)

async def db_find(collection, filter=None, sort=None, limit=None):
    """Run find in thread pool and return list"""
    if filter is None:
        filter = {}
    
    def _find():
        cursor = collection.find(filter)
        if sort:
            cursor = cursor.sort(sort)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    return await asyncio.to_thread(_find)

async def db_insert_one(collection, document):
    """Run insert_one in thread pool"""
    return await asyncio.to_thread(collection.insert_one, document)

async def db_insert_many(collection, documents):
    """Run insert_many in thread pool"""
    return await asyncio.to_thread(collection.insert_many, documents)

async def db_update_one(collection, filter, update, upsert=False):
    """Run update_one in thread pool"""
    return await asyncio.to_thread(collection.update_one, filter, update, upsert=upsert)

async def db_update_many(collection, filter, update):
    """Run update_many in thread pool"""
    return await asyncio.to_thread(collection.update_many, filter, update)

async def db_delete_many(collection, filter):
    """Run delete_many in thread pool"""
    return await asyncio.to_thread(collection.delete_many, filter)

# ============================================
# DATABASE COLLECTIONS
# ============================================
# Get collections from db
users_collection = db["users"]
subscriptions_collection = db["subscriptions"]
payments_collection = db["payments"]

# ============================================
# ENUMS & CONSTANTS
# ============================================
class PlanType(str, Enum):
    FREE_TRIAL = "free_trial"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"

class PaymentStatus(str, Enum):
    COMPLETED = "completed"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"

# Plan configuration
PLAN_CONFIG = {
    PlanType.FREE_TRIAL: {
        "name": "Free Trial",
        "description": "Try all features free for 15 days",
        "price": 0,
        "duration_days": 15,
        "stripe_price_id": None,  # No Stripe price ID for free trial
        "features": [
            "Full access to all features",
            "15 days trial period",
            "No credit card required"
        ],
        "is_popular": False
    },
    PlanType.MONTHLY: {
        "name": "Monthly Plan",
        "description": "Full access, pay monthly. Cancel anytime.",
        "price": 9.99,
        "duration_days": 30,
        "stripe_price_id": os.getenv("STRIPE_MONTHLY_PRICE_ID", "price_monthly"),
        "features": [
            "Unlimited documents",
            "Priority support",
            "Audit trails",
            "Cancel anytime"
        ],
        "is_popular": False
    },
    PlanType.YEARLY: {
        "name": "Yearly Plan",
        "description": "Best value - 2 months free. Full access for one year.",
        "price": 99.99,
        "duration_days": 365,
        "stripe_price_id": os.getenv("STRIPE_YEARLY_PRICE_ID", "price_yearly"),
        "features": [
            "All Monthly features",
            "2 months free",
            "Best value",
            "Priority support"
        ],
        "is_popular": True,
        "savings": "Save 16%"
    },
    PlanType.ENTERPRISE: {
        "name": "Enterprise",
        "description": "Custom plans for teams and organizations",
        "price": 0,  # Base price, actual price will be negotiated
        "duration_days": 365,  # Default 1 year, can be customized
        "stripe_price_id": None,  # Custom pricing
        "features": [
            "Custom duration",
            "Team management",
            "Dedicated support",
            "SLA guarantee",
            "Custom features"
        ],
        "is_popular": False
    }
}

# ============================================
# PYDANTIC MODELS
# ============================================
class SubscriptionCreate(BaseModel):
    plan_type: PlanType
    payment_method_id: Optional[str] = None
    custom_duration_days: Optional[int] = Field(None, ge=30, le=1095)  # 30 days to 3 years
    custom_price: Optional[float] = Field(None, ge=0)
    enterprise_requirements: Optional[str] = None
    
    @field_validator('plan_type')
    def validate_plan_type(cls, v):
        if v == PlanType.FREE_TRIAL:
            raise ValueError("Free trial cannot be manually subscribed")
        return v
    
    @field_validator('custom_duration_days', 'custom_price')
    def validate_enterprise_fields(cls, v, info: ValidationInfo):
        if info.data.get('plan_type') == PlanType.ENTERPRISE:
            # Enterprise fields are optional
            return v
        return None

class SubscriptionChangeRequest(BaseModel):
    new_plan_type: PlanType
    payment_method_id: Optional[str] = None
    proration_date: Optional[int] = None
    custom_duration_days: Optional[int] = Field(None, ge=30, le=1095)
    custom_price: Optional[float] = Field(None, ge=0)

class SubscriptionResponse(BaseModel):
    id: str
    user_email: str
    user_name: str
    plan_type: PlanType
    plan_name: str
    status: SubscriptionStatus
    start_date: datetime
    expiry_date: datetime
    days_remaining: int
    is_active: bool
    price: float
    auto_renew: bool
    stripe_subscription_id: Optional[str]
    stripe_customer_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(
        use_enum_values=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class PlanInfo(BaseModel):
    plan_type: PlanType
    name: str
    description: str
    price: float
    duration_days: int
    features: List[str]
    is_popular: bool = False
    savings: Optional[str] = None
    requires_custom_pricing: bool = False
    stripe_price_id: Optional[str]

class SubscriptionStatusResponse(BaseModel):
    has_active_subscription: bool
    status: str
    plan_type: Optional[PlanType] = None
    plan_name: Optional[str] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    days_remaining: int = 0
    message: str
    can_change_plan: bool = True

class AccessCheckResponse(BaseModel):
    has_access: bool
    message: str
    requires_subscription: bool = True
    plan_type: Optional[PlanType] = None
    plan_name: Optional[str] = None
    expiry_date: Optional[datetime] = None
    days_remaining: int = 0

class PaymentResponse(BaseModel):
    id: str
    amount: float
    plan_type: PlanType
    payment_method: str
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str]
    transaction_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class SubscriptionHistoryResponse(BaseModel):
    subscriptions: List[Dict[str, Any]]
    payments: List[PaymentResponse]
    statistics: Dict[str, Any]

class CreatePaymentIntentRequest(BaseModel):
    plan_type: PlanType
    custom_price: Optional[float] = None
    custom_duration_days: Optional[int] = None

class CreatePaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: float
    plan_type: PlanType

class EnterpriseQuoteRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    message: str

# ============================================
# HELPER FUNCTIONS
# ============================================
class SubscriptionHelper:
    """Helper class for subscription operations"""
    
    @staticmethod
    def calculate_expiry_date(plan_type: PlanType, start_date: Optional[datetime] = None, custom_days: Optional[int] = None) -> datetime:
        """Calculate expiry date based on plan type"""
        if start_date is None:
            start_date = datetime.utcnow()
        
        if plan_type == PlanType.ENTERPRISE and custom_days:
            duration_days = custom_days
        else:
            plan_config = PLAN_CONFIG.get(plan_type)
            if not plan_config:
                raise ValueError(f"Invalid plan type: {plan_type}")
            duration_days = plan_config["duration_days"]
        
        return start_date + timedelta(days=duration_days)
    
    @staticmethod
    def get_days_remaining(expiry_date: Optional[datetime]) -> int:
        """Calculate days remaining until expiry"""
        if not expiry_date:
            return 0
        
        remaining = expiry_date - datetime.utcnow()
        return max(0, remaining.days)
    
    @staticmethod
    def is_active(expiry_date: Optional[datetime]) -> bool:
        """Check if subscription is still within valid period"""
        if not expiry_date:
            return False
        return datetime.utcnow() < expiry_date
    
    @staticmethod
    def generate_transaction_id(prefix: str = "TXN") -> str:
        """Generate unique transaction ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        return f"{prefix}{timestamp}{ObjectId()}"

async def create_stripe_customer(email: str, name: str) -> str:
    """Create a Stripe customer"""
    try:
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={
                "source": "subscription_system"
            }
        )
        return customer.id
    except stripe.error.StripeError as e:
        logger.error(f"Stripe customer creation error: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

async def get_or_create_stripe_customer(email: str, name: str) -> str:
    """Get existing Stripe customer or create new one"""
    user = await db_find_one(users_collection, {"email": email})
    
    if user and user.get("stripe_customer_id"):
        return user["stripe_customer_id"]
    
    # Create new Stripe customer
    customer_id = await create_stripe_customer(email, name)
    
    # Save to user record
    await db_update_one(
        users_collection,
        {"email": email},
        {"$set": {"stripe_customer_id": customer_id}}
    )
    
    return customer_id

async def update_user_subscription_status(
    email: str, 
    has_active: bool, 
    plan_type: Optional[PlanType] = None, 
    expiry: Optional[datetime] = None,
    stripe_subscription_id: Optional[str] = None
) -> None:
    """Update user document with subscription info"""
    update_data = {
        "has_active_subscription": has_active,
        "is_premium": has_active,
        "subscription_updated_at": datetime.utcnow()
    }
    
    if plan_type:
        update_data["subscription_plan"] = plan_type.value if isinstance(plan_type, PlanType) else plan_type
    
    if expiry:
        update_data["subscription_expiry"] = expiry
    
    if stripe_subscription_id:
        update_data["stripe_subscription_id"] = stripe_subscription_id
    
    await db_update_one(
        users_collection,
        {"email": email},
        {"$set": update_data}
    )

async def get_active_subscription(email: str) -> Optional[Dict[str, Any]]:
    """Get user's active subscription"""
    try:
        subscription = await db_find_one(
            subscriptions_collection,
            {
                "user_email": email,
                "status": SubscriptionStatus.ACTIVE.value
            }
        )
        return subscription
    except Exception as e:
        logger.error(f"Error getting active subscription: {e}")
        return None

async def deactivate_user_subscriptions(email: str, exclude_id: Optional[str] = None) -> None:
    """Deactivate all active subscriptions for a user"""
    query = {"user_email": email, "status": SubscriptionStatus.ACTIVE.value}
    if exclude_id:
        query["_id"] = {"$ne": ObjectId(exclude_id)}
    
    await db_update_many(
        subscriptions_collection,
        query,
        {"$set": {
            "status": SubscriptionStatus.CANCELLED.value,
            "cancelled_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )

async def create_subscription_record(
    email: str,
    name: str,
    plan_type: PlanType,
    start_date: datetime,
    expiry_date: datetime,
    transaction_id: str,
    stripe_subscription_id: Optional[str] = None,
    stripe_customer_id: Optional[str] = None,
    payment_method: str = "stripe",
    payment_status: PaymentStatus = PaymentStatus.COMPLETED,
    price: Optional[float] = None,
    metadata: Optional[Dict] = None
) -> str:
    """Create new subscription record in database"""
    
    plan_config = PLAN_CONFIG.get(plan_type, {})
    final_price = price if price is not None else plan_config.get("price", 0)
    
    subscription = {
        "user_email": email,
        "user_name": name,
        "plan_type": plan_type.value,
        "status": SubscriptionStatus.ACTIVE.value,
        "start_date": start_date,
        "expiry_date": expiry_date,
        "price": final_price,
        "created_at": start_date,
        "updated_at": start_date,
        "payment_method": payment_method,
        "transaction_id": transaction_id,
        "payment_status": payment_status.value,
        "auto_renew": plan_config.get("auto_renew", False) if plan_type != PlanType.ENTERPRISE else False,
        "stripe_subscription_id": stripe_subscription_id,
        "stripe_customer_id": stripe_customer_id,
        "metadata": metadata or {}
    }
    
    result = await db_insert_one(subscriptions_collection, subscription)
    return str(result.inserted_id)

async def record_payment(
    email: str,
    amount: float,
    plan_type: PlanType,
    transaction_id: str,
    subscription_id: str,
    stripe_payment_intent_id: Optional[str] = None,
    payment_method: str = "stripe",
    status: PaymentStatus = PaymentStatus.COMPLETED,
    metadata: Optional[Dict] = None
) -> str:
    """Record payment in database"""
    
    payment = {
        "user_email": email,
        "amount": amount,
        "plan_type": plan_type.value,
        "payment_method": payment_method,
        "payment_status": status.value,
        "transaction_id": transaction_id,
        "subscription_id": subscription_id,
        "stripe_payment_intent_id": stripe_payment_intent_id,
        "created_at": datetime.utcnow(),
        "metadata": metadata or {}
    }
    
    result = await db_insert_one(payments_collection, payment)
    return str(result.inserted_id)

async def get_most_recent_subscription(email: str) -> Optional[Dict[str, Any]]:
    """Get user's most recent subscription"""
    try:
        subscriptions = await db_find(
            subscriptions_collection,
            {"user_email": email},
            sort=[("created_at", -1)],
            limit=1
        )
        return subscriptions[0] if subscriptions else None
    except Exception as e:
        logger.error(f"Error getting most recent subscription: {e}")
        return None

async def get_all_subscriptions(email: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all subscriptions for a user"""
    try:
        return await db_find(
            subscriptions_collection,
            {"user_email": email},
            sort=[("created_at", -1)],
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting all subscriptions: {e}")
        return []

async def get_all_payments(email: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all payments for a user"""
    try:
        return await db_find(
            payments_collection,
            {"user_email": email},
            sort=[("created_at", -1)],
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting all payments: {e}")
        return []

async def calculate_proration(current_subscription: Dict, new_plan_type: PlanType) -> Dict:
    """Calculate proration amount when changing plans"""
    try:
        if not current_subscription.get("stripe_subscription_id"):
            return {"credit_amount": 0, "new_amount": PLAN_CONFIG[new_plan_type]["price"]}
        
        # Get Stripe subscription
        stripe_sub = stripe.Subscription.retrieve(current_subscription["stripe_subscription_id"])
        
        # Get new price
        new_price_id = PLAN_CONFIG[new_plan_type]["stripe_price_id"]
        if not new_price_id:
            return {"credit_amount": 0, "new_amount": PLAN_CONFIG[new_plan_type]["price"]}
        
        # Calculate proration
        invoice = stripe.Invoice.upcoming(
            customer=stripe_sub.customer,
            subscription=stripe_sub.id,
            subscription_items=[{
                'id': stripe_sub['items']['data'][0].id,
                'price': new_price_id,
            }],
        )
        
        # Calculate credit and new amount
        lines = invoice.lines.data
        credit = 0
        new_charge = 0
        
        for line in lines:
            if line.period.start < stripe_sub.current_period_start:
                # This is a proration for unused time
                credit += line.amount
            else:
                # This is the new subscription amount
                new_charge += line.amount
        
        return {
            "credit_amount": abs(credit) / 100,  # Convert from cents
            "new_amount": new_charge / 100,
            "total_due": invoice.total / 100,
            "proration_date": invoice.lines.data[0].period.start if invoice.lines.data else None
        }
    except Exception as e:
        logger.error(f"Error calculating proration: {e}")
        return {"credit_amount": 0, "new_amount": PLAN_CONFIG[new_plan_type]["price"]}

# ============================================
# SUBSCRIPTION ROUTES
# ============================================
@router.get("/plans", response_model=List[PlanInfo])
async def get_available_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_type, config in PLAN_CONFIG.items():
        plan_info = PlanInfo(
            plan_type=plan_type,
            name=config["name"],
            description=config["description"],
            price=config["price"],
            duration_days=config["duration_days"],
            features=config.get("features", []),
            is_popular=config.get("is_popular", False),
            savings=config.get("savings"),
            requires_custom_pricing=(plan_type == PlanType.ENTERPRISE),
            stripe_price_id=config.get("stripe_price_id")
        )
        plans.append(plan_info)
    
    return plans

@router.post("/create-payment-intent", response_model=CreatePaymentIntentResponse)
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    user: dict = Depends(get_current_user)
):
    """Create a Stripe payment intent for subscription"""
    try:
        user_email = user.get("email")
        user_name = user.get("full_name", "")
        
        # Get or create Stripe customer
        customer_id = await get_or_create_stripe_customer(user_email, user_name)
        
        # Determine amount
        if request.plan_type == PlanType.ENTERPRISE and request.custom_price:
            amount = int(request.custom_price * 100)  # Convert to cents
        else:
            amount = int(PLAN_CONFIG[request.plan_type]["price"] * 100)
        
        # Create payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            customer=customer_id,
            metadata={
                'plan_type': request.plan_type.value,
                'user_email': user_email,
                'custom_duration': str(request.custom_duration_days) if request.custom_duration_days else ''
            }
        )
        
        return CreatePaymentIntentResponse(
            client_secret=payment_intent.client_secret,
            payment_intent_id=payment_intent.id,
            amount=amount / 100,
            plan_type=request.plan_type
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment intent")

@router.post("/subscribe")
async def create_subscription(
    request: SubscriptionCreate,
    user: dict = Depends(get_current_user)
):
    """
    Create a new subscription
    User can subscribe even if they have existing subscription (will be replaced)
    """
    user_email = user.get("email")
    user_name = user.get("full_name", "")
    
    try:
        # Check for existing active subscription
        existing = await get_active_subscription(user_email)
        
        # Get Stripe customer
        customer_id = await get_or_create_stripe_customer(user_email, user_name)
        
        # Create Stripe subscription if not free trial
        stripe_subscription_id = None
        if request.plan_type != PlanType.FREE_TRIAL:
            # Confirm payment intent
            if not request.payment_method_id:
                raise HTTPException(status_code=400, detail="Payment method required")
            
            # Create subscription in Stripe
            price_id = PLAN_CONFIG[request.plan_type]["stripe_price_id"]
            
            if request.plan_type == PlanType.ENTERPRISE and price_id is None:
                # For enterprise, we just record the payment intent
                payment_intent = stripe.PaymentIntent.retrieve(request.payment_method_id)
                if payment_intent.status != 'succeeded':
                    raise HTTPException(status_code=400, detail="Payment not successful")
                stripe_subscription_id = payment_intent.id
            else:
                # Regular subscription
                subscription = stripe.Subscription.create(
                    customer=customer_id,
                    items=[{'price': price_id}],
                    payment_behavior='default_incomplete',
                    payment_settings={'save_default_payment_method': 'on_subscription'},
                    expand=['latest_invoice.payment_intent'],
                    metadata={
                        'user_email': user_email,
                        'plan_type': request.plan_type.value
                    }
                )
                stripe_subscription_id = subscription.id
        
        # Deactivate any existing subscriptions (user can change plans freely)
        await deactivate_user_subscriptions(user_email)
        
        # Create new subscription
        start_date = datetime.utcnow()
        expiry_date = SubscriptionHelper.calculate_expiry_date(
            request.plan_type, 
            start_date, 
            request.custom_duration_days
        )
        transaction_id = SubscriptionHelper.generate_transaction_id()
        
        # Determine final price
        final_price = request.custom_price if request.custom_price else PLAN_CONFIG[request.plan_type]["price"]
        
        # Create subscription record
        subscription_id = await create_subscription_record(
            email=user_email,
            name=user_name,
            plan_type=request.plan_type,
            start_date=start_date,
            expiry_date=expiry_date,
            transaction_id=transaction_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=customer_id,
            payment_method="stripe" if request.plan_type != PlanType.FREE_TRIAL else "free_trial",
            price=final_price,
            metadata={
                "custom_duration": request.custom_duration_days,
                "enterprise_requirements": request.enterprise_requirements
            }
        )
        
        # Record payment if not free trial
        if request.plan_type != PlanType.FREE_TRIAL:
            await record_payment(
                email=user_email,
                amount=final_price,
                plan_type=request.plan_type,
                transaction_id=transaction_id,
                subscription_id=subscription_id,
                stripe_payment_intent_id=request.payment_method_id,
                metadata={"stripe_subscription_id": stripe_subscription_id}
            )
        
        # Update user document
        await update_user_subscription_status(
            user_email, 
            True, 
            request.plan_type, 
            expiry_date,
            stripe_subscription_id
        )
        
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        plan_config = PLAN_CONFIG[request.plan_type]
        
        return {
            "message": f"Successfully subscribed to {plan_config['name']}",
            "success": True,
            "subscription": {
                "id": subscription_id,
                "plan_type": request.plan_type.value,
                "plan_name": plan_config["name"],
                "start_date": start_date,
                "expiry_date": expiry_date,
                "days_remaining": days_remaining,
                "price": final_price,
                "transaction_id": transaction_id,
                "stripe_subscription_id": stripe_subscription_id
            }
        }
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )

@router.post("/change-plan")
async def change_plan(
    request: SubscriptionChangeRequest,
    user: dict = Depends(get_current_user)
):
    """
    Change subscription plan
    User can switch between plans at any time
    """
    user_email = user.get("email")
    user_name = user.get("full_name", "")
    
    try:
        # Get current active subscription
        current_sub = await get_active_subscription(user_email)
        
        if not current_sub:
            raise HTTPException(
                status_code=404,
                detail="No active subscription found to change"
            )
        
        # Calculate proration
        proration_info = await calculate_proration(current_sub, request.new_plan_type)
        
        # Get Stripe customer
        customer_id = await get_or_create_stripe_customer(user_email, user_name)
        
        # Update Stripe subscription if exists
        if current_sub.get("stripe_subscription_id"):
            try:
                # Update subscription in Stripe
                stripe_sub = stripe.Subscription.retrieve(current_sub["stripe_subscription_id"])
                
                new_price_id = PLAN_CONFIG[request.new_plan_type]["stripe_price_id"]
                if new_price_id:
                    # Update subscription item
                    stripe.Subscription.modify(
                        stripe_sub.id,
                        items=[{
                            'id': stripe_sub['items']['data'][0].id,
                            'price': new_price_id,
                        }],
                        proration_behavior='always_invoice',
                        payment_behavior='default_incomplete'
                    )
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error during plan change: {e}")
                # Continue with local subscription change even if Stripe fails
        
        # Deactivate current subscription
        await deactivate_user_subscriptions(user_email, exclude_id=str(current_sub["_id"]))
        
        # Create new subscription
        start_date = datetime.utcnow()
        expiry_date = SubscriptionHelper.calculate_expiry_date(
            request.new_plan_type, 
            start_date, 
            request.custom_duration_days
        )
        transaction_id = SubscriptionHelper.generate_transaction_id("CHG")
        
        # Determine final price
        final_price = request.custom_price if request.custom_price else PLAN_CONFIG[request.new_plan_type]["price"]
        
        # Create subscription record
        subscription_id = await create_subscription_record(
            email=user_email,
            name=user_name,
            plan_type=request.new_plan_type,
            start_date=start_date,
            expiry_date=expiry_date,
            transaction_id=transaction_id,
            stripe_subscription_id=current_sub.get("stripe_subscription_id"),
            stripe_customer_id=customer_id,
            price=final_price,
            metadata={
                "changed_from": str(current_sub["_id"]),
                "previous_plan": current_sub["plan_type"],
                "proration": proration_info
            }
        )
        
        # Update user document
        await update_user_subscription_status(
            user_email, 
            True, 
            request.new_plan_type, 
            expiry_date,
            current_sub.get("stripe_subscription_id")
        )
        
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        plan_config = PLAN_CONFIG[request.new_plan_type]
        
        return {
            "message": f"Successfully changed to {plan_config['name']}",
            "success": True,
            "proration": proration_info,
            "subscription": {
                "id": subscription_id,
                "plan_type": request.new_plan_type.value,
                "plan_name": plan_config["name"],
                "start_date": start_date,
                "expiry_date": expiry_date,
                "days_remaining": days_remaining,
                "price": final_price
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change plan"
        )

@router.post("/enterprise-quote")
async def request_enterprise_quote(
    request: EnterpriseQuoteRequest,
    user: dict = Depends(get_current_user)
):
    """Submit enterprise contact request"""

    try:
        quote_data = {
            "name": request.name,
            "email": request.email,
            "company": request.company,
            "phone": request.phone,
            "message": request.message,
            "status": "pending",
            "created_at": datetime.utcnow()
        }

        await db_insert_one(db["enterprise_contacts"], quote_data)

        return {
            "success": True,
            "message": "Your request has been submitted. Our team will contact you shortly."
        }

    except Exception as e:
        logger.error(f"Enterprise contact error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit request"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event['type'] == 'invoice.payment_succeeded':
        # Handle successful payment
        invoice = event['data']['object']
        # Update subscription status
        await handle_successful_payment(invoice)
        
    elif event['type'] == 'invoice.payment_failed':
        # Handle failed payment
        invoice = event['data']['object']
        await handle_failed_payment(invoice)
        
    elif event['type'] == 'customer.subscription.deleted':
        # Handle subscription cancellation
        subscription = event['data']['object']
        await handle_subscription_cancelled(subscription)
    
    return {"status": "success"}

async def handle_successful_payment(invoice):
    """Handle successful Stripe payment"""
    try:
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        
        # Find user by stripe_customer_id
        user = await db_find_one(users_collection, {"stripe_customer_id": customer_id})
        if not user:
            return
        
        # Update payment record
        await db_update_one(
            payments_collection,
            {"stripe_payment_intent_id": invoice.get('payment_intent')},
            {"$set": {"payment_status": PaymentStatus.COMPLETED.value}}
        )
        
    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")

async def handle_failed_payment(invoice):
    """Handle failed Stripe payment"""
    try:
        customer_id = invoice.get('customer')
        
        # Find user
        user = await db_find_one(users_collection, {"stripe_customer_id": customer_id})
        if not user:
            return
        
        # Update subscription status
        await db_update_one(
            subscriptions_collection,
            {"user_email": user['email'], "status": SubscriptionStatus.ACTIVE.value},
            {"$set": {"status": SubscriptionStatus.PENDING.value}}
        )
        
    except Exception as e:
        logger.error(f"Error handling failed payment: {e}")

async def handle_subscription_cancelled(stripe_subscription):
    """Handle cancelled Stripe subscription"""
    try:
        # Find subscription in database
        subscription = await db_find_one(
            subscriptions_collection,
            {"stripe_subscription_id": stripe_subscription.id}
        )
        
        if subscription:
            # Update status
            await db_update_one(
                subscriptions_collection,
                {"_id": subscription["_id"]},
                {"$set": {"status": SubscriptionStatus.CANCELLED.value}}
            )
            
            # Update user
            await update_user_subscription_status(
                subscription["user_email"],
                False
            )
            
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {e}")

@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(user: dict = Depends(get_current_user)):
    """
    Get current user's subscription status
    Automatically creates free trial for new users
    """
    user_email = user.get("email")
    user_name = user.get("full_name", "")
    
    try:
        # Find user's active subscription
        subscription = await get_active_subscription(user_email)
        
        # No active subscription found
        if not subscription:
            # Check if user ever had a subscription
            any_sub = await get_most_recent_subscription(user_email)
            
            if any_sub:
                # User has expired subscription
                plan_type_val = any_sub.get("plan_type")
                plan_type = PlanType(plan_type_val) if plan_type_val else None
                
                return SubscriptionStatusResponse(
                    has_active_subscription=False,
                    status=SubscriptionStatus.EXPIRED.value,
                    plan_type=plan_type,
                    plan_name=PLAN_CONFIG[plan_type]["name"] if plan_type else None,
                    start_date=any_sub.get("start_date"),
                    expiry_date=any_sub.get("expiry_date"),
                    days_remaining=0,
                    message="Your subscription has expired. Please renew to continue using all features.",
                    can_change_plan=True
                )
            else:
                # Brand new user - create free trial
                return await create_free_trial(user_email, user_name)
        
        # Check subscription validity
        expiry_date = subscription.get("expiry_date")
        is_active = SubscriptionHelper.is_active(expiry_date)
        plan_type = PlanType(subscription["plan_type"])
        
        if not is_active:
            # Auto-update expired subscription
            await db_update_one(
                subscriptions_collection,
                {"_id": subscription["_id"]},
                {"$set": {
                    "status": SubscriptionStatus.EXPIRED.value,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            await update_user_subscription_status(user_email, False)
            
            return SubscriptionStatusResponse(
                has_active_subscription=False,
                status=SubscriptionStatus.EXPIRED.value,
                plan_type=plan_type,
                plan_name=PLAN_CONFIG[plan_type]["name"],
                start_date=subscription.get("start_date"),
                expiry_date=expiry_date,
                days_remaining=0,
                message="Your subscription has expired. Please renew to continue.",
                can_change_plan=True
            )
        
        # Active subscription
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        
        return SubscriptionStatusResponse(
            has_active_subscription=True,
            status=SubscriptionStatus.ACTIVE.value,
            plan_type=plan_type,
            plan_name=PLAN_CONFIG[plan_type]["name"],
            start_date=subscription.get("start_date"),
            expiry_date=expiry_date,
            days_remaining=days_remaining,
            message=f"Your {PLAN_CONFIG[plan_type]['name']} is active for {days_remaining} more days",
            can_change_plan=True  # Users can always change plan
        )
    except Exception as e:
        logger.error(f"Error in get_subscription_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving subscription status"
        )

async def create_free_trial(email: str, name: str = "") -> SubscriptionStatusResponse:
    """Create free trial for new user"""
    try:
        start_date = datetime.utcnow()
        expiry_date = SubscriptionHelper.calculate_expiry_date(PlanType.FREE_TRIAL, start_date)
        transaction_id = SubscriptionHelper.generate_transaction_id("TRIAL")
        
        # Create subscription
        subscription_id = await create_subscription_record(
            email=email,
            name=name,
            plan_type=PlanType.FREE_TRIAL,
            start_date=start_date,
            expiry_date=expiry_date,
            transaction_id=transaction_id,
            payment_method="free_trial",
            metadata={"source": "auto_trial"}
        )
        
        # Update user document
        await update_user_subscription_status(
            email, 
            True, 
            PlanType.FREE_TRIAL, 
            expiry_date
        )
        
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        
        return SubscriptionStatusResponse(
            has_active_subscription=True,
            status=SubscriptionStatus.ACTIVE.value,
            plan_type=PlanType.FREE_TRIAL,
            plan_name=PLAN_CONFIG[PlanType.FREE_TRIAL]["name"],
            start_date=start_date,
            expiry_date=expiry_date,
            days_remaining=days_remaining,
            message="Welcome! Your 15-day free trial has started. Enjoy full access to all features!",
            can_change_plan=True
        )
    except Exception as e:
        logger.error(f"Error creating free trial: {e}")
        # Return a basic response if trial creation fails
        return SubscriptionStatusResponse(
            has_active_subscription=False,
            status=SubscriptionStatus.PENDING.value,
            days_remaining=0,
            message="Unable to create free trial. Please try again later.",
            can_change_plan=True
        )

@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """
    Cancel active subscription
    User keeps access until expiry date
    """
    user_email = user.get("email")
    
    try:
        # Find active subscription
        subscription = await get_active_subscription(user_email)
        
        if not subscription:
            raise HTTPException(
                status_code=404,
                detail="No active subscription found to cancel"
            )
        
        # Check if already expired
        if not SubscriptionHelper.is_active(subscription.get("expiry_date")):
            # Mark as expired
            await db_update_one(
                subscriptions_collection,
                {"_id": subscription["_id"]},
                {"$set": {
                    "status": SubscriptionStatus.EXPIRED.value,
                    "updated_at": datetime.utcnow()
                }}
            )
            await update_user_subscription_status(user_email, False)
            raise HTTPException(
                status_code=400,
                detail="Your subscription has already expired"
            )
        
        # Cancel Stripe subscription if exists
        if subscription.get("stripe_subscription_id"):
            try:
                stripe.Subscription.delete(subscription["stripe_subscription_id"])
            except stripe.error.StripeError as e:
                logger.error(f"Stripe cancellation error: {e}")
        
        # Cancel subscription (keep active until expiry)
        await db_update_one(
            subscriptions_collection,
            {"_id": subscription["_id"]},
            {
                "$set": {
                    "status": SubscriptionStatus.CANCELLED.value,
                    "cancelled_at": datetime.utcnow(),
                    "auto_renew": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # User remains active until expiry
        expiry_date = subscription["expiry_date"]
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        plan_type = PlanType(subscription["plan_type"])
        
        return {
            "message": f"Subscription cancelled successfully. You'll have access until {expiry_date.strftime('%Y-%m-%d')} ({days_remaining} days)",
            "access_until": expiry_date,
            "days_remaining": days_remaining,
            "plan_type": plan_type.value,
            "plan_name": PLAN_CONFIG[plan_type]["name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )

@router.post("/renew")
async def renew_subscription(user: dict = Depends(get_current_user)):
    """
    Renew an expired subscription
    User gets a new period with same plan
    """
    user_email = user.get("email")
    user_name = user.get("full_name", "")
    
    try:
        # Find most recent subscription
        last_sub = await get_most_recent_subscription(user_email)
        
        if not last_sub:
            raise HTTPException(
                status_code=404,
                detail="No previous subscription found. Please subscribe to a new plan."
            )
        
        # Check if already active
        active = await get_active_subscription(user_email)
        
        if active and SubscriptionHelper.is_active(active.get("expiry_date")):
            days_left = SubscriptionHelper.get_days_remaining(active["expiry_date"])
            raise HTTPException(
                status_code=400,
                detail=f"You already have an active subscription with {days_left} days remaining"
            )
        
        # Determine plan for renewal
        plan_type = PlanType(last_sub["plan_type"])
        if plan_type == PlanType.FREE_TRIAL:
            plan_type = PlanType.MONTHLY  # Trial renews to monthly by default
        
        # Get Stripe customer
        customer_id = await get_or_create_stripe_customer(user_email, user_name)
        
        # Deactivate any existing subscriptions
        await deactivate_user_subscriptions(user_email)
        
        # Create renewal
        start_date = datetime.utcnow()
        expiry_date = SubscriptionHelper.calculate_expiry_date(plan_type, start_date)
        transaction_id = SubscriptionHelper.generate_transaction_id("REN")
        
        # Create subscription record
        subscription_id = await create_subscription_record(
            email=user_email,
            name=user_name,
            plan_type=plan_type,
            start_date=start_date,
            expiry_date=expiry_date,
            transaction_id=transaction_id,
            stripe_customer_id=customer_id,
            metadata={"renewed_from": str(last_sub["_id"])}
        )
        
        # Record payment
        await record_payment(
            email=user_email,
            amount=PLAN_CONFIG[plan_type]["price"],
            plan_type=plan_type,
            transaction_id=transaction_id,
            subscription_id=subscription_id,
            metadata={"is_renewal": True}
        )
        
        # Update user
        await update_user_subscription_status(user_email, True, plan_type, expiry_date)
        
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        plan_config = PLAN_CONFIG[plan_type]
        
        return {
            "message": f"Subscription renewed successfully for {plan_config['name']}",
            "success": True,
            "subscription": {
                "id": subscription_id,
                "plan_type": plan_type.value,
                "plan_name": plan_config["name"],
                "start_date": start_date,
                "expiry_date": expiry_date,
                "days_remaining": days_remaining,
                "price": plan_config["price"],
                "transaction_id": transaction_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renewing subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to renew subscription"
        )

@router.get("/check-access", response_model=AccessCheckResponse)
async def check_access(user: dict = Depends(get_current_user)):
    """
    Simple access check for protected routes
    Use this in frontend to verify if user can access features
    """
    user_email = user.get("email")
    
    try:
        # Find active subscription
        subscription = await get_active_subscription(user_email)
        
        # No active subscription found
        if not subscription:
            # Check if user has any subscription at all
            any_sub = await get_most_recent_subscription(user_email)
            
            if any_sub:
                return AccessCheckResponse(
                    has_access=False,
                    message="Your subscription has expired. Please renew to continue.",
                    requires_subscription=True
                )
            else:
                # New user - should have free trial created automatically
                return AccessCheckResponse(
                    has_access=False,
                    message="No active subscription found. Please start a free trial or subscribe.",
                    requires_subscription=True
                )
        
        # Check if subscription is still active
        expiry_date = subscription.get("expiry_date")
        is_active = SubscriptionHelper.is_active(expiry_date)
        
        if not is_active:
            # Auto-update to expired
            await db_update_one(
                subscriptions_collection,
                {"_id": subscription["_id"]},
                {"$set": {
                    "status": SubscriptionStatus.EXPIRED.value,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            await update_user_subscription_status(user_email, False)
            
            return AccessCheckResponse(
                has_access=False,
                message="Your subscription has expired. Please renew to continue.",
                requires_subscription=True
            )
        
        # Active subscription
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date)
        plan_type = PlanType(subscription["plan_type"])
        
        return AccessCheckResponse(
            has_access=True,
            message=f"Access granted. Your subscription is active for {days_remaining} more days.",
            requires_subscription=True,
            plan_type=plan_type,
            plan_name=PLAN_CONFIG[plan_type]["name"],
            expiry_date=expiry_date,
            days_remaining=days_remaining
        )
    except Exception as e:
        logger.error(f"Error in check_access: {e}")
        # Default to allowing access if we can't determine status
        return AccessCheckResponse(
            has_access=True,
            message="Access granted.",
            requires_subscription=True
        )

@router.get("/history", response_model=SubscriptionHistoryResponse)
async def get_subscription_history(user: dict = Depends(get_current_user)):
    """Get user's complete subscription history"""
    user_email = user.get("email")
    
    try:
        # Get subscriptions
        subscriptions = await get_all_subscriptions(user_email, limit=100)
        
        history = []
        for sub in subscriptions:
            expiry = sub.get("expiry_date")
            plan_type_val = sub["plan_type"]
            plan_type = PlanType(plan_type_val) if plan_type_val else None
            
            history.append({
                "id": str(sub["_id"]),
                "plan_type": plan_type.value if plan_type else None,
                "plan_name": PLAN_CONFIG[plan_type]["name"] if plan_type else "Unknown",
                "status": sub["status"],
                "start_date": sub["start_date"],
                "expiry_date": expiry,
                "price": sub.get("price", 0),
                "created_at": sub["created_at"],
                "was_active": SubscriptionHelper.is_active(expiry) if expiry else False,
                "days_used": (expiry - sub["start_date"]).days if expiry and sub["start_date"] else 0
            })
        
        # Get payment history
        payments = await get_all_payments(user_email, limit=100)
        
        payment_history = []
        for p in payments:
            plan_type_val = p["plan_type"]
            plan_type = PlanType(plan_type_val) if plan_type_val else PlanType.MONTHLY
            
            payment_history.append(PaymentResponse(
                id=str(p["_id"]),
                amount=p["amount"],
                plan_type=plan_type,
                payment_method=p.get("payment_method", "unknown"),
                status=PaymentStatus(p.get("payment_status", "completed")),
                stripe_payment_intent_id=p.get("stripe_payment_intent_id"),
                transaction_id=p.get("transaction_id"),
                created_at=p["created_at"]
            ))
        
        # Calculate statistics
        total_spent = sum(p.amount for p in payment_history if p.status == PaymentStatus.COMPLETED)
        total_subscriptions = len(subscriptions)
        active_sub = next((s for s in subscriptions if s["status"] == SubscriptionStatus.ACTIVE.value and 
                          SubscriptionHelper.is_active(s.get("expiry_date"))), None)
        
        return SubscriptionHistoryResponse(
            subscriptions=history,
            payments=payment_history,
            statistics={
                "total_subscriptions": total_subscriptions,
                "total_spent": round(total_spent, 2),
                "has_active": active_sub is not None,
                "current_plan": PLAN_CONFIG[PlanType(active_sub["plan_type"])]["name"] if active_sub and active_sub.get("plan_type") else None,
                "member_since": subscriptions[-1]["created_at"] if subscriptions else None
            }
        )
    except Exception as e:
        logger.error(f"Error getting subscription history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription history"
        )

@router.get("/payments", response_model=List[PaymentResponse])
async def get_payment_history(user: dict = Depends(get_current_user)):
    """Get user's payment history"""
    user_email = user.get("email")
    
    try:
        payments = await get_all_payments(user_email, limit=100)
        
        result = []
        for p in payments:
            plan_type_val = p["plan_type"]
            plan_type = PlanType(plan_type_val) if plan_type_val else PlanType.MONTHLY
            
            result.append(PaymentResponse(
                id=str(p["_id"]),
                amount=p["amount"],
                plan_type=plan_type,
                payment_method=p.get("payment_method", "unknown"),
                status=PaymentStatus(p.get("payment_status", "completed")),
                stripe_payment_intent_id=p.get("stripe_payment_intent_id"),
                transaction_id=p.get("transaction_id"),
                created_at=p["created_at"]
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error getting payment history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )

@router.get("/current", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(user: dict = Depends(get_current_user)):
    """Get current active subscription details"""
    user_email = user.get("email")
    
    try:
        subscription = await get_active_subscription(user_email)
        
        if not subscription:
            return None
        
        expiry_date = subscription.get("expiry_date")
        is_active = SubscriptionHelper.is_active(expiry_date)
        days_remaining = SubscriptionHelper.get_days_remaining(expiry_date) if is_active else 0
        plan_type = PlanType(subscription["plan_type"])
        
        return SubscriptionResponse(
            id=str(subscription["_id"]),
            user_email=subscription["user_email"],
            user_name=subscription["user_name"],
            plan_type=plan_type,
            plan_name=PLAN_CONFIG[plan_type]["name"],
            status=SubscriptionStatus(subscription["status"]),
            start_date=subscription["start_date"],
            expiry_date=expiry_date,
            days_remaining=days_remaining,
            is_active=is_active,
            price=subscription["price"],
            auto_renew=subscription.get("auto_renew", False),
            stripe_subscription_id=subscription.get("stripe_subscription_id"),
            stripe_customer_id=subscription.get("stripe_customer_id"),
            created_at=subscription["created_at"]
        )
    except Exception as e:
        logger.error(f"Error getting current subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve current subscription"
        )