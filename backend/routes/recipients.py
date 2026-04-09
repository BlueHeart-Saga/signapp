from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks, Query, Request
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator, Field, ValidationInfo
from enum import Enum
import hashlib
from typing import Optional
from bson.errors import InvalidId

from database import db
from .auth import get_current_user
from routes.fields import validate_field_role
from .email_service import send_bulk_invites, send_reminder_email
from .fields import serialize_field_with_recipient
from .documents import _log_event, load_document_pdf  # Import load_document_pdf
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/recipients", tags=["Recipients"])

# Note: GridFS is removed - we now use Azure Blob Storage

class RecipientRole(str, Enum):
    SIGNER = "signer"
    APPROVER = "approver"
    VIEWER = "viewer"
    FORM_FILLER = "form_filler"
    WITNESS = "witness"
    IN_PERSON_SIGNER = "in_person_signer"

class RecipientCreate(BaseModel):
    name: str
    email: EmailStr
    signing_order: int = 1
    role: RecipientRole = RecipientRole.SIGNER
    form_fields: Optional[List[str]] = Field(default_factory=list)
    witness_for: Optional[str] = None
    personal_message: Optional[str] = ""  # ← ADD THIS
    document_info: Optional[dict] = Field(default_factory=lambda: {  # ← ADD THIS
        "show_details": True,
        "custom_message": "",
        "view_instructions": "Please review the document carefully before signing"
    })

    @field_validator('name')
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @field_validator('signing_order')
    def signing_order_positive(cls, v):
        if v < 1:
            raise ValueError('Signing order must be at least 1')
        return v

    @field_validator('witness_for')
    def validate_witness_for(cls, v, info: ValidationInfo):
        if info.data.get('role') == RecipientRole.WITNESS and not v:
            raise ValueError('Witness must specify who they are witnessing')
        return v

    
class RecipientDetailsUpdate(BaseModel):
    personal_message: Optional[str] = ""
    document_info: Optional[dict] = {
        "show_details": True,
        "custom_message": "",
        "view_instructions": "Please review the document carefully before signing"
    }

class RecipientsBulkCreate(BaseModel):
    recipients: List[RecipientCreate]

class BulkRecipientTemplate(BaseModel):
    name_template: str = "Recipient {number}"
    email_domain: str = "example.com"
    count: int = Field(..., ge=1, le=1000)
    signing_order_start: int = 1
    role: RecipientRole = RecipientRole.SIGNER

class ReorderItem(BaseModel):
    recipient_id: str
    signing_order: int

class SendInvitesRequest(BaseModel):
    recipient_ids: List[str]
    common_message: Optional[str] = None
    personal_messages: Optional[dict] = {}  # {"recipient_id": "personal message"}
    expiry_days: Optional[int] = None  # None means use document setting
    reminder_period: Optional[int] = None  # None means use document setting
    signing_order_enabled: bool = False  # Add this flag
    
    
def generate_recipient_color(email: str) -> str:
    """
    Generate a strong, readable, consistent color per recipient.
    Suitable for borders, chips, placeholders.
    """
    hash_obj = hashlib.md5(email.encode())
    hash_int = int(hash_obj.hexdigest(), 16)

    hue = hash_int % 360

    # Stronger, professional values
    saturation = 65 + (hash_int % 15)   # 70–85%
    lightness = 45 + (hash_int % 10)    # 55–65%

    return f"hsl({hue}, {saturation}%, {lightness}%)"

def save_contact_if_missing(name: str, email: str, user_id: str):
    if not db.contacts.find_one({
        "email": email,
        "owner_id": ObjectId(user_id)
    }):
        db.contacts.insert_one({
            "name": name.strip(),
            "email": email,
            "favorite": False,
            "owner_id": ObjectId(user_id),
            "created_at": datetime.utcnow()
        })


@router.post("/{document_id}/add")
async def add_recipients(
    request: Request,  # Add this parameter
    document_id: str,
    recipients_data: RecipientsBulkCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add multiple recipients to a document"""
    try:
        # Validate document_id format first
        try:
            doc_oid = ObjectId(document_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        document = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get sender (owner) details from users collection
        sender = db.users.find_one({"_id": ObjectId(current_user["id"])})
        sender_info = {
            "name": sender.get("full_name", "") or sender.get("name", ""),
            "email": sender.get("email", ""),
            "organization": sender.get("organization_name", "")
        }
        
        added_recipients = []
        errors = []
        
        for recipient_data in recipients_data.recipients:
            try:
                # Check for duplicate email in this document
                existing_recipient = db.recipients.find_one({
                    "document_id": doc_oid,
                    "email": recipient_data.email
                })
                
                if existing_recipient:
                    errors.append(f"Recipient with email {recipient_data.email} already exists")
                    continue
                
                # 🔹 Auto-save to contacts
                save_contact_if_missing(
                    recipient_data.name,
                    recipient_data.email,
                    current_user["id"]
                )
                
                # Generate consistent color for recipient
                recipient_color = generate_recipient_color(recipient_data.email)
                
                # Create recipient document WITH SENDER INFO
                recipient = {
                    "document_id": doc_oid,
                    "name": recipient_data.name,
                    "email": recipient_data.email,
                    "signing_order": recipient_data.signing_order,
                    "role": recipient_data.role.value if hasattr(recipient_data.role, 'value') else recipient_data.role,
                    "color": recipient_color,
                    "personal_message": recipient_data.personal_message or "",
                    "document_info": recipient_data.document_info or {
                        "show_details": True,
                        "custom_message": "",
                        "view_instructions": "Please review the document carefully before signing"
                    },
                    # ✅ ADD SENDER INFORMATION
                    "sender_info": sender_info,
                    "status": "created",
                    "added_at": datetime.utcnow(),
                    "added_by": ObjectId(current_user["id"]),
                    "otp": None,
                    "otp_expires": None,
                    "otp_verified": False,
                    "sent_at": None,
                    "signed_at": None,
                    "approved_at": None,
                    "form_completed_at": None,
                    "witnessed_at": None,
                    "form_fields": [str(field) for field in recipient_data.form_fields] if recipient_data.form_fields else [],
                    "witness_for": ObjectId(recipient_data.witness_for) if recipient_data.witness_for else None,
                    "form_data": {}
                }
                
                result = db.recipients.insert_one(recipient)
                recipient["_id"] = result.inserted_id
                added_recipients.append(serialize_recipient(recipient))
                
            except Exception as e:
                errors.append(f"Error adding {recipient_data.email}: {str(e)}")
        
        # Update document recipient count
        if added_recipients:
            db.documents.update_one(
                {"_id": doc_oid},
                {"$inc": {"recipient_count": len(added_recipients)}}
            )
        
        # Log event
        _log_event(
            document_id,
            current_user,
            "recipients_added",
            {
                "count": len(added_recipients),
                "emails": [r["email"] for r in added_recipients],
                "roles": list(set(r["role"] for r in added_recipients))
            },
            request
        )
        
        response = {"recipients": added_recipients}
        if errors:
            response["errors"] = errors
            
        return response
        
    except HTTPException:
        raise
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid document ID format")
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error adding recipients: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error adding recipients: {str(e)}")

@router.put("/{document_id}/personal-messages/bulk")
async def update_personal_messages_bulk(
    request: Request,
    document_id: str,
    payload: dict,  # {"recipient_id": "personal_message", ...}
    current_user: dict = Depends(get_current_user)
):
    """
    Update personal messages for multiple recipients at once.
    """
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        updated_count = 0
        errors = []
        
        for recipient_id, personal_message in payload.items():
            try:
                # Verify recipient belongs to this document
                recipient = db.recipients.find_one({
                    "_id": ObjectId(recipient_id),
                    "document_id": ObjectId(document_id)
                })
                
                if not recipient:
                    errors.append(f"Recipient {recipient_id} not found")
                    continue
                
                # Update personal message
                db.recipients.update_one(
                    {"_id": ObjectId(recipient_id)},
                    {"$set": {"personal_message": str(personal_message).strip()}}
                )
                updated_count += 1
                
            except Exception as e:
                errors.append(f"Error updating recipient {recipient_id}: {str(e)}")
                
        _log_event(
            document_id,
            current_user,
            "personal_messages_bulk_updated",
            {
                "updated_count": updated_count,
                "error_count": len(errors) if errors else 0
            },
            request  # Need to add Request parameter
        )
        
        return {
            "message": f"Updated personal messages for {updated_count} recipients",
            "updated_count": updated_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{document_id}/messages/summary")
async def get_messages_summary(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get summary of all messages for a document.
    Returns common message + recipient personal messages.
    """
    try:
        # Get document
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get all recipients with their personal messages
        recipients = list(db.recipients.find(
            {"document_id": ObjectId(document_id)},
            {"name": 1, "email": 1, "personal_message": 1, "role": 1}
        ))
        
        # Format recipient messages
        recipient_messages = []
        for rec in recipients:
            recipient_messages.append({
                "id": str(rec["_id"]),
                "name": rec.get("name", ""),
                "email": rec.get("email", ""),
                "role": rec.get("role", ""),
                "personal_message": rec.get("personal_message", ""),
                "has_personal_message": bool(rec.get("personal_message"))
            })
        
        return {
            "common_message": document.get("common_message", ""),
            "recipient_messages": recipient_messages,
            "summary": {
                "total_recipients": len(recipient_messages),
                "with_personal_message": sum(1 for r in recipient_messages if r["has_personal_message"]),
                "without_personal_message": sum(1 for r in recipient_messages if not r["has_personal_message"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{recipient_id}/details")
async def update_recipient_details(
    request: Request,
    recipient_id: str,
    details: RecipientDetailsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update recipient personal message and document info"""
    try:
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Verify document ownership
        document = db.documents.find_one({
            "_id": recipient["document_id"],
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update recipient details
        update_data = {
            "personal_message": details.personal_message,
            "document_info": details.document_info
        }
        
        db.recipients.update_one(
            {"_id": ObjectId(recipient_id)},
            {"$set": update_data}
        )
        
        # Get updated recipient
        updated_recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        
        _log_event(
            str(document["_id"]),
            current_user,
            "recipient_details_updated",
            {
                "recipient_id": recipient_id,
                "updated_fields": ["personal_message", "document_info"]
            },
            request  # Need to add Request parameter
        )
        
        return {
            "message": "Recipient details updated successfully",
            "recipient": serialize_recipient(updated_recipient)
        }
        
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid recipient ID")


def serialize_recipient(recipient):
    """Serialize recipient for JSON response"""
    return {
        "id": str(recipient["_id"]),
        "name": recipient["name"],
        "email": recipient["email"],
        "signing_order": recipient.get("signing_order", 1),
        "role": recipient.get("role", RecipientRole.SIGNER),
        "color": recipient.get("color", generate_recipient_color(recipient["email"])),
        "personal_message": recipient.get("personal_message", ""),
        "document_info": recipient.get("document_info", {
            "show_details": True,
            "custom_message": "",
            "view_instructions": "Please review the document carefully before signing"
        }),
        # ✅ ADD SENDER INFO TO RESPONSE
        "sender_info": recipient.get("sender_info", {
            "name": "",
            "email": "",
            "organization": ""
        }),
        "status": recipient.get("status", "pending"),
        "added_at": recipient.get("added_at", datetime.utcnow()).isoformat(),
        "sent_at": recipient.get("sent_at").isoformat() if recipient.get("sent_at") else None,
        "signed_at": recipient.get("signed_at").isoformat() if recipient.get("signed_at") else None,
        "approved_at": recipient.get("approved_at").isoformat() if recipient.get("approved_at") else None,
        "form_completed_at": recipient.get("form_completed_at").isoformat() if recipient.get("form_completed_at") else None,
        "witnessed_at": recipient.get("witnessed_at").isoformat() if recipient.get("witnessed_at") else None,
        "otp_verified": recipient.get("otp_verified", False),
        "form_fields": recipient.get("form_fields", []),
        "witness_for": str(recipient["witness_for"]) if recipient.get("witness_for") else None,
        "form_data": recipient.get("form_data", {})
    }


@router.get("/roles/all")
async def get_recipient_roles():
    """Get all available recipient roles with descriptions"""
    roles = [
        {
            "value": RecipientRole.SIGNER,
            "label": "Signer",
            "description": "Must sign the document. Can add initials, signature, or stamp."
        },
        {
            "value": RecipientRole.APPROVER,
            "label": "Approver",
            "description": "Reads the document and clicks 'Approve'. Does not sign with a signature."
        },
        {
            "value": RecipientRole.VIEWER,
            "label": "Viewer",
            "description": "Can view and download the document. No action required."
        },
        {
            "value": RecipientRole.FORM_FILLER,
            "label": "Form Filler",
            "description": "Enter data into text fields, upload files, complete form. No signature required."
        },
        {
            "value": RecipientRole.WITNESS,
            "label": "Witness",
            "description": "Confirms signature of another party. Often signs after the primary signer."
        },
        {
            "value": RecipientRole.IN_PERSON_SIGNER,
            "label": "In-person Signer",
            "description": "Signer signs physically at a device presented by the sender."
        }
    ]
    return roles


@router.put("/{recipient_id}")
async def edit_recipient(
    request: Request,
    recipient_id: str,
    recipient_data: RecipientCreate,  # This includes personal_message and document_info
    current_user: dict = Depends(get_current_user)
):
    # -----------------------------
    # 1. Validate recipient ID
    # -----------------------------
    try:
        rid = ObjectId(recipient_id)
    except Exception:
        raise HTTPException(400, "Invalid recipient ID")

    recipient = db.recipients.find_one({"_id": rid})
    if not recipient:
        raise HTTPException(404, "Recipient not found")

    # -----------------------------
    # 2. Verify document ownership
    # -----------------------------
    document = db.documents.find_one({
        "_id": recipient["document_id"],
        "owner_id": ObjectId(current_user["id"])
    })

    if not document:
        raise HTTPException(403, "Access denied")

    # -----------------------------
    # 3. 🔒 Draft-only guard (IMPORTANT)
    # -----------------------------
    if document["status"] != "draft":
        raise HTTPException(
            status_code=400,
            detail="Recipients can only be edited while document is in draft status"
        )

    # -----------------------------
    # 4. Prevent edit if already completed
    # -----------------------------
    role = recipient.get("role")

    if (
        (role == "signer" and recipient.get("signed_at")) or
        (role == "approver" and recipient.get("approved_at")) or
        (role == "form_filler" and recipient.get("form_completed_at")) or
        (role == "witness" and recipient.get("witnessed_at"))
    ):
        raise HTTPException(
            status_code=400,
            detail="Cannot edit a recipient who has already completed their action"
        )

    # -----------------------------
    # 5. Prevent duplicate email
    # -----------------------------
    duplicate = db.recipients.find_one({
        "document_id": recipient["document_id"],
        "email": recipient_data.email,
        "_id": {"$ne": rid}
    })

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=f"Another recipient with email {recipient_data.email} already exists"
        )

    # -----------------------------
    # 6. Validate witness reference
    # -----------------------------
    witness_for = None
    if recipient_data.role == RecipientRole.WITNESS:
        if not recipient_data.witness_for:
            raise HTTPException(400, "Witness must specify signer to witness")

        try:
            witness_for = ObjectId(recipient_data.witness_for)
        except Exception:
            raise HTTPException(400, "Invalid witness target ID")

        signer = db.recipients.find_one({
            "_id": witness_for,
            "document_id": recipient["document_id"]
        })

        if not signer:
            raise HTTPException(400, "Witness target recipient not found")

    # -----------------------------
    # 7. Update recipient - INCLUDING NEW FIELDS
    # -----------------------------
    update_data = {
        "name": recipient_data.name.strip(),
        "email": recipient_data.email,
        "signing_order": recipient_data.signing_order,
        "role": recipient_data.role,
        "form_fields": recipient_data.form_fields,
        "witness_for": witness_for,
        # ADD THESE FIELDS:
        "personal_message": recipient_data.personal_message or "",
        "document_info": recipient_data.document_info or {
            "show_details": True,
            "custom_message": "",
            "view_instructions": "Please review the document carefully before signing"
        }
    }

    # Regenerate color if email changed
    if recipient["email"] != recipient_data.email:
        update_data["color"] = generate_recipient_color(recipient_data.email)

    db.recipients.update_one(
        {"_id": rid},
        {"$set": update_data}
    )

    updated = db.recipients.find_one({"_id": rid})
    
    
    _log_event(
        str(document["_id"]),
        current_user,
        "recipient_updated",
        {
            "recipient_id": recipient_id,
            "old_email": recipient["email"],
            "new_email": recipient_data.email,
            "role": recipient_data.role
        },
        request
    )

    return {
        "message": "Recipient updated successfully",
        "recipient": serialize_recipient(updated)
    }


@router.post("/{document_id}/add-bulk-template")
async def add_bulk_recipients_template(
    request: Request,
    document_id: str,
    template: BulkRecipientTemplate,
    current_user: dict = Depends(get_current_user)
):
    """Add multiple recipients using a template"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if document is draft
        if document["status"] != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only add recipients to draft documents"
            )
        
        added_recipients = []
        skipped_recipients = []
        
        
        for i in range(template.count):
            recipient_number = i + 1
            recipient_email = f"recipient{recipient_number}@{template.email_domain}"
            
            # Check for duplicate email
            existing_recipient = db.recipients.find_one({
                "document_id": ObjectId(document_id),
                "email": recipient_email
            })
            
            if existing_recipient:
                skipped_recipients.append(recipient_email)
                continue  # Skip duplicates
            
            # Generate color for recipient
            recipient_color = generate_recipient_color(recipient_email)
            
            recipient = {
                "document_id": ObjectId(document_id),
                "name": template.name_template.format(number=recipient_number),
                "email": recipient_email,
                "signing_order": template.signing_order_start + i,
                "role": template.role,
                "color": recipient_color,  # ADD COLOR HERE
                "personal_message": "",  # Add empty personal message
                "document_info": {
                    "show_details": True,
                    "custom_message": "",
                    "view_instructions": "Please review the document carefully before signing"
                },
                "status": "created",
                "added_at": datetime.utcnow(),
                "added_by": ObjectId(current_user["id"]),
                "otp": None,
                "otp_expires": None,
                "otp_verified": False,
                "sent_at": None,
                "signed_at": None,
                "approved_at": None,
                "form_completed_at": None,
                "witnessed_at": None,
                "form_fields": [],
                "witness_for": None,
                "form_data": {}
            }
            
            result = db.recipients.insert_one(recipient)
            recipient["_id"] = result.inserted_id
            added_recipients.append(serialize_recipient(recipient))
        
        # Update document recipient count
        if added_recipients:
            db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$inc": {"recipient_count": len(added_recipients)}}
            )
            
        _log_event(
            document_id,
            current_user,
            "recipients_bulk_template_added",
            {
                "count": len(added_recipients),
                "template": template.name_template,
                "domain": template.email_domain,
                "role": template.role,
                "skipped_count": len(skipped_recipients)
            },
            request  # Need to add Request parameter
        )
        
        return {"recipients": added_recipients}
    
        
    except:
        raise HTTPException(status_code=400, detail="Invalid document ID")


@router.get("/{document_id}")
async def get_document_recipients(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all recipients for a document"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        recipients = list(db.recipients.find({
            "document_id": ObjectId(document_id)
        }).sort("signing_order", 1))
        
        return [serialize_recipient(rec) for rec in recipients]
    except:
        raise HTTPException(status_code=400, detail="Invalid document ID")


@router.post("/{document_id}/send-invites")
async def send_invites_to_recipients(
    request: Request,  # This is for logging IP/user-agent
    document_id: str,
    invites_data: SendInvitesRequest,  # This contains your actual data
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send signing invites to multiple recipients with common + personal messages"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Block re-send if already sent
        if document.get("status") != "draft":
            raise HTTPException(
                status_code=400,
                detail="Document already sent"
            )

        # Get recipients - USE INVITES_DATA, NOT REQUEST
        recipients = list(db.recipients.find({
            "_id": {"$in": [ObjectId(rid) for rid in invites_data.recipient_ids]},
            "document_id": ObjectId(document_id)
        }))

        if not recipients:
            raise HTTPException(status_code=404, detail="No recipients found")

        # ✅ NEW: Validate that all required recipients have fields before sending
        # Recipients with roles other than 'viewer' or 'approver' MUST have fields
        ROLES_WITHOUT_FIELDS = [RecipientRole.VIEWER, RecipientRole.APPROVER]
        
        # Get all fields for this document to check assignment
        all_fields = list(db.signature_fields.find({"document_id": ObjectId(document_id)}))
        # Store assigned recipient IDs as strings for easy comparison
        assigned_recipient_ids = {str(f.get("recipient_id")) for f in all_fields if f.get("recipient_id")}
        
        for recipient in recipients:
            role = recipient.get("role", RecipientRole.SIGNER)
            if role not in ROLES_WITHOUT_FIELDS:
                if str(recipient["_id"]) not in assigned_recipient_ids:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Recipient {recipient['email']} ({role}) must have at least one field assigned before sending."
                    )

        # ✅ NEW: IF SEQUENTIAL, ONLY INVITE THE FIRST LEVEL
        if invites_data.signing_order_enabled:
            # Find the minimum signing order across all document recipients
            all_doc_recipients = list(db.recipients.find({"document_id": ObjectId(document_id)}))
            min_order = min(r.get("signing_order", 1) for r in all_doc_recipients)
            
            # Repopulate current recipients to only send email to those at the lowest order
            recipients = [r for r in all_doc_recipients if r.get("signing_order", 1) == min_order]
            
            # Log the sequential flow start
            _log_event(
                document_id,
                None,
                "signing_order_activated",
                {"first_order": min_order, "count": len(recipients)},
                request
            )
            
            # Mark all others as 'awaiting_previous'
            db.recipients.update_many(
                {
                    "document_id": ObjectId(document_id),
                    "signing_order": {"$gt": min_order}
                },
                {"$set": {"status": "awaiting_previous"}}
            )
        
        # Send invites in background - This will now only process the filtered list
        background_tasks.add_task(
            send_bulk_invites,
            document_id,
            recipients,
            invites_data.common_message or document.get("common_message", ""),
            invites_data.personal_messages,
            current_user["email"]
        )

        # Update document status and store settings
        expiry_days = invites_data.expiry_days if invites_data.expiry_days is not None else document.get("expiry_days", 0)
        reminder_period = invites_data.reminder_period if invites_data.reminder_period is not None else document.get("reminder_period", 0)
        
        expires_at = None
        if expiry_days and expiry_days > 0:
            expires_at = datetime.utcnow() + timedelta(days=expiry_days)
            
        next_reminder_at = None
        if reminder_period and reminder_period > 0:
            next_reminder_at = datetime.utcnow() + timedelta(days=reminder_period)

        update_fields = {
            "status": "sent",
            "sent_at": datetime.utcnow(),
            "common_message": invites_data.common_message or document.get("common_message", ""),
            "expiry_days": expiry_days,
            "reminder_period": reminder_period,
            "expires_at": expires_at,
            "next_reminder_at": next_reminder_at,
            "signing_order_enabled": invites_data.signing_order_enabled  # Save this
        }
        
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_fields}
        )
        
        # Update recipient statuses - ONLY FOR THOSE BEING INVITED NOW
        invite_ids = [r["_id"] for r in recipients]
        db.recipients.update_many(
            {
                "_id": {"$in": invite_ids}
            },
            {
                "$set": {
                    "status": "invited",
                    "sent_at": datetime.utcnow()
                }
            }
        )
        
        # Log event - use request for client info, but data from invites_data
        _log_event(
            document_id,
            current_user,
            "invites_sent",
            {
                "recipient_count": len(recipients),
                "recipient_ids": invites_data.recipient_ids,  # Fixed: use invites_data
                "common_message_preview": invites_data.common_message[:50] if invites_data.common_message else ""  # Fixed: use invites_data
            },
            request  # This is fine, request is used for IP/user-agent
        )

        return {
            "message": f"Invites are being sent to {len(recipients)} recipients",
            "status": "sent",
            "common_message": invites_data.common_message,  # Fixed: use invites_data
            "recipients_count": len(recipients)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending invites: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{recipient_id}/send-reminder")
async def send_reminder(
    request: Request,
    recipient_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    
):
    """Send reminder to a specific recipient"""
    try:
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Verify document ownership
        document = db.documents.find_one({
            "_id": recipient["document_id"],
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check action status based on role
        role = recipient.get("role", RecipientRole.SIGNER)
        if role == RecipientRole.SIGNER and recipient.get("status") == "signed":
            raise HTTPException(
                status_code=400,
                detail="Cannot send reminder to a signer who has already signed"
            )
        elif role == RecipientRole.APPROVER and recipient.get("approved_at"):
            raise HTTPException(
                status_code=400,
                detail="Cannot send reminder to an approver who has already approved"
            )
        elif role == RecipientRole.FORM_FILLER and recipient.get("form_completed_at"):
            raise HTTPException(
                status_code=400,
                detail="Cannot send reminder to a form filler who has already completed the form"
            )
        elif role == RecipientRole.WITNESS and recipient.get("witnessed_at"):
            raise HTTPException(
                status_code=400,
                detail="Cannot send reminder to a witness who has already witnessed"
            )
        
        # Send reminder in background
        background_tasks.add_task(
            send_reminder_email,
            recipient,
            document,
            current_user["email"]
        )
        
        _log_event(
            str(document["_id"]),
            current_user,
            "reminder_sent",
            {
                "recipient_id": recipient_id,
                "recipient_email": recipient["email"],
                "recipient_role": recipient["role"]
            },
            request
        )
        
        return {"message": "Reminder sent successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid recipient ID")


@router.get("/{recipient_id}")
async def get_recipient(
    recipient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get recipient details"""
    try:
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Verify document ownership
        document = db.documents.find_one({
            "_id": recipient["document_id"],
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return serialize_recipient(recipient)
    except:
        raise HTTPException(status_code=400, detail="Invalid recipient ID")


@router.delete("/{recipient_id}")
async def delete_recipient(
    request: Request,
    recipient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a recipient"""
    try:
        recipient = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Verify document ownership
        document = db.documents.find_one({
            "_id": recipient["document_id"],
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if action already completed based on role
        role = recipient.get("role", RecipientRole.SIGNER)
        if (role == RecipientRole.SIGNER and recipient.get("signed_at")) or \
           (role == RecipientRole.APPROVER and recipient.get("approved_at")) or \
           (role == RecipientRole.FORM_FILLER and recipient.get("form_completed_at")) or \
           (role == RecipientRole.WITNESS and recipient.get("witnessed_at")):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete a {role} who has already completed their action"
            )
        
        # Delete recipient
        db.recipients.delete_one({"_id": ObjectId(recipient_id)})
        
        # Update document recipient count
        db.documents.update_one(
            {"_id": recipient["document_id"]},
            {"$inc": {"recipient_count": -1}}
        )
        
        # Delete associated signature if exists (for signers)
        if role == RecipientRole.SIGNER:
            db.signatures.delete_one({"recipient_id": ObjectId(recipient_id)})
        
        # Remove any witness references to this recipient
        db.recipients.update_many(
            {"witness_for": ObjectId(recipient_id)},
            {"$set": {"witness_for": None}}
        )
        
        _log_event(
            str(document["_id"]),
            current_user,
            "recipient_deleted",
            {
                "recipient_id": recipient_id,
                "email": recipient["email"],
                "role": recipient["role"],
                "reason": "manual_deletion"
            },
            request
        )
        
        return {"message": "Recipient deleted successfully"}
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid recipient ID")
    
@router.post("/{document_id}/bulk-delete")
async def bulk_delete_recipients(
    request: Request,
    document_id: str,
    recipient_ids: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Delete multiple recipients at once"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if document is draft
        if document["status"] != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only delete recipients from draft documents"
            )
        
        deleted_count = 0
        errors = []
        
        for recipient_id in recipient_ids:
            try:
                recipient = db.recipients.find_one({
                    "_id": ObjectId(recipient_id),
                    "document_id": ObjectId(document_id)
                })
                
                if not recipient:
                    errors.append(f"Recipient {recipient_id} not found")
                    continue
                
                # Check if action already completed
                role = recipient.get("role")
                if (role == "signer" and recipient.get("signed_at")) or \
                   (role == "approver" and recipient.get("approved_at")) or \
                   (role == "form_filler" and recipient.get("form_completed_at")) or \
                   (role == "witness" and recipient.get("witnessed_at")):
                    errors.append(f"Cannot delete {role} {recipient['email']} who has already completed")
                    continue
                
                # Delete recipient
                db.recipients.delete_one({"_id": ObjectId(recipient_id)})
                deleted_count += 1
                
                # Delete associated signature if exists
                if role == "signer":
                    db.signatures.delete_one({"recipient_id": ObjectId(recipient_id)})
                
                # Remove witness references
                db.recipients.update_many(
                    {"witness_for": ObjectId(recipient_id)},
                    {"$set": {"witness_for": None}}
                )
                
            except Exception as e:
                errors.append(f"Error deleting recipient {recipient_id}: {str(e)}")
        
        # Update document recipient count
        if deleted_count > 0:
            db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$inc": {"recipient_count": -deleted_count}}
            )
            
        _log_event(
            document_id,
            current_user,
            "recipients_bulk_deleted",
            {
                "deleted_count": deleted_count,
                "recipient_ids": recipient_ids[:10],  # Log first 10
                "error_count": len(errors) if errors else 0
            },
            request
        )
        
        return {
            "message": f"Deleted {deleted_count} recipients",
            "deleted_count": deleted_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/{document_id}/reorder")
async def reorder_recipients(
    request: Request,
    document_id: str,
    new_order: List[ReorderItem],  # Use the model here
    current_user: dict = Depends(get_current_user)
):
    """Update signing order for multiple recipients"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if document is draft
        if document["status"] != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only reorder recipients in draft documents"
            )
        
        # Validate all recipients belong to this document
        recipient_ids = [ObjectId(item.recipient_id) for item in new_order]
        recipients_count = db.recipients.count_documents({
            "_id": {"$in": recipient_ids},
            "document_id": ObjectId(document_id)
        })
        
        if recipients_count != len(recipient_ids):
            raise HTTPException(
                status_code=400,
                detail="Some recipients don't belong to this document"
            )
        
        # Update signing orders
        for item in new_order:
            db.recipients.update_one(
                {
                    "_id": ObjectId(item.recipient_id),
                    "document_id": ObjectId(document_id)
                },
                {"$set": {"signing_order": item.signing_order}}
            )
            
        _log_event(
            document_id,
            current_user,
            "recipients_reordered",
            {
                "recipient_count": len(new_order),
                "new_order": [{"id": item.recipient_id, "order": item.signing_order} 
                            for item in new_order[:10]]  # Log first 10
            },
            request  # Need to add Request parameter
        )
        
        return {"message": "Recipient order updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/{document_id}/search")
async def search_recipients(
    document_id: str,
    query: str = Query("", description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Search and filter recipients"""
    try:
        # Verify document ownership
        document = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Build query
        search_query = {"document_id": ObjectId(document_id)}
        
        if query:
            search_query["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ]
        
        if role:
            search_query["role"] = role
        
        if status:
            search_query["status"] = status
        
        recipients = list(db.recipients.find(search_query).sort("signing_order", 1))
        
        return [serialize_recipient(rec) for rec in recipients]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/fields/{field_id}/complete")
async def complete_field(
    request: Request,
    field_id: str,
    value: dict,
    current_user: dict = Depends(get_current_user),
    
):
    # -----------------------------
    # 1. Load field
    # -----------------------------
    try:
        field_oid = ObjectId(field_id)
    except Exception:
        raise HTTPException(400, "Invalid field ID")

    field = db.signature_fields.find_one({"_id": field_oid})
    if not field:
        raise HTTPException(404, "Field not found")

    # -----------------------------
    # 2. Validate recipient
    # -----------------------------
    recipient = db.recipients.find_one({
        "_id": field["recipient_id"],
        "email": current_user["email"]
    })
    if not recipient:
        raise HTTPException(403, "Not your field")
    
    if not recipient.get("otp_verified"):
        raise HTTPException(403, "OTP verification required")
    
    if recipient["status"] in ["invited", "viewed"]:
        db.recipients.update_one(
            {"_id": recipient["_id"]},
            {"$set": {"status": "in_progress"}}
        )

    # ✅ Normalize role (ENUM → string)
    role = recipient["role"].value if hasattr(recipient["role"], "value") else recipient["role"]
    
    validate_field_role(role, field["type"])
    
    if role == "viewer":
        raise HTTPException(
            status_code=403,
            detail="Viewer cannot complete fields"
        )

    # -----------------------------
    # 3A. Witness dependency
    # -----------------------------
    if role == "witness":
        signer = db.recipients.find_one({
            "_id": recipient.get("witness_for"),
            "status": "completed"
        })
        if not signer:
            raise HTTPException(
                403,
                "Signer must complete before witness"
            )

    # -----------------------------
    # 4. Save field value
    # -----------------------------
    db.signature_fields.update_one(
        {"_id": field_oid},
        {
            "$set": {
                "value": value,
                "completed_at": datetime.utcnow()
            }
        }
    )

    doc_id = field["document_id"]
    
    
    # Get updated field with recipient info
    updated_field = db.signature_fields.find_one({"_id": field_oid})
    
    # Fetch recipient details to include in response
    recipient = db.recipients.find_one({"_id": recipient["_id"]})

    # -----------------------------
    # 5. sent → in_progress
    # -----------------------------
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})

    if doc and doc["status"] == "sent":
        db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "in_progress"}}
        )

    # -----------------------------
    # 6. Check remaining fields for THIS recipient
    # -----------------------------
    remaining_fields = db.signature_fields.count_documents({
        "document_id": doc_id,
        "recipient_id": recipient["_id"],
        "completed_at": {"$exists": False}
    })

    if remaining_fields > 0:
        return {
            "message": "Field saved. More fields pending.",
            "field": serialize_field_with_recipient(updated_field, recipient),
            "remaining_fields": remaining_fields
        }

    # -----------------------------
    # 7. Mark recipient completed
    # -----------------------------
    update = {"status": "completed"}

    if role in ("signer", "in_person_signer"):
        update["signed_at"] = datetime.utcnow()
    elif role == "approver":
        update["approved_at"] = datetime.utcnow()
    elif role == "form_filler":
        update["form_completed_at"] = datetime.utcnow()
    elif role == "witness":
        update["witnessed_at"] = datetime.utcnow()
    elif role == "viewer":
        update["viewer_at"] = datetime.utcnow()

    db.recipients.update_one(
        {"_id": recipient["_id"]},
        {"$set": update}
    )
    
    # -----------------------------
    # 7B. Recompute role counts
    # -----------------------------
    def count_role(r):
        return db.recipients.count_documents({
            "document_id": doc_id,
            "role": r,
            "status": "completed"
        })

    signer_count = count_role("signer") + count_role("in_person_signer")
    approver_count = count_role("approver")
    witness_count = count_role("witness")
    form_filler_count = count_role("form_filler")
    viewer_count = count_role("viewer")

    signed_count = (
        signer_count +
        approver_count +
        witness_count +
        form_filler_count +
        viewer_count
    )

    db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {
            "signer_count": signer_count,
            "approver_count": approver_count,
            "witness_count": witness_count,
            "form_filler_count": form_filler_count,
            "viewer_count": viewer_count,
            "signed_count": signed_count
        }}
    )

    # -----------------------------
    # 8. NOW check if document is complete
    # -----------------------------
    REQUIRED_ROLES = [
        "signer",
        "in_person_signer",
        "approver",
        "form_filler",
        "witness",
        "viewer"    # you chose KEEP viewer required
    ]

    remaining = db.recipients.count_documents({
        "document_id": doc_id,
        "role": {"$in": REQUIRED_ROLES},
        "status": {"$ne": "completed"}
    })
    
    if remaining > 0:
        return {
            "message": "Recipient completed. Other recipients still pending.",
            "field": serialize_field_with_recipient(updated_field, recipient),
            "recipient": serialize_recipient(recipient)
        }

    # -----------------------------------------
    # 8B. ALL REQUIRED RECIPIENTS COMPLETED
    # → AUTO FINALIZE DOCUMENT
    # -----------------------------------------
    from routes.pdf_engine import PDFEngine  # adjust import to your project

    # 1) fetch PDF using load_document_pdf from documents.py
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    
    # Use the unified load_document_pdf function
    pdf_bytes = load_document_pdf(doc, doc_id)

    # 2) collect all completed fields
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id),
        "completed_at": {"$exists": True}
    }))

    # 3) prepare signature objects for engine
    signatures = []
    texts = []

    for f in fields:
        if f["type"] == "signature":
            signatures.append({
                "page": f["page"],
                "x": f["x"],
                "y": f["y"],
                "width": f["width"],
                "height": f["height"],
                "image": f["value"].get("image")
            })
        else:
            texts.append(f)

    # 4) stamp signatures and fields
    final_pdf = PDFEngine.finalize_document(
        pdf_bytes,
        signatures=signatures,
        fields=[]
    )

    # 5) save final PDF to Azure
    signed_pdf_path = storage.upload(
        final_pdf,
        f"signed_{doc['filename']}",
        folder=f"documents/{doc_id}"
    )

    # 6) update document
    db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "signed_pdf_path": signed_pdf_path,
                "signed_count": db.recipients.count_documents({
                    "document_id": ObjectId(doc_id),
                    "status": "completed"
                })
            }
        }
    )
    
    _log_event(
        str(doc_id),
        recipient,
        "field_completed_via_recipients",
        {
            "field_id": field_id,
            "field_type": field["type"],
            "recipient_id": str(recipient["_id"])
        },
        request  # Need to add Request parameter
    )

    return {
        "message": "All recipients completed. Document finalized.",
        "status": "completed"
    }