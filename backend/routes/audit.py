# routers/audit.py
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from database import db
from .auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit"])


# Pydantic Models
class AuditEventCreate(BaseModel):
    document_id: str
    action: str
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditEventResponse(BaseModel):
    id: str
    document_id: str
    action: str
    details: Dict[str, Any]
    performed_by: str
    performed_by_email: Optional[str] = None
    performed_by_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: str

class AuditFilter(BaseModel):
    document_id: Optional[str] = None
    action: Optional[str] = None
    performed_by: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    ip_address: Optional[str] = None

class AuditStatsResponse(BaseModel):
    total_events: int
    events_by_action: Dict[str, int]
    events_by_user: Dict[str, int]
    recent_activity: List[Dict[str, Any]]

class BulkAuditExportRequest(BaseModel):
    document_ids: List[str]
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    format: str = "json"  # json, csv


# Audit Event Types
AUDIT_ACTIONS = {
    # Document Events
    "document_uploaded": "Document uploaded",
    "document_downloaded": "Document downloaded",
    "document_deleted": "Document deleted",
    "document_viewed": "Document viewed",
    "document_shared": "Document shared",
    
    # Recipient Events
    "recipient_added": "Recipient added",
    "recipient_removed": "Recipient removed",
    "recipient_updated": "Recipient updated",
    "recipient_invited": "Recipient invited",
    "recipient_reminded": "Recipient reminded",
    
    # Signing Events
    "signing_started": "Signing process started",
    "signing_completed": "Signing process completed",
    "signing_cancelled": "Signing process cancelled",
    "recipient_signed": "Recipient signed document",
    "signature_applied": "Signature applied",
    "field_completed": "Form field completed",
    
    # Email Events
    "email_sent": "Email sent",
    "email_failed": "Email failed to send",
    "email_opened": "Email opened",
    "link_clicked": "Signing link clicked",
    
    # User Events
    "user_logged_in": "User logged in",
    "user_logged_out": "User logged out",
    "user_created": "User created",
    "profile_updated": "Profile updated",
    
    # Security Events
    "failed_login": "Failed login attempt",
    "password_changed": "Password changed",
    "access_denied": "Access denied",
    "suspicious_activity": "Suspicious activity detected",
    
    # System Events
    "system_backup": "System backup performed",
    "cleanup_performed": "Data cleanup performed",
    "export_generated": "Audit export generated"
}


def log_audit_event(
    event_data: Dict[str, Any],
    background_tasks: BackgroundTasks = None,
    request=None
):
    """
    Main function to log audit events. Can be called from any router.
    
    Args:
        event_data: Dictionary containing:
            - document_id (ObjectId, optional)
            - action (str)
            - details (dict, optional)
            - performed_by (ObjectId, optional)
            - ip_address (str, optional)
            - user_agent (str, optional)
        background_tasks: FastAPI BackgroundTasks instance
        request: FastAPI Request object for IP and User-Agent
    """
    
    # Create the audit record
    audit_record = {
        "action": event_data.get("action"),
        "details": event_data.get("details", {}),
        "timestamp": event_data.get("timestamp", datetime.utcnow())
    }
    
    # Add document_id if provided
    if event_data.get("document_id"):
        audit_record["document_id"] = ObjectId(event_data["document_id"])
    
    # Add performed_by if provided
    if event_data.get("performed_by"):
        audit_record["performed_by"] = ObjectId(event_data["performed_by"])
    
    # Add IP and User-Agent from request if available
    if request:
        audit_record["ip_address"] = request.client.host if request.client else "unknown"
        audit_record["user_agent"] = request.headers.get("user-agent", "unknown")
    else:
        # Use provided values or defaults
        audit_record["ip_address"] = event_data.get("ip_address", "unknown")
        audit_record["user_agent"] = event_data.get("user_agent", "unknown")
    
    # Add metadata
    audit_record["created_at"] = datetime.utcnow()
    
    # If background_tasks is provided, use it for non-blocking insertion
    if background_tasks:
        background_tasks.add_task(_insert_audit_record, audit_record)
    else:
        _insert_audit_record(audit_record)


def _insert_audit_record(audit_record: Dict[str, Any]):
    """Helper function to insert audit record into database"""
    try:
        db.audit.insert_one(audit_record)
    except Exception as e:
        # Log the error but don't break the main operation
        print(f"Failed to insert audit record: {str(e)}")
        # You might want to log this to a file or external service


def serialize_audit_event(audit_event: Dict) -> Dict[str, Any]:
    """Serialize audit event for API response"""
    serialized = {
        "id": str(audit_event["_id"]),
        "action": audit_event.get("action"),
        "details": audit_event.get("details", {}),
        "timestamp": audit_event.get("timestamp", audit_event.get("created_at")).isoformat(),
        "ip_address": audit_event.get("ip_address"),
        "user_agent": audit_event.get("user_agent")
    }
    
    # Add document_id if present
    if audit_event.get("document_id"):
        serialized["document_id"] = str(audit_event["document_id"])
    
    # Add user information if present
    if audit_event.get("performed_by"):
        serialized["performed_by"] = str(audit_event["performed_by"])
        
        # Try to get user details
        user = db.users.find_one({"_id": ObjectId(audit_event["performed_by"])})
        if user:
            serialized["performed_by_email"] = user.get("email")
            serialized["performed_by_name"] = user.get("name")
    
    return serialized


@router.post("/log", response_model=Dict[str, str])
async def create_audit_event(
    event: AuditEventCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a custom audit event
    """
    try:
        audit_data = {
            "document_id": event.document_id,
            "action": event.action,
            "details": event.details,
            "performed_by": current_user["id"],
            "ip_address": event.ip_address,
            "user_agent": event.user_agent,
            "timestamp": datetime.utcnow()
        }
        
        log_audit_event(audit_data, background_tasks)
        
        return {"message": "Audit event logged successfully", "id": str(ObjectId())}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log audit event: {str(e)}")


@router.get("/document/{document_id}", response_model=List[AuditEventResponse])
async def get_audit_for_document(
    document_id: str,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get audit trail for a specific document with filtering and pagination
    """
    try:
        # Verify document ownership
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["_id"])
        })
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
        # Build query
        query = {"document_id": ObjectId(document_id)}
        
        # Add filters
        if action:
            query["action"] = action
        
        if date_from or date_to:
            query["timestamp"] = {}
            if date_from:
                query["timestamp"]["$gte"] = date_from
            if date_to:
                query["timestamp"]["$lte"] = date_to
        
        # Get audit events
        cursor = db.audit.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        audit_events = list(cursor)
        
        return [serialize_audit_event(event) for event in audit_events]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit trail: {str(e)}")


@router.get("/user/me", response_model=List[AuditEventResponse])
async def get_my_audit_events(
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get audit events for the current user
    """
    try:
        # Build query
        query = {"performed_by": ObjectId(current_user["_id"])}
        
        # Add filters
        if action:
            query["action"] = action
        
        if date_from or date_to:
            query["timestamp"] = {}
            if date_from:
                query["timestamp"]["$gte"] = date_from
            if date_to:
                query["timestamp"]["$lte"] = date_to
        
        # Get audit events
        cursor = db.audit.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        audit_events = list(cursor)
        
        return [serialize_audit_event(event) for event in audit_events]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit events: {str(e)}")


@router.post("/search", response_model=List[AuditEventResponse])
async def search_audit_events(
    filters: AuditFilter,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Advanced search for audit events with multiple filters
    """
    try:
        # Build query - only show events for documents owned by user
        user_documents = list(db.documents.find(
            {"owner_id": ObjectId(current_user["_id"])},
            {"_id": 1}
        ))
        user_document_ids = [doc["_id"] for doc in user_documents]
        
        query = {"document_id": {"$in": user_document_ids}}
        
        # Add filters
        if filters.document_id:
            query["document_id"] = ObjectId(filters.document_id)
        
        if filters.action:
            query["action"] = filters.action
        
        if filters.performed_by:
            query["performed_by"] = ObjectId(filters.performed_by)
        
        if filters.ip_address:
            query["ip_address"] = {"$regex": filters.ip_address, "$options": "i"}
        
        if filters.date_from or filters.date_to:
            query["timestamp"] = {}
            if filters.date_from:
                query["timestamp"]["$gte"] = filters.date_from
            if filters.date_to:
                query["timestamp"]["$lte"] = filters.date_to
        
        # Get audit events
        cursor = db.audit.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        audit_events = list(cursor)
        
        return [serialize_audit_event(event) for event in audit_events]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search audit events: {str(e)}")


@router.get("/stats", response_model=AuditStatsResponse)
async def get_audit_statistics(
    document_id: Optional[str] = None,
    days: int = Query(30, le=365),
    current_user: dict = Depends(get_current_user)
):
    """
    Get audit statistics and analytics
    """
    try:
        # Build base query for user's documents
        user_documents = list(db.documents.find(
            {"owner_id": ObjectId(current_user["_id"])},
            {"_id": 1}
        ))
        user_document_ids = [doc["_id"] for doc in user_documents]
        
        query = {
            "document_id": {"$in": user_document_ids},
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=days)}
        }
        
        # Filter by specific document if provided
        if document_id:
            query["document_id"] = ObjectId(document_id)
        
        # Total events
        total_events = db.audit.count_documents(query)
        
        # Events by action
        pipeline_actions = [
            {"$match": query},
            {"$group": {"_id": "$action", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        events_by_action = {
            str(item["_id"]): item["count"] 
            for item in db.audit.aggregate(pipeline_actions)
        }
        
        # Events by user
        pipeline_users = [
            {"$match": query},
            {"$group": {"_id": "$performed_by", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        events_by_user = {}
        for item in db.audit.aggregate(pipeline_users):
            user_id = str(item["_id"])
            user = db.users.find_one({"_id": ObjectId(user_id)})
            user_name = user.get("name") if user else f"User {user_id}"
            events_by_user[user_name] = item["count"]
        
        # Recent activity
        recent_events = list(db.audit.find(query)
            .sort("timestamp", -1)
            .limit(10))
        
        recent_activity = []
        for event in recent_events:
            activity = {
                "action": event.get("action"),
                "timestamp": event.get("timestamp").isoformat(),
                "document_id": str(event.get("document_id")) if event.get("document_id") else None
            }
            
            # Add user info
            if event.get("performed_by"):
                user = db.users.find_one({"_id": ObjectId(event["performed_by"])})
                activity["user_name"] = user.get("name") if user else "Unknown User"
            
            recent_activity.append(activity)
        
        return AuditStatsResponse(
            total_events=total_events,
            events_by_action=events_by_action,
            events_by_user=events_by_user,
            recent_activity=recent_activity
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get audit statistics: {str(e)}")


@router.get("/actions", response_model=Dict[str, str])
async def get_audit_actions():
    """
    Get all available audit action types with descriptions
    """
    return AUDIT_ACTIONS


@router.post("/export")
async def export_audit_trail(
    export_request: BulkAuditExportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Export audit trail for multiple documents
    """
    try:
        # Verify user owns all documents
        for doc_id in export_request.document_ids:
            doc = db.documents.find_one({
                "_id": ObjectId(doc_id),
                "owner_id": ObjectId(current_user["_id"])
            })
            if not doc:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Unauthorized access to document {doc_id}"
                )
        
        # Build query
        query = {"document_id": {"$in": [ObjectId(doc_id) for doc_id in export_request.document_ids]}}
        
        if export_request.date_from or export_request.date_to:
            query["timestamp"] = {}
            if export_request.date_from:
                query["timestamp"]["$gte"] = export_request.date_from
            if export_request.date_to:
                query["timestamp"]["$lte"] = export_request.date_to
        
        # Get events for export
        events = list(db.audit.find(query).sort("timestamp", -1))
        
        # Schedule export generation
        export_id = str(ObjectId())
        background_tasks.add_task(
            generate_audit_export,
            export_id,
            events,
            export_request.format,
            current_user["_id"]
        )
        
        return {
            "message": "Export generation started",
            "export_id": export_id,
            "event_count": len(events)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start export: {str(e)}")


def generate_audit_export(export_id: str, events: List[Dict], format: str, user_id: str):
    """
    Background task to generate audit export
    """
    try:
        # Serialize events
        serialized_events = [serialize_audit_event(event) for event in events]
        
        # Store export in database (you could also generate files and store in cloud storage)
        export_record = {
            "_id": ObjectId(export_id),
            "user_id": ObjectId(user_id),
            "format": format,
            "event_count": len(events),
            "generated_at": datetime.utcnow(),
            "data": serialized_events,
            "status": "completed"
        }
        
        db.audit_exports.insert_one(export_record)
        
        # Log the export activity
        log_audit_event({
            "action": "export_generated",
            "details": {
                "export_id": export_id,
                "event_count": len(events),
                "format": format
            },
            "performed_by": user_id
        })
        
    except Exception as e:
        # Log failed export
        db.audit_exports.insert_one({
            "_id": ObjectId(export_id),
            "user_id": ObjectId(user_id),
            "format": format,
            "generated_at": datetime.utcnow(),
            "status": "failed",
            "error": str(e)
        })


@router.get("/exports/{export_id}")
async def get_audit_export(
    export_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get generated audit export
    """
    try:
        export = db.audit_exports.find_one({
            "_id": ObjectId(export_id),
            "user_id": ObjectId(current_user["_id"])
        })
        
        if not export:
            raise HTTPException(status_code=404, detail="Export not found")
        
        return {
            "export_id": export_id,
            "status": export.get("status"),
            "format": export.get("format"),
            "event_count": export.get("event_count"),
            "generated_at": export.get("generated_at").isoformat(),
            "data": export.get("data", []),
            "error": export.get("error")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get export: {str(e)}")


@router.delete("/cleanup")
async def cleanup_old_audit_events(
    background_tasks: BackgroundTasks,
    days: int = Query(365, description="Delete events older than this many days"),
    current_user: dict = Depends(get_current_user)
):
    """
    Clean up old audit events (admin function)
    """
    try:
        user = db.users.find_one({"_id": ObjectId(current_user["_id"])})

        if not user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Admin access required")

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        background_tasks.add_task(perform_audit_cleanup, cutoff_date, current_user["_id"])

        return {
            "message": f"Audit cleanup scheduled for events older than {days} days",
            "cutoff_date": cutoff_date.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule cleanup: {str(e)}")



def perform_audit_cleanup(cutoff_date: datetime, user_id: str):
    """
    Background task to clean up old audit events
    """
    try:
        # Delete events older than cutoff date
        result = db.audit.delete_many({"timestamp": {"$lt": cutoff_date}})
        
        # Log the cleanup
        log_audit_event({
            "action": "cleanup_performed",
            "details": {
                "cutoff_date": cutoff_date.isoformat(),
                "deleted_count": result.deleted_count
            },
            "performed_by": user_id
        })
        
    except Exception as e:
        print(f"Audit cleanup failed: {str(e)}")


# Middleware-style function to automatically log requests
async def log_request(request, call_next):
    """
    FastAPI middleware to automatically log requests
    """
    response = await call_next(request)
    
    # Log specific actions based on request method and path
    if request.method in ["POST", "PUT", "DELETE"]:
        try:
            # Extract document ID from path if available
            path_parts = request.url.path.split('/')
            document_id = None
            if 'documents' in path_parts:
                doc_index = path_parts.index('documents')
                if len(path_parts) > doc_index + 1:
                    document_id = path_parts[doc_index + 1]
            
            # Determine action based on method and path
            action = f"api_{request.method.lower()}"
            if "sign" in request.url.path:
                action = "signing_action"
            elif "recipients" in request.url.path:
                action = "recipient_modified"
            
            # Get user from request state if available
            user_id = getattr(request.state, 'user_id', None)
            
            if user_id and document_id:
                log_audit_event({
                    "document_id": document_id,
                    "action": action,
                    "details": {
                        "path": request.url.path,
                        "method": request.method,
                        "status_code": response.status_code
                    },
                    "performed_by": user_id,
                    "ip_address": request.client.host if request.client else "unknown",
                    "user_agent": request.headers.get("user-agent", "unknown")
                })
                
        except Exception as e:
            # Don't break the request if logging fails
            print(f"Request logging failed: {str(e)}")
    
    return response