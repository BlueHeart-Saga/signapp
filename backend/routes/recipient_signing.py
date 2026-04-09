from fastapi import APIRouter, Depends, HTTPException, Body, Query, Request, BackgroundTasks
from bson import ObjectId
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import io
from pydantic import BaseModel
from routes.fields import validate_field_role
from .fields import serialize_field_with_recipient
from .pdf_engine import PDFEngine
from .documents import _log_event, get_merged_pdf, load_document_pdf, apply_completed_fields_to_pdf
from database import db
from config import BACKEND_URL
from .auth import get_current_user
from .email_service import send_completed_document_to_recipients, SafeSignSummaryEngine, SafeSignCertificateEngine, generate_otp, send_role_based_email
import re
import uuid

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import PageBreak, KeepTogether
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Import storage provider
from storage import storage

router = APIRouter(prefix="/signing", tags=["Recipient Signing"])

# Note: GridFS is removed - we now use Azure Blob Storage

IMAGE_FIELDS = {
    "signature",
    "initials",
    "witness_signature",
    "stamp"
}

TEXT_FIELDS = {
    "textbox",
    "date",
    "mail",
    "dropdown",
    "radio"
}

RADIO_FIELDS = {"radio"}
DROPDOWN_FIELDS = {"dropdown"}

BOOLEAN_FIELDS = {
    "checkbox",
    "approval"  # approval can be boolean
}

# Add attachment field type if needed
ATTACHMENT_FIELDS = {
    "attachment"
}

# ======================
# MODELS
# ======================

class OTPVerification(BaseModel):
    otp: str

class SigningData(BaseModel):
    otp: str
    signature_data: Optional[str] = None
    form_data: Optional[Dict[str, str]] = None

class FormFillData(BaseModel):
    otp: str
    fields: dict

class DeclineRequest(BaseModel):
    reason: Optional[str] = None
    
class AssignToOthersRequest(BaseModel):
    new_email: str
    new_name: str
    reason: Optional[str] = None
    
    
class TermsAcceptance(BaseModel):
    accepted: bool
    accept_always: Optional[bool] = False
    accepted_at: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class TermsDecline(BaseModel):
    decline_reason: str
    declined_at: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

# ======================
# HELPERS
# ======================

def serialize_recipient(recipient):
    """Serialize recipient data for response."""
    result = {
        "id": str(recipient["_id"]),
        "name": recipient["name"],
        "email": recipient["email"],
        "role": recipient.get("role", "signer"),
        "signing_order": recipient.get("signing_order", 1),
        "status": recipient.get("status", "pending"),
        "otp_verified": recipient.get("otp_verified", False),
        "terms_accepted": recipient.get("terms_accepted", False),
        "terms_accepted_at": recipient.get("terms_accepted_at"),
        "terms_declined": recipient.get("terms_declined", False),
        "terms_declined_at": recipient.get("terms_declined_at"),
        "terms_decline_reason": recipient.get("terms_decline_reason"),
        "added_at": recipient.get("added_at", datetime.utcnow()).isoformat()
    }
    
    # Add role-specific timestamps
    timestamps = {
        "signed_at": "signed_at",
        "approved_at": "approved_at",
        "viewer_at": "viewer_at",
        "form_completed_at": "form_completed_at",
        "witnessed_at": "witnessed_at"
    }
    
    for key, field in timestamps.items():
        if recipient.get(field):
            result[key] = recipient[field].isoformat()
    
    return result

def serialize_document(document):
    """Serialize document data for response."""
    return {
        "id": str(document["_id"]),
        "filename": document.get("filename", "Unknown"),
        "uploaded_at": document.get("uploaded_at", datetime.utcnow()).isoformat(),
        "size": document.get("size", 0),
        "mime_type": document.get("mime_type", "application/octet-stream"),
        "status": document.get("status", "draft")
    }

async def get_recipient_for_signing(recipient_id: str, allow_voided=False):
    """Get recipient with validation for signing operations."""
    try:
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(404, "Recipient not found")

        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # ✅ ALLOW VOIDED DOCUMENTS FOR VIEWING
        # Only block voided documents if specifically not allowed
        if not allow_voided and document.get("status") == "voided":
            # Instead of raising error, return recipient but indicate voided status
            # This allows the frontend to handle voided documents appropriately
            raise HTTPException(400, "Document has been voided. Please use /view-voided endpoint.")
            
        # Allow viewing for sent, in_progress, completed, and voided (with allow_voided)
        allowed_status = ["sent", "in_progress", "completed"]
        if allow_voided:
            allowed_status.append("voided")
            
        if document.get("status") not in allowed_status:
            raise HTTPException(400, f"Document is not available for signing (status: {document.get('status')})")

        return recipient
    except:
        raise HTTPException(400, "Invalid recipient ID")

def can_sign_now(recipient_id: str, document_id: ObjectId) -> bool:
    """Check if recipient can sign based on signing order."""
    doc = db.documents.find_one({"_id": document_id})
    signing_order_enabled = doc.get("signing_order_enabled", False) if doc else False
    
    all_recipients = list(db.recipients.find(
        {"document_id": document_id}
    ).sort("signing_order", 1))
    
    current_recipient = None
    for rec in all_recipients:
        if str(rec["_id"]) == recipient_id:
            current_recipient = rec
            break
    
    if not current_recipient:
        return False
    
    if not signing_order_enabled:
        print(f"✅ Signing order disabled for document {document_id}. Recipient {recipient_id} can sign.")
        return True

    current_order = current_recipient.get("signing_order", 1)
    previous_signers = [
        r for r in all_recipients 
        if r.get("signing_order", 1) < current_order
    ]
    
    blocking_signers = [r for r in previous_signers if r.get("status") != "completed"]
    
    if not blocking_signers:
        print(f"✅ Recipient {recipient_id} (Order: {current_order}) can sign now.")
        return True
    else:
        print(f"⏳ Recipient {recipient_id} (Order: {current_order}) is BLOCKED by: {[r.get('email') for r in blocking_signers]}")
        return False

def update_document_statistics(document_id: ObjectId):
    """Update document statistics after recipient completion."""
    recipients = list(db.recipients.find({"document_id": document_id}))
    
    role_counts = {
        "signer": 0,
        "approver": 0,
        "viewer": 0,
        "form_filler": 0,
        "witness": 0
    }
    
    completed_by_role = {
        "signer": 0,
        "approver": 0,
        "viewer": 0,
        "form_filler": 0,
        "witness": 0
    }
    
    for recipient in recipients:
        role = recipient.get("role", "signer")
        if role in role_counts:
            role_counts[role] += 1
            if recipient.get("status") == "completed":
                completed_by_role[role] += 1
    
    total_completed = sum(completed_by_role.values())
    
    db.documents.update_one(
        {"_id": document_id},
        {"$set": {
            "signed_count": total_completed,
            "signer_count": completed_by_role["signer"],
            "approver_count": completed_by_role["approver"],
            "viewer_count": completed_by_role["viewer"],
            "form_filler_count": completed_by_role["form_filler"],
            "witness_count": completed_by_role["witness"]
        }}
    )
    
async def _get_voided_document_preview(document, recipient, request):
    """Handle voided document preview."""
    # Check for multi-file voided document
    files = list(
        db.document_files
        .find({"document_id": document["_id"]})
        .sort("order", 1)
    )
    
    pdf_bytes = None
    
    if files and len(files) > 0:
        # Multi-file voided document
        if len(files) == 1:
            single_file = files[0]
            try:
                pdf_bytes = storage.download(single_file["file_path"])
            except Exception:
                pass
        else:
            # Merge multiple files for voided document
            try:
                pdf_bytes = get_merged_pdf(str(document["_id"]))
            except Exception as e:
                print(f"Error merging voided files: {e}")
                # Fallback to first file
                try:
                    pdf_bytes = storage.download(files[0]["file_path"])
                except:
                    pass
    else:
        # Legacy voided document
        base_pdf_path = document.get("pdf_file_path")
        if base_pdf_path:
            try:
                pdf_bytes = storage.download(base_pdf_path)
            except Exception:
                pass
    
    if not pdf_bytes:
        raise HTTPException(404, "Base PDF not found for voided document")
    
    # Apply professional VOIDED watermark
    pdf_bytes = PDFEngine.apply_watermark(
        pdf_bytes,
        "VOIDED",
        color="#D32F2F", # Professional Red
        opacity=0.15,
        font_size=120,
        angle=45
    )
    
    # Add professional status banner
    voided_at = document.get("voided_at", datetime.utcnow())
    info_text = f"SafeSign Verified • VOIDED ON {voided_at.strftime('%Y-%m-%d %H:%M:%S UTC')}"
    pdf_bytes = PDFEngine.apply_watermark(
        pdf_bytes,
        info_text,
        color="#424242",
        opacity=0.6,
        font_size=10,
        position="bottom"
    )
    
    filename = f"VOIDED_{document.get('filename', 'document')}"
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Document-Status": "voided"
        }
    )
    
# ======================
# RECIPIENT INFORMATION
# ======================

@router.get("/recipient/{recipient_id}")
async def get_signing_info(recipient_id: str):
    """Get signing information for recipient."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check document status
        doc_status = document.get("status")
        
        # Handle voided documents - SHOW THEM TO RECIPIENTS
        if doc_status == "voided":
            return {
                "recipient": serialize_recipient(recipient),
                "document": serialize_document(document),
                "signing_info": {
                    "requires_terms": False,
                    "requires_otp": not recipient.get("otp_verified", False),
                    "can_sign_now": False,
                    "terms_status": "n/a",
                    "document_status": "voided",
                    "voided_at": document.get("voided_at"),
                    "void_reason": document.get("void_reason", "Document has been voided"),
                    "message": "This document has been voided",
                    "can_view_voided": True,  # ✅ Add this flag
                    "is_voided": True
                },
                "is_voided": True
            }
        
        # Handle other terminal statuses
        terminal_statuses = ["declined", "expired", "deleted"]
        if doc_status in terminal_statuses:
            return {
                "recipient": serialize_recipient(recipient),
                "document": serialize_document(document),
                "signing_info": {
                    "document_status": doc_status,
                    "can_sign_now": False,
                    "message": f"Document is {doc_status}"
                }
            }
        
        # Check terms status
        if not recipient.get("terms_accepted") and not recipient.get("terms_declined"):
            # ✅ CHECK IF EMAIL HAS ALREADY "ALWAYS ACCEPTED" TERMS
            email = recipient.get("email", "").lower()
            always_accepted = False
            if email:
                pref = db.terms_preferences.find_one({"email": email, "accepted_always": True})
                if pref:
                    always_accepted = True
                    # AUTO-ACCEPT FOR THIS RECIPIENT
                    db.recipients.update_one(
                        {"_id": rid},
                        {"$set": {
                            "terms_accepted": True,
                            "terms_accepted_at": datetime.utcnow(),
                            "terms_ip_address": "auto-accepted-always",
                            "terms_auto_accepted": True
                        }}
                    )
                    # Refresh recipient object
                    recipient = db.recipients.find_one({"_id": rid})

            if not always_accepted:
                return {
                    "recipient": serialize_recipient(recipient),
                    "document": serialize_document(document),
                    "signing_info": {
                        "requires_terms": True,
                        "requires_otp": not recipient.get("otp_verified", False),
                        "can_sign_now": False,
                        "terms_status": "pending",
                        "document_status": doc_status
                    }
                }
        
        if recipient.get("terms_declined"):
            return {
                "recipient": serialize_recipient(recipient),
                "document": serialize_document(document),
                "signing_info": {
                    "requires_terms": False,
                    "requires_otp": False,
                    "can_sign_now": False,
                    "terms_status": "declined",
                    "document_status": doc_status,
                    "message": "You have declined the terms and conditions."
                }
            }
        
        # Normal flow for active documents
        all_recipients = list(db.recipients.find(
            {"document_id": recipient["document_id"]}
        ).sort("signing_order", 1))
        
        can_sign = can_sign_now(recipient_id, recipient["document_id"])
        
        return {
            "recipient": serialize_recipient(recipient),
            "document": serialize_document(document),
            "signing_info": {
                "requires_terms": False,
                "requires_otp": not recipient.get("otp_verified", False),
                "can_sign_now": can_sign and recipient.get("status") != "completed",
                "terms_status": "accepted",
                "document_status": doc_status,
                "current_order": recipient.get("signing_order", 1),
                "total_recipients": len(all_recipients),
                "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"])
            },
            "is_voided": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting recipient info: {str(e)}")
        raise HTTPException(400, "Invalid recipient ID")

@router.get("/recipient/{recipient_id}/history")
async def get_document_history_for_recipient(recipient_id: str):
    """
    Get detailed document history and activity logs for a recipient.
    This provides data for the 'Document History' high-fidelity UI.
    """
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        doc_id = recipient["document_id"]
        document = db.documents.find_one({"_id": doc_id})
        if not document:
            raise HTTPException(404, "Document not found")

        # 1. Document Details
        owner = db.users.find_one({"_id": document["owner_id"]})
        document_details = {
            "id": str(document["_id"]),
            "envelope_id": document.get("envelope_id"),
            "filename": document.get("filename"),
            "owner": {
                "name": owner.get("full_name") or owner.get("name") if owner else "Unknown",
                "email": document.get("owner_email"),
                "organization": owner.get("organization_name") if owner else "N/A"
            },
            "created_at": document.get("uploaded_at").isoformat() if document.get("uploaded_at") else None,
            "sent_at": document.get("sent_at").isoformat() if document.get("sent_at") else None,
            "status": document.get("status"),
            "time_zone": "(GMT +05:30) India Standard Time ( Asia/Kolkata )" # Hardcoded for now as per image or get from user pref
        }

        # 2. Recipients Information
        all_recipients = list(db.recipients.find({"document_id": doc_id}).sort("signing_order", 1))
        recipients_list = []
        for idx, rec in enumerate(all_recipients):
            recipients_list.append({
                "index": idx + 1,
                "name": rec.get("name"),
                "email": rec.get("email"),
                "role": rec.get("role", "signer"),
                "status": rec.get("status"),
                "received_at": rec.get("added_at").isoformat() if rec.get("added_at") else None,
                "completed_at": (rec.get("signed_at") or rec.get("approved_at") or rec.get("form_completed_at")).isoformat() if (rec.get("signed_at") or rec.get("approved_at") or rec.get("form_completed_at")) else None
            })

        # 3. Activities / Timeline
        timeline_logs = list(db.document_timeline.find({"document_id": doc_id}).sort("timestamp", -1))
        activities = []
        for log in timeline_logs:
            actor = log.get("actor", {})
            activities.append({
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None,
                "action": log.get("type", "updated").upper(),
                "title": log.get("title") or log.get("type", "").replace("_", " ").title(),
                "performed_by": {
                    "name": actor.get("name") or "System",
                    "email": actor.get("email") or "",
                    "ip": log.get("metadata", {}).get("ip", "Unknown")
                },
                "activity": log.get("description") or f"Document has been {log.get('type', 'updated').replace('_', ' ')}"
            })

        return {
            "document": document_details,
            "recipients": recipients_list,
            "activities": activities
        }

    except Exception as e:
        print(f"Error fetching history: {str(e)}")
        raise HTTPException(500, f"Error fetching document history: {str(e)}")

# ======================
# OTP VERIFICATION
# ======================

@router.post("/recipient/{recipient_id}/verify-otp")
async def verify_recipient_otp(recipient_id: str, otp_data: OTPVerification,  request: Request):
    """Verify OTP for recipient."""
    recipient = await get_recipient_for_signing(recipient_id)
    
    if recipient.get("status") == "completed":
        raise HTTPException(400, "Recipient already completed")
    
    stored_otp = recipient.get("otp")
    otp_expires = recipient.get("otp_expires")
    
    if not stored_otp:
        raise HTTPException(400, "OTP not generated")
    
    if otp_expires and datetime.utcnow() > otp_expires:
        raise HTTPException(400, "OTP expired")
    
    if stored_otp != otp_data.otp:
        raise HTTPException(400, "Invalid OTP")
    
    db.recipients.update_one(
        {"_id": ObjectId(recipient_id)},
        {"$set": {
            "otp_verified": True,
            "otp_verified_at": datetime.utcnow(),
            "status": "viewed"
        }}
    )
    _log_event(
        str(recipient["document_id"]),
        recipient,
        "otp_verified",
        {},
        request
    )

    
    return {"message": "OTP verified", "verified": True}



@router.get("/recipient/{recipient_id}/terms-status")
async def get_terms_status(recipient_id: str):
    """Get terms acceptance status for recipient."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # ✅ CHECK IF EMAIL HAS ALREADY "ALWAYS ACCEPTED" TERMS
        email = recipient.get("email", "").lower()
        if not recipient.get("terms_accepted") and not recipient.get("terms_declined") and email:
            pref = db.terms_preferences.find_one({"email": email, "accepted_always": True})
            if pref:
                # AUTO-ACCEPT FOR THIS RECIPIENT
                db.recipients.update_one(
                    {"_id": rid},
                    {"$set": {
                        "terms_accepted": True,
                        "terms_accepted_at": datetime.utcnow(),
                        "terms_ip_address": "auto-accepted-always",
                        "terms_auto_accepted": True
                    }}
                )
                # Refresh recipient object
                recipient = db.recipients.find_one({"_id": rid})

        return {
            "terms_accepted": recipient.get("terms_accepted", False),
            "terms_accepted_at": recipient.get("terms_accepted_at"),
            "terms_declined": recipient.get("terms_declined", False),
            "terms_declined_at": recipient.get("terms_declined_at"),
            "terms_decline_reason": recipient.get("terms_decline_reason"),
            "requires_terms": not recipient.get("terms_accepted", False)
        }
    except:
        raise HTTPException(400, "Invalid recipient ID")

@router.post("/recipient/{recipient_id}/accept-terms")
async def accept_terms(
    recipient_id: str,
    terms_data: TermsAcceptance,
    request: Request
):
    """Accept terms and conditions."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        if recipient.get("status") == "completed":
            raise HTTPException(400, "Recipient already completed")
        
        if recipient.get("terms_declined"):
            raise HTTPException(400, "Cannot accept terms after declining")
        
        # Update recipient with terms acceptance
        update_data = {
            "terms_accepted": True,
            "terms_accepted_at": datetime.utcnow(),
            "terms_ip_address": terms_data.ip_address or request.client.host,
            "terms_user_agent": terms_data.user_agent or request.headers.get("user-agent")
        }
        
        # If this is first acceptance, update status to viewed
        if not recipient.get("otp_verified"):
            update_data["status"] = "viewed"
        
        db.recipients.update_one(
            {"_id": rid},
            {"$set": update_data}
        )

        # ✅ STORE IN TERMS PREFERENCES IF "ALWAYS"
        if terms_data.accept_always:
            email = recipient.get("email", "").lower()
            if email:
                db.terms_preferences.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "email": email,
                            "accepted_always": True,
                            "updated_at": datetime.utcnow(),
                            "ip": terms_data.ip_address or request.client.host,
                            "ua": terms_data.user_agent or request.headers.get("user-agent")
                        }
                    },
                    upsert=True
                )
        
        # Log the acceptance
        _log_event(
            str(recipient["document_id"]),
            recipient,
            "accept_terms",
            {},
            request
        )

        
        return {
            "message": "Terms accepted successfully",
            "accepted": True,
            "requires_otp": not recipient.get("otp_verified", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting terms: {str(e)}")
        raise HTTPException(500, "Failed to accept terms")
    
@router.post("/recipient/{recipient_id}/reaccept-terms")
async def reaccept_terms(
    recipient_id: str,
    terms_data: TermsAcceptance,
    request: Request
):
    """Re-accept terms after declining."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        if not recipient.get("terms_declined"):
            raise HTTPException(400, "Terms not previously declined")
        
        if recipient.get("status") == "completed":
            raise HTTPException(400, "Recipient already completed")
        
        # Update recipient with terms re-acceptance
        update_data = {
            "terms_accepted": True,
            "terms_reaccepted_at": datetime.utcnow(),
            "terms_reaccepted_ip": terms_data.ip_address or request.client.host,
            "terms_reaccepted_user_agent": terms_data.user_agent or request.headers.get("user-agent"),
            "terms_declined": False,
            "terms_decline_reason": None,
            "terms_declined_at": None,
            "status": "viewed"  # Reset status to allow signing
        }
        
        db.recipients.update_one(
            {"_id": rid},
            {"$set": update_data}
        )
        
        # ✅ STORE IN TERMS PREFERENCES IF "ALWAYS"
        if terms_data.accept_always:
            email = recipient.get("email", "").lower()
            if email:
                db.terms_preferences.update_one(
                    {"email": email},
                    {
                        "$set": {
                            "email": email,
                            "accepted_always": True,
                            "updated_at": datetime.utcnow(),
                            "ip": terms_data.ip_address or request.client.host,
                            "ua": terms_data.user_agent or request.headers.get("user-agent")
                        }
                    },
                    upsert=True
                )
        
        # Log the re-acceptance
        _log_event(
            str(recipient["document_id"]),
            recipient,
            "reaccept_terms",
            {},
            request
        )
        
        return {
            "message": "Terms re-accepted successfully",
            "accepted": True,
            "requires_otp": not recipient.get("otp_verified", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error re-accepting terms: {str(e)}")
        raise HTTPException(500, "Failed to re-accept terms")

@router.post("/recipient/{recipient_id}/decline-terms")
async def decline_terms(
    recipient_id: str,
    decline_data: TermsDecline,
    request: Request
):
    """Decline terms and conditions."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        if recipient.get("status") == "completed":
            raise HTTPException(400, "Recipient already completed")
        
        if recipient.get("terms_accepted"):
            raise HTTPException(400, "Cannot decline terms after accepting")
        
        # Update recipient with terms decline
        update_data = {
            "terms_declined": True,
            "terms_decline_reason": decline_data.decline_reason,
            "terms_declined_at": datetime.utcnow(),
            "terms_ip_address": decline_data.ip_address or request.client.host,
            "terms_user_agent": decline_data.user_agent or request.headers.get("user-agent"),
            "status": "declined",
            "declined_at": datetime.utcnow(),
            "decline_reason": f"Declined terms: {decline_data.decline_reason}"
        }
        
        db.recipients.update_one(
            {"_id": rid},
            {"$set": update_data}
        )
        
        # Update document statistics
        doc_id = recipient["document_id"]
        update_document_statistics(doc_id)
        
        # Log the decline
        _log_event(
            str(doc_id),
            recipient,
            "decline_terms",
            {
                "reason": decline_data.decline_reason,
                "ip_address": update_data["terms_ip_address"],
                "user_agent": update_data["terms_user_agent"]
            },
            request
        )

        
        return {
            "message": "Terms declined successfully",
            "declined": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error declining terms: {str(e)}")
        raise HTTPException(500, "Failed to decline terms")

# ======================
# IMPROVED LIVE DOCUMENT VIEW WITH PLACEHOLDERS
# ======================

@router.get("/recipient/{recipient_id}/live-document")
async def get_live_document_for_recipient(recipient_id: str, request: Request):
    """
    Get document with ONLY completed fields from ALL recipients visible.
    NO placeholders are shown for ANY recipient's pending fields.
    """
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Skip OTP verification for voided documents
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Get files for this document
        files = list(db.document_files.find({
            "document_id": recipient["document_id"]
        }).sort("order", 1))
        
        # Check if document is voided
        if document.get("status") == "voided":
            # For voided documents, show with VOIDED watermark
            base_pdf_path = document.get("pdf_file_path")
            if not base_pdf_path:
                raise HTTPException(404, "Base PDF not found")
            
            pdf_bytes = storage.download(base_pdf_path)
            
            # Apply prominent VOIDED watermark
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "VOIDED",
                color="#FF0000",
                opacity=0.3,
                font_size=96,
                angle=45
            )
            
            # Add status info
            voided_at = document.get("voided_at", datetime.utcnow())
            info_text = f"Document voided on {voided_at.strftime('%Y-%m-%d %H:%M:%S UTC')}"
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                info_text,
                color="#666666",
                opacity=0.5,
                font_size=14,
                position="bottom"
            )
            
            filename = f"VOIDED_{document.get('filename', 'document')}"
            
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "X-Document-Status": "voided",
                    "X-File-Count": str(len(files))
                }
            )
        
        # OTP verification check
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required before viewing document")
        
        allowed_status = ["sent", "in_progress", "completed"]
        if document.get("status") not in allowed_status:
            raise HTTPException(400, f"Document is not available for viewing (status: {document.get('status')})")
        
        # Use the existing load_document_pdf function from documents.py
        pdf_bytes = load_document_pdf(document, str(document["_id"]))
        
        if not pdf_bytes:
            raise HTTPException(404, "No PDF content available")
        
        # Apply envelope header if envelope ID exists
        envelope_id = document.get("envelope_id")
        if envelope_id:
            pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                pdf_bytes,
                envelope_id=envelope_id,
                color="#000000"
            )
        
        # ============================================
        # GET ONLY COMPLETED FIELDS FROM ALL RECIPIENTS
        # ============================================
        
        # Get ONLY completed fields for this document (all recipients)
        completed_fields_query = {
            "document_id": recipient["document_id"],
            "completed_at": {"$exists": True}  # Only get completed fields
        }
        
        completed_raw_fields = list(db.signature_fields.find(completed_fields_query))
        
        # Pre-fetch all recipients for name mapping
        all_recipients = {}
        recipients_list = list(db.recipients.find({"document_id": recipient["document_id"]}))
        for r in recipients_list:
            all_recipients[str(r["_id"])] = r
        
        print(f"Live document: {len(completed_raw_fields)} completed fields from all recipients")
        print(f"NO placeholders will be shown for ANY pending fields")
        
        # ============================================
        # PREPARE ONLY COMPLETED FIELDS FOR PDF RENDERING
        # ============================================

        signatures = []
        form_fields = []

        # Process ONLY completed fields from ALL recipients
        for raw_field in completed_raw_fields:
            recipient_id_for_field = str(raw_field.get("recipient_id"))
            field_recipient = all_recipients.get(recipient_id_for_field, {})
            
            field_type = raw_field.get("type")
            field_value = raw_field.get("value")
            
            if field_type in IMAGE_FIELDS:
                # Handle image-based fields (signatures, initials, stamps)
                image_data = None
                if isinstance(field_value, dict):
                    if "image" in field_value:
                        image_data = field_value["image"]
                    elif "data" in field_value and field_value.get("type") == "image":
                        image_data = field_value["data"]
                
                if image_data:
                    signatures.append({
                        "field_id": str(raw_field["_id"]),
                        "image": image_data,
                        "page": raw_field.get("page", 0),
                        "x": raw_field.get("pdf_x", raw_field.get("x", 0)),
                        "y": raw_field.get("pdf_y", raw_field.get("y", 0)),
                        "width": raw_field.get("pdf_width", raw_field.get("width", 100)),
                        "height": raw_field.get("pdf_height", raw_field.get("height", 30)),
                        "opacity": 1.0,
                        "is_completed": True,  # CRITICAL: Add this flag
                        "_render_completed": True,  # Add this for PDFEngine
                        "recipient_name": field_recipient.get("name", "Unknown")
                    })
                    print(f"  - Added completed {field_type} from {field_recipient.get('name', 'Unknown')}")
                    
            elif field_type not in IMAGE_FIELDS:
                # Handle form fields (text, checkbox, etc.)
                printable_value = None
                
                if isinstance(field_value, dict):
                    printable_value = field_value.get("value")
                else:
                    printable_value = field_value
                
                if printable_value not in [None, ""]:
                    # For approval fields, ensure we preserve the boolean value
                    if field_type == "approval":
                        # The value might be in different formats
                        if isinstance(field_value, dict):
                            if "value" in field_value:
                                # Extract boolean from nested structure
                                val = field_value["value"]
                                if isinstance(val, bool):
                                    printable_value = val
                                elif isinstance(val, str):
                                    printable_value = val.lower() in ["true", "yes", "1", "approved"]
                                elif isinstance(val, dict):
                                    printable_value = val.get("value", False)
                            elif "approved" in field_value:
                                printable_value = field_value["approved"]
                        elif isinstance(field_value, bool):
                            printable_value = field_value
                        elif isinstance(field_value, str):
                            printable_value = field_value.lower() in ["true", "yes", "1", "approved"]
                        
                        # Log for debugging
                        print(f"  - Processing approval field: {field_value} -> {printable_value}")
                    
                    # CRITICAL: Ensure both completion flags are set
                    form_fields.append({
                        "field_id": str(raw_field["_id"]),
                        "type": field_type,
                        "value": printable_value,
                        "page": raw_field.get("page", 0),
                        "x": raw_field.get("pdf_x", raw_field.get("x", 0)),
                        "y": raw_field.get("pdf_y", raw_field.get("y", 0)),
                        "width": raw_field.get("pdf_width", raw_field.get("width", 100)),
                        "height": raw_field.get("pdf_height", raw_field.get("height", 30)),
                        "font_size": raw_field.get("font_size", 12),
                        "color": "#000000",
                        "opacity": 1.0,
                        "is_completed": True,  # CRITICAL: Set this flag
                        "_render_completed": True  # CRITICAL: Set this flag for PDFEngine
                    })
                    print(f"  - Added completed {field_type} from {field_recipient.get('name', 'Unknown')}: {printable_value}")
        
        # ============================================
        # APPLY TO PDF - ONLY COMPLETED FIELDS, NO PLACEHOLDERS
        # ============================================
        
        # Apply form fields first (text appears under signatures)
        if form_fields:
            print(f"Applying {len(form_fields)} completed form fields")
            pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
        
        # Apply signatures on top
        if signatures:
            print(f"Applying {len(signatures)} completed signatures")
            pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
                pdf_bytes,
                signatures,
                completed_raw_fields  # Pass completed fields for coordinate context
            )
        
        # NO PLACEHOLDERS ARE APPLIED - NOT EVEN FOR CURRENT RECIPIENT
        
        # Add dynamic watermark based on document status
        watermark_config = {
            "sent": ("LIVE PREVIEW - AWAITING SIGNATURES", "#1E88E5"),
            "in_progress": ("LIVE PREVIEW - IN PROGRESS", "#FF9800"),
            "completed": ("SIGNED COPY", "#4CAF50")
        }
        
        watermark_text, watermark_color = watermark_config.get(
            document.get("status", "sent"),
            ("LIVE PREVIEW", "#666666")
        )
        
        # Add recipient-specific watermark if they haven't completed
        if recipient.get("status") != "completed":
            watermark_text = f"{watermark_text} - {recipient.get('name', 'You')}"
        
        # Add envelope ID to filename
        filename = f"live_preview_{document.get('filename', 'document')}"
        if envelope_id:
            filename = f"{filename}_{envelope_id}"
        
        # Add recipient name and timestamp
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M")
        filename = f"{filename}_{recipient.get('name', 'recipient')}_{timestamp_str}.pdf"
        
        # Log the live document view
        _log_event(
            str(document["_id"]),
            recipient,
            "view_live_document",
            {
                "recipient_id": recipient_id,
                "recipient_name": recipient.get("name"),
                "completed_fields": len(completed_raw_fields),
                "signatures_count": len(signatures),
                "form_fields_count": len(form_fields),
                "envelope_id": envelope_id,
                "file_count": len(files) if files else 1
            },
            request
        )
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Document-Status": document.get("status", "unknown"),
                "X-Recipient-Status": recipient.get("status", "unknown"),
                "X-Envelope-ID": envelope_id or "none",
                "X-Recipient-Name": recipient.get("name", "unknown"),
                "X-Completed-Fields": str(len(completed_raw_fields)),
                "X-Placeholders-Shown": "0",
                "X-File-Count": str(len(files) if files else 1)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Live document error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Error generating live document: {str(e)}")

@router.get("/recipient/{recipient_id}/view-voided")
async def view_voided_document(
    recipient_id: str,
    request: Request,
    download: bool = Query(False, description="Set to true to download instead of view")
):
    """
    View voided document with VOIDED watermark.
    This allows recipients to see voided documents with proper indication.
    Can be viewed inline or downloaded.
    """
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check if document is voided
        if document.get("status") != "voided":
            raise HTTPException(400, "Document is not voided")
        
        # ✅ NO OTP VERIFICATION REQUIRED FOR VOIDED DOCUMENTS
        
        # Use the existing load_document_pdf function
        pdf_bytes = load_document_pdf(document, str(document["_id"]))
        
        if not pdf_bytes:
            raise HTTPException(404, "Base PDF not found")
        
        # Apply prominent VOIDED watermark with red color
        pdf_bytes = PDFEngine.apply_watermark(
            pdf_bytes,
            "VOIDED",
            color="#FF0000",  # Red color
            opacity=0.3,
            font_size=96,
            angle=45
        )
        
        # Add status info at bottom
        voided_at = document.get("voided_at", datetime.utcnow())
        voided_by = document.get("voided_by", "Unknown")
        void_reason = document.get("void_reason", "No reason provided")
        
        info_text = f"Document voided on {voided_at.strftime('%Y-%m-%d %H:%M:%S UTC')} by {voided_by}"
        if void_reason and void_reason != "No reason provided":
            info_text += f" - Reason: {void_reason}"
        
        pdf_bytes = PDFEngine.apply_watermark(
            pdf_bytes,
            info_text,
            color="#666666",
            opacity=0.5,
            font_size=12,
            position="bottom"
        )
        
        # Add audit info footer
        audit_text = f"Viewed voided document by {recipient.get('email')} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        pdf_bytes = PDFEngine.apply_audit_footer(
            pdf_bytes,
            recipient.get("email", "unknown"),
            request.client.host if request.client else "0.0.0.0",
            datetime.utcnow().isoformat(),
            footer_text=audit_text
        )
        
        # Create filename
        original_filename = document.get("filename", "document")
        filename = f"VOIDED_{original_filename}"
        
        # Log the view
        _log_event(
            str(document["_id"]),
            recipient,
            "view_voided_document",
            {
                "recipient_id": recipient_id,
                "action": "download" if download else "view",
                "voided_at": voided_at.isoformat() if voided_at else None,
                "voided_by": voided_by,
                "void_reason": void_reason
            },
            request
        )
        
        # Determine content disposition
        content_disposition = "attachment" if download else "inline"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'{content_disposition}; filename="{filename}"',
                "X-Document-Status": "voided",
                "X-Voided-At": voided_at.isoformat() if voided_at else "",
                "X-Voided-By": voided_by
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error viewing voided document: {str(e)}")
        raise HTTPException(500, f"Error generating voided document view: {str(e)}")
    
@router.get("/recipient/{recipient_id}/download/voided")
async def download_voided_document(
    recipient_id: str,
    request: Request
):
    """
    Download voided document with VOIDED watermark.
    """
    # Reuse the view_voided_document function but force download
    response = await view_voided_document(recipient_id, request, download=True)
    return response

@router.get("/recipient/{recipient_id}/voided-status")
async def get_voided_document_status(recipient_id: str):
    """Check if document is voided and get voiding details."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        is_voided = document.get("status") == "voided"
        
        response = {
            "is_voided": is_voided,
            "document_status": document.get("status"),
            "document": serialize_document(document),
            "recipient": serialize_recipient(recipient)
        }
        
        if is_voided:
            response.update({
                "voided_at": document.get("voided_at"),
                "voided_by": document.get("voided_by", "Unknown"),
                "void_reason": document.get("void_reason", "No reason provided"),
                "can_view_voided": True,
                "view_voided_url": f"/signing/recipient/{recipient_id}/view-voided"
            })
        
        return response
        
    except Exception as e:
        print(f"Error checking voided status: {str(e)}")
        raise HTTPException(400, "Invalid recipient ID")

# ======================
# DOCUMENT DOWNLOAD
# ======================

@router.get("/recipient/{recipient_id}/document")
async def download_document_for_recipient(recipient_id: str, request: Request):
    """Download document for recipient."""
    try:
        recipient_obj_id = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": recipient_obj_id})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required before viewing document")
        
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        allowed_status = ["sent", "in_progress", "completed"]
        if document.get("status") not in allowed_status:
            raise HTTPException(400, "Document is not available for viewing")
        
        # Determine which PDF to serve
        pdf_path = (
            document.get("signed_pdf_path") or
            document.get("intermediate_pdf_path") or
            document.get("pdf_file_path")
        )
        
        if not pdf_path:
            raise HTTPException(404, "PDF not generated yet")
        
        try:
            pdf_bytes = storage.download(pdf_path)
        except Exception as e:
            raise HTTPException(404, f"PDF file not found in storage: {str(e)}")
        
        filename = document.get("filename", "document")
        if document.get("status") == "completed":
            filename = f"signed_{filename}"
            
        _log_event(
            str(document["_id"]),
            recipient,
            "document_downloaded",
            {},
            request
        )

        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}.pdf"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {str(e)}")
        raise HTTPException(500, "Unexpected server error while downloading document")

# ======================
# FIELD MANAGEMENT
# ======================

@router.get("/recipient/{recipient_id}/fields")
async def get_fields_for_recipient(recipient_id: str):
    """Get all fields assigned to recipient with ALL coordinate data."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        if recipient["role"] == "viewer":
            return []
        
        fields = list(db.signature_fields.find({
            "document_id": recipient["document_id"],
            "recipient_id": rid
        }))
        
        enriched_fields = []
        for f in fields:
            field_data = {
                "id": str(f["_id"]),
                "type": f["type"],
                "page": f["page"],
                
                # PDF coordinates (points) - for PDF rendering
                "x": f.get("canvas_x", 0),
                "y": f.get("canvas_y", 0),
                "width": f.get("canvas_width", 100),
                "height": f.get("canvas_height", 30),

                
                # Enhanced PDF coordinates
                "pdf_x": f.get("pdf_x", f.get("x", 0)),        # PDF points (from bottom)
                "pdf_y": f.get("pdf_y", f.get("y", 0)),        # PDF points (from bottom)
                "pdf_width": f.get("pdf_width", f.get("width", 100)),   # PDF points
                "pdf_height": f.get("pdf_height", f.get("height", 30)), # PDF points
                
                # Canvas coordinates (pixels) - for frontend editing
                "canvas_x": f.get("canvas_x", 0),
                "canvas_y": f.get("canvas_y", 0),
                "canvas_width": f.get("canvas_width", 0),
                "canvas_height": f.get("canvas_height", 0),
                
                # Value and completion status
                "value": f.get("value"),
                "completed_at": f.get("completed_at"),
                "required": f.get("required", True),
                "label": f.get("label"),
                "placeholder": f.get("placeholder"),
                "font_size": f.get("font_size", 12),
                
                # Metadata
                "added_at": f.get("added_at", datetime.utcnow()).isoformat() if f.get("added_at") else None,
            }
            
            # Add conversion context if available
            if f.get("conversion_context"):
                field_data["conversion_context"] = f["conversion_context"]
            
            enriched_fields.append(field_data)
        
        print(f"Returning {len(enriched_fields)} fields with full coordinate data")
        for field in enriched_fields:
            print(f"Field {field['id']}:", {
                "type": field["type"],
                "page": field["page"],
                "pdf_x": field["pdf_x"],
                "pdf_y": field["pdf_y"],
                "pdf_width": field["pdf_width"],
                "pdf_height": field["pdf_height"],
                "x": field["x"],
                "y": field["y"],
                "canvas_x": field["canvas_x"],
                "canvas_y": field["canvas_y"]
            })
        
        return enriched_fields
    except Exception as e:
        print(f"Error getting fields: {str(e)}")
        raise HTTPException(400, "Invalid recipient ID")
    
@router.get("/recipient/{recipient_id}/fields/debug")
async def debug_recipient_fields(recipient_id: str):
    """Debug endpoint to check field coordinate data."""
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            return {"error": "Recipient not found"}
        
        fields = list(db.signature_fields.find({
            "recipient_id": rid
        }))
        
        debug_info = {
            "recipient": {
                "id": str(recipient["_id"]),
                "name": recipient.get("name"),
                "email": recipient.get("email"),
                "role": recipient.get("role"),
                "status": recipient.get("status"),
                "otp_verified": recipient.get("otp_verified", False)
            },
            "document_id": str(recipient["document_id"]),
            "total_fields": len(fields),
            "fields": []
        }
        
        for field in fields:
            field_info = {
                "id": str(field["_id"]),
                "type": field.get("type"),
                "page": field.get("page"),
                "completed": field.get("completed_at") is not None,
                "coordinates": {
                    "pdf_x": field.get("pdf_x"),
                    "pdf_y": field.get("pdf_y"),
                    "pdf_width": field.get("pdf_width"),
                    "pdf_height": field.get("pdf_height"),
                    "x": field.get("x"),
                    "y": field.get("y"),
                    "canvas_x": field.get("canvas_x"),
                    "canvas_y": field.get("canvas_y"),
                    "canvas_width": field.get("canvas_width"),
                    "canvas_height": field.get("canvas_height"),
                },
                "conversion_context": field.get("conversion_context"),
                "has_value": "value" in field
            }
            debug_info["fields"].append(field_info)
        
        return debug_info
        
    except Exception as e:
        return {"error": str(e)}


@router.post("/recipient/{recipient_id}/signed-preview")
async def get_recipient_signed_preview(
    request: Request,
    recipient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get signed preview for a specific recipient with all completed signatures and form fields.
    Uses the same pattern as the document-level signed preview.
    """
    try:
        # Get recipient and document
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(404, "Recipient not found")

        document_id = recipient["document_id"]
        doc = db.documents.find_one({"_id": document_id})
        if not doc:
            raise HTTPException(404, "Document not found")

        # Get the request data (optional field data)
        try:
            body = await request.json()
            fields_data = body.get("fields", [])
        except:
            # If no fields provided in request, use database fields
            fields_data = []
        
        # Get all completed fields for this recipient
        completed_fields_query = {
            "document_id": document_id,
            "recipient_id": recipient["_id"],
            "completed_at": {"$exists": True}
        }
        
        completed_fields = list(db.signature_fields.find(completed_fields_query))
        
        if not completed_fields and not fields_data:
            # For viewer role or no fields, return the original document
            pdf_path = doc.get("pdf_file_path")
            if not pdf_path:
                raise HTTPException(500, "Base PDF missing")
            
            pdf_bytes = storage.download(pdf_path)
            
            # Apply envelope header if envelope ID exists
            envelope_id = doc.get("envelope_id")
            if envelope_id:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#000000"
                )
            
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f'inline; filename="{doc.get("filename", "document")}_preview.pdf"'}
            )
        
        # Enrich fields - prioritize request data, fallback to database
        enriched_fields = []
        
        # Use fields from request if provided
        if fields_data:
            for field in fields_data:
                # Try to find matching field in database for coordinates
                db_field = db.signature_fields.find_one({"_id": ObjectId(field.get("id"))})
                if db_field:
                    # Combine request data with database coordinates
                    enriched = serialize_field_with_recipient(db_field)
                    enriched["value"] = field.get("value")
                    enriched["is_completed"] = True
                    enriched_fields.append(enriched)
        else:
            # Use fields from database
            for field in completed_fields:
                enriched = serialize_field_with_recipient(field)
                enriched["is_completed"] = True
                enriched_fields.append(enriched)
        
        # Load base PDF
        pdf_path = doc.get("pdf_file_path")
        if not pdf_path:
            raise HTTPException(500, "Base PDF missing")
        
        try:
            pdf_bytes = storage.download(pdf_path)
        except Exception:
            raise HTTPException(500, "Cannot read base PDF")
        
        # Apply envelope header if envelope ID exists
        envelope_id = doc.get("envelope_id")
        if envelope_id:
            pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                pdf_bytes,
                envelope_id=envelope_id,
                color="#000000"
            )
        
        # Separate signatures and form fields
        signatures = []
        form_fields = []
        
        for field in enriched_fields:
            field_type = field.get("type")
            field_value = field.get("value")
            
            if field_type in IMAGE_FIELDS:
                if field_value and isinstance(field_value, dict) and field_value.get("image"):
                    signatures.append({
                        "field_id": field["id"],
                        "image": field_value["image"],
                        "page": field.get("page", 0),
                        # Pass coordinates directly from field data
                        "x": field.get("x"),
                        "y": field.get("y"),
                        "width": field.get("width", 100),
                        "height": field.get("height", 30),
                        "pdf_x": field.get("pdf_x"),
                        "pdf_y": field.get("pdf_y"),
                        "pdf_width": field.get("pdf_width"),
                        "pdf_height": field.get("pdf_height"),
                        "canvas_x": field.get("canvas_x"),
                        "canvas_y": field.get("canvas_y")
                    })
            elif field_type not in IMAGE_FIELDS:

                printable_value = None

                if isinstance(field_value, dict):
                    printable_value = field_value.get("value")
                else:
                    printable_value = field_value

                if printable_value not in [None, ""]:
                    form_fields.append({
                        "field_id": field["id"],
                        "type": field_type,
                        "value": printable_value,
                        "page": field.get("page", 0),
                        "x": field.get("x", 0),
                        "y": field.get("y", 0),
                        "width": field.get("width", 100),
                        "height": field.get("height", 30),
                        "pdf_x": field.get("pdf_x"),
                        "pdf_y": field.get("pdf_y"),
                        "font_size": field.get("font_size", 12)
                    })

        
        print(f"Processing {len(signatures)} signatures and {len(form_fields)} form fields")
        
        # Apply form fields first
        if form_fields:
            pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
        
        # Apply signatures with proper field data context
        if signatures:
            # Pass the enriched fields as context for coordinates
            pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
                pdf_bytes,
                signatures,
                enriched_fields  # Pass all field data for coordinate lookup
            )
        
        # Add audit footer
        pdf_bytes = PDFEngine.apply_audit_footer(
            pdf_bytes,
            recipient.get("email", "unknown"),
            request.client.host if request and request.client else "0.0.0.0",
            datetime.utcnow().isoformat()
        )
        
        # Create filename with envelope ID if available
        filename_base = f"{doc.get('filename', 'document').rsplit('.', 1)[0]}_recipient_preview"
        if envelope_id:
            filename = f"{filename_base}_{envelope_id}.pdf"
        else:
            filename = f"{filename_base}.pdf"
        
        # Log the view
        _log_event(
            str(document_id),
            recipient,
            "recipient_signed_preview",
            {
                "recipient_id": recipient_id, 
                "field_count": len(enriched_fields),
                "envelope_id": envelope_id
            },
            request
        )
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating recipient signed preview: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to generate preview: {str(e)}")
    
@router.post("/recipient/{recipient_id}/fields/{field_id}/draft")
async def save_field_draft(
    recipient_id: str,
    field_id: str,
    payload: Dict,
    request: Request
):
    rid = ObjectId(recipient_id)
    fid = ObjectId(field_id)

    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")

    if not recipient.get("otp_verified"):
        raise HTTPException(403, "OTP required")

    field = db.signature_fields.find_one({
        "_id": fid,
        "recipient_id": rid
    })
    if not field:
        raise HTTPException(403, "Not your field")

    db.signature_fields.update_one(
        {"_id": fid},
        {"$set": {
            "draft_value": payload.get("value"),
            "draft_saved_at": datetime.utcnow()
        }}
    )
    
    _log_event(
        str(recipient["document_id"]),
        recipient,
        "field_draft_saved",
        {
            "field_id": field_id,
            "field_type": field.get("type")
        },
        request
    )


    return {"message": "Draft saved"}


# @router.post("/recipient/{recipient_id}/fields/{field_id}/complete")
# async def complete_field_as_recipient(
#     recipient_id: str,
#     field_id: str,
#     payload: Dict,
#     background_tasks: BackgroundTasks,
#     request: Request
# ):
#     print(f"Received payload: {payload}")
    
#     """Complete a specific field as recipient with enhanced coordinate support."""
#     try:
#         rid = ObjectId(recipient_id)
#         fid = ObjectId(field_id)
#     except:
#         raise HTTPException(400, "Invalid ID")
    
#     recipient = db.recipients.find_one({"_id": rid})
#     if not recipient:
#         raise HTTPException(404, "Recipient not found")
    
#     # Check OTP verification
#     if not recipient.get("otp_verified"):
#         raise HTTPException(403, "OTP verification required")
    
    
#     # Check if document is already completed - PREVENT EDITS
#     if document.get("status") == "completed":
#         # If field was already completed, prevent editing
#         if field.get("completed_at"):
#             raise HTTPException(400, "Document is already completed. Fields cannot be edited after completion.")
#         # If field is new (shouldn't happen for completed documents)
#         raise HTTPException(400, "Document is already completed. No new fields can be added.")
    
#     # Check signing order (commented out as per your code)
#     # if not can_sign_now(recipient_id, recipient["document_id"]):
#     #     raise HTTPException(400, "Not your turn to sign yet")
    
#     field = db.signature_fields.find_one({
#         "_id": fid,
#         "recipient_id": rid
#     })
#     if not field:
#         raise HTTPException(403, "Not your field")
    
#     # Role validation
#     role = recipient["role"]
#     validate_field_role(role, field["type"])
    
#     if role == "viewer":
#         raise HTTPException(403, "Viewer cannot complete fields")
    
#     document = db.documents.find_one({"_id": recipient["document_id"]})

#     # Allow editing completed fields even after document completion
#     if document.get("status") == "completed":
#         if not field.get("completed_at"):
#             raise HTTPException(400, "Document finalized — no new fields allowed")
        
    

#     # Extract the value from payload
#     field_value = payload.get("value", {})
    
#     # If payload is a dict with 'value' key, extract it
#     if isinstance(field_value, dict) and "value" in field_value:
#         # Handle nested values like {'value': {'value': 'text'}}
#         inner_value = field_value.get("value")
#         if isinstance(inner_value, dict) and "value" in inner_value:
#             # Double nested: {'value': {'value': {'value': 'text'}}}
#             actual_value = inner_value.get("value")
#         else:
#             # Single nested: {'value': 'text'}
#             actual_value = inner_value
#     elif isinstance(field_value, str):
#         # Direct string value
#         actual_value = field_value
#     else:
#         # Other cases (list, number, etc.)
#         actual_value = field_value
    
#     # Now ensure we have a dict format for storage
#     if isinstance(actual_value, dict):
#         # Already in dict format
#         normalized_value = actual_value
#     else:
#         # Convert to dict format
#         normalized_value = {"value": actual_value}
    
#     print(f"Normalized value for field {field_id}: {normalized_value}")
    
#     # Validate field based on type
#     field_type = field["type"]
    
#     if field_type in IMAGE_FIELDS:
#         # For image fields, check for image data
#         if not normalized_value.get("image"):
#             # Check if it's in a nested format
#             if isinstance(normalized_value.get("value"), dict) and normalized_value.get("value", {}).get("image"):
#                 pass  # Has image in nested format
#             else:
#                 raise HTTPException(400, f"Image required for {field_type} field")
    
#     elif field_type in BOOLEAN_FIELDS:
#         # For boolean fields, check for boolean value
#         boolean_value = normalized_value.get("value")
#         if boolean_value not in [True, False, "true", "false", "1", "0"]:
#             raise HTTPException(400, f"Boolean value required for {field_type} field")
#         # Normalize to boolean
#         if isinstance(boolean_value, str):
#             normalized_value["value"] = boolean_value.lower() in ["true", "yes", "1", "checked"]
    
#     elif field_type in TEXT_FIELDS:
#         # For text fields, check value exists
#         text_value = normalized_value.get("value", "")
        
#         # If text_value is None or empty string for required field
#         if field.get("required", True) and text_value in [None, ""]:
#             raise HTTPException(400, f"Value required for {field_type} field")
        
#         # ✅ ADD THIS BLOCK HERE
#         if field_type == "dropdown":
#             options = field.get("dropdown_options", [])
#             selected = normalized_value.get("value")
            
#             if selected is not None:
#                 selected = str(selected).strip()
#                 normalized_value["value"] = selected

#             if options and selected not in options:
#                 raise HTTPException(
#                     400,
#                     f"Invalid dropdown value. Allowed values: {options}"
#                 )
        
#         # Additional validation for specific field types
#         if field_type == "mail" and text_value:
#             # Simple email validation
#             if "@" not in text_value or "." not in text_value:
#                 raise HTTPException(400, "Invalid email format")
        
#         elif field_type == "date" and text_value:
#             if not isinstance(text_value, str):
#                 raise HTTPException(400, "Date value must be string YYYY-MM-DD")
#             try:
#                 datetime.strptime(text_value, "%Y-%m-%d")
#             except ValueError:
#                 raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")
    
#     else:
#         # For other field types, ensure value exists
#         if field.get("required", True) and normalized_value.get("value") in [None, ""]:
#             raise HTTPException(400, f"Value required for {field_type} field")

#     was_already_completed = bool(field.get("completed_at"))
    
#     update_data = {
#         "value": normalized_value,
#         "is_completed": True,
#         "edited_at": datetime.utcnow(),
#         "edited_ip": request.client.host if request.client else "unknown"
#     }

#     if not was_already_completed:
#         update_data["completed_at"] = datetime.utcnow()
#         update_data["completed_ip"] = request.client.host if request.client else "unknown"
#         update_data["last_action"] = "completed"
#     else:
#         update_data["last_action"] = "edited"
    
#     # If it's a signature type with coordinates in the value
#     if field_type in IMAGE_FIELDS:
#         if isinstance(normalized_value, dict) and normalized_value.get("coordinates"):
#             # Store coordinate metadata with the signature
#             update_data["completion_coordinates"] = normalized_value["coordinates"]
    
#     # =====================================
#     # 🔒 DOCUSIGN-LIKE RADIO GROUP LOGIC
#     # =====================================
#     if field_type == "radio" and normalized_value.get("value") is True:

#         group_name = field.get("group_name")
#         if not group_name:
#             raise HTTPException(400, "Radio field missing group_name")

#         # Uncheck all other radios in the same group
#         db.signature_fields.update_many(
#             {
#                 "document_id": field["document_id"],
#                 "recipient_id": rid,
#                 "group_name": group_name,
#                 "_id": {"$ne": fid}
#             },
#             {
#                 "$set": {
#                     "value": {"value": False},
#                     "is_completed": False,
#                     "completed_at": None,
#                     "edited_at": datetime.utcnow()
#                 }
#             }
#         )

    
#     # Update the field
#     db.signature_fields.update_one(
#         {"_id": fid},
#         {"$set": update_data}
#     )
    
#     # Check if all recipient's fields are completed
#     remaining_fields = db.signature_fields.count_documents({
#         "recipient_id": rid,
#         "$or": [
#             {"completed_at": {"$exists": False}},
#             {"completed_at": None}
#         ]
#     })

#     if (
#         remaining_fields == 0
#         and recipient.get("status") != "completed"
#         and not was_already_completed
#     ):
#         # Mark recipient as completed
#         update_recipient_data = {"status": "completed"}
        
#         # Add role-specific timestamp
#         role_timestamp = {
#             "signer": "signed_at",
#             "in_person_signer": "signed_at",
#             "approver": "approved_at",
#             "form_filler": "form_completed_at",
#             "witness": "witnessed_at",
#             "viewer": "viewer_at"
#         }
        
#         timestamp_field = role_timestamp.get(role)
#         if timestamp_field:
#             update_recipient_data[timestamp_field] = datetime.utcnow()
        
#         db.recipients.update_one({"_id": rid}, {"$set": update_recipient_data})
        
#         # Update document status and generate intermediate PDF
#         doc_id = recipient["document_id"]
#         update_intermediate_pdf(doc_id, rid)
        
#         # Check if all recipients are completed
#         all_recipients = list(db.recipients.find({"document_id": doc_id}))
#         all_completed = all(r.get("status") == "completed" for r in all_recipients)
        
#         if all_completed:
#             finalize_document(doc_id)
#             return {
#                 "message": "Field completed — document finalized",
#                 "completed": True,
#                 "document_finalized": True,
#                 "field_id": field_id
#             }
            
#         _log_event(
#             str(recipient["document_id"]),
#             recipient,
#             "field_edited" if was_already_completed else "field_completed",
#             {
#                 "field_id": field_id,
#                 "field_type": field["type"],
#                 "action": "edit" if was_already_completed else "complete"
#             },
#             request
#         )
        
#         all_recipients = list(db.recipients.find({"document_id": doc_id}))
#         all_completed = all(r.get("status") == "completed" for r in all_recipients)
        
#          # When all recipients are completed, make sure to pass background_tasks
#         if all_completed:
#             # Finalize document with background email sending
#             signed_pdf_id = finalize_document(
#                 doc_id,
#                 request=request,
#                 background_tasks=background_tasks  # Make sure this is passed
#             )
            
#             return {
#                 "message": "Field completed — document finalized",
#                 "completed": True,
#                 "document_finalized": True,
#                 "field_id": field_id
#             }

#         return {
#             "message": "All your fields completed",
#             "completed": True,
#             "document_finalized": False,
#             "field_id": field_id
#         }
        
#     _log_event(
#         str(recipient["document_id"]),
#         recipient,
#         "field_edited" if was_already_completed else "field_completed",
#         {
#             "field_id": field_id,
#             "field_type": field["type"],
#             "action": "edit" if was_already_completed else "complete"
#         },
#         request
#     )

#     return {
#         "message": "Field completed",
#         "completed": False,
#         "remaining_fields": remaining_fields,
#         "field_id": field_id
#     }


@router.post("/recipient/{recipient_id}/fields/{field_id}/complete")
async def complete_field_as_recipient(
    recipient_id: str,
    field_id: str,
    payload: Dict,
    background_tasks: BackgroundTasks,
    request: Request
):
    print(f"Received payload: {payload}")
    
    """Complete a specific field as recipient with enhanced coordinate support."""
    try:
        rid = ObjectId(recipient_id)
        fid = ObjectId(field_id)
    except:
        raise HTTPException(400, "Invalid ID")
    
    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")
    
    # Check OTP verification
    if not recipient.get("otp_verified"):
        raise HTTPException(403, "OTP verification required")
    
    
    
    # ✅ FIX: Get document FIRST before using it
    document = db.documents.find_one({"_id": recipient["document_id"]})
    if not document:
        raise HTTPException(404, "Document not found")
    
    # Get the field
    field = db.signature_fields.find_one({
        "_id": fid,
        "recipient_id": rid
    })
    if not field:
        raise HTTPException(403, "Not your field")
    
    # Check if document is already completed - PREVENT EDITS
    if document.get("status") == "completed":
        # If field was already completed, prevent editing
        if field.get("completed_at"):
            raise HTTPException(400, "Document is already completed. Fields cannot be edited after completion.")
        # If field is new (shouldn't happen for completed documents)
        raise HTTPException(400, "Document is already completed. No new fields can be added.")
    
    # Role validation
    role = recipient["role"]
    validate_field_role(role, field["type"])
    
    if role == "viewer":
        raise HTTPException(403, "Viewer cannot complete fields")

    # Extract the value from payload
    field_value = payload.get("value", {})
    
    # If payload is a dict with 'value' key, extract it
    if isinstance(field_value, dict) and "value" in field_value:
        # Handle nested values like {'value': {'value': 'text'}}
        inner_value = field_value.get("value")
        if isinstance(inner_value, dict) and "value" in inner_value:
            # Double nested: {'value': {'value': {'value': 'text'}}}
            actual_value = inner_value.get("value")
        else:
            # Single nested: {'value': 'text'}
            actual_value = inner_value
    elif isinstance(field_value, str):
        # Direct string value
        actual_value = field_value
    else:
        # Other cases (list, number, etc.)
        actual_value = field_value
    
    # Now ensure we have a dict format for storage
    if isinstance(actual_value, dict):
        # Already in dict format
        normalized_value = actual_value
    else:
        # Convert to dict format
        normalized_value = {"value": actual_value}
    
    print(f"Normalized value for field {field_id}: {normalized_value}")
    
    # Validate field based on type
    field_type = field["type"]
    
    if field_type in IMAGE_FIELDS:
        # For image fields, check for image data
        if not normalized_value.get("image"):
            # Check if it's in a nested format
            if isinstance(normalized_value.get("value"), dict) and normalized_value.get("value", {}).get("image"):
                pass  # Has image in nested format
            else:
                raise HTTPException(400, f"Image required for {field_type} field")
    
    elif field_type in BOOLEAN_FIELDS:
        # For boolean fields, check for boolean value
        boolean_value = normalized_value.get("value")
        if boolean_value not in [True, False, "true", "false", "1", "0"]:
            raise HTTPException(400, f"Boolean value required for {field_type} field")
        # Normalize to boolean
        if isinstance(boolean_value, str):
            normalized_value["value"] = boolean_value.lower() in ["true", "yes", "1", "checked"]
    
    elif field_type in TEXT_FIELDS:
        # For text fields, check value exists
        text_value = normalized_value.get("value", "")
        
        # If text_value is None or empty string for required field
        if field.get("required", True) and text_value in [None, ""]:
            raise HTTPException(400, f"Value required for {field_type} field")
        
        if field_type == "dropdown":
            options = field.get("dropdown_options", [])
            selected = normalized_value.get("value")
            
            if selected is not None:
                selected = str(selected).strip()
                normalized_value["value"] = selected

            if options and selected not in options:
                raise HTTPException(
                    400,
                    f"Invalid dropdown value. Allowed values: {options}"
                )
        
        # Additional validation for specific field types
        if field_type == "mail" and text_value:
            # Simple email validation
            if "@" not in text_value or "." not in text_value:
                raise HTTPException(400, "Invalid email format")
        
        elif field_type == "date" and text_value:
            if not isinstance(text_value, str):
                raise HTTPException(400, "Date value must be string YYYY-MM-DD")
            try:
                datetime.strptime(text_value, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")
    
    else:
        # For other field types, ensure value exists
        if field.get("required", True) and normalized_value.get("value") in [None, ""]:
            raise HTTPException(400, f"Value required for {field_type} field")

    was_already_completed = bool(field.get("completed_at"))
    
    update_data = {
        "value": normalized_value,
        "is_completed": True,
        "edited_at": datetime.utcnow(),
        "edited_ip": request.client.host if request.client else "unknown"
    }

    if not was_already_completed:
        update_data["completed_at"] = datetime.utcnow()
        update_data["completed_ip"] = request.client.host if request.client else "unknown"
        update_data["last_action"] = "completed"
    else:
        update_data["last_action"] = "edited"
    
    # If it's a signature type with coordinates in the value
    if field_type in IMAGE_FIELDS:
        if isinstance(normalized_value, dict) and normalized_value.get("coordinates"):
            # Store coordinate metadata with the signature
            update_data["completion_coordinates"] = normalized_value["coordinates"]
    
    # =====================================
    # 🔒 DOCUSIGN-LIKE RADIO GROUP LOGIC
    # =====================================
    if field_type == "radio" and normalized_value.get("value") is True:

        group_name = field.get("group_name")
        if not group_name:
            raise HTTPException(400, "Radio field missing group_name")

        # Uncheck all other radios in the same group
        db.signature_fields.update_many(
            {
                "document_id": field["document_id"],
                "recipient_id": rid,
                "group_name": group_name,
                "_id": {"$ne": fid}
            },
            {
                "$set": {
                    "value": {"value": False},
                    "is_completed": False,
                    "completed_at": None,
                    "edited_at": datetime.utcnow()
                }
            }
        )
    
    # Update the field
    db.signature_fields.update_one(
        {"_id": fid},
        {"$set": update_data}
    )
    
    # Check if all recipient's fields are completed (but DON'T auto-complete)
    remaining_fields = db.signature_fields.count_documents({
        "recipient_id": rid,
        "$or": [
            {"completed_at": {"$exists": False}},
            {"completed_at": None}
        ]
    })

    all_fields_completed = (remaining_fields == 0)
    
    _log_event(
        str(recipient["document_id"]),
        recipient,
        "field_edited" if was_already_completed else "field_completed",
        {
            "field_id": field_id,
            "field_type": field["type"],
            "action": "edit" if was_already_completed else "complete",
            "remaining_fields": remaining_fields,
            "all_fields_completed": all_fields_completed
        },
        request
    )

    return {
        "message": "Field completed successfully",
        "completed": True,
        "field_completed": True,
        "all_fields_completed": all_fields_completed,
        "remaining_fields": remaining_fields,
        "field_id": field_id
    }

# ======================
# SIGNING OPERATIONS
# ======================

@router.post("/recipient/{recipient_id}/sign")
async def sign_document(recipient_id: str, signing_data: SigningData, request: Request):
    """Sign document (legacy endpoint - use complete_field instead)."""
    # This is now handled by complete_field endpoint
    # Keeping for backward compatibility
    return {"message": "Use /complete-field endpoint instead"}

def update_intermediate_pdf(document_id: ObjectId, recipient_id: ObjectId):
    """Update intermediate PDF with completed signatures."""
    document = db.documents.find_one({"_id": document_id})
    if not document:
        return
    
    # Get current PDF - Always prefer original PDF as base for clean application
    pdf_path = document.get("pdf_file_path") or document.get("intermediate_pdf_path")
    if not pdf_path:
        return
    
    pdf_bytes = storage.download(pdf_path)
    
    # Get all completed signature fields for the document
    fields = list(db.signature_fields.find({
        "document_id": document_id,
        "type": {"$in": ["signature", "initials", "witness_signature"]},
        "completed_at": {"$exists": True}
    }))
    
    if not fields:
        return
    
    # Prepare signatures
    signatures = []
    for f in fields:
        val = f.get("value")

        # Only process image-based signatures
        if isinstance(val, dict) and val.get("image"):
            signatures.append({
                "field_id": str(f["_id"]),
                "image": val["image"],
                "page": f.get("page", 0),
                "x": f.get("x"),
                "y": f.get("y"),
                "width": f.get("width"),
                "height": f.get("height")
            })

    
    # Apply signatures
    updated_pdf = PDFEngine.apply_signatures_with_field_positions(
        pdf_bytes=pdf_bytes,
        signatures=signatures,
        fields_data=fields
    )
    
    # Save intermediate PDF to Azure
    new_intermediate_path = storage.upload(
        updated_pdf,
        f"intermediate_{document_id}.pdf",
        folder=f"documents/{document_id}"
    )
    
    db.documents.update_one(
        {"_id": document_id},
        {"$set": {"intermediate_pdf_path": new_intermediate_path}}
    )

def finalize_document(document_id: ObjectId, request: Request = None, background_tasks: BackgroundTasks = None):
    """Finalize document with all signatures and trigger email sending."""
    
    document = db.documents.find_one({"_id": document_id})
    
    if not document:
        return None
    
    # Get latest PDF
    # IMPORTANT: Always start from ORIGINAL PDF to avoid doubling fields
    # If we use intermediate_pdf_path, it might already have some fields burned in
    pdf_path = document.get("pdf_file_path") or document.get("intermediate_pdf_path")
    if not pdf_path:
        raise HTTPException(404, "Base PDF not found for finalization")
    pdf_bytes = storage.download(pdf_path)
    
    # Get all completed fields
    fields = list(db.signature_fields.find({
        "document_id": document_id,
        "completed_at": {"$exists": True}
    }))
    
    # Prepare all fields with completion flags and coordinates
    all_form_fields = []
    signatures = []
    
    for f in fields:
        field_type = f.get("type")
        val = f.get("value")
        
        # Enrich field for PDFEngine
        f_enriched = f.copy()
        f_enriched["_render_completed"] = True
        f_enriched["is_completed"] = True
        
        # Ensure we have consistent coordinate keys
        if "pdf_x" not in f_enriched: f_enriched["pdf_x"] = f.get("x", 0)
        if "pdf_y" not in f_enriched: f_enriched["pdf_y"] = f.get("y", 0)
        if "pdf_width" not in f_enriched: f_enriched["pdf_width"] = f.get("width", 100)
        if "pdf_height" not in f_enriched: f_enriched["pdf_height"] = f.get("height", 30)
        
        if field_type in IMAGE_FIELDS:
            # Handle image-based fields (signatures, initials, stamps)
            image_data = None
            if isinstance(val, dict):
                image_data = val.get("image") or val.get("data")
            elif isinstance(val, str) and val.startswith("data:image"):
                image_data = val
                
            if image_data:
                signatures.append({
                    "field_id": str(f["_id"]),
                    "image": image_data,
                    "page": f.get("page", 0)
                })
        
        # Always include in fields list for coordinate lookup and form rendering
        all_form_fields.append(f_enriched)
    
    # Finalize document
    final_pdf = PDFEngine.finalize_document(
        pdf_bytes=pdf_bytes,
        signatures=signatures,
        fields=all_form_fields,
        add_footer=True,
        signer_email="system@safesign.ai",
        ip=request.client.host if request and request.client else "system",
        timestamp=datetime.utcnow().isoformat()
    )
    
    # Save final PDF to Azure
    signed_pdf_path = storage.upload(
        final_pdf,
        f"signed_{document_id}.pdf",
        folder=f"documents/{document_id}"
    )
    
    # Update document
    all_recipients = list(db.recipients.find({"document_id": document_id}))
    completed_count = len([r for r in all_recipients if r.get("status") == "completed"])
    
    db.documents.update_one(
        {"_id": document_id},
        {"$set": {
            "status": "completed",
            "signed_pdf_path": signed_pdf_path,
            "signed_count": completed_count,
            "finalized_at": datetime.utcnow(),
            "completed_email_sent": False  # Add this flag
        }}
    )
    
    # Log the finalization
    _log_event(
        str(document_id),
        None,
        "document_finalized",
        {
            "signed_count": completed_count,
            "total_recipients": len(all_recipients)
        },
        request
    )
    
    # ✅ TRIGGER BACKGROUND EMAILS
    if background_tasks:
        from routes.email_service import send_completed_document_package, send_completed_document_to_recipients
        
        # 1. Send "Final Copy" to Recipients (Already includes ZIP package)
        background_tasks.add_task(
            send_completed_document_to_recipients,
            document_id=str(document_id)
        )
        
        # 2. Send "ZIP Package" to Owner ONLY
        background_tasks.add_task(
            send_completed_document_package,
            document_id=str(document_id)
        )
        
        print(f"📦 Scheduled both Final Copy (Recipients) and Package ZIP (Owner) for document {document_id}")
    
    return signed_pdf_path


# ======================
# DOCUMENT PREVIEW
# ======================

@router.get("/document/{document_id}/preview-with-signatures")
async def preview_with_signatures(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    show_placeholders: bool = Query(True)
):
    """Preview document with signatures and placeholders."""
    try:
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Get all fields
        fields = list(db.signature_fields.find({
            "document_id": ObjectId(document_id)
        }))
        
        # Enrich fields with completion status
        enriched_fields = []
        for field in fields:
            enriched = {
                "id": str(field["_id"]),
                "type": field["type"],
                "page": field["page"],
                "x": field["x"],
                "y": field["y"],
                "width": field["width"],
                "height": field["height"],
                "value": field.get("value"),
                "completed_at": field.get("completed_at"),
                "label": field.get("label"),
                "is_completed": field.get("completed_at") is not None
            }
            
            # Add recipient info
            recipient = db.recipients.find_one({"_id": field["recipient_id"]})
            if recipient:
                enriched["recipient_name"] = recipient.get("name")
                enriched["recipient_email"] = recipient.get("email")
            
            enriched_fields.append(enriched)
        
        # Load PDF
        pdf_path = doc.get("pdf_file_path")
        pdf_bytes = storage.download(pdf_path)
        
        # Apply completed signatures
        completed_fields = [f for f in enriched_fields if f.get("is_completed")]
        if completed_fields:
            signatures = []
            for field in completed_fields:
                if field["type"] in IMAGE_FIELDS:
                    if field.get("value", {}).get("image"):
                        signatures.append({
                            "field_id": field["id"],
                            "image": field["value"]["image"],
                            "page": field["page"]
                        })
            
            if signatures:
                pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
                    pdf_bytes,
                    signatures,
                    completed_fields
                )
        
        # Apply placeholders for pending fields
        if show_placeholders:
            pending_fields = [f for f in enriched_fields if not f.get("is_completed")]
            if pending_fields:
                pdf_bytes = PDFEngine.apply_field_placeholders(pdf_bytes, pending_fields)
        
        # Apply watermark based on status
        if doc["status"] != "completed":
            status_text = {
                "draft": "DRAFT PREVIEW",
                "sent": "IN PROGRESS",
                "in_progress": "IN PROGRESS"
            }.get(doc["status"], "PREVIEW")
            
            pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, status_text)
        
        filename = f"{doc['filename'].rsplit('.', 1)[0]}_preview.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{filename}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Preview error: {str(e)}")
        raise HTTPException(500, "Error generating preview")

# ======================
# DOCUMENT PROGRESS
# ======================

@router.get("/document/{document_id}/progress")
async def get_signing_progress(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get signing progress for document."""
    document = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not document:
        raise HTTPException(404, "Document not found")
    
    recipients = list(db.recipients.find({"document_id": ObjectId(document_id)}))
    completed = len([r for r in recipients if r.get("status") == "completed"])
    total = len(recipients)
    
    return {
        "document": serialize_document(document),
        "progress": {
            "total": total,
            "signed": completed,
            "pending": total - completed,
            "percentage": round((completed / total) * 100, 2) if total else 0
        },
        "recipients": [serialize_recipient(r) for r in recipients]
    }

# ======================
# DOCUMENT FINALIZATION
# ======================

@router.post("/document/{document_id}/finalize")
async def finalize_signed_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Manually finalize document and send emails to recipients."""
    document = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not document:
        raise HTTPException(404, "Document not found")
    
    recipients = list(db.recipients.find({"document_id": ObjectId(document_id)}))
    unsigned = [r for r in recipients if r.get("status") not in ["completed", "declined"]]
    
    if unsigned:
        raise HTTPException(400, "Cannot finalize — remaining signers unfinished")
    
    # Finalize with background tasks for email sending
    finalize_document(
        ObjectId(document_id),
        request=request,
        background_tasks=background_tasks
    )
    
    return {
        "message": "Document finalized successfully. Completed documents will be emailed to all recipients.",
        "status": "processing"
    }

# ======================
# DOCUMENT DECLINE
# ======================

@router.post("/recipient/{recipient_id}/decline")
async def decline_document(
    recipient_id: str,
    decline_request: DeclineRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Decline to sign document."""
    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(400, "Invalid recipient ID")
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")
    
    if recipient.get("status") == "completed":
        raise HTTPException(400, "Completed recipient cannot decline")
    
    document = db.documents.find_one({"_id": recipient["document_id"]})
    if document.get("status") not in ["sent", "in_progress"]:
        raise HTTPException(400, "Document is not active")
    
    # Mark recipient as declined
    db.recipients.update_one(
        {"_id": rid},
        {"$set": {
            "status": "declined",
            "declined_at": datetime.utcnow(),
            "decline_reason": decline_request.reason,
            "decline_ip": client_ip
        }}
    )
    
    # ✅ NEW: Notify owner about recipient decline
    from .email_service import send_recipient_activity_notification_to_owner
    background_tasks.add_task(
        send_recipient_activity_notification_to_owner,
        recipient=recipient,
        document=document,
        status="declined"
    )
    
    # Mark document as declined if all recipients decline
    # Or finalize if some completed and others (like this one) declined
    all_recipients = list(db.recipients.find({"document_id": recipient["document_id"]}))
    none_pending = all(r.get("status") in ["completed", "declined"] for r in all_recipients)
    any_completed = any(r.get("status") == "completed" for r in all_recipients)
    all_declined = all(r.get("status") == "declined" for r in all_recipients)

    if all_declined:
        db.documents.update_one({"_id": recipient["document_id"]}, {"$set": {"status": "declined", "declined_at": datetime.utcnow()}})
        _log_event(str(recipient["document_id"]), recipient, "document_voided", {"reason": "All recipients declined"}, request)
    elif any_completed and none_pending:
        # Finalize because everyone has taken action (some signed, some declined)
        from .recipient_signing import finalize_document # Import inside to avoid circular if needed
        finalize_document(recipient["document_id"], request=request)
    
    return {"message": "Document declined successfully"}

# ======================
# DELEGATION / ASSIGN TO OTHERS
# ======================

@router.post("/recipient/{recipient_id}/assign-to-others")
async def assign_document_to_others(
    recipient_id: str,
    assign_request: AssignToOthersRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Delegate the document to another recipient.
    Replaces the current recipient's identity with the new one.
    This generates a new OTP and sends an invite email automatically.
    """
    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(400, "Invalid recipient ID")

    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")

    if recipient.get("status") == "completed":
        raise HTTPException(400, "Completed recipient cannot delegate")

    doc_id = recipient["document_id"]
    document = db.documents.find_one({"_id": doc_id})
    if not document:
        raise HTTPException(404, "Document not found")

    if document.get("status") not in ["sent", "in_progress"]:
        raise HTTPException(400, "Document is not active for delegation")

    # Store old info for audit history
    old_info = {
        "email": recipient.get("email"),
        "name": recipient.get("name"),
        "delegated_at": datetime.utcnow().isoformat(),
        "reason": assign_request.reason
    }

    # Generate new OTP for the new recipient
    new_otp = generate_otp()
    otp_expires = datetime.utcnow() + timedelta(hours=24)

    # Perform the replacement (maintain same ID but new identity)
    update_result = db.recipients.update_one(
        {"_id": rid},
        {"$set": {
            "email": assign_request.new_email.lower(),
            "name": assign_request.new_name,
            "status": "invited",
            "otp": new_otp,
            "otp_expires": otp_expires,
            "otp_verified": False,
            "delegated_from": old_info,
            "assigned_at": datetime.utcnow(),
            "sent_at": datetime.utcnow()
        },
        "$push": {
            "delegation_history": old_info
        }}
    )

    if update_result.modified_count == 0:
        raise HTTPException(500, "Failed to update recipient details")

    # Get the updated recipient object for email sending
    updated_recipient = db.recipients.find_one({"_id": rid})

    # Log the delegation event
    _log_event(
        str(doc_id),
        recipient, # Log using old info as actor if possible or system
        "recipient_delegated",
        {
            "from_email": recipient.get("email"),
            "to_email": assign_request.new_email,
            "to_name": assign_request.new_name,
            "reason": assign_request.reason
        },
        request
    )

    # Trigger welcome email to the new recipient in background
    background_tasks.add_task(
        send_role_based_email,
        recipient=updated_recipient,
        document=document,
        otp=new_otp,
        common_message=document.get("common_message", ""),
        personal_message=f"This document was delegated to you by {recipient.get('name')}. Reason: {assign_request.reason or 'No reason provided'}"
    )

    return {
        "message": f"Document successfully delegated to {assign_request.new_name}",
        "new_email": assign_request.new_email
    }

# ======================
# VIEWER COMPLETION
# ======================

@router.post("/recipient/{recipient_id}/viewer-complete")
async def complete_viewer(recipient_id: str, request: Request, background_tasks: BackgroundTasks):
    """Mark viewer as having completed review."""
    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(400, "Invalid recipient ID")
    
    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")
    
    if recipient["role"] != "viewer":
        raise HTTPException(400, "Only viewers can use this endpoint")
    
    if not recipient.get("otp_verified"):
        raise HTTPException(403, "OTP verification required")
    
    document = db.documents.find_one({"_id": recipient["document_id"]})

    # Mark viewer completed
    db.recipients.update_one(
        {"_id": rid},
        {"$set": {
            "status": "completed",
            "viewer_at": datetime.utcnow()
        }}
    )
    
    # ✅ NEW: Notify owner about viewer completion
    from .email_service import send_recipient_activity_notification_to_owner
    background_tasks.add_task(
        send_recipient_activity_notification_to_owner,
        recipient=recipient,
        document=document,
        status="completed"
    )
    
    # Update document statistics
    doc_id = recipient["document_id"]
    update_document_statistics(doc_id)
    
    _log_event(
        str(recipient["document_id"]),
        recipient,
        "viewer_completed",
        {},
        request
    )

    
    return {"message": "Viewer completed review"}


# ======================
# RESEND OTP
# ======================

@router.post("/recipient/{recipient_id}/resend-otp")
async def resend_otp(recipient_id: str, request: Request):
    """Resend OTP to recipient."""
    recipient = await get_recipient_for_signing(recipient_id)
    
    if recipient.get("status") == "completed":
        raise HTTPException(400, "Recipient already completed")
    
    from .email_service import generate_otp, send_otp_email
    otp = generate_otp()
    
    db.recipients.update_one(
        {"_id": ObjectId(recipient_id)},
        {"$set": {
            "otp": otp,
            "otp_expires": datetime.utcnow() + timedelta(hours=24),
            "otp_verified": False,
            "sent_at": datetime.utcnow()
        }}
    )
    
    document = db.documents.find_one({"_id": recipient["document_id"]})
    
    _log_event(
        str(recipient["document_id"]),
        recipient,
        "otp_resent",
        {},
        None
    )

    
    if send_otp_email(recipient, document, otp):
        return {"message": "OTP sent"}
    
    raise HTTPException(500, "Failed to send OTP")

@router.post("/recipient/{recipient_id}/email-signed")
async def email_signed_document(
    recipient_id: str,
    request: Request
):
    recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
    if not recipient:
        raise HTTPException(404, "Recipient not found")

    document = db.documents.find_one({"_id": recipient["document_id"]})
    if not document or document.get("status") != "completed":
        raise HTTPException(400, "Document not completed")

    signed_pdf_path = document.get("signed_pdf_path")
    if not signed_pdf_path:
        raise HTTPException(404, "Signed PDF missing")

    pdf_bytes = storage.download(signed_pdf_path)

    from .email_service import send_signed_document_email

    success = send_signed_document_email(
        to_email=recipient["email"],
        recipient_name=recipient.get("name", ""),
        document_name=document.get("filename", "document.pdf"),
        pdf_bytes=pdf_bytes
    )

    if not success:
        raise HTTPException(500, "Failed to send email")

    _log_event(
        str(document["_id"]),
        recipient,
        "email_signed_document",
        {},
        request
    )

    return {"message": "Signed document emailed successfully"}

# ======================
# DOCUMENT DOWNLOAD ROUTES (MATCHING FRONTEND)
# ======================


@router.get("/recipient/{recipient_id}/download/signed")
async def download_signed_document(
    recipient_id: str,
    request: Request
):
    """
    Main download endpoint for signed document.
    This is called when clicking the main Download button.
    Returns signed document with 'SIGNED' watermark.
    """
    try:
        # Validate recipient ID
        try:
            rid = ObjectId(recipient_id)
        except Exception:
            raise HTTPException(400, "Invalid recipient ID format")
        
        # Get recipient
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check if document is completed (signed)
        doc_status = document.get("status")
        # if doc_status != "completed":
        #     raise HTTPException(
        #         400, 
        #         f"Document is not completed yet. Current status: {doc_status}"
        #     )
        
        # Always start from base PDF (unified loader handles multiple files and fallbacks)
        pdf_bytes = load_document_pdf(document, str(document["_id"]))
        if not pdf_bytes:
            raise HTTPException(404, "No PDF content available for this document")
        
        # ✅ USE UNIFIED RENDERING LOGIC (MATCHES documents.py)
        # This fixes the missing signatures/initials from the signing side.
        try:
            print(f"Applying all completed fields dynamically for recipient download")
            pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, str(document["_id"]), document)
        except Exception as e:
            print(f"Error in dynamic rendering: {str(e)}")
            # If dynamic failed and we have a storage version, use it
            if document.get("signed_pdf_path"):
                pdf_bytes = storage.download(document["signed_pdf_path"])
            else:
                raise HTTPException(500, f"Critical rendering error: {str(e)}")
        
        # Add envelope header if info exists
        envelope_id = document.get("envelope_id")
        if envelope_id:
            try:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#000000"
                )
            except Exception as e:
                print(f"Warning: Could not apply envelope header: {str(e)}")
        
        # Apply "SIGNED" watermark
        try:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "SIGNED DOCUMENT",
                color="#4CAF50",  # Professional green
                opacity=0.1,
                font_size=48,
                angle=45
            )
        except Exception as e:
            print(f"Warning: Could not apply watermark: {str(e)}")
        
        # Add download timestamp footer (Audit Evidence)
        try:
            client_ip = request.client.host if request.client else "0.0.0.0"
            pdf_bytes = PDFEngine.apply_audit_footer(
                pdf_bytes,
                recipient.get("email", "unknown"),
                client_ip,
                datetime.utcnow().isoformat(),
                footer_text=f"Downloaded by: {recipient.get('email')} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
            )
        except Exception as e:
            print(f"Warning: Could not apply audit footer: {str(e)}")
        
        # Determine filename
        original_filename = document.get("filename", "signed_document.pdf")
        if not original_filename.lower().endswith(".pdf"):
            original_filename += ".pdf"
        filename = f"signed_{original_filename}"
        
        # Generate count of completed fields for headers/logging
        # We don't have completed_raw_fields in scope anymore (it's inside apply_completed_fields_to_pdf)
        # So we'll just check the document or do a simple count
        try:
            completed_count = db.signature_fields.count_documents({
                "document_id": document["_id"],
                "completed_at": {"$exists": True}
            })
        except:
            completed_count = 0
            
        # Log the download event
        try:
            _log_event(
                str(document["_id"]),
                recipient,
                "download_signed",
                {
                    "download_type": "signed",
                    "filename": filename,
                    "envelope_id": envelope_id,
                    "completed_fields_count": completed_count
                },
                request
            )
        except Exception as e:
            print(f"Warning: Could not log event: {str(e)}")
        
        # Return streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Document-ID": str(document["_id"]),
                "X-Completed-Fields": str(completed_count)
            }
        )
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error downloading signed document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading document")

@router.get("/recipient/{recipient_id}/download/package")
async def download_recipient_package(
    recipient_id: str,
    request: Request
):
    """Download full document package (ZIP) for a recipient."""
    try:
        # Get recipient and document
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
            
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
            
        # Verify document is completed
        # if document.get("status") != "completed":
        #     raise HTTPException(403, "Document package only available after completion")
            
        # Import package generator
        from .email_service import generate_document_package
        
        # Get overall branding/owner info
        owner = db.users.find_one({"_id": document["owner_id"]})
        sender_email = document.get("owner_email", "")
        sender_name = owner.get("full_name", "") or owner.get("name", "") if owner else ""
        sender_organization = owner.get("organization_name", "") if owner else ""
        
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
        
        # Generate the package
        package = await generate_document_package(
            document=document,
            recipient=recipient,
            sender_name=sender_name,
            sender_email=sender_email,
            sender_organization=sender_organization,
            platform_name=platform_name,
            logo_url=logo_url
        )
        
        if not package or not package.get("zip_bytes"):
            raise HTTPException(500, "Could not generate document package")
            
        # Log the event
        _log_event(
            str(document["_id"]),
            recipient,
            "download_package",
            {"format": "zip"},
            request
        )
        
        # Return ZIP as streaming response
        return StreamingResponse(
            io.BytesIO(package["zip_bytes"]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{package["zip_filename"]}"'
            }
        )
        
    except HTTPException: raise
    except Exception as e:
        print(f"Error generating recipient package: {str(e)}")
        raise HTTPException(500, "Internal error during package generation")
    
    

@router.get("/recipient/{recipient_id}/download/signed/password")
async def download_signed_document_with_passkey(
    recipient_id: str,
    request: Request,
    passkey: str = Query(..., description="Password/passkey for encryption")
):
    """
    Download signed document with password protection.
    Called from the dropdown menu with passkey.
    """
    try:
        # Validate recipient ID
        try:
            rid = ObjectId(recipient_id)
        except Exception:
            raise HTTPException(400, "Invalid recipient ID format")
        
        # Validate passkey
        if not passkey or len(passkey.strip()) < 4:
            raise HTTPException(
                400, 
                "Passkey must be at least 4 characters and cannot be empty"
            )
        
        # Get recipient
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check if document is completed
        # if document.get("status") != "completed":
        #     raise HTTPException(400, "Document is not completed yet")
        
        # Decide if we need to apply fields
        signed_pdf_path = document.get("signed_pdf_path")
        should_reapply_fields = False
        
        if not signed_pdf_path:
            # Fallback (rare for completed docs)
            signed_pdf_path = document.get("intermediate_pdf_path") or document.get("pdf_file_path")
            should_reapply_fields = True
            if not signed_pdf_path:
                raise HTTPException(404, "Signed PDF not available")
        
        # Get PDF from Azure
        try:
            pdf_bytes = storage.download(signed_pdf_path)
        except Exception as e:
            print(f"Error reading PDF from Azure: {str(e)}")
            raise HTTPException(404, "PDF file not found in storage")
        
        # ============================================
        # FIX: GET COMPLETED FIELDS AND APPLY THEM
        # ============================================
        
        # Get ALL completed fields for this document
        completed_fields_query = {
            "document_id": recipient["document_id"],
            "completed_at": {"$exists": True}
        }
        completed_raw_fields = list(db.signature_fields.find(completed_fields_query))
        
        print(f"Download password-protected: Found {len(completed_raw_fields)} completed fields")
        
        if completed_raw_fields and should_reapply_fields:
            # Prepare signatures and form fields with COMPLETION FLAGS
            signatures = []
            form_fields = []
            
            for raw_field in completed_raw_fields:
                field_type = raw_field.get("type")
                field_value = raw_field.get("value")
                
                if field_type in IMAGE_FIELDS:
                    # Handle image-based fields
                    image_data = None
                    if isinstance(field_value, dict):
                        if "image" in field_value:
                            image_data = field_value["image"]
                        elif "data" in field_value and field_value.get("type") == "image":
                            image_data = field_value["data"]
                    
                    if image_data:
                        signatures.append({
                            "field_id": str(raw_field["_id"]),
                            "image": image_data,
                            "page": raw_field.get("page", 0),
                            "x": raw_field.get("pdf_x", raw_field.get("x", 0)),
                            "y": raw_field.get("pdf_y", raw_field.get("y", 0)),
                            "width": raw_field.get("pdf_width", raw_field.get("width", 100)),
                            "height": raw_field.get("pdf_height", raw_field.get("height", 30)),
                            "opacity": 1.0,
                            "is_completed": True,
                            "_render_completed": True
                        })
                        
                elif field_type not in IMAGE_FIELDS:
                    # Handle form fields
                    printable_value = None
                    
                    if isinstance(field_value, dict):
                        printable_value = field_value.get("value")
                    else:
                        printable_value = field_value
                    
                    if printable_value not in [None, ""]:
                        form_fields.append({
                            "field_id": str(raw_field["_id"]),
                            "type": field_type,
                            "value": printable_value,
                            "page": raw_field.get("page", 0),
                            "x": raw_field.get("pdf_x", raw_field.get("x", 0)),
                            "y": raw_field.get("pdf_y", raw_field.get("y", 0)),
                            "width": raw_field.get("pdf_width", raw_field.get("width", 100)),
                            "height": raw_field.get("pdf_height", raw_field.get("height", 30)),
                            "font_size": raw_field.get("font_size", 12),
                            "color": "#000000",
                            "opacity": 1.0,
                            "is_completed": True,
                            "_render_completed": True
                        })
            
            # Apply form fields first
            if form_fields:
                print(f"Applying {len(form_fields)} completed form fields to password-protected document")
                pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
            
            # Apply signatures on top
            if signatures:
                print(f"Applying {len(signatures)} completed signatures to password-protected document")
                pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
                    pdf_bytes,
                    signatures,
                    completed_raw_fields
                )
        
        # Encrypt with the provided passkey
        try:
            pdf_bytes = PDFEngine.encrypt_pdf(
                pdf_bytes,
                user_password=passkey,
                owner_password=passkey,  # Same as user password
                permissions={
                    "print": True,
                    "modify": False,
                    "copy": True,
                    "annotate": False,
                    "form_fill": False,
                    "extract": False
                }
            )
        except Exception as e:
            print(f"Error encrypting PDF: {str(e)}")
            raise HTTPException(500, f"Failed to encrypt PDF: {str(e)}")
        
        # Apply "PASSWORD PROTECTED" watermark
        try:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "PASSWORD PROTECTED",
                color="#FF9800",  # Orange color
                opacity=0.15,
                font_size=36,
                angle=45
            )
        except Exception as e:
            print(f"Warning: Could not apply watermark: {str(e)}")
        
        # Add envelope header if exists
        envelope_id = document.get("envelope_id")
        if envelope_id:
            try:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#000000"
                )
            except Exception as e:
                print(f"Warning: Could not apply envelope header: {str(e)}")
        
        # Create filename
        original_filename = document.get("filename", "document.pdf")
        base_name = original_filename.rsplit('.', 1)[0]
        filename = f"protected_{base_name}.pdf"
        
        # Log the download
        try:
            _log_event(
                str(document["_id"]),
                recipient,
                "download_signed_password",
                {
                    "download_type": "signed_password",
                    "encrypted": True,
                    "filename": filename,
                    "envelope_id": envelope_id,
                    "completed_fields": len(completed_raw_fields)
                },
                request
            )
        except Exception as e:
            print(f"Warning: Could not log event: {str(e)}")
        
        # Return streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Document-Status": "completed",
                "X-Password-Protected": "true",
                "X-Download-Type": "signed_password",
                "X-Filename": filename,
                "X-Completed-Fields": str(len(completed_raw_fields))
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading password-protected document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading protected document")


@router.get("/recipient/{recipient_id}/download/original")
async def download_original_document(
    recipient_id: str,
    request: Request
):
    """
    Download original (unsigned) document.
    Called from the dropdown menu.
    """
    try:
        # Validate recipient ID
        try:
            rid = ObjectId(recipient_id)
        except Exception:
            raise HTTPException(400, "Invalid recipient ID format")
        
        # Get recipient
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Get original PDF path
        base_pdf_path = document.get("pdf_file_path")
        if not base_pdf_path:
            raise HTTPException(404, "Original PDF not found")
        
        # Get PDF from Azure
        try:
            pdf_bytes = storage.download(base_pdf_path)
        except Exception as e:
            print(f"Error reading PDF from Azure: {str(e)}")
            raise HTTPException(404, "PDF file not found in storage")
        
        # Apply "ORIGINAL" watermark
        try:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "ORIGINAL UNSIGNED COPY",
                color="#666666",  # Gray color
                opacity=0.1,
                font_size=36,
                angle=45
            )
        except Exception as e:
            print(f"Warning: Could not apply watermark: {str(e)}")
        
        # Add envelope header if exists
        envelope_id = document.get("envelope_id")
        if envelope_id:
            try:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#666666"
                )
            except Exception as e:
                print(f"Warning: Could not apply envelope header: {str(e)}")
        
        # Add audit footer
        try:
            client_ip = request.client.host if request.client else "0.0.0.0"
            pdf_bytes = PDFEngine.apply_audit_footer(
                pdf_bytes,
                recipient.get("email", "unknown"),
                client_ip,
                datetime.utcnow().isoformat(),
                footer_text=f"Original document downloaded by: {recipient.get('email', 'unknown')}"
            )
        except Exception as e:
            print(f"Warning: Could not apply audit footer: {str(e)}")
        
        # Create filename
        original_filename = document.get("filename", "document.pdf")
        base_name = original_filename.rsplit('.', 1)[0]
        filename = f"original_{base_name}.pdf"
        
        # Log the download
        try:
            _log_event(
                str(document["_id"]),
                recipient,
                "download_original",
                {
                    "download_type": "original",
                    "filename": filename,
                    "envelope_id": envelope_id
                },
                request
            )
        except Exception as e:
            print(f"Warning: Could not log event: {str(e)}")
        
        # Return streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Document-Status": document.get("status", "unknown"),
                "X-Download-Type": "original",
                "X-Filename": filename
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading original document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading original document")


# ======================
# REWRITTEN PROFESSIONAL SUMMARY ENDPOINT
# ======================
@router.get("/recipient/{recipient_id}/download/summary")
async def download_professional_summary(
    recipient_id: str,
    request: Request,
    format: str = Query("pdf", description="Output format (pdf only for now)")
):
    """
    Download a professional, detailed document summary report.
    
    Features:
    - SafeSign branded header with teal color (#0d9488)
    - Document information card with complete metadata
    - Recipient's personal participation summary
    - SIGNATURE AND INITIALS displayed directly in summary
    - Detailed list of assigned fields with completion status
    - All participants table with roles and status
    - Recent activity timeline
    - Professional typography and layout
    """
    try:
        # Validate recipient ID
        try:
            rid = ObjectId(recipient_id)
        except Exception:
            raise HTTPException(400, "Invalid recipient ID format")
        
        # Get recipient with OTP verification check
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required to download summary")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Get document owner info
        owner = db.users.find_one({"_id": document.get("owner_id")}) if document.get("owner_id") else None
        owner_name = owner.get("full_name") or owner.get("name") or document.get("owner_email", "") if owner else document.get("owner_email", "")
        
        # ========== GATHER COMPLETE DOCUMENT DATA ==========
        
        # Get all recipients
        all_recipients = list(db.recipients.find({
            "document_id": recipient["document_id"]
        }).sort("signing_order", 1))
        
        # Get all fields for this document
        all_fields = list(db.signature_fields.find({
            "document_id": recipient["document_id"]
        }))
        
        # Get fields assigned to current recipient
        recipient_fields = [f for f in all_fields if str(f.get("recipient_id")) == recipient_id]
        
        # Get document timeline/activity
        timeline = list(db.document_timeline.find({
            "document_id": recipient["document_id"]
        }).sort("timestamp", -1).limit(20))
        
        # ========== PREPARE SUMMARY DATA ==========
        
        # Format dates
        created_date = document.get("uploaded_at")
        created_date_str = created_date.strftime("%B %d, %Y") if created_date else "Unknown"
        
        completed_date = document.get("completed_at") or document.get("finalized_at")
        completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M %p") if completed_date else "Not completed"
        
        # Calculate statistics
        total_fields = len(all_fields)
        completed_fields = len([f for f in all_fields if f.get("completed_at")])
        
        # Prepare assigned fields with detailed information
        assigned_fields = []
        signature_value = None
        initials_value = None
        has_initials_field = False
        
        for field in recipient_fields:
            field_type = field.get("type", "unknown")
            completed = field.get("completed_at") is not None
            
            # Capture signature and initials for display
            if field_type in ['signature', 'witness_signature'] and completed:
                signature_value = field.get("value")
            elif field_type == 'initials':
                has_initials_field = True
                if completed:
                    initials_value = field.get("value")
            
            # Format value for display
            value = field.get("value", "")
            if isinstance(value, dict):
                if "image" in value:
                    value = "[Signature captured]"
                elif "value" in value:
                    value = value["value"]
                else:
                    value = str(value)[:50]
            
            # Get completion timestamp
            completed_at = None
            if completed:
                completed_at = field.get("completed_at")
                if completed_at:
                    completed_at = completed_at.strftime("%Y-%m-%d %H:%M")
            
            assigned_fields.append({
                "type": field_type,
                "page": field.get("page", 0),
                "completed": completed,
                "value": value,
                "raw_value": field.get("value"),  # Keep raw for signature display
                "completed_at": completed_at,
                "required": field.get("required", True),
                "label": field.get("label", "")
            })
        
        # Prepare all participants data
        participants = []
        for r in all_recipients:
            # Get completion timestamp based on role
            completion_time = None
            if r.get("signed_at"):
                completion_time = r["signed_at"].strftime("%Y-%m-%d")
            elif r.get("approved_at"):
                completion_time = r["approved_at"].strftime("%Y-%m-%d")
            elif r.get("form_completed_at"):
                completion_time = r["form_completed_at"].strftime("%Y-%m-%d")
            elif r.get("viewer_at"):
                completion_time = r["viewer_at"].strftime("%Y-%m-%d")
            
            # Count fields for this recipient
            r_fields = [f for f in all_fields if str(f.get("recipient_id")) == str(r["_id"])]
            r_completed = len([f for f in r_fields if f.get("completed_at")])
            
            participants.append({
                "name": r.get("name", "Unknown"),
                "email": r.get("email", ""),
                "role": r.get("role", "signer"),
                "status": r.get("status", "pending"),
                "completed_at": completion_time,
                "signing_order": r.get("signing_order", 1),
                "fields_assigned": len(r_fields),
                "fields_completed": r_completed,
                "otp_verified": r.get("otp_verified", False),
                "terms_accepted": r.get("terms_accepted", False)
            })
        
        # Prepare recent activity - High information density
        recent_activity = []
        for event in timeline[:15]:
            actor = event.get("actor", {})
            participant_name = actor.get("name") or actor.get("email") or "System"
            
            event_date = event.get("timestamp")
            if event_date:
                event_date = event_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Improve details if description is empty
            details = event.get("description", "")
            if not details:
                # Build detail from metadata if description missing
                meta = event.get("metadata", {})
                action = event.get("type", event.get("action", ""))
                if action == "recipient_viewed":
                    details = f"Viewed by {participant_name}"
                elif action == "document_downloaded":
                    details = f"Downloaded {meta.get('filename', 'document')}"
                elif action == "otp_verified":
                    details = "Security verification completed"
                else:
                    details = event.get("title", action.replace("_", " ").title())
            
            recent_activity.append({
                "date": event_date,
                "event": event.get("title", event.get("action", "Activity")),
                "participant": participant_name,
                "details": details
            })
        
        # Get envelope ID
        envelope_id = document.get("envelope_id", "N/A")
        
        # Current recipient info for "Your Participation" section
        current_recipient_completed = None
        if recipient.get("signed_at"):
            current_recipient_completed = recipient["signed_at"].isoformat()
        elif recipient.get("approved_at"):
            current_recipient_completed = recipient["approved_at"].isoformat()
        elif recipient.get("form_completed_at"):
            current_recipient_completed = recipient["form_completed_at"].isoformat()
        elif recipient.get("viewer_at"):
            current_recipient_completed = recipient["viewer_at"].isoformat()
        
        # Prepare complete summary data with signature and initials
        summary_data = {
            "envelope_id": envelope_id,
            "document_name": document.get("filename", "Untitled Document"),
            "document_status": document.get("status", "unknown"),
            "created_date": created_date_str,
            "completed_date": completed_date_str,
            "total_pages": document.get("page_count", 0),
            "owner_name": owner_name,
            "owner_email": document.get("owner_email", "Unknown"),
            
            # Current recipient section with signature/initials
            "current_recipient": {
                "name": recipient.get("name", "Unknown"),
                "email": recipient.get("email", ""),
                "role": recipient.get("role", "signer"),
                "status": recipient.get("status", "pending"),
                "completed_at": current_recipient_completed,
                "ip_address": recipient.get("signed_ip") or recipient.get("completed_ip") or recipient.get("viewed_ip", "Unknown"),
                "otp_verified": recipient.get("otp_verified", False),
                "terms_accepted": recipient.get("terms_accepted", False),
                "signing_order": recipient.get("signing_order", 1),
                # ADDED: Signature and initials values
                "signature_value": signature_value,
                "initials_value": initials_value,
                "has_initials_field": has_initials_field
            },
            
            # Assigned fields (including signatures/initials for the table)
            "assigned_fields": assigned_fields,
            
            # All participants
            "all_recipients": participants,
            
            # Statistics
            "statistics": {
                "total_recipients": len(all_recipients),
                "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"]),
                "total_fields": total_fields,
                "completed_fields": completed_fields,
                "completion_percentage": round((completed_fields / total_fields * 100), 1) if total_fields > 0 else 0,
                "assigned_to_you": len(recipient_fields),
                "completed_by_you": len([f for f in recipient_fields if f.get("completed_at")])
            },
            
            # Recent activity
            "recent_activity": recent_activity,
            
            # Metadata
            "summary_id": f"SUM-{uuid.uuid4().hex[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "platform": "SafeSign Professional"
        }
        
        # ========== GENERATE PROFESSIONAL SUMMARY PDF ==========
        try:
            pdf_bytes = SafeSignSummaryEngine.create_document_summary_pdf(summary_data)
        except Exception as e:
            print(f"Error creating summary PDF: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Enhanced fallback PDF with teal header
            from reportlab.pdfgen import canvas
            import io as io_module
            
            buffer = io_module.BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            # Teal header
            c.setFillColor(colors.HexColor("#0d9488"))
            c.rect(0, height - 60, width, 60, fill=1, stroke=0)
            
            c.setFont("Helvetica-Bold", 20)
            c.setFillColor(colors.white)
            c.drawString(50, height - 40, "SafeSign")
            c.drawString(width - 200, height - 40, "DOCUMENT SUMMARY")
            
            # Content
            c.setFont("Helvetica-Bold", 14)
            c.setFillColor(colors.black)
            c.drawString(50, height - 100, f"Document: {document.get('filename', 'Unknown')}")
            
            c.setFont("Helvetica", 11)
            c.drawString(50, height - 130, f"Envelope ID: {envelope_id}")
            c.drawString(50, height - 150, f"Recipient: {recipient.get('name', 'Unknown')}")
            c.drawString(50, height - 170, f"Status: {recipient.get('status', 'pending').upper()}")
            
            # Show signature status
            if signature_value:
                c.drawString(50, height - 190, "Signature: ✓ Signed")
            else:
                c.drawString(50, height - 190, "Signature: Not signed")
                
            if has_initials_field:
                if initials_value:
                    c.drawString(50, height - 210, "Initials: ✓ Provided")
                else:
                    c.drawString(50, height - 210, "Initials: ○ Pending")
            
            c.setFont("Helvetica", 9)
            c.drawString(50, 50, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
            c.drawString(50, 30, "Verified by SafeSign Secure Digital Signature Platform")
            
            c.save()
            buffer.seek(0)
            pdf_bytes = buffer.read()
        
        # ========== CREATE FILENAME ==========
        safe_name = re.sub(r'[^\w\s-]', '', document.get('filename', 'document'))
        base_name = safe_name.rsplit('.', 1)[0][:50]
        recipient_name = re.sub(r'[^\w\s-]', '', recipient.get('name', 'recipient'))[:20]
        
        filename = f"SafeSign_Summary_{envelope_id}_{recipient_name}_{base_name}.pdf"
        filename = re.sub(r'\s+', '_', filename)
        
        # ========== LOG THE DOWNLOAD ==========
        try:
            _log_event(
                str(document["_id"]),
                recipient,
                "download_professional_summary",
                {
                    "download_type": "professional_summary",
                    "filename": filename,
                    "envelope_id": envelope_id,
                    "summary_id": summary_data["summary_id"],
                    "recipient_name": recipient.get("name"),
                    "has_signature": signature_value is not None,
                    "has_initials": initials_value is not None
                },
                request
            )
        except Exception as e:
            print(f"Warning: Could not log event: {str(e)}")
        
        # ========== RETURN STREAMING RESPONSE ==========
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Summary-Type": "professional_document_summary",
                "X-Envelope-ID": envelope_id,
                "X-Summary-ID": summary_data["summary_id"],
                "X-Recipient-Name": recipient.get("name", "Unknown"),
                "X-Recipient-Status": recipient.get("status", "unknown"),
                "X-Has-Signature": str(signature_value is not None),
                "X-Has-Initials": str(initials_value is not None),
                "X-Generated-At": summary_data["generated_at"]
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error generating professional summary: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while generating document summary")
# ======================
# REWRITTEN PROFESSIONAL CERTIFICATE ENDPOINT
# ======================

@router.get("/recipient/{recipient_id}/download/certificate")
async def download_professional_certificate(
    recipient_id: str,
    request: Request,
    include_timeline: bool = Query(True, description="Include detailed field completion timeline")
):
    """
    Download a professional, DocuSign-quality Certificate of Completion.
    Matches the professional style of the document summary.
    """
    try:
        # Validate recipient ID
        try:
            rid = ObjectId(recipient_id)
        except Exception:
            raise HTTPException(400, "Invalid recipient ID format")
        
        # Get recipient
        recipient = db.recipients.find_one({"_id": rid})
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required to download certificate")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check if document is completed
        # if document.get("status") != "completed":
        #     raise HTTPException(
        #         400, 
        #         f"Certificate can only be generated for completed documents. Current status: {document.get('status')}"
        #     )
        
        # ========== GATHER COMPLETE CERTIFICATE DATA ==========
        
        # Get document owner info
        owner = db.users.find_one({"_id": document.get("owner_id")}) if document.get("owner_id") else None
        owner_name = owner.get("full_name") or owner.get("name") or document.get("owner_email", "") if owner else document.get("owner_email", "")
        
        # Get all recipients
        all_recipients = list(db.recipients.find({
            "document_id": recipient["document_id"]
        }).sort("signing_order", 1))
        
        # Get all fields
        all_fields = list(db.signature_fields.find({
            "document_id": recipient["document_id"]
        }))
        
        # Get completed fields
        completed_fields = [f for f in all_fields if f.get("completed_at")]
        
        # Get document timeline (Full for certificate)
        sent_log = db.document_timeline.find_one({
            "document_id": recipient["document_id"],
            "action": "upload_document"
        })
        
        timeline = list(db.document_timeline.find({
            "document_id": recipient["document_id"]
        }).sort("timestamp", -1).limit(50))
        
        # Prepare recent activity - High information density
        recent_activity_list = []
        for event in timeline:
            actor = event.get("actor", {})
            participant_name = actor.get("name") or actor.get("email") or "System"
            
            event_date = event.get("timestamp")
            if event_date:
                event_date = event_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Improve details if description is empty
            details = event.get("description", "")
            if not details:
                meta = event.get("metadata", {})
                action = event.get("type", event.get("action", ""))
                if action == "recipient_viewed":
                    details = f"Viewed by {participant_name}"
                elif action == "document_downloaded":
                    details = f"Downloaded {meta.get('filename', 'document')}"
                elif action == "otp_verified":
                    details = "Security verification completed"
                else:
                    details = event.get("title", action.replace("_", " ").title())
            
            recent_activity_list.append({
                "date": event_date,
                "event": event.get("title", event.get("action", "Activity")),
                "participant": participant_name,
                "details": details
            })
        
        # Calculate statistics
        total_signatures = len([f for f in all_fields if f.get("type") in ["signature", "witness_signature"]])
        completed_signatures = len([f for f in completed_fields if f.get("type") in ["signature", "witness_signature"]])
        
        total_initials = len([f for f in all_fields if f.get("type") == "initials"])
        completed_initials = len([f for f in completed_fields if f.get("type") == "initials"])
        
        total_form_fields = len([f for f in all_fields if f.get("type") in ["textbox", "date", "mail", "dropdown"]])
        completed_form_fields = len([f for f in completed_fields if f.get("type") in ["textbox", "date", "mail", "dropdown"]])
        
        # Prepare recipients data
        recipients_data = []
        for r in all_recipients:
            # Get completion timestamp based on role
            completion_timestamp = None
            completion_ip = "Unknown"
            
            role = r.get("role", "signer")
            if role == "signer" or role == "in_person_signer":
                completion_timestamp = r.get("signed_at")
                completion_ip = r.get("signed_ip", r.get("completed_ip", "Unknown"))
            elif role == "approver":
                completion_timestamp = r.get("approved_at")
                completion_ip = r.get("approved_ip", r.get("completed_ip", "Unknown"))
            elif role == "form_filler":
                completion_timestamp = r.get("form_completed_at")
                completion_ip = r.get("completed_ip", "Unknown")
            elif role == "witness":
                completion_timestamp = r.get("witnessed_at")
                completion_ip = r.get("witnessed_ip", r.get("completed_ip", "Unknown"))
            elif role == "viewer":
                completion_timestamp = r.get("viewer_at")
                completion_ip = r.get("viewed_ip", r.get("completed_ip", "Unknown"))
            
            # Get terms acceptance date
            terms_accepted_date = None
            if r.get("terms_accepted_at"):
                terms_accepted_date = r["terms_accepted_at"].strftime("%Y-%m-%d %H:%M:%S")
            
            recipients_data.append({
                "name": r.get("name", "Unknown"),
                "email": r.get("email", "No email"),
                "role": role,
                "status": r.get("status", "pending"),
                "completed_at": completion_timestamp.strftime("%Y-%m-%d %H:%M:%S") if completion_timestamp else None,
                "ip_address": completion_ip,
                "signing_order": r.get("signing_order", 0),
                "otp_verified": r.get("otp_verified", False),
                "terms_accepted": r.get("terms_accepted", False),
                "terms_accepted_date": terms_accepted_date
            })
        
        # Prepare field completion history
        field_history = []
        if include_timeline:
            for field in completed_fields[:25]:  # Limit to 25 most recent
                field_recipient = db.recipients.find_one({"_id": field.get("recipient_id")})
                if field_recipient:
                    completion_time = field.get("completed_at")
                    field_history.append({
                        "type": field.get("type", "unknown"),
                        "signer_name": field_recipient.get("name", "Unknown"),
                        "completed_at": completion_time.strftime("%Y-%m-%d %H:%M:%S") if completion_time else None,
                        "ip_address": field.get("completed_ip", "Unknown"),
                        "page": field.get("page", 0) + 1
                    })
            
            # Sort by completion date (newest first)
            field_history.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
        
        # Get sender IP
        sender_ip = "Unknown"
        if sent_log and sent_log.get("metadata"):
            sender_ip = sent_log["metadata"].get("ip") or sent_log.get("metadata", {}).get("ip_address", "Unknown")
        
        # Format dates
        created_date = document.get("uploaded_at")
        created_date_str = created_date.strftime("%B %d, %Y at %I:%M:%S %p") if created_date else "Unknown"
        
        completed_date = document.get("completed_at") or document.get("finalized_at")
        completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M:%S %p") if completed_date else "Unknown"
        
        sent_date_str = created_date_str
        if sent_log and sent_log.get("timestamp"):
            sent_date_str = sent_log["timestamp"].strftime("%B %d, %Y at %I:%M:%S %p")
        
        # Generate unique certificate ID
        certificate_id = f"CERT-{document.get('envelope_id', uuid.uuid4().hex[:8])}-{datetime.utcnow().strftime('%Y%m%d')}"
        
        # ========== PREPARE COMPLETE CERTIFICATE DATA ==========
        certificate_data = {
            "envelope_id": document.get("envelope_id", "N/A"),
            "document_name": document.get("filename", "Unknown Document"),
            "document_id": str(document["_id"]),
            "page_count": document.get("page_count", 0),
            
            # Dates
            "created_date": created_date_str,
            "sent_date": sent_date_str,
            "completed_date": completed_date_str,
            
            # Owner information
            "owner_name": owner_name,
            "owner_email": document.get("owner_email", "Unknown"),
            "owner_ip": sender_ip,
            
            # Statistics
            "statistics": {
                "total_recipients": len(all_recipients),
                "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"]),
                "total_fields": len(all_fields),
                "completed_fields": len(completed_fields),
                "completion_percentage": round((len(completed_fields) / len(all_fields) * 100), 1) if all_fields else 0,
                "total_signatures": total_signatures,
                "signatures_completed": completed_signatures,
                "total_initials": total_initials,
                "initials_completed": completed_initials,
                "total_form_fields": total_form_fields,
                "form_fields_completed": completed_form_fields,
            },
            
            # Recipients
            "recipients": recipients_data,
            
            # Document Activity (Full)
            "recent_activity": recent_activity_list,
            
            # Field history
            "field_history": field_history if include_timeline else [],
            
            # Certificate metadata
            "certificate_id": certificate_id,
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "generated_by_name": recipient.get("name", "Unknown Recipient"),
            "platform": "SafeSign Professional"
        }
        
        # ========== GENERATE PROFESSIONAL CERTIFICATE PDF ==========
        try:
            pdf_bytes = SafeSignCertificateEngine.create_certificate_pdf(certificate_data)
        except Exception as e:
            print(f"Error creating certificate PDF: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(500, f"Error generating certificate: {str(e)}")
        
        # ========== CREATE FILENAME ==========
        safe_name = re.sub(r'[^\w\s-]', '', document.get('filename', 'document'))
        base_name = safe_name.rsplit('.', 1)[0][:40]
        envelope_short = document.get('envelope_id', certificate_id)[-8:]
        
        filename = f"SafeSign_Certificate_{envelope_short}_{base_name}.pdf"
        filename = re.sub(r'\s+', '_', filename)
        
        # ========== LOG THE DOWNLOAD ==========
        try:
            _log_event(
                str(document["_id"]),
                recipient,
                "download_certificate",
                {
                    "download_type": "certificate",
                    "filename": filename,
                    "envelope_id": document.get("envelope_id"),
                    "certificate_id": certificate_id
                },
                request
            )
        except Exception as e:
            print(f"Warning: Could not log event: {str(e)}")
        
        # ========== RETURN STREAMING RESPONSE ==========
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "X-Certificate-Type": "professional_completion",
                "X-Envelope-ID": document.get("envelope_id", "none"),
                "X-Certificate-ID": certificate_id,
                "X-Document-Status": "completed"
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading certificate: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading certificate")
    
    
# ======================
# DOCUMENT THUMBNAILS (RECIPIENT ACCESS)
# ======================

@router.get("/recipient/{recipient_id}/thumbnails")
async def get_recipient_document_thumbnails(
    recipient_id: str
):
    """
    Get thumbnail information for a document when accessing as a recipient.
    Returns metadata for all pages with page numbers.
    """
    try:
        # Get recipient with validation
        recipient = await get_recipient_for_signing(recipient_id, allow_voided=True)
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Get all files
        files = list(db.document_files.find({
            "document_id": recipient["document_id"]
        }).sort("order", 1))
        
        # If no files found, use the main PDF
        if not files:
            # Create a virtual file entry for the main PDF
            total_pages = document.get("page_count", 0)
            thumbnails = []
            for page_num in range(1, total_pages + 1):
                thumbnails.append({
                    "page": page_num,
                    "thumbnail_url": f"/signing/recipient/{recipient_id}/pages/{page_num}/thumbnail",
                    "has_thumbnail": True
                })
            
            return {
                "document_id": str(document["_id"]),
                "filename": document.get("filename", "Unknown"),
                "page_count": total_pages,
                "total_files": 1,
                "thumbnails": thumbnails
            }
        
        # Multiple files - calculate page ranges
        thumbnails = []
        current_page = 1
        
        for file in files:
            start_page = current_page
            end_page = current_page + file["page_count"] - 1
            
            # For multi-file documents, generate thumbnails for each page
            for page_offset in range(file["page_count"]):
                page_num = start_page + page_offset
                thumbnails.append({
                    "file_id": str(file["_id"]),
                    "filename": file["filename"],
                    "page": page_num,
                    "page_in_file": page_offset + 1,
                    "thumbnail_url": f"/signing/recipient/{recipient_id}/pages/{page_num}/thumbnail",
                    "has_thumbnail": True
                })
            
            current_page = end_page + 1
        
        return {
            "document_id": str(document["_id"]),
            "filename": document.get("filename", "Unknown"),
            "page_count": document.get("page_count", 0),
            "total_files": len(files),
            "thumbnails": thumbnails
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting thumbnails for recipient: {e}")
        raise HTTPException(500, "Error retrieving thumbnails")


@router.get("/recipient/{recipient_id}/pages/{page_number}/thumbnail")
async def get_recipient_page_thumbnail(
    recipient_id: str,
    page_number: int,
    width: int = Query(200, ge=50, le=1000),
    height: int = Query(300, ge=50, le=1000),
    quality: int = Query(85, ge=10, le=100) 
):
    """
    Get REAL thumbnail for a specific page as a recipient.
    Generates actual page thumbnail from PDF, not a placeholder.
    """
    try:
        # Get recipient with validation
        recipient = await get_recipient_for_signing(recipient_id, allow_voided=True)
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Validate page number
        total_pages = document.get("page_count", 0)
        if page_number < 1 or page_number > total_pages:
            raise HTTPException(400, f"Invalid page number. Must be between 1 and {total_pages}")
        
        # Find which file contains this page
        files = list(db.document_files.find({
            "document_id": recipient["document_id"]
        }).sort("order", 1))
        
        # If no files found, use the main PDF
        if not files:
            # Get the main PDF
            pdf_path = document.get("pdf_file_path")
            if not pdf_path:
                raise HTTPException(404, "PDF not found")
            
            try:
                pdf_bytes = storage.download(pdf_path)
            except Exception as e:
                print(f"Error reading PDF file: {e}")
                raise HTTPException(404, "PDF file not found in storage")
            
            page_in_file = page_number
            
        else:
            # Find the correct file for this page
            current_page = 1
            target_file = None
            page_in_file = 1
            
            for file in files:
                end_page = current_page + file["page_count"] - 1
                
                if current_page <= page_number <= end_page:
                    target_file = file
                    page_in_file = page_number - current_page + 1
                    break
                
                current_page = end_page + 1
            
            if not target_file:
                raise HTTPException(404, "Page not found")
            
            # Get the file's PDF from Azure
            try:
                pdf_bytes = storage.download(target_file["file_path"])
            except Exception as e:
                print(f"Error reading PDF file: {e}")
                raise HTTPException(404, "PDF file not found in storage")
        
        # Open PDF and get specific page - GENERATE ACTUAL THUMBNAIL
        try:
            import fitz
            from PIL import Image
            
            doc_pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            if page_in_file > doc_pdf.page_count or page_in_file < 1:
                doc_pdf.close()
                raise HTTPException(400, "Page number out of range")
            
            page = doc_pdf[page_in_file - 1]
            
            # Calculate zoom to fit requested dimensions while maintaining aspect ratio
            page_rect = page.rect
            
            # Use the requested dimensions to determine zoom
            # We want the thumbnail to fill as much of the requested area as possible
            # while maintaining aspect ratio
            zoom_x = width / page_rect.width
            zoom_y = height / page_rect.height
            zoom = min(zoom_x, zoom_y)  # Use min to fit within bounds
            
            # Generate pixmap with proper resolution
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # If the image doesn't exactly match requested dimensions, resize with LANCZOS
            if pix.width != width or pix.height != height:
                img = img.resize((width, height), Image.Resampling.LANCZOS)
            
            # Save as PNG with quality setting (PNG ignores quality, but we'll use optimize)
            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=(quality < 95))
            
            doc_pdf.close()
            
            # Log thumbnail generation (optional)
            print(f"Generated REAL thumbnail for page {page_number}")
            
            return StreamingResponse(
                io.BytesIO(buf.getvalue()),
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Content-Disposition": f'inline; filename="page_{page_number}_thumbnail.png"',
                    "X-Page-Number": str(page_number),
                    "X-Total-Pages": str(total_pages),
                    "X-Thumbnail-Type": "real"
                }
            )
            
        except ImportError as e:
            print(f"Error: PyMuPDF not installed: {e}")
            raise HTTPException(500, "PDF rendering library not available")
        except Exception as e:
            print(f"Error generating thumbnail: {e}")
            raise HTTPException(500, f"Error generating thumbnail: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating page thumbnail: {e}")
        raise HTTPException(500, "Error generating thumbnail")


@router.get("/recipient/{recipient_id}/files/{file_id}/thumbnail")
async def get_recipient_file_thumbnail(
    recipient_id: str,
    file_id: str
):
    """
    Get stored thumbnail for a specific file as a recipient.
    If no stored thumbnail exists, generate one from the first page.
    """
    try:
        # Get recipient with validation
        recipient = await get_recipient_for_signing(recipient_id, allow_voided=True)
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required")
        
        # Get file
        file = db.document_files.find_one({
            "_id": ObjectId(file_id),
            "document_id": recipient["document_id"]
        })
        
        if not file:
            raise HTTPException(404, "File not found")
        
        # Check if thumbnail exists
        thumbnail_path = file.get("thumbnail_path")
        if thumbnail_path:
            try:
                # Try to get stored thumbnail from Azure
                thumb_bytes = storage.download(thumbnail_path)
                
                # Return the stored thumbnail
                return StreamingResponse(
                    io.BytesIO(thumb_bytes),
                    media_type="image/png",
                    headers={
                        "Cache-Control": "private, max-age=86400",
                        "Content-Disposition": f'inline; filename="{file.get("filename", "thumbnail")}_thumb.png"',
                        "X-Filename": file.get("filename", "thumbnail"),
                        "X-File-ID": file_id,
                        "X-Thumbnail-Source": "stored"
                    }
                )
            except Exception as e:
                print(f"Error reading stored thumbnail: {e}")
                # Fall through to generate from first page
        
        # No stored thumbnail or error reading it - generate from first page
        # Calculate the global page number for this file's first page
        files = list(db.document_files.find({
            "document_id": recipient["document_id"]
        }).sort("order", 1))
        
        current_page = 1
        start_page = 1
        for f in files:
            if f["_id"] == file["_id"]:
                start_page = current_page
                break
            current_page += f["page_count"]
        
        # Generate thumbnail from first page
        return await get_recipient_page_thumbnail(
            recipient_id, 
            start_page, 
            width=400, 
            height=300
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting file thumbnail: {e}")
        raise HTTPException(500, "Error retrieving thumbnail")


@router.get("/recipient/{recipient_id}/document-preview")
async def get_document_preview_images(
    recipient_id: str,
    page_from: int = Query(1, ge=1),
    page_to: int = Query(None, ge=1),
    width: int = Query(400, ge=100, le=1200),
    height: int = Query(600, ge=150, le=1600)
):
    """
    Get preview images for multiple pages of a document.
    Useful for showing document preview in UI.
    """
    try:
        # Get recipient with validation
        recipient = await get_recipient_for_signing(recipient_id, allow_voided=True)
        
        # Check OTP verification
        if not recipient.get("otp_verified"):
            raise HTTPException(403, "OTP verification required")
        
        # Get document
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        total_pages = document.get("page_count", 0)
        
        # Validate page range
        if page_to is None:
            page_to = min(page_from + 4, total_pages)  # Default: next 5 pages or total
        
        if page_to > total_pages:
            page_to = total_pages
        
        if page_from > page_to:
            raise HTTPException(400, "Invalid page range")
        
        # Limit to reasonable number of pages
        max_pages = 20
        if (page_to - page_from + 1) > max_pages:
            raise HTTPException(400, f"Cannot generate more than {max_pages} pages at once")
        
        # Generate previews for each page
        previews = []
        for page_num in range(page_from, page_to + 1):
            previews.append({
                "page": page_num,
                "url": f"/signing/recipient/{recipient_id}/pages/{page_num}/thumbnail?width={width}&height={height}",
                "width": width,
                "height": height
            })
        
        return {
            "document_id": str(document["_id"]),
            "filename": document.get("filename", "Unknown"),
            "total_pages": total_pages,
            "preview_range": f"{page_from}-{page_to}",
            "previews": previews,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document preview: {e}")
        raise HTTPException(500, "Error generating document preview")
    
@router.post("/recipient/{recipient_id}/complete")
async def manually_complete_recipient(
    recipient_id: str,
    background_tasks: BackgroundTasks,
    request: Request
):
    """
    Manually mark recipient as completed (for viewers, approvers, etc.)
    This endpoint is called by the frontend's "Finish" button.
    """
    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(400, "Invalid recipient ID")
    
    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")
    
    # if recipient.get("status") == "completed":
    #     raise HTTPException(400, "Recipient already completed")
    
    if not recipient.get("otp_verified"):
        raise HTTPException(403, "OTP verification required")
    
    role = recipient.get("role", "signer")
    
    # Check if recipient can be completed
    if role in ["signer", "in_person_signer", "form_filler", "witness"]:
        # For these roles, check if all fields are completed
        incomplete_fields = db.signature_fields.count_documents({
            "recipient_id": rid,
            "$or": [
                {"completed_at": {"$exists": False}},
                {"completed_at": None}
            ]
        })
        
        if incomplete_fields > 0:
            raise HTTPException(400, f"You have {incomplete_fields} incomplete fields")
    
    # For approvers and viewers, allow manual completion
    # (They might not have fields to complete)
    
    # Mark recipient as completed
    update_recipient_data = {"status": "completed"}
    
    # Add role-specific timestamp
    role_timestamp = {
        "signer": "signed_at",
        "in_person_signer": "signed_at",
        "approver": "approved_at",
        "form_filler": "form_completed_at",
        "witness": "witnessed_at",
        "viewer": "viewer_at"
    }
    
    timestamp_field = role_timestamp.get(role)
    if timestamp_field:
        update_recipient_data[timestamp_field] = datetime.utcnow()
    
    # Add completion metadata
    update_recipient_data.update({
        "completed_ip": request.client.host if request.client else "unknown",
        "completed_at": datetime.utcnow(),
        "completed_via": "manual"  # To distinguish from automatic completion
    })
    
    # Update document statistics
    doc_id = recipient["document_id"]
    if isinstance(doc_id, str):
        try:
            doc_id = ObjectId(doc_id)
        except:
            raise HTTPException(400, "Invalid document ID in recipient record")
            
    document = db.documents.find_one({"_id": doc_id})
    if not document:
        raise HTTPException(404, "Document not found")
        
    db.recipients.update_one({"_id": rid}, {"$set": update_recipient_data})
    
    # ✅ NEW: Notify owner about recipient completion
    from .email_service import send_recipient_activity_notification_to_owner
    background_tasks.add_task(
        send_recipient_activity_notification_to_owner,
        recipient=recipient,
        document=document,
        status="completed"
    )
    update_document_statistics(doc_id)
    
    # Check if all recipients have finished (either completed or declined)
    all_recipients = list(db.recipients.find({"document_id": doc_id}))
    none_pending = all(r.get("status") in ["completed", "declined"] for r in all_recipients)
    any_completed = any(r.get("status") == "completed" for r in all_recipients)
    
    if none_pending and any_completed:
        # Finalize the document if at least one person signed and no one is pending
        finalize_document(
            doc_id,
            request=request,
            background_tasks=background_tasks
        )
        return {
            "message": "Recipient completed — document finalized",
            "completed": True,
            "document_finalized": True,
            "recipient_status": "completed"
        }

    # ✅ SEQUENTIAL FLOW: TRIGGER NEXT SIGNER
    # Re-use the existing 'document' variable already fetched above
    if document.get("signing_order_enabled"):
        # Find current recipient's order
        current_order = recipient.get("signing_order", 0)
        
        # Find if anyone else in current order is still pending
        current_level_pending = db.recipients.count_documents({
            "document_id": doc_id,
            "signing_order": current_order,
            "status": {"$nin": ["completed", "declined"]}
        })
        
        if current_level_pending == 0:
            # Everyone at current level finished, find next order
            next_recipients = list(db.recipients.find({
                "document_id": doc_id,
                "signing_order": {"$gt": current_order},
                "status": "awaiting_previous"
            }).sort("signing_order", 1))
            
            if next_recipients:
                # Group by order and take the lowest one
                next_order = next_recipients[0]["signing_order"]
                to_invite = [r for r in next_recipients if r["signing_order"] == next_order]
                
                # Send invites to the next level
                from .email_service import send_bulk_invites
                background_tasks.add_task(
                    send_bulk_invites,
                    str(doc_id),
                    to_invite,
                    document.get("common_message", ""),
                    {}, # Personal messages already stored in recipient doc
                    document.get("owner_email", "system@safesign.ai")
                )
    
    # Log the manual completion
    _log_event(
        str(doc_id),
        recipient,
        "manual_recipient_completion",
        {
            "role": role,
            "via": "manual",
            "ip": request.client.host if request.client else "unknown"
        },
        request
    )
    
    
    return {
        "message": "Recipient marked as completed",
        "completed": True,
        "document_finalized": False,
        "recipient_status": "completed"
    }
    
@router.post("/recipient/{recipient_id}/trigger-completed-emails")
async def trigger_completed_emails(
    recipient_id: str,
    background_tasks: BackgroundTasks,
    request: Request
):
    """
    Manually trigger sending completed document emails.
    This can be called when document status is already completed.
    """
    try:
        rid = ObjectId(recipient_id)
        recipient = db.recipients.find_one({"_id": rid})
        
        if not recipient:
            raise HTTPException(404, "Recipient not found")
        
        document = db.documents.find_one({"_id": recipient["document_id"]})
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Check if document is completed
        if document.get("status") != "completed":
            raise HTTPException(400, "Document is not completed yet")
        
        # Check if emails have already been sent
        if document.get("completed_email_sent"):
            return {
                "message": "Completed emails have already been sent",
                "already_sent": True,
                "sent_at": document.get("completed_email_sent_at")
            }
        
        from .email_service import send_completed_document_to_recipients, send_completed_document_package
        
        # Trigger both completion (Final Copy) for recipients and package ZIP for owner
        background_tasks.add_task(
            send_completed_document_to_recipients,
            document_id=str(document["_id"])
        )
        
        background_tasks.add_task(
            send_completed_document_package,
            document_id=str(document["_id"])
        )
        # Log the action
        _log_event(
            str(document["_id"]),
            recipient,
            "trigger_completed_emails",
            {"triggered_by": recipient.get("email")},
            request
        )
        
        return {
            "message": "Completed document emails scheduled for sending",
            "scheduled": True,
            "document_id": str(document["_id"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error triggering completed emails: {str(e)}")
        raise HTTPException(500, f"Error: {str(e)}")