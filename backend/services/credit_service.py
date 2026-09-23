import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from bson import ObjectId
from fastapi import HTTPException, status

from database import db
from config.credit_costs import CREDIT_COSTS

logger = logging.getLogger(__name__)

users_collection = db["users"]
subscriptions_collection = db["subscriptions"]
credit_transactions_collection = db["credit_transactions"]
credit_buckets_collection = db["credit_buckets"]

async def db_find_one(collection, filter_dict):
    return await asyncio.to_thread(collection.find_one, filter_dict)

async def db_find(collection, filter_dict=None, sort=None, skip=0, limit=20):
    if filter_dict is None:
        filter_dict = {}
    def _find():
        cursor = collection.find(filter_dict)
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    return await asyncio.to_thread(_find)

async def db_count(collection, filter_dict=None):
    if filter_dict is None:
        filter_dict = {}
    return await asyncio.to_thread(collection.count_documents, filter_dict)

async def db_insert_one(collection, document):
    return await asyncio.to_thread(collection.insert_one, document)

async def db_update_one(collection, filter_dict, update_dict, upsert=False):
    return await asyncio.to_thread(collection.update_one, filter_dict, update_dict, upsert=upsert)

class CreditService:
    @staticmethod
    async def allocate_credits(
        user_id: str,
        email: str,
        amount: int,
        source: str, # "subscription", "purchase", "free_trial", "admin_grant", "promotion"
        reference_id: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        description: str = "",
        reset_previous_sub_credits: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Allocate credits to user account. Enforces idempotency via reference_id.
        If source is 'subscription', resets unused previous subscription credits by default (purchased packs are preserved).
        """
        try:
            email_clean = email.lower()
            # Build query filter for user
            user = await db_find_one(users_collection, {"email": email_clean})
            
            if not user and user_id:
                try:
                    user = await db_find_one(users_collection, {"_id": ObjectId(user_id)})
                except Exception:
                    pass

            if not user:
                logger.error(f"User not found for credit allocation: {email} / {user_id}")
                raise ValueError("User not found")

            uid = str(user["_id"])

            # 1️⃣ IDEMPOTENCY CHECK: Check if this reference_id has already been processed for a credit allocation
            if reference_id:
                existing_tx = await db_find_one(
                    credit_transactions_collection,
                    {"user_email": email_clean, "reference_id": reference_id, "type": "credit"}
                )
                if existing_tx:
                    logger.warning(f"Duplicate credit allocation attempt for {email_clean} with reference_id: {reference_id}. Ignored.")
                    return {
                        "success": True,
                        "duplicate_ignored": True,
                        "amount": 0,
                        "new_balance": user.get("credit_balance", 0),
                        "transaction_id": existing_tx.get("transaction_id")
                    }

            current_balance = user.get("credit_balance", 0)
            new_balance = current_balance + amount

            # 2️⃣ CREATE CREDIT BUCKET (Permanent, non-expiring)
            bucket = {
                "user_id": uid,
                "user_email": email_clean,
                "source": source,
                "amount": amount,
                "remaining": amount,
                "reference_id": reference_id,
                "expires_at": None,
                "created_at": datetime.utcnow()
            }
            bucket_result = await db_insert_one(credit_buckets_collection, bucket)
            bucket_id = str(bucket_result.inserted_id)

            # 3️⃣ UPDATE USER DOCUMENT
            update_data = {
                "$set": {
                    "credit_balance": new_balance,
                    "credit_plan_limit": max(user.get("credit_plan_limit", 0), new_balance),
                    "credit_updated_at": datetime.utcnow()
                }
            }
            await db_update_one(users_collection, {"_id": user["_id"]}, update_data)

            # 5️⃣ RECORD CREDIT TRANSACTION
            now_str = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            transaction_id = f"CRD_{now_str}_{ObjectId()}"
            
            transaction = {
                "user_id": uid,
                "user_email": email_clean,
                "type": "credit",
                "source": source,
                "amount": amount,
                "balance_before": user.get("credit_balance", 0),
                "balance_after": new_balance,
                "description": description or f"Allocated {amount} credits via {source}",
                "reference_id": reference_id,
                "bucket_id": bucket_id,
                "transaction_id": transaction_id,
                "created_at": datetime.utcnow()
            }
            await db_insert_one(credit_transactions_collection, transaction)

            logger.info(f"Successfully allocated {amount} credits to {email_clean}. New balance: {new_balance}")
            return {
                "success": True,
                "duplicate_ignored": False,
                "amount": amount,
                "new_balance": new_balance,
                "transaction_id": transaction_id
            }
        except Exception as e:
            logger.error(f"Failed to allocate credits: {e}")
            raise

    @staticmethod
    async def consume_credits(
        user_id: str,
        email: str,
        amount: int,
        action: str,
        reference_id: Optional[str] = None,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Atomically consume credits for a user action.
        Admins bypass credit deduction.
        Returns transaction summary or raises 402 Payment Required HTTP exception.
        """
        user_filter = {"email": email.lower()}
        user = await db_find_one(users_collection, user_filter)

        if not user and user_id:
            try:
                user = await db_find_one(users_collection, {"_id": ObjectId(user_id)})
            except Exception:
                pass

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Admin bypass
        if user.get("role") == "admin":
            return {
                "success": True,
                "admin_bypass": True,
                "amount": amount,
                "remaining_balance": user.get("credit_balance", 999999)
            }

        uid = str(user["_id"])
        
        # Atomic conditional decrement on credit_balance
        atomic_filter = {
            "_id": user["_id"],
            "credit_balance": {"$gte": amount}
        }
        atomic_update = {
            "$inc": {"credit_balance": -amount},
            "$set": {"credit_updated_at": datetime.utcnow()}
        }

        result = await db_update_one(users_collection, atomic_filter, atomic_update)

        if result.modified_count == 0:
            # Insufficient credits
            available = user.get("credit_balance", 0)
            logger.warning(f"Credit consumption failed for {email}: required {amount}, available {available}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "INSUFFICIENT_CREDITS",
                    "message": f"Insufficient credits. This action requires {amount} credits, but you only have {available}.",
                    "required": amount,
                    "available": available,
                    "action": action
                }
            )

        # Update was successful - calculate updated balance
        balance_before = user.get("credit_balance", 0)
        balance_after = balance_before - amount

        # Deduct from active buckets (oldest expiring first)
        def _update_buckets():
            cursor = credit_buckets_collection.find({
                "user_id": uid,
                "remaining": {"$gt": 0}
            }).sort("expires_at", 1) # Non-null / early expiry first
            
            remaining_to_deduct = amount
            for bucket in cursor:
                if remaining_to_deduct <= 0:
                    break
                deduct_from_this = min(bucket["remaining"], remaining_to_deduct)
                credit_buckets_collection.update_one(
                    {"_id": bucket["_id"]},
                    {"$inc": {"remaining": -deduct_from_this}}
                )
                remaining_to_deduct -= deduct_from_this

        await asyncio.to_thread(_update_buckets)

        # Record debit transaction
        now_str = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        transaction_id = f"DEB_{now_str}_{ObjectId()}"

        transaction = {
            "user_id": uid,
            "user_email": email.lower(),
            "type": "debit",
            "source": action,
            "amount": -amount,
            "balance_before": balance_before,
            "balance_after": balance_after,
            "description": description or f"Consumed {amount} credits for {action}",
            "reference_id": reference_id,
            "transaction_id": transaction_id,
            "created_at": datetime.utcnow()
        }
        await db_insert_one(credit_transactions_collection, transaction)

        logger.info(f"Consumed {amount} credits for {email} ({action}). Remaining balance: {balance_after}")
        return {
            "success": True,
            "amount": amount,
            "remaining_balance": balance_after,
            "transaction_id": transaction_id
        }

    @staticmethod
    async def refund_credits(
        user_id: str,
        email: str,
        amount: int,
        action: str,
        reference_id: Optional[str] = None,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Refund credits to user after a failed or cancelled operation.
        """
        user_filter = {"email": email.lower()}
        user = await db_find_one(users_collection, user_filter)

        if not user and user_id:
            try:
                user = await db_find_one(users_collection, {"_id": ObjectId(user_id)})
            except Exception:
                pass

        if not user:
            logger.error(f"User not found for credit refund: {email}")
            return {"success": False, "reason": "User not found"}

        uid = str(user["_id"])
        balance_before = user.get("credit_balance", 0)
        balance_after = balance_before + amount

        # Atomic increment
        await db_update_one(
            users_collection,
            {"_id": user["_id"]},
            {
                "$inc": {"credit_balance": amount},
                "$set": {"credit_updated_at": datetime.utcnow()}
            }
        )

        now_str = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        transaction_id = f"REF_{now_str}_{ObjectId()}"

        transaction = {
            "user_id": uid,
            "user_email": email.lower(),
            "type": "refund",
            "source": action,
            "amount": amount,
            "balance_before": balance_before,
            "balance_after": balance_after,
            "description": description or f"Refunded {amount} credits for {action}",
            "reference_id": reference_id,
            "transaction_id": transaction_id,
            "created_at": datetime.utcnow()
        }
        await db_insert_one(credit_transactions_collection, transaction)

        logger.info(f"Refunded {amount} credits to {email} for {action}. New balance: {balance_after}")
        return {
            "success": True,
            "amount": amount,
            "new_balance": balance_after,
            "transaction_id": transaction_id
        }

    @staticmethod
    async def get_credit_summary(email: str) -> Dict[str, Any]:
        """
        Get comprehensive credit status for a user.
        """
        user = await db_find_one(users_collection, {"email": email.lower()})
        if not user:
            return {
                "balance": 0,
                "limit": 0,
                "used": 0,
                "reset_date": None,
                "active_buckets": []
            }

        balance = user.get("credit_balance", 0)
        limit = user.get("credit_plan_limit", 0)
        used = max(0, limit - balance)
        reset_date = user.get("credit_reset_date")

        uid = str(user["_id"])
        raw_buckets = await db_find(
            credit_buckets_collection,
            {"user_id": uid, "remaining": {"$gt": 0}},
            sort=[("expires_at", 1)],
            limit=10
        )

        buckets = []
        for b in raw_buckets:
            buckets.append({
                "id": str(b["_id"]),
                "source": b.get("source"),
                "amount": b.get("amount"),
                "remaining": b.get("remaining"),
                "expires_at": b.get("expires_at")
            })

        return {
            "balance": balance,
            "limit": limit,
            "used": used,
            "reset_date": reset_date,
            "active_buckets": buckets,
            "has_active_subscription": user.get("has_active_subscription", False),
            "plan_type": user.get("subscription_plan", "free_trial")
        }

    @staticmethod
    async def get_credit_transactions(email: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get paginated credit transactions for a user.
        """
        skip = (page - 1) * limit
        filter_dict = {"user_email": email.lower()}

        total = await db_count(credit_transactions_collection, filter_dict)
        items = await db_find(
            credit_transactions_collection,
            filter_dict,
            sort=[("created_at", -1)],
            skip=skip,
            limit=limit
        )

        transactions = []
        for item in items:
            transactions.append({
                "id": str(item["_id"]),
                "type": item.get("type"),
                "source": item.get("source"),
                "amount": item.get("amount"),
                "balance_before": item.get("balance_before"),
                "balance_after": item.get("balance_after"),
                "description": item.get("description"),
                "reference_id": item.get("reference_id"),
                "transaction_id": item.get("transaction_id"),
                "created_at": item.get("created_at")
            })

        return {
            "transactions": transactions,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        }
