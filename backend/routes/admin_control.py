from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import math
from enum import Enum

from database import db
from .auth import get_current_user, role_required, serialize_doc, pwd_ctx

router = APIRouter(prefix="/admin", tags=["Admin Control"])

# Models
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    organization_name: Optional[str] = None
    is_active: Optional[bool] = None
    email_verified: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = Field(default="user")
    organization_name: Optional[str] = None
    email_verified: Optional[bool] = True
    is_active: Optional[bool] = True

class UserSearchQuery(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    organization_name: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    is_active: Optional[bool] = None

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[int] = -1  # -1 for descending, 1 for ascending

class UserStats(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    users_by_role: Dict[str, int]
    new_users_last_7_days: int
    new_users_last_30_days: int
    recipients_with_signatures: int
    average_signatures_per_recipient: float

class UserActivity(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    last_login_at: Optional[datetime]
    last_signed_at: Optional[datetime]
    documents_created: int
    documents_signed: int
    last_activity_at: Optional[datetime]

# Helper Functions - UPDATED VERSION
def build_user_query(search_query: UserSearchQuery) -> Dict[str, Any]:
    """Build MongoDB query from search parameters"""
    query = {}
    
    if search_query.email:
        query["email"] = {"$regex": search_query.email, "$options": "i"}
    
    if search_query.full_name:
        query["full_name"] = {"$regex": search_query.full_name, "$options": "i"}
    
    if search_query.role:
        query["role"] = search_query.role
    
    if search_query.organization_name:
        query["organization_name"] = {"$regex": search_query.organization_name, "$options": "i"}
    
    if search_query.is_active is not None:
        query["is_active"] = search_query.is_active
    
    if search_query.date_from or search_query.date_to:
        date_query = {}
        if search_query.date_from:
            date_query["$gte"] = search_query.date_from
        if search_query.date_to:
            date_query["$lte"] = search_query.date_to
        if date_query:
            query["created_at"] = date_query
    
    return query

async def get_user_document_stats(user_id: str) -> Dict[str, int]:
    """Get document statistics for a user"""
    try:
        # Check if documents collection exists
        if "documents" not in db.list_collection_names():
            return {"documents_created": 0, "documents_signed": 0}
        
        # Count documents created by user
        documents_created = db.documents.count_documents({
            "created_by": user_id
        })
        
        # Count documents signed by user (if recipient)
        documents_signed = db.documents.count_documents({
            "recipients.user_id": user_id,
            "recipients.signed_at": {"$exists": True}
        })
        
        return {
            "documents_created": documents_created,
            "documents_signed": documents_signed
        }
    except Exception as e:
        print(f"Error getting user document stats: {e}")
        return {"documents_created": 0, "documents_signed": 0}

async def get_user_login_stats(user_id: str) -> Dict[str, Any]:
    """Get login statistics for a user"""
    try:
        # Get user first
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"last_login_at": None, "login_count_30d": 0}
        
        # Check if auth_logs collection exists
        if "auth_logs" not in db.list_collection_names():
            # Use updated_at as fallback
            return {
                "last_login_at": user.get("updated_at"),
                "login_count_30d": 0
            }
        
        # Get last login from auth logs
        last_login = db.auth_logs.find_one(
            {"user_id": user_id, "action": "login"},
            sort=[("created_at", -1)]
        )
        
        # Count logins in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        login_count_30d = db.auth_logs.count_documents({
            "user_id": user_id,
            "action": "login",
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "last_login_at": last_login["created_at"] if last_login else user.get("updated_at"),
            "login_count_30d": login_count_30d
        }
    except Exception as e:
        print(f"Error getting user login stats: {e}")
        return {"last_login_at": None, "login_count_30d": 0}

# Routes

@router.get("/users", summary="Get all users with pagination and filtering")
async def get_all_users(
    search_query: UserSearchQuery = Depends(),
    pagination: PaginationParams = Depends(),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get all users with advanced filtering, sorting, and pagination.
    
    - **email**: Filter by email (partial match, case-insensitive)
    - **full_name**: Filter by full name (partial match, case-insensitive)
    - **role**: Filter by role (admin, user, recipient)
    - **organization_name**: Filter by organization name
    - **date_from**: Filter users created after this date
    - **date_to**: Filter users created before this date
    - **is_active**: Filter by active status
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    - **sort_by**: Field to sort by (default: created_at)
    - **sort_order**: Sort order: -1 for descending, 1 for ascending
    """
    try:
        # Build query
        query = build_user_query(search_query)
        
        # Count total matching users
        total_users = db.users.count_documents(query)
        
        # Calculate pagination
        total_pages = math.ceil(total_users / pagination.limit)
        skip = (pagination.page - 1) * pagination.limit
        
        # Build sort
        sort_field = pagination.sort_by if pagination.sort_by in [
            "email", "full_name", "role", "organization_name", 
            "created_at", "updated_at", "signature_count"
        ] else "created_at"
        
        sort_order = pagination.sort_order if pagination.sort_order in [-1, 1] else -1
        
        # Get users
        users_cursor = db.users.find(query).sort(sort_field, sort_order).skip(skip).limit(pagination.limit)
        users = list(users_cursor)
        
        # Serialize users
        serialized_users = []
        for user in users:
            user_data = serialize_doc(user)
            
            # Add document stats
            doc_stats = await get_user_document_stats(str(user["_id"]))
            user_data.update(doc_stats)
            
            # Add login stats
            login_stats = await get_user_login_stats(str(user["_id"]))
            user_data.update(login_stats)
            
            serialized_users.append(user_data)
        
        return {
            "users": serialized_users,
            "pagination": {
                "page": pagination.page,
                "limit": pagination.limit,
                "total_users": total_users,
                "total_pages": total_pages,
                "has_next": pagination.page < total_pages,
                "has_prev": pagination.page > 1
            },
            "filters": search_query.dict(exclude_none=True)
        }
        
    except Exception as e:
        print(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users"
        )

@router.get("/users/{user_id}", summary="Get detailed user information")
async def get_user_details(
    user_id: str = Path(..., description="User ID"),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get detailed information about a specific user.
    
    Includes:
    - User profile information
    - Document statistics
    - Login history
    - Activity timeline
    - Associated documents
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get basic user data
        user_data = serialize_doc(user)
        
        # Get document statistics
        doc_stats = await get_user_document_stats(user_id)
        # Ensure doc_stats is a dictionary
        if isinstance(doc_stats, dict):
            user_data.update(doc_stats)
        else:
            user_data.update({"documents_created": 0, "documents_signed": 0})
        
        # Get login statistics
        login_stats = await get_user_login_stats(user_id)
        # Ensure login_stats is a dictionary
        if isinstance(login_stats, dict):
            user_data.update(login_stats)
        else:
            user_data.update({"last_login_at": None, "login_count_30d": 0})
        
        # Get recent activity - check if collection exists
        if "activity_logs" in db.list_collection_names():
            recent_activity = list(db.activity_logs.find(
                {"user_id": user_id},
                sort=[("created_at", -1)],
                limit=20
            ))
            user_data["recent_activity"] = serialize_doc(recent_activity)
        else:
            user_data["recent_activity"] = []
        
        # Get documents created by user
        if "documents" in db.list_collection_names():
            created_documents = list(db.documents.find(
                {"created_by": user_id},
                sort=[("created_at", -1)],
                limit=10,
                projection={
                    "_id": 1,
                    "name": 1,
                    "status": 1,
                    "created_at": 1,
                    "recipients": 1,
                    "signatures_count": 1
                }
            ))
            user_data["created_documents"] = serialize_doc(created_documents)
        else:
            user_data["created_documents"] = []
        
        # Get documents signed by user
        if "documents" in db.list_collection_names():
            signed_documents = list(db.documents.find(
                {"recipients.user_id": user_id, "recipients.signed_at": {"$exists": True}},
                sort=[{"recipients.signed_at": -1}],
                limit=10
            ))
            user_data["signed_documents"] = serialize_doc(signed_documents)
        else:
            user_data["signed_documents"] = []
        
        # Get login history - check if collection exists
        if "auth_logs" in db.list_collection_names():
            login_history = list(db.auth_logs.find(
                {"user_id": user_id, "action": "login"},
                sort=[("created_at", -1)],
                limit=20
            ))
            user_data["login_history"] = serialize_doc(login_history)
        else:
            user_data["login_history"] = []
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user details"
        )

@router.post("/users", summary="Create a new user (admin)")
async def create_user_admin(
    user_data: UserCreate,
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Create a new user account (admin only).
    
    - **email**: User's email address
    - **password**: User's password (min 6 characters)
    - **full_name**: User's full name
    - **role**: User role (admin, user, recipient)
    - **organization_name**: Organization name (for users)
    - **email_verified**: Whether email is verified (default: true for admin-created users)
    - **is_active**: Whether account is active (default: true)
    """
    try:
        # Check if user already exists
        existing_user = db.users.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate role
        if user_data.role not in ["admin", "user", "recipient"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be admin, user, or recipient"
            )
        
        # Create user document
        user_doc = {
            "email": user_data.email.lower(),
            "password": pwd_ctx.hash(user_data.password),
            "full_name": user_data.full_name,
            "role": user_data.role,
            "organization_name": user_data.organization_name or "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": user_data.is_active if user_data.is_active is not None else True,
            "email_verified": user_data.email_verified if user_data.email_verified is not None else True,
            "created_by_admin": True,
            "created_by": str(current_user["id"]),
            "auth_provider": "email"
        }
        
        # Add role-specific fields
        if user_data.role == "recipient":
            user_doc.update({
                "recipient_since": datetime.utcnow(),
                "signature_count": 0,
                "last_signed_at": None,
                "linked_documents_count": 0,
                "document_access_count": 0
            })
        
        # Insert user
        result = db.users.insert_one(user_doc)
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "create_user",
            "target_user_id": str(result.inserted_id),
            "target_email": user_data.email.lower(),
            "details": {
                "role": user_data.role,
                "is_active": user_doc["is_active"],
                "email_verified": user_doc["email_verified"]
            },
            "created_at": datetime.utcnow()
        })
        
        # Get the created user
        created_user = db.users.find_one({"_id": result.inserted_id})
        
        return {
            "message": "User created successfully",
            "user": serialize_doc(created_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.put("/users/{user_id}", summary="Update user information")
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Update user information.
    
    Only specified fields will be updated.
    
    - **full_name**: Update user's full name
    - **role**: Change user role
    - **organization_name**: Update organization name
    - **is_active**: Activate or deactivate account
    - **email_verified**: Mark email as verified or not
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent admin from modifying themselves (except certain fields)
        if user_id == str(current_user["id"]):
            restricted_fields = ["role", "is_active"]
            for field in restricted_fields:
                if getattr(update_data, field, None) is not None:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Cannot modify {field} for your own account"
                    )
        
        # Prepare update
        update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
        
        # Validate role if being changed
        if "role" in update_dict and update_dict["role"] not in ["admin", "user", "recipient"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be admin, user, or recipient"
            )
        
        # Add updated timestamp
        update_dict["updated_at"] = datetime.utcnow()
        
        # Perform update
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made or user not found"
            )
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "update_user",
            "target_user_id": user_id,
            "target_email": user["email"],
            "changes": update_dict,
            "created_at": datetime.utcnow()
        })
        
        # Get updated user
        updated_user = db.users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "User updated successfully",
            "user": serialize_doc(updated_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

@router.delete("/users/{user_id}", summary="Delete a user account")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Delete a user account.
    
    Note: This is a soft delete - marks user as inactive and removes sensitive data.
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent self-deletion
        if user_id == str(current_user["id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete your own account"
            )
        
        # Soft delete - mark as inactive and anonymize data
        delete_update = {
            "is_active": False,
            "deleted_at": datetime.utcnow(),
            "deleted_by": str(current_user["id"]),
            "email": f"deleted_{user_id}@{user['email'].split('@')[1]}",
            "full_name": "[Deleted User]",
            "organization_name": "",
            "password": "[DELETED]",
            "updated_at": datetime.utcnow()
        }
        
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": delete_update}
        )
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "delete_user",
            "target_user_id": user_id,
            "target_email": user["email"],
            "created_at": datetime.utcnow()
        })
        
        return {
            "message": "User deleted successfully",
            "user_id": user_id,
            "original_email": user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )

@router.post("/users/{user_id}/reset-password", summary="Reset user's password (admin)")
async def reset_user_password_admin(
    user_id: str,
    new_password: str = Query(..., min_length=6, description="New password for the user"),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Reset a user's password (admin only).
    
    - **new_password**: New password (min 6 characters)
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        hashed_password = pwd_ctx.hash(new_password)
        
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password": hashed_password,
                "updated_at": datetime.utcnow(),
                "password_changed_at": datetime.utcnow(),
                "password_changed_by_admin": True
            }}
        )
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "reset_password",
            "target_user_id": user_id,
            "target_email": user["email"],
            "created_at": datetime.utcnow()
        })
        
        return {
            "message": "Password reset successfully",
            "user_id": user_id,
            "email": user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password"
        )

@router.post("/users/{user_id}/activate", summary="Activate a user account")
async def activate_user(
    user_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Activate a deactivated user account.
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Activate user
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "is_active": True,
                "activated_at": datetime.utcnow(),
                "activated_by": str(current_user["id"]),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or already active"
            )
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "activate_user",
            "target_user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        return {
            "message": "User activated successfully",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error activating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error activating user"
        )

@router.post("/users/{user_id}/deactivate", summary="Deactivate a user account")
async def deactivate_user(
    user_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Deactivate an active user account.
    """
    try:
        # Validate user_id
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        # Get user
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent self-deactivation
        if user_id == str(current_user["id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot deactivate your own account"
            )
        
        # Deactivate user
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "is_active": False,
                "deactivated_at": datetime.utcnow(),
                "deactivated_by": str(current_user["id"]),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Log the action
        db.admin_logs.insert_one({
            "admin_id": str(current_user["id"]),
            "admin_email": current_user["email"],
            "action": "deactivate_user",
            "target_user_id": user_id,
            "target_email": user["email"],
            "created_at": datetime.utcnow()
        })
        
        return {
            "message": "User deactivated successfully",
            "user_id": user_id,
            "email": user["email"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deactivating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deactivating user"
        )

@router.get("/stats/users", summary="Get user statistics")
async def get_user_statistics(
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get comprehensive user statistics.
    
    Includes:
    - Total user counts
    - Active vs inactive users
    - Users by role
    - New user trends
    - Recipient signature statistics
    """
    try:
        # Get current date for calculations
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Total users
        total_users = db.users.count_documents({})
        
        # Active users
        active_users = db.users.count_documents({"is_active": True})
        
        # Verified users
        verified_users = db.users.count_documents({"email_verified": True})
        
        # Users by role
        users_by_role = {}
        roles = ["admin", "user", "recipient"]
        for role in roles:
            users_by_role[role] = db.users.count_documents({"role": role})
        
        # New users in last 7 days
        new_users_7d = db.users.count_documents({
            "created_at": {"$gte": seven_days_ago}
        })
        
        # New users in last 30 days
        new_users_30d = db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Recipients with signatures
        recipients_with_signatures = db.users.count_documents({
            "role": "recipient",
            "signature_count": {"$gt": 0}
        })
        
        # Average signatures per recipient
        recipients = list(db.users.find(
            {"role": "recipient"},
            {"signature_count": 1}
        ))
        total_signatures = sum(recipient.get("signature_count", 0) for recipient in recipients)
        avg_signatures = total_signatures / len(recipients) if recipients else 0
        
        # User growth trend (last 12 months)
        monthly_growth = []
        for i in range(12):
            month_start = datetime(now.year, now.month - i, 1) if now.month > i else datetime(now.year - 1, now.month + 12 - i, 1)
            month_end = datetime(month_start.year, month_start.month % 12 + 1, 1) if month_start.month < 12 else datetime(month_start.year + 1, 1, 1)
            
            monthly_count = db.users.count_documents({
                "created_at": {"$gte": month_start, "$lt": month_end}
            })
            
            monthly_growth.append({
                "month": month_start.strftime("%Y-%m"),
                "new_users": monthly_count
            })
        
        monthly_growth.reverse()  # Oldest to newest
        
        # Activity by hour (last 24 hours) - only if auth_logs exists
        hourly_activity = []
        if "auth_logs" in db.list_collection_names():
            for hour in range(24):
                hour_start = now - timedelta(hours=24 - hour)
                hour_end = hour_start + timedelta(hours=1)
                
                # Count logins in this hour
                login_count = db.auth_logs.count_documents({
                    "action": "login",
                    "created_at": {"$gte": hour_start, "$lt": hour_end}
                })
                
                hourly_activity.append({
                    "hour": hour_start.strftime("%H:00"),
                    "logins": login_count
                })
        else:
            # Create empty hourly activity
            for hour in range(24):
                hour_start = now - timedelta(hours=24 - hour)
                hourly_activity.append({
                    "hour": hour_start.strftime("%H:00"),
                    "logins": 0
                })
        
        return {
            "summary": {
                "total_users": total_users,
                "active_users": active_users,
                "verified_users": verified_users,
                "inactive_users": total_users - active_users,
                "users_by_role": users_by_role,
                "new_users_last_7_days": new_users_7d,
                "new_users_last_30_days": new_users_30d,
                "recipients_with_signatures": recipients_with_signatures,
                "average_signatures_per_recipient": round(avg_signatures, 2)
            },
            "trends": {
                "monthly_growth": monthly_growth,
                "hourly_activity": hourly_activity
            }
        }
        
    except Exception as e:
        print(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user statistics"
        )

@router.get("/stats/activity", summary="Get user activity statistics")
async def get_user_activity_stats(
    days: int = Query(default=7, ge=1, le=90, description="Number of days to look back"),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get user activity statistics for the specified time period.
    
    - **days**: Number of days to look back (1-90)
    """
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get active users in period
        active_users = db.users.count_documents({
            "updated_at": {"$gte": start_date}
        })
        
        # Get new users in period
        new_users = db.users.count_documents({
            "created_at": {"$gte": start_date}
        })
        
        # Get login activity - only if auth_logs exists
        login_activity = {}
        if "auth_logs" in db.list_collection_names():
            daily_logins = {}
            for i in range(days):
                day = start_date + timedelta(days=i)
                day_str = day.strftime("%Y-%m-%d")
                
                login_count = db.auth_logs.count_documents({
                    "action": "login",
                    "created_at": {"$gte": day, "$lt": day + timedelta(days=1)}
                })
                
                daily_logins[day_str] = login_count
            
            login_activity = daily_logins
        
        # Get document creation activity - only if documents exists
        document_creation = 0
        if "documents" in db.list_collection_names():
            document_creation = db.documents.count_documents({
                "created_at": {"$gte": start_date}
            })
        
        # Get signature activity - only if documents exists
        signature_activity = 0
        if "documents" in db.list_collection_names():
            signature_activity = db.documents.count_documents({
                "recipients.signed_at": {"$gte": start_date}
            })
        
        # Most active users - only if activity_logs exists
        top_users_formatted = []
        if "activity_logs" in db.list_collection_names():
            pipeline = [
                {"$match": {"created_at": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$created_by",
                    "activity_count": {"$sum": 1}
                }},
                {"$sort": {"activity_count": -1}},
                {"$limit": 10}
            ]
            
            top_active_users = list(db.activity_logs.aggregate(pipeline))
            
            # Convert to readable format
            for user in top_active_users:
                user_doc = db.users.find_one({"_id": ObjectId(user["_id"])})
                if user_doc:
                    top_users_formatted.append({
                        "user_id": str(user_doc["_id"]),
                        "email": user_doc["email"],
                        "full_name": user_doc.get("full_name", ""),
                        "activity_count": user["activity_count"]
                    })
        
        return {
            "period": {
                "days": days,
                "start_date": start_date,
                "end_date": end_date
            },
            "activity_summary": {
                "active_users": active_users,
                "new_users": new_users,
                "document_creation": document_creation,
                "signature_activity": signature_activity
            },
            "login_activity": login_activity,
            "top_active_users": top_users_formatted
        }
        
    except Exception as e:
        print(f"Error getting activity stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving activity statistics"
        )

@router.get("/users/search/email/{email}", summary="Search users by email")
async def search_users_by_email(
    email: str = Path(..., description="Email to search for"),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Search users by email address (partial match, case-insensitive).
    """
    try:
        users = list(db.users.find(
            {"email": {"$regex": email, "$options": "i"}},
            limit=20
        ))
        
        return {
            "users": serialize_doc(users),
            "count": len(users)
        }
        
    except Exception as e:
        print(f"Error searching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching users"
        )

@router.get("/users/export/csv", summary="Export users to CSV")
async def export_users_csv(
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Export all users to CSV format.
    """
    try:
        # Get all users
        users = list(db.users.find({}))
        
        # Create CSV header
        csv_header = [
            "ID", "Email", "Full Name", "Role", "Organization", 
            "Active", "Email Verified", "Created At", "Last Updated",
            "Document Created", "Documents Signed", "Signature Count"
        ]
        
        # Create CSV rows
        csv_rows = []
        for user in users:
            # Get document stats
            doc_stats = await get_user_document_stats(str(user["_id"]))
            
            row = [
                str(user.get("_id", "")),
                user.get("email", ""),
                user.get("full_name", ""),
                user.get("role", ""),
                user.get("organization_name", ""),
                "Yes" if user.get("is_active", False) else "No",
                "Yes" if user.get("email_verified", False) else "No",
                user.get("created_at", "").isoformat() if user.get("created_at") else "",
                user.get("updated_at", "").isoformat() if user.get("updated_at") else "",
                str(doc_stats.get("documents_created", 0)),
                str(doc_stats.get("documents_signed", 0)),
                str(user.get("signature_count", 0))
            ]
            csv_rows.append(row)
        
        # Create CSV content
        csv_content = []
        csv_content.append(",".join(csv_header))
        for row in csv_rows:
            # Escape commas and quotes in fields
            escaped_row = []
            for field in row:
                if isinstance(field, str):
                    if "," in field or '"' in field:
                        escaped = field.replace('"', '""')
                        field = f'"{escaped}"'
                escaped_row.append(str(field))

            csv_content.append(",".join(escaped_row))
        
        # Return CSV as response
        from fastapi.responses import Response
        csv_string = "\n".join(csv_content)
        
        return Response(
            content=csv_string,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=users_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except Exception as e:
        print(f"Error exporting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error exporting users"
        )

@router.get("/admin-logs", summary="Get admin action logs")
async def get_admin_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    action: Optional[str] = Query(None, description="Filter by action type"),
    admin_id: Optional[str] = Query(None, description="Filter by admin ID"),
    date_from: Optional[datetime] = Query(None, description="Start date"),
    date_to: Optional[datetime] = Query(None, description="End date"),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get admin action logs with filtering.
    
    - **page**: Page number
    - **limit**: Items per page
    - **action**: Filter by action type
    - **admin_id**: Filter by admin ID
    - **date_from**: Filter logs after this date
    - **date_to**: Filter logs before this date
    """
    try:
        # Build query
        query = {}
        
        if action:
            query["action"] = action
        
        if admin_id:
            query["admin_id"] = admin_id
        
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = date_from
            if date_to:
                date_query["$lte"] = date_to
            if date_query:
                query["created_at"] = date_query
        
        # Count total logs
        total_logs = db.admin_logs.count_documents(query)
        
        # Calculate pagination
        total_pages = math.ceil(total_logs / limit)
        skip = (page - 1) * limit
        
        # Get logs
        logs = list(db.admin_logs.find(query)
                    .sort("created_at", -1)
                    .skip(skip)
                    .limit(limit))
        
        return {
            "logs": serialize_doc(logs),
            "pagination": {
                "page": page,
                "limit": limit,
                "total_logs": total_logs,
                "total_pages": total_pages
            }
        }
        
    except Exception as e:
        print(f"Error getting admin logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving admin logs"
        )

# In admin_control.py, update the get_dashboard_summary function:

@router.get("/dashboard/summary", summary="Get admin dashboard summary")
async def get_dashboard_summary(
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Get summary data for admin dashboard.
    """
    try:
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        last_week = now - timedelta(days=7)
        last_month = now - timedelta(days=30)
        
        # User statistics - check if collections exist
        total_users = db.users.count_documents({})
        active_users = db.users.count_documents({"is_active": True})
        new_users_today = db.users.count_documents({"created_at": {"$gte": yesterday}})
        new_users_week = db.users.count_documents({"created_at": {"$gte": last_week}})
        
        # Document statistics
        total_documents = db.documents.count_documents({})
        pending_documents = db.documents.count_documents({"status": "pending"})
        completed_documents = db.documents.count_documents({"status": "completed"})
        
        # Recent users
        recent_users = list(db.users.find({}, {"email": 1, "full_name": 1, "role": 1, "created_at": 1})
                           .sort("created_at", -1)
                           .limit(5))
        
        # Recent activity from admin logs
        recent_activity = []
        # Check if collection exists
        if "admin_logs" in db.list_collection_names():
            recent_activity = list(db.admin_logs.find({})
                                  .sort("created_at", -1)
                                  .limit(10))
        
        # System health
        
        
        # Get documents collection status
        if "documents" in db.list_collection_names():
            # Calculate document completion rate
            if total_documents > 0:
                completion_rate = round((completed_documents / total_documents) * 100, 1)
            else:
                completion_rate = 0
        else:
            total_documents = 0
            pending_documents = 0
            completed_documents = 0
            completion_rate = 0
        
        # Calculate user growth percentage
        users_last_month = db.users.count_documents({
            "created_at": {"$gte": last_month, "$lt": last_week}
        })
        if users_last_month > 0:
            user_growth = round(((new_users_week - users_last_month) / users_last_month) * 100, 1)
        else:
            user_growth = 100.0 if new_users_week > 0 else 0.0
        
        return {
            "timestamp": now.isoformat(),
            "users": {
                "total": total_users,
                "active": active_users,
                "new_today": new_users_today,
                "new_week": new_users_week,
                "growth_percentage": user_growth
            },
            "documents": {
                "total": total_documents,
                "pending": pending_documents,
                "completed": completed_documents,
                "completion_rate": completion_rate
            },
            "recent_users": serialize_doc(recent_users),
            "recent_activity": serialize_doc(recent_activity),
            
            "performance": {
                "avg_response_time": 125,  # ms - you can calculate this from logs
                "uptime": 99.8,  # percentage
                "active_sessions": db.sessions.count_documents({}) if "sessions" in db.list_collection_names() else 0
            }
        }
        
    except Exception as e:
        print(f"Error getting dashboard summary: {e}")
        # Return basic data even if some queries fail
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "users": {
                "total": 0,
                "active": 0,
                "new_today": 0,
                "new_week": 0,
                "growth_percentage": 0
            },
            "documents": {
                "total": 0,
                "pending": 0,
                "completed": 0,
                "completion_rate": 0
            },
            "recent_users": [],
            "recent_activity": [],
            
            "performance": {
                "avg_response_time": 0,
                "uptime": 0,
                "active_sessions": 0
            }
        }