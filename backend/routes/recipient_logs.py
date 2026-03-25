from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from typing import List

from database import db
from .auth import get_current_user, role_required, serialize_doc

router = APIRouter(prefix="/auth", tags=["Recipient Logs"])

# Helper function to get documents for recipient
async def get_documents_for_recipient(recipient_email: str):
    """Get all documents where user is a recipient"""
    documents = list(db.documents.find({
        "recipients.email": recipient_email
    }).sort("created_at", -1))
    
    result_docs = []
    for doc in documents:
        # Find recipient info
        recipient_info = None
        for recipient in doc.get("recipients", []):
            if recipient["email"].lower() == recipient_email.lower():
                recipient_info = recipient
                break
        
        if recipient_info:
            doc_data = {
                "id": str(doc["_id"]),
                "name": doc.get("name", "Untitled Document"),
                "description": doc.get("description", ""),
                "status": doc.get("status", "draft"),
                "created_by": doc.get("created_by"),
                "created_at": doc.get("created_at"),
                "completed_at": doc.get("completed_at"),
                "signed_at": recipient_info.get("signed_at"),
                "signature_status": recipient_info.get("status", "pending"),
                "signature_method": recipient_info.get("signature_method"),
                "ip_address": recipient_info.get("ip_address")
            }
            result_docs.append(serialize_doc(doc_data))
    
    return result_docs

@router.get("/me/documents")
async def get_my_documents(current_user: dict = Depends(get_current_user)):
    """Get documents accessible to current user"""
    try:
        if current_user["role"] == "recipient":
            # For recipients, get documents they've signed or are pending
            documents = await get_documents_for_recipient(current_user["email"])
            return {
                "role": "recipient",
                "documents": documents,
                "total_count": len(documents),
                "signed_count": len([doc for doc in documents if doc.get("signed_at")]),
                "pending_count": len([doc for doc in documents if not doc.get("signed_at")])
            }
        else:
            # For regular users/admins, get documents they've created
            user_documents = list(db.documents.find({
                "created_by": current_user["id"]
            }).sort("created_at", -1))
            
            serialized_docs = [serialize_doc(doc) for doc in user_documents]
            
            return {
                "role": current_user["role"],
                "documents": serialized_docs,
                "total_count": len(serialized_docs)
            }
    except Exception as e:
        print(f"Error getting user documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving documents"
        )

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a document (with access control)"""
    try:
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check access permissions
        if current_user["role"] == "recipient":
            # Recipients can only download documents they're recipients of
            recipient_access = any(
                recipient.get("email") == current_user["email"]
                for recipient in document.get("recipients", [])
            )
            
            if not recipient_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this document"
                )
        else:
            # Users/admins can download documents they created
            if document.get("created_by") != current_user["id"] and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this document"
                )
        
        # Generate download URL (you would implement actual file serving logic here)
        download_url = f"/api/documents/{document_id}/file"
        
        # Log the download activity
        db.document_activity.insert_one({
            "document_id": document_id,
            "user_id": current_user["id"],
            "action": "download",
            "timestamp": datetime.utcnow(),
            "ip_address": None  # You can get this from request if needed
        })
        
        return {
            "document_id": document_id,
            "document_name": document.get("name", "Unknown Document"),
            "download_url": download_url,
            "signed_at": document.get("completed_at"),
            "access_granted": True,
            "file_size": document.get("file_size"),
            "file_type": document.get("file_type")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error downloading document"
        )

@router.get("/documents/{document_id}/history")
async def get_document_history(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get signature history for a document"""
    try:
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check access permissions
        if current_user["role"] == "recipient":
            # Recipients can only view history of documents they're recipients of
            recipient_access = any(
                recipient.get("email") == current_user["email"]
                for recipient in document.get("recipients", [])
            )
            
            if not recipient_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this document"
                )
        
        # Get document activity history
        activities = list(db.document_activity.find({
            "document_id": document_id
        }).sort("timestamp", -1).limit(50))
        
        serialized_activities = [serialize_doc(activity) for activity in activities]
        
        # Prepare signature history
        signature_history = []
        for recipient in document.get("recipients", []):
            history_entry = {
                "recipient_email": recipient.get("email"),
                "recipient_name": recipient.get("name"),
                "status": recipient.get("status", "pending"),
                "sent_at": recipient.get("sent_at"),
                "viewed_at": recipient.get("viewed_at"),
                "signed_at": recipient.get("signed_at"),
                "ip_address": recipient.get("ip_address"),
                "signature_method": recipient.get("signature_method"),
                "is_registered": recipient.get("is_registered", False),
                "user_id": recipient.get("user_id")
            }
            signature_history.append(serialize_doc(history_entry))
        
        return {
            "document_id": document_id,
            "document_name": document.get("name", "Unknown Document"),
            "created_at": document.get("created_at"),
            "completed_at": document.get("completed_at"),
            "status": document.get("status"),
            "signature_history": signature_history,
            "activity_log": serialized_activities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving document history"
        )

@router.get("/recipient/dashboard")
async def get_recipient_dashboard(current_user: dict = Depends(role_required(["recipient"]))):
    """Get recipient dashboard data"""
    try:
        documents = await get_documents_for_recipient(current_user["email"])
        
        # Calculate statistics
        total_documents = len(documents)
        signed_documents = len([doc for doc in documents if doc.get("signed_at")])
        pending_documents = total_documents - signed_documents
        
        # Recent activity
        recent_activity = list(db.document_activity.find({
            "user_id": current_user["id"]
        }).sort("timestamp", -1).limit(10))
        
        serialized_activities = [serialize_doc(activity) for activity in recent_activity]
        
        return {
            "user": {
                "id": current_user["id"],
                "email": current_user["email"],
                "full_name": current_user.get("full_name", ""),
                "recipient_since": current_user.get("recipient_since"),
                "signature_count": current_user.get("signature_count", 0)
            },
            "statistics": {
                "total_documents": total_documents,
                "signed_documents": signed_documents,
                "pending_documents": pending_documents,
                "completion_rate": (signed_documents / total_documents * 100) if total_documents > 0 else 0
            },
            "recent_documents": documents[:5],  # Last 5 documents
            "recent_activity": serialized_activities
        }
        
    except Exception as e:
        print(f"Error getting recipient dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving dashboard data"
        )