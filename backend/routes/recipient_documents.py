from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import io
import re
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr

from database import db
from config import JWT_SECRET, JWT_ALGORITHM
from routes.pdf_engine import PDFEngine
from routes.documents import _log_event, load_document_pdf, apply_completed_fields_to_pdf
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/api/recipient-docs", tags=["Recipient Documents"])

# Note: GridFS is removed - we now use Azure Blob Storage

# Models for response
class DocumentSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    sender_organization: Optional[str] = None
    envelope_id: Optional[str] = None
    page_count: int = 0
    file_count: int = 1
    thumbnail_url: Optional[str] = None

class RecipientInfo(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    signing_order: int
    signed_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    otp_verified: bool = False
    terms_accepted: bool = False

class FieldSummary(BaseModel):
    id: str
    type: str
    page: int
    label: Optional[str] = None
    completed: bool
    completed_at: Optional[datetime] = None
    value: Optional[Any] = None  

class DocumentDetailResponse(BaseModel):
    document: DocumentSummary
    recipient: RecipientInfo
    fields: List[FieldSummary]
    all_recipients: List[RecipientInfo]
    timeline: List[Dict]
    can_download: bool
    can_view_certificate: bool
    can_view_summary: bool

# Helper function to get recipient from token
async def get_recipient_from_token(token: str):
    """Extract recipient info from JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if this is a recipient token
        if payload.get("type") != "recipient":
            return None
        
        recipient_id = payload.get("recipient_id")
        email = payload.get("email")
        document_id = payload.get("document_id")
        
        if not recipient_id or not email:
            return None
        
        # Verify recipient still exists
        recipient = db.recipients.find_one({
            "_id": ObjectId(recipient_id),
            "email": email
        })
        
        if not recipient:
            return None
        
        # Verify document still exists
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            return None
        
        return {
            "id": str(recipient["_id"]),
            "email": recipient["email"],
            "name": recipient.get("name", ""),
            "document_id": str(recipient["document_id"]),
            "role": recipient.get("role", "signer"),
            "status": recipient.get("status", "pending"),
            "token_type": "recipient"
        }
        
    except JWTError:
        return None

# Alternative auth: can use token in query param for direct links
async def get_recipient_from_request(request: Request):
    """Get recipient from Authorization header or query token"""
    auth = request.headers.get("Authorization")
    token = None
    
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
    
    if not token:
        token = request.query_params.get("token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    
    recipient = await get_recipient_from_token(token)
    if not recipient:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return recipient

# Alternative: use email + OTP verification for simple access
class RecipientAccessRequest(BaseModel):
    email: EmailStr
    otp: str

@router.post("/access")
async def access_recipient_documents(access: RecipientAccessRequest):
    """
    Allow recipient to access their documents using email + OTP.
    Returns a list of documents and an access token.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": access.email.lower()
        }).sort("created_at", -1))
        
        if not recipients:
            raise HTTPException(404, "No documents found for this email")
        
        # Verify OTP for any recipient (all should have same OTP)
        # In a real implementation, you'd want to verify OTP per document
        # For simplicity, we'll check the first recipient
        recipient = recipients[0]
        
        stored_otp = recipient.get("otp")
        otp_expires = recipient.get("otp_expires")
        
        if not stored_otp:
            raise HTTPException(400, "No OTP generated for this email")
        
        if otp_expires and datetime.utcnow() > otp_expires:
            raise HTTPException(400, "OTP expired. Please request a new one.")
        
        if stored_otp != access.otp:
            raise HTTPException(400, "Invalid OTP")
        
        # Get unique documents
        document_ids = set(str(r["document_id"]) for r in recipients)
        documents = []
        
        for doc_id in document_ids:
            doc = db.documents.find_one({"_id": ObjectId(doc_id)})
            if doc:
                # Get recipient info for this document
                doc_recipient = next(
                    (r for r in recipients if str(r["document_id"]) == doc_id),
                    None
                )
                
                if doc_recipient:
                    # Generate token for this document
                    token_data = {
                        "type": "recipient",
                        "recipient_id": str(doc_recipient["_id"]),
                        "email": doc_recipient["email"],
                        "document_id": doc_id,
                        "exp": datetime.utcnow() + timedelta(days=7)
                    }
                    access_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
                    
                    documents.append({
                        "document": serialize_document_summary(doc),
                        "recipient": serialize_recipient_info(doc_recipient),
                        "access_token": access_token,
                        "access_url": f"/recipient-docs/document/{doc_id}?token={access_token}"
                    })
        
        return {
            "email": access.email,
            "documents": documents,
            "total_documents": len(documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accessing recipient documents: {e}")
        raise HTTPException(500, "Error accessing documents")

def serialize_document_summary(doc):
    """Serialize document for recipient view"""
    # Get sender info
    sender_name = None
    sender_organization = None
    
    if doc.get("owner_id"):
        owner = db.users.find_one({"_id": doc["owner_id"]})
        if owner:
            sender_name = owner.get("full_name") or owner.get("name")
            sender_organization = owner.get("organization_name")
    
    return {
        "id": str(doc["_id"]),
        "name": doc.get("filename", "Untitled Document"),
        "description": doc.get("description", ""),
        "status": doc.get("status", "draft"),
        "created_at": doc.get("uploaded_at", datetime.utcnow()),
        "completed_at": doc.get("completed_at") or doc.get("finalized_at"),
        "sender_name": sender_name,
        "sender_email": doc.get("owner_email"),
        "sender_organization": sender_organization,
        "envelope_id": doc.get("envelope_id"),
        "page_count": doc.get("page_count", 0),
        "file_count": db.document_files.count_documents({"document_id": doc["_id"]}) or 1,
        "thumbnail_url": f"/recipient-docs/thumbnail/{doc['_id']}"
    }

def serialize_recipient_info(recipient):
    """Serialize recipient info for response"""
    return {
        "id": str(recipient["_id"]),
        "name": recipient.get("name", ""),
        "email": recipient.get("email", ""),
        "role": recipient.get("role", "signer"),
        "status": recipient.get("status", "pending"),
        "signing_order": recipient.get("signing_order", 1),
        "signed_at": recipient.get("signed_at") or recipient.get("completed_at"),
        "viewed_at": recipient.get("viewed_at"),
        "otp_verified": recipient.get("otp_verified", False),
        "terms_accepted": recipient.get("terms_accepted", False),
        "color": recipient.get("color", "#666666")
    }

@router.get("/documents")
async def get_my_documents(
    request: Request,
    recipient: dict = Depends(get_recipient_from_request),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get all documents assigned to the authenticated recipient.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }).sort("created_at", -1))
        
        if not recipients:
            return {"documents": [], "total": 0}
        
        # Get document IDs
        document_ids = [r["document_id"] for r in recipients]
        
        # Build query
        query = {"_id": {"$in": document_ids}}
        if status:
            query["status"] = status
        
        # Get documents
        documents = list(db.documents.find(query).sort("uploaded_at", -1).limit(limit))
        
        # Map recipients to documents
        recipient_map = {str(r["document_id"]): r for r in recipients}
        
        result = []
        for doc in documents:
            doc_recipient = recipient_map.get(str(doc["_id"]))
            if doc_recipient:
                result.append({
                    "document": serialize_document_summary(doc),
                    "recipient": serialize_recipient_info(doc_recipient),
                    "access_url": f"/recipient-docs/document/{doc['_id']}"
                })
        
        return {
            "documents": result,
            "total": len(result),
            "email": recipient["email"]
        }
        
    except Exception as e:
        print(f"Error getting recipient documents: {e}")
        raise HTTPException(500, "Error retrieving documents")

@router.get("/document/{document_id}")
async def get_document_details(
    document_id: str,
    request: Request,
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get detailed information about a specific document for the recipient.
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned to this document
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "You are not assigned to this document")
        
        # Get all recipients for this document
        all_recipients = list(db.recipients.find({
            "document_id": ObjectId(document_id)
        }).sort("signing_order", 1))
        
        # Get fields for this recipient
        fields = list(db.signature_fields.find({
            "document_id": ObjectId(document_id),
            "recipient_id": recipient_doc["_id"]
        }))
        
        # Enrich fields
        field_list = []
        for field in fields:
            field_list.append({
                "id": str(field["_id"]),
                "type": field.get("type", ""),
                "page": field.get("page", 0),
                "label": field.get("label", ""),
                "completed": field.get("completed_at") is not None,
                "completed_at": field.get("completed_at"),
                "value": field.get("value"),
                "required": field.get("required", True)
            })
        
        # Get document timeline/activity
        timeline = list(db.document_timeline.find({
            "document_id": ObjectId(document_id)
        }).sort("timestamp", -1).limit(20))
        
        timeline_list = []
        for event in timeline:
            actor = event.get("actor", {})
            timeline_list.append({
                "id": str(event["_id"]),
                "type": event.get("type", ""),
                "title": event.get("title", ""),
                "description": event.get("description", ""),
                "timestamp": event.get("timestamp"),
                "actor_name": actor.get("name") or actor.get("email", "System")
            })
        
        # Determine what recipient can do
        can_download = doc.get("status") in ["completed", "sent", "in_progress"]
        can_view_certificate = doc.get("status") == "completed"
        can_view_summary = True
        can_sign = (
            recipient_doc.get("status") != "completed" and
            doc.get("status") in ["sent", "in_progress"] and
            recipient_doc.get("otp_verified", False)
        )
        
        return DocumentDetailResponse(
            document=serialize_document_summary(doc),
            recipient=serialize_recipient_info(recipient_doc),
            fields=field_list,
            all_recipients=[serialize_recipient_info(r) for r in all_recipients],
            timeline=timeline_list,
            can_download=can_download,
            can_view_certificate=can_view_certificate,
            can_view_summary=can_view_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document details: {e}")
        raise HTTPException(500, "Error retrieving document details")

@router.get("/document/{document_id}/download")
async def download_document(
    document_id: str,
    request: Request,
    recipient: dict = Depends(get_recipient_from_request),
    include_signatures: bool = Query(True, description="Include signatures in PDF")
):
    """
    Download document with or without signatures.
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Check if document is completed - only then can download with signatures
        if include_signatures and doc.get("status") != "completed":
            raise HTTPException(400, "Signed document not available yet")
        
        # Load PDF using load_document_pdf from documents.py
        pdf_bytes = load_document_pdf(doc, document_id)
        
        # Apply completed fields if requested and document is completed
        if include_signatures and doc.get("status") == "completed":
            pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, document_id)
        
        # Add envelope header
        envelope_id = doc.get("envelope_id")
        if envelope_id:
            pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                pdf_bytes,
                envelope_id=envelope_id,
                color="#000000"
            )
        
        # Add recipient name as watermark
        if not include_signatures:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                f"For: {recipient_doc.get('name', recipient['email'])}",
                color="#666666",
                opacity=0.1,
                font_size=24,
                position="top"
            )
        
        # Create filename
        filename_base = doc.get("filename", "document").rsplit(".", 1)[0]
        suffix = "signed" if include_signatures else "copy"
        filename = f"{filename_base}_{suffix}.pdf"
        
        # Log download
        _log_event(
            document_id,
            recipient_doc,
            "document_downloaded",
            {
                "include_signatures": include_signatures,
                "envelope_id": envelope_id
            },
            request
        )
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Document-Status": doc.get("status"),
                "X-Include-Signatures": str(include_signatures)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error downloading document: {e}")
        raise HTTPException(500, "Error downloading document")

@router.get("/document/{document_id}/preview")
async def preview_document(
    document_id: str,
    request: Request,
    recipient: dict = Depends(get_recipient_from_request),
    page: int = Query(1, ge=1)
):
    """
    Get document preview (first page as image).
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Get PDF using load_document_pdf
        pdf_bytes = load_document_pdf(doc, document_id)
        
        # Generate thumbnail for requested page
        import fitz
        from PIL import Image
        
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        total_pages = pdf_doc.page_count   # ✅ store early

        if page > total_pages:
            page = 1

        page_obj = pdf_doc[page - 1]
        zoom = 150 / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page_obj.get_pixmap(matrix=matrix)

        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=True)

        pdf_doc.close()   # safe now

        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "X-Page-Number": str(page),
                "X-Total-Pages": str(total_pages)   # ✅ no crash
            }
        )

        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating preview: {e}")
        raise HTTPException(500, "Error generating preview")

@router.get("/document/{document_id}/status")
async def get_document_status(
    document_id: str,
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get current status of document for recipient.
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Get all recipients for status
        all_recipients = list(db.recipients.find({
            "document_id": ObjectId(document_id)
        }))
        
        total_recipients = len(all_recipients)
        completed_recipients = len([r for r in all_recipients if r.get("status") == "completed"])
        
        # Get recipient's fields
        fields = list(db.signature_fields.find({
            "document_id": ObjectId(document_id),
            "recipient_id": recipient_doc["_id"]
        }))
        
        total_fields = len(fields)
        completed_fields = len([f for f in fields if f.get("completed_at")])
        
        return {
            "document_status": doc.get("status"),
            "recipient_status": recipient_doc.get("status"),
            "overall_progress": {
                "total_recipients": total_recipients,
                "completed_recipients": completed_recipients,
                "percentage": (completed_recipients / total_recipients * 100) if total_recipients > 0 else 0
            },
            "recipient_progress": {
                "total_fields": total_fields,
                "completed_fields": completed_fields,
                "percentage": (completed_fields / total_fields * 100) if total_fields > 0 else 0
            },
            "can_sign": (
                recipient_doc.get("status") != "completed" and
                doc.get("status") in ["sent", "in_progress"] and
                recipient_doc.get("otp_verified", False)
            ),
            "needs_otp": not recipient_doc.get("otp_verified", False),
            "needs_terms": not recipient_doc.get("terms_accepted", False) and not recipient_doc.get("terms_declined", False),
            "envelope_id": doc.get("envelope_id"),
            "completed_at": doc.get("completed_at") or doc.get("finalized_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document status: {e}")
        raise HTTPException(500, "Error retrieving document status")

@router.get("/document/{document_id}/recipients")
async def get_document_recipients(
    document_id: str,
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get all recipients for a document (for recipient view).
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Get all recipients
        all_recipients = list(db.recipients.find({
            "document_id": ObjectId(document_id)
        }).sort("signing_order", 1))
        
        recipients_list = []
        for r in all_recipients:
            recipients_list.append({
                "id": str(r["_id"]),
                "name": r.get("name", ""),
                "email": r.get("email", ""),
                "role": r.get("role", "signer"),
                "status": r.get("status", "pending"),
                "signing_order": r.get("signing_order", 1),
                "signed_at": r.get("signed_at") or r.get("completed_at"),
                "is_current_recipient": str(r["_id"]) == str(recipient_doc["_id"])
            })
        
        return {
            "recipients": recipients_list,
            "total": len(recipients_list),
            "document_status": doc.get("status")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document recipients: {e}")
        raise HTTPException(500, "Error retrieving recipients")

@router.get("/document/{document_id}/fields")
async def get_document_fields(
    document_id: str,
    recipient: dict = Depends(get_recipient_from_request),
    include_all: bool = Query(False, description="Include all recipients' fields")
):
    """
    Get fields for document.
    By default, returns only current recipient's fields.
    If include_all=True, returns all fields (requires document completion).
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Build query
        query = {"document_id": ObjectId(document_id)}
        
        if not include_all:
            # Only this recipient's fields
            query["recipient_id"] = recipient_doc["_id"]
        else:
            # Only show all fields if document is completed
            if doc.get("status") != "completed":
                raise HTTPException(400, "Cannot view all fields until document is completed")
        
        fields = list(db.signature_fields.find(query))
        
        field_list = []
        for field in fields:
            # Get recipient info for this field
            field_recipient = None
            if include_all and field.get("recipient_id"):
                field_recipient = db.recipients.find_one({"_id": field["recipient_id"]})
            
            field_list.append({
                "id": str(field["_id"]),
                "type": field.get("type", ""),
                "page": field.get("page", 0),
                "label": field.get("label", ""),
                "completed": field.get("completed_at") is not None,
                "completed_at": field.get("completed_at"),
                "value": field.get("value") if field.get("completed_at") else None,
                "required": field.get("required", True),
                "recipient_name": field_recipient.get("name") if field_recipient else None,
                "recipient_color": field_recipient.get("color") if field_recipient else None,
                "is_my_field": field.get("recipient_id") == recipient_doc["_id"] if field.get("recipient_id") else False
            })
        
        return {
            "fields": field_list,
            "total": len(field_list),
            "include_all": include_all,
            "document_status": doc.get("status")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document fields: {e}")
        raise HTTPException(500, "Error retrieving fields")

@router.get("/document/{document_id}/timeline")
async def get_document_timeline(
    document_id: str,
    recipient: dict = Depends(get_recipient_from_request),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get timeline of events for a document.
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Get timeline events
        events = list(db.document_timeline.find({
            "document_id": ObjectId(document_id)
        }).sort("timestamp", -1).limit(limit))
        
        timeline = []
        for event in events:
            actor = event.get("actor", {})
            timeline.append({
                "id": str(event["_id"]),
                "type": event.get("type", ""),
                "title": event.get("title", ""),
                "description": event.get("description", ""),
                "timestamp": event.get("timestamp"),
                "actor_name": actor.get("name") or actor.get("email", "System"),
                "metadata": event.get("metadata", {})
            })
        
        return {
            "timeline": timeline,
            "total": len(timeline),
            "document_id": document_id,
            "document_status": doc.get("status")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document timeline: {e}")
        raise HTTPException(500, "Error retrieving timeline")

@router.get("/statistics")
async def get_recipient_statistics(
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get statistics about recipient's documents.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return {
                "total_documents": 0,
                "completed_documents": 0,
                "pending_documents": 0,
                "expired_documents": 0,
                "by_role": {},
                "recent_documents": []
            }
        
        document_ids = [r["document_id"] for r in recipients]
        
        # Get all documents
        documents = list(db.documents.find({
            "_id": {"$in": document_ids}
        }))
        
        # Map recipients to documents
        recipient_map = {str(r["document_id"]): r for r in recipients}
        
        # Calculate statistics
        total = len(documents)
        completed = 0
        pending = 0
        expired = 0
        by_role = {}
        recent = []
        
        for doc in documents:
            status = doc.get("status", "draft")
            doc_recipient = recipient_map.get(str(doc["_id"]))
            
            if status == "completed":
                completed += 1
            elif status == "expired":
                expired += 1
            else:
                pending += 1
            
            # Count by role
            if doc_recipient:
                role = doc_recipient.get("role", "signer")
                by_role[role] = by_role.get(role, 0) + 1
            
            # Add to recent if within last 30 days
            if doc.get("uploaded_at") and (datetime.utcnow() - doc["uploaded_at"]).days <= 30:
                recent.append({
                    "document_id": str(doc["_id"]),
                    "name": doc.get("filename", "Untitled"),
                    "status": doc.get("status"),
                    "role": doc_recipient.get("role") if doc_recipient else "unknown",
                    "uploaded_at": doc.get("uploaded_at"),
                    "envelope_id": doc.get("envelope_id")
                })
        
        # Sort recent by date
        recent.sort(key=lambda x: x["uploaded_at"], reverse=True)
        
        return {
            "total_documents": total,
            "completed_documents": completed,
            "pending_documents": pending,
            "expired_documents": expired,
            "by_role": by_role,
            "recent_documents": recent[:10],  # Last 10
            "email": recipient["email"]
        }
        
    except Exception as e:
        print(f"Error getting recipient statistics: {e}")
        raise HTTPException(500, "Error calculating statistics")

@router.get("/thumbnail/{document_id}")
async def get_document_thumbnail(
    document_id: str,
    request: Request
):
    """
    Get thumbnail image for document (for list views).
    Can be accessed with recipient token or via query token.
    """
    # Try to get recipient from token
    try:
        recipient = await get_recipient_from_request(request)
    except:
        recipient = None
    
    if not recipient:
        # Try to get from query param
        token = request.query_params.get("token")
        if token:
            try:
                recipient = await get_recipient_from_token(token)
            except:
                pass
    
    if not recipient:
        raise HTTPException(401, "Authentication required")
    
    try:
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Check if recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc and str(doc.get("owner_id")) != recipient.get("id"):
            raise HTTPException(403, "Not authorized")
        
        # Try to get pre-generated thumbnail from Azure
        if doc.get("preview_thumbnail_path"):
            try:
                thumb_bytes = storage.download(doc["preview_thumbnail_path"])
                return StreamingResponse(
                    io.BytesIO(thumb_bytes),
                    media_type="image/png",
                    headers={"Cache-Control": "public, max-age=86400"}
                )
            except:
                pass
        
        # Generate thumbnail on the fly
        pdf_bytes = load_document_pdf(doc, document_id)
        
        import fitz
        from PIL import Image
        
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = pdf_doc[0]
        
        # Render at 100 DPI
        zoom = 100 / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)
        
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Resize for thumbnail
        img.thumbnail((200, 300), Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=True)
        
        pdf_doc.close()
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"}
        )
        
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        raise HTTPException(500, "Error generating thumbnail")

@router.get("/search")
async def search_documents(
    request: Request,
    recipient: dict = Depends(get_recipient_from_request),
    q: str = Query(..., min_length=1, description="Search query"),
    status: Optional[str] = Query(None)
):
    """
    Search recipient's documents by name or sender.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return {"documents": [], "total": 0}
        
        document_ids = [r["document_id"] for r in recipients]
        
        # Build search query
        query = {
            "_id": {"$in": document_ids},
            "$or": [
                {"filename": {"$regex": q, "$options": "i"}},
                {"owner_email": {"$regex": q, "$options": "i"}},
                {"envelope_id": {"$regex": q, "$options": "i"}}
            ]
        }
        
        if status:
            query["status"] = status
        
        documents = list(db.documents.find(query).sort("uploaded_at", -1).limit(50))
        
        # Map recipients
        recipient_map = {str(r["document_id"]): r for r in recipients}
        
        result = []
        for doc in documents:
            doc_recipient = recipient_map.get(str(doc["_id"]))
            if doc_recipient:
                result.append({
                    "document": serialize_document_summary(doc),
                    "recipient": serialize_recipient_info(doc_recipient),
                    "match_reason": "filename" if q.lower() in doc.get("filename", "").lower() else "sender" if q.lower() in doc.get("owner_email", "").lower() else "envelope"
                })
        
        return {
            "query": q,
            "documents": result,
            "total": len(result)
        }
        
    except Exception as e:
        print(f"Error searching documents: {e}")
        raise HTTPException(500, "Error searching documents")