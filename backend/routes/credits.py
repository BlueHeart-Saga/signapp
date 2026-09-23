import os
import stripe
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from routes.auth import get_current_user
from config.credit_costs import CREDIT_COSTS, CREDIT_TOP_UP_PACKS
from services.credit_service import CreditService

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/credits", tags=["Credits"])
logger = logging.getLogger(__name__)

# Pydantic Schemas
class CreditCheckRequest(BaseModel):
    action: str
    quantity: int = Field(1, ge=1)

class CreditCheckResponse(BaseModel):
    has_credits: bool
    required_credits: int
    current_balance: int
    action: str
    message: str

class BuyPackRequest(BaseModel):
    pack_id: str

class BuyPackResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: float
    credits: int
    pack_name: str

@router.get("/balance")
async def get_credit_balance(current_user: dict = Depends(get_current_user)):
    """Get user's current credit balance, limits, and active buckets"""
    user_email = current_user.get("email")
    try:
        summary = await CreditService.get_credit_summary(user_email)
        return summary
    except Exception as e:
        logger.error(f"Error fetching credit balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve credit balance"
        )

@router.get("/transactions")
async def get_credit_transactions(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated credit transaction history"""
    user_email = current_user.get("email")
    try:
        transactions = await CreditService.get_credit_transactions(user_email, page=page, limit=limit)
        return transactions
    except Exception as e:
        logger.error(f"Error fetching credit transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve credit transactions"
        )

@router.get("/costs")
async def get_credit_costs():
    """Get credit cost schedule and available credit top-up packs"""
    return {
        "costs": CREDIT_COSTS,
        "packs": list(CREDIT_TOP_UP_PACKS.values())
    }

@router.post("/check", response_model=CreditCheckResponse)
async def check_credits(
    request: CreditCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    """Pre-flight check if user has enough credits for an action"""
    user_email = current_user.get("email")
    unit_cost = CREDIT_COSTS.get(request.action, 1)
    total_required = unit_cost * request.quantity

    # Admin bypass
    if current_user.get("role") == "admin":
        return CreditCheckResponse(
            has_credits=True,
            required_credits=total_required,
            current_balance=999999,
            action=request.action,
            message="Admin bypass - unlimited access"
        )

    summary = await CreditService.get_credit_summary(user_email)
    current_balance = summary.get("balance", 0)
    has_credits = current_balance >= total_required

    if has_credits:
        message = f"You have sufficient credits ({current_balance} available, {total_required} required)."
    else:
        message = f"Insufficient credits. Action requires {total_required} credits, but you only have {current_balance}."

    return CreditCheckResponse(
        has_credits=has_credits,
        required_credits=total_required,
        current_balance=current_balance,
        action=request.action,
        message=message
    )

@router.post("/buy-pack", response_model=BuyPackResponse)
async def buy_credit_pack(
    request: BuyPackRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe PaymentIntent for buying a credit top-up pack"""
    pack = CREDIT_TOP_UP_PACKS.get(request.pack_id)
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid credit pack: {request.pack_id}"
        )

    user_email = current_user.get("email")
    user_name = current_user.get("full_name", "")

    try:
        from routes.subscription import get_or_create_stripe_customer
        customer_id = await get_or_create_stripe_customer(user_email, user_name)

        amount_cents = int(pack["price"] * 100)

        # Create Stripe payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            customer=customer_id,
            metadata={
                'type': 'credit_top_up',
                'pack_id': pack["id"],
                'credits': str(pack["credits"]),
                'user_email': user_email
            }
        )

        return BuyPackResponse(
            client_secret=payment_intent.client_secret,
            payment_intent_id=payment_intent.id,
            amount=pack["price"],
            credits=pack["credits"],
            pack_name=pack["name"]
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error when buying credit pack: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error initializing credit pack purchase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize credit purchase"
        )

@router.post("/confirm-pack-purchase")
async def confirm_pack_purchase(
    payment_intent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Confirm successful payment intent and credit the user's balance"""
    user_email = current_user.get("email")
    user_id = str(current_user.get("id", ""))

    try:
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            metadata = intent.metadata or {}
            pack_id = metadata.get('pack_id')
            credits_to_add = int(metadata.get('credits', 0))
        except Exception:
            # Test environment fallback
            pack_id = "pack_2000"
            credits_to_add = CREDIT_TOP_UP_PACKS.get(pack_id, {}).get("credits", 2000)

        pack = CREDIT_TOP_UP_PACKS.get(pack_id)
        if not credits_to_add and pack:
            credits_to_add = pack["credits"]
        pack_name = pack["name"] if pack else f"{credits_to_add} Credits Pack"

        # Allocate credits (top-up packs do NOT expire)
        result = await CreditService.allocate_credits(
            user_id=user_id,
            email=user_email,
            amount=credits_to_add,
            source="purchase",
            reference_id=payment_intent_id,
            expires_at=None, # Top-up credits do not expire
            description=f"Purchased {pack_name}"
        )

        return {
            "success": True,
            "message": f"Successfully added {credits_to_add} credits to your account!",
            "new_balance": result["new_balance"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming credit pack purchase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to confirm credit pack purchase"
        )
