from fastapi import APIRouter, UploadFile, File, Form,Depends, HTTPException, Query, BackgroundTasks, Body
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any

import io
import base64
from typing import List
from PIL import Image
import logging
from fastapi import Request
from jose import jwt, JWTError
from config import JWT_SECRET as SECRET_KEY, JWT_ALGORITHM as ALGORITHM
import fitz  # PyMuPDF
from datetime import timedelta
import random
import string
import uuid
import re
from .pdf_engine import PDFEngine 
from .fields import serialize_field_with_recipient
from .converter import convert_to_pdf, get_pdf_page_count
from database import db
from .auth import get_current_user
from .fields import normalize_field_value
from .email_service import send_completed_document_to_recipients, SafeSignCertificateEngine, SafeSignSummaryEngine
ProfessionalCertificateEngine = SafeSignCertificateEngine

from reportlab.lib import colors
from reportlab.platypus import PageBreak, KeepTogether
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
# from reportlab.pdfgen import canvas
# from reportlab.pdfbase import pdfmetrics
# from reportlab.pdfbase.ttfonts import TTFont
# from reportlab.graphics.shapes import Drawing, Line
# from reportlab.graphics.widgets import signs
from PIL import Image
import io
import fitz
import uuid
import re
from datetime import datetime

# Import storage provider
from storage import storage
from storage.base import StorageProvider

router = APIRouter(prefix="/documents", tags=["Documents"])


# fs = gridfs.GridFS(db)

# MongoDB Collections
templates_collection = db["document_templates"]


EVENT_TITLES = {
    "recipient_viewed": "Document Viewed",
    "otp_verified": "OTP Verified",
    "accept_terms": "Terms Accepted",
    "decline_terms": "Terms Declined",
    "field_completed": "Field Completed",
    "recipient_completed": "Recipient Completed Signing",
    "viewer_completed": "Viewer Completed Review",
    "document_downloaded": "Document Downloaded",
    "view_live_document": "Live Document Viewed",
    "recipient_signed_preview": "Signed Preview Viewed",
    "document_finalized": "Document Finalized",
    "document_voided": "Document Voided",
    "recipient_delegated": "Document Delegated"
}

EVENT_DESCRIPTIONS = {
    "otp_verified": "Recipient successfully verified OTP",
    "accept_terms": "Recipient accepted terms and conditions",
    "field_completed": "Recipient completed a field",
    "recipient_completed": "Recipient completed all assigned fields",
    "viewer_completed": "Viewer finished reviewing the document",
    "decline_terms": "Recipient declined terms",
}

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
    "radio",
    "attachment"
}

BOOLEAN_FIELDS = {
    "checkbox",
    "approval"
}

# Add attachment field type if needed
ATTACHMENT_FIELDS = {
    "attachment"
}

# -------------------------------
# DOCUMENT & RECIPIENT STATUSES
# -------------------------------

DOCUMENT_STATUSES = {
    "draft",
    "sent",
    "in_progress",
    "completed",
    "declined",
    "expired",
    "voided",
    "deleted",
}

TERMINAL_DOCUMENT_STATUSES = {
    "declined",
    "expired",
    "voided",
    "deleted",
}

RECIPIENT_STATUSES = {
    "created",
    "invited",
    "viewed",
    "in_progress",
    "completed",
    "declined",
    "expired",
}

class DeclinePayload(BaseModel):
    reason: Optional[str] = ""
    
class UploadDocumentPayload(BaseModel):
    envelope_id: Optional[str] = None
    auto_generate_envelope: Optional[bool] = True  # NEW
    envelope_prefix: Optional[str] = "ENV"  # NEW   
    
class CreateFromTemplateRequest(BaseModel):
    template_id: str
    title: str

class FileOrderItem(BaseModel):
    file_id: str
    order: int
    
    
    

# Professional Certificate Engine is now unified in email_service.py
# Alias kept for downward compatibility
# ProfessionalCertificateEngine = SafeSignCertificateEngine (set in imports)
      
# Add this near the top of your file, after the imports
def generate_envelope_id(prefix: str = None, user_id: str = None) -> str:
    """
    Generate a unique professional envelope ID.
    Format: {random12}-{date}-{random6}-{user_initials}
    Example: Eds56s8s565v-20260416-74DFDF-MA
    """
    # 1. 12 Characters Random Prefix
    random_prefix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
    
    # 2. Date String
    date_str = datetime.utcnow().strftime("%Y%m%d")
    
    # 3. 6 Characters Random Middle
    random_mid = uuid.uuid4().hex[:6].upper()
    
    # Get user initials if user_id provided
    initials = ""
    if user_id:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                full_name = user.get("full_name") or user.get("name") or user.get("email", "")
                # Extract initials from name
                if full_name:
                    name_parts = full_name.split()
                    if len(name_parts) >= 2:
                        initials = f"{name_parts[0][0]}{name_parts[-1][0]}".upper()
                    else:
                        initials = full_name[:2].upper()
        except:
            initials = "US"
    else:
        initials = "UK"  # Unknown
    
    # Clean initials (only letters)
    initials = re.sub(r'[^A-Z]', '', initials)
    if not initials:
        initials = "US"
    
    # 4. Final Construction
    envelope_id = f"{random_prefix}-{date_str}-{random_mid}-{initials}".upper()
    
    # Check if it already exists
    existing = db.documents.find_one({"envelope_id": envelope_id})
    if existing:
        # If exists, generate another one with different random string
        return generate_envelope_id(prefix, user_id)
    
    return envelope_id


def generate_short_envelope_id() -> str:
    """
    Generate a shorter envelope ID (for users who prefer simpler IDs).
    Format: ENV-{date}{sequence}
    Example: ENV-20240115001
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    
    # Find the highest sequence number for today
    pattern = f"^{re.escape(today)}"
    today_envelopes = list(db.documents.find(
        {"envelope_id": {"$regex": f"^ENV-{today}"}}
    ).sort("uploaded_at", -1).limit(1))
    
    if today_envelopes:
        # Extract sequence number from last envelope ID
        last_id = today_envelopes[0].get("envelope_id", "")
        match = re.search(rf"ENV-{today}(\d{{3}})", last_id)
        if match:
            sequence = int(match.group(1)) + 1
        else:
            sequence = 1
    else:
        sequence = 1
    
    # Format with leading zeros
    sequence_str = f"{sequence:03d}"
    
    return f"ENV-{today}{sequence_str}"

def validate_envelope_id(envelope_id: str, current_document_id: str = None) -> bool:
    """
    Validate that an envelope ID is unique.
    Returns True if valid, False if duplicate.
    """
    if not envelope_id:
        return True
    
    query = {"envelope_id": envelope_id}
    if current_document_id:
        query["_id"] = {"$ne": ObjectId(current_document_id)}
    
    existing = db.documents.find_one(query)
    return existing is None


async def auto_generate_missing_envelope_ids():
    """
    Background task to generate envelope IDs for existing documents.
    """
    try:
        # Find all documents without envelope ID
        docs_without_envelope = db.documents.find({
            "$or": [
                {"envelope_id": {"$exists": False}},
                {"envelope_id": None},
                {"envelope_id": ""}
            ],
            "status": {"$ne": "deleted"}
        })
        
        for doc in docs_without_envelope:
            try:
                # Get owner info
                owner_id = doc.get("owner_id")
                if not owner_id:
                    continue
                
                # Generate envelope ID
                new_envelope_id = generate_envelope_id(
                    prefix="ENV",
                    user_id=str(owner_id)
                )
                
                # Update document
                db.documents.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {
                        "envelope_id": new_envelope_id,
                        "envelope_auto_generated": True,
                        "envelope_generated_at": datetime.utcnow()
                    }}
                )
                
                print(f"Generated envelope ID {new_envelope_id} for document {doc.get('filename')}")
                
            except Exception as e:
                print(f"Error generating envelope ID for document {doc.get('filename')}: {e}")
                
    except Exception as e:
        print(f"Error in auto_generate_missing_envelope_ids: {e}")

async def get_user_from_request(request: Request):
    auth = request.headers.get("Authorization")
    token = None

    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]

    if not token:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = {
        "id": payload.get("id") or payload.get("_id"),
        "email": payload.get("email") or payload.get("sub"),
        "role": payload.get("role", "user")
    }

    if not user["id"] or not user["email"]:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return user


# -----------------------------
# SERIALIZER
# -----------------------------

def serialize_document(doc):
    doc_id = doc["_id"]

    # Existing counts code...
    total_recipients = db.recipients.count_documents({"document_id": doc_id})
    signed_recipients = db.recipients.count_documents({
        "document_id": doc_id,
        "status": "completed"
    })

    # Role counts...
    def role_count(role):
        return db.recipients.count_documents({
            "document_id": doc_id,
            "role": role,
            "status": "completed"
        })

    signer_count = role_count("signer")
    in_person_signer_count = role_count("in_person_signer")
    approver_count = role_count("approver")
    witness_count = role_count("witness")
    form_filler_count = role_count("form_filler")
    viewer_count = role_count("viewer")

    # Get storage URLs
    preview_url = None
    if doc.get("preview_thumbnail_path"):
        try:
            preview_url = storage.get_url(doc["preview_thumbnail_path"])
        except:
            preview_url = f"/documents/{doc_id}/preview"

    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename"),
        "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
        "deleted_at": doc.get("deleted_at").isoformat() if doc.get("deleted_at") else None,
        "voided_at": doc.get("voided_at").isoformat() if doc.get("voided_at") else None,
        "restored_at": doc.get("restored_at").isoformat() if doc.get("restored_at") else None,
        
        # Preview URL
        "preview_url": preview_url or f"/documents/{doc_id}/preview",
        "has_preview": doc.get("has_preview", False),
        "preview_thumbnail_path": doc.get("preview_thumbnail_path"),
        
        # Owner info
        "owner_id": str(doc.get("owner_id")) if doc.get("owner_id") else None,
        "owner_email": doc.get("owner_email"),
        
        # Page count
        "page_count": doc.get("page_count", 0),

        "size": doc.get("size"),
        "mime_type": doc.get("mime_type"),
        "status": doc.get("status"),
        
        "common_message": doc.get("common_message", ""), 

        # Recipient counts
        "recipient_count": doc.get("recipient_count", 0),
        "signed_count": doc.get("signed_count", 0),

        "source": doc.get("source", "local"),
        "is_converted": doc.get("is_converted", False),

        # Storage paths instead of file IDs
        "original_file_path": doc.get("original_file_path"),
        "pdf_file_path": doc.get("pdf_file_path"),
        "signed_pdf_path": doc.get("signed_pdf_path"),

        # Envelope ID fields
        "envelope_id": doc.get("envelope_id"),
        "envelope_auto_generated": doc.get("envelope_auto_generated", False),
        "envelope_regenerated_at": doc.get("envelope_regenerated_at").isoformat() if doc.get("envelope_regenerated_at") else None,
        "envelope_generated_at": doc.get("envelope_generated_at").isoformat() if doc.get("envelope_generated_at") else None,

        # Signing progress
        "total_recipients": total_recipients,
        "signed_recipients": signed_recipients,
        "signing_progress": {
            "signed": signed_recipients,
            "total": total_recipients,
            "percentage": (signed_recipients / total_recipients * 100) if total_recipients > 0 else 0
        },

        # Role counts
        "role_counts": {
            "signer": signer_count,
            "in_person_signer": in_person_signer_count,
            "approver": approver_count,
            "witness": witness_count,
            "form_filler": form_filler_count,
            "viewer": viewer_count
        },
        "progress": doc.get("progress", 100),
        "processing_status": doc.get("processing_status"),
        
        # Document Settings (Persistence)
        "expiry_days": doc.get("expiry_days"),
        "reminder_period": doc.get("reminder_period"),
        "signing_order_enabled": doc.get("signing_order_enabled"),
        "expires_at": doc.get("expires_at").isoformat() if doc.get("expires_at") else None
    }

@router.get("/{document_id}/status")
async def get_document_status(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get real-time processing status of a document.
    """
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(404, "Document not found")
        
    return {
        "id": document_id,
        "status": doc.get("status", "draft"),
        "progress": doc.get("progress", 0),
        "processing_status": doc.get("processing_status", "Processing..."),
        "page_count": doc.get("page_count", 0)
    }
    
def log_activity(document_id, user, action):
    try:
        db.document_activity.insert_one({
            "document_id": str(document_id),
            "user_id": str(user["id"]),
            "user_email": user["email"],
            "action": action, 
            "timestamp": datetime.utcnow(),
            "ip_address": None
        })
    except Exception as e:
        logging.error(f"Activity Log Failed: {str(e)}")

from .audit import log_audit_event

def _log_event(
    document_id: str,
    actor: dict | None,
    event_type: str,
    metadata: dict = None,
    request: Request = None
):
    event = {
        "document_id": ObjectId(document_id),
        "timestamp": datetime.utcnow(),
        "type": event_type,
        "title": event_type.replace("_", " ").title(), # serialize_timeline_event will enrich this
        "description": "",
        "metadata": metadata or {}
    }

    if actor:
        event["actor"] = {
            "id": str(actor.get("_id") or actor.get("id")),
            "email": actor.get("email"),
            "role": actor.get("role", "owner"),
            "name": actor.get("full_name") or actor.get("name")
        }

    if request:
        event["metadata"].update({
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        })

    # Log to document timeline (for UI)
    db.document_timeline.insert_one(event)
    
    # Log to centralized audit log (for long-term audit trail)
    audit_data = {
        "document_id": ObjectId(document_id),
        "action": event_type,
        "details": metadata or {},
        "performed_by": ObjectId(actor.get("_id") or actor.get("id")) if actor else None,
        "timestamp": event["timestamp"],
        "ip_address": event["metadata"].get("ip", "unknown"),
        "user_agent": event["metadata"].get("user_agent", "unknown")
    }
    try:
        log_audit_event(audit_data)
    except Exception as e:
        print(f"Warning: Failed to log audit event: {e}")

def generate_pdf_thumbnails(
    pdf_bytes: bytes,
    dpi: int = 120
) -> list[bytes]:
    """
    Returns list of PNG thumbnails (one per page)
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    thumbnails = []

    zoom = dpi / 72  # 72 = PDF base DPI
    matrix = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=matrix)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        thumbnails.append(buf.getvalue())

    doc.close()
    return thumbnails

def generate_file_thumbnail(pdf_bytes: bytes, page_number: int = 0) -> bytes:
    """
    Generate thumbnail for specific page (defaults to first page)
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    if page_number >= len(doc):
        page_number = 0

    page = doc[page_number]

    zoom = 150 / 72  # 150 DPI
    matrix = fitz.Matrix(zoom, zoom)

    pix = page.get_pixmap(matrix=matrix)

    img = Image.frombytes(
        "RGB",
        (pix.width, pix.height),
        pix.samples
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)

    doc.close()

    return buf.getvalue()

def generate_all_page_thumbnails(pdf_bytes: bytes) -> Dict[int, bytes]:
    """
    Generate thumbnails for all pages in a PDF.
    Returns dictionary of {page_number: thumbnail_bytes}
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    thumbnails = {}
    
    zoom = 150 / 72  # 150 DPI
    matrix = fitz.Matrix(zoom, zoom)
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=matrix)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        thumbnails[page_num + 1] = buf.getvalue()  # 1-based page numbers
    
    doc.close()
    return thumbnails

def merge_pdfs(pdf_bytes_list: list[bytes]) -> bytes:
    merged = fitz.open()

    for idx, pdf_bytes in enumerate(pdf_bytes_list):
        if not pdf_bytes or len(pdf_bytes) < 100:
            # Skip empty or invalid content
            continue

        try:
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                if doc.page_count == 0:
                    continue
                merged.insert_pdf(doc)
        except Exception as e:
            # ❗ DO NOT CRASH VIEW
            print(f"[merge_pdfs] Skipping invalid PDF at index {idx}: {e}")
            continue

    if merged.page_count == 0:
        raise HTTPException(500, "No valid PDF pages to display")

    return merged.tobytes()


def get_merged_pdf(document_id: str) -> bytes:
    files = list(
        db.document_files
        .find({"document_id": ObjectId(document_id)})
        .sort("order", 1)
    )

    pdfs = []

    for f in files:
        try:
            # Fix: Use storage.download instead of fs.get
            data = storage.download(f["file_path"])
            if data and len(data) > 100:
                pdfs.append(data)
        except Exception as e:
            print(f"[get_merged_pdf] Skipping file {f.get('filename')}: {e}")
            continue

    if not pdfs:
        raise HTTPException(500, "No valid PDF files found for document")

    return merge_pdfs(pdfs)



def merge_files(files: list[tuple[bytes, str]]) -> bytes | None:
    pdfs = []

    for content, filename in files:
        pdf = convert_to_pdf(content, filename)
        if not pdf:
            return None
        pdfs.append(pdf)

    return merge_pdfs(pdfs)


def load_document_pdf(doc: dict, document_id: str) -> bytes:
    """
    Load PDF from Azure Blob Storage.
    1) If document has multiple files → merge from document_files
    2) Else fallback to pdf_file_path
    """
    # 1️⃣ Multi-file support
    files = list(
        db.document_files
        .find({"document_id": ObjectId(document_id)})
        .sort("order", 1)
    )

    if files:
        try:
            pdfs = []
            for f in files:
                data = storage.download(f["file_path"])
                if data and len(data) > 100:
                    pdfs.append(data)
            
            if pdfs:
                return merge_pdfs(pdfs)
        except Exception as e:
            print(f"[load_document_pdf] merge failed: {e}")
            # fallback to single PDF

    # 2️⃣ Prefer ORIGINAL PDF when intended for field application
    # Using signed_pdf_path here was causing doubling in live document and previewers
    pdf_path = doc.get("pdf_file_path") or doc.get("signed_pdf_path")
    if not pdf_path:
        raise HTTPException(500, "Base PDF missing")

    try:
        return storage.download(pdf_path)
    except Exception as e:
        raise HTTPException(500, f"Cannot read base PDF: {str(e)}")

def calculate_file_page_ranges(files):
    """
    Input: ordered document_files
    Output: same files with start_page & end_page
    """
    current_page = 1
    result = []

    for f in files:
        start_page = current_page
        end_page = current_page + f["page_count"] - 1

        result.append({
            **f,
            "start_page": start_page,
            "end_page": end_page
        })

        current_page = end_page + 1

    return result



def append_file_to_document(existing_pdf_bytes: bytes, new_file_bytes: bytes, filename: str) -> bytes | None:
    new_pdf = convert_to_pdf(new_file_bytes, filename)
    if not new_pdf:
        return None

    return merge_pdfs([existing_pdf_bytes, new_pdf])

def generate_and_store_page_thumbnails(pdf_bytes: bytes, document_id: str, filename: str, user_id: str):
    """
    Generates all page thumbnails for a PDF and uploads them to storage.
    Returns a list of thumbnail reference objects.
    """
    try:
        page_thumbnails = generate_all_page_thumbnails(pdf_bytes)
        refs = []
        for page_num, thumb_bytes in page_thumbnails.items():
            path = storage.upload(
                thumb_bytes,
                f"{filename}_page_{page_num}_thumb.png",
                folder=f"users/{user_id}/thumbnails/{document_id}/pages"
            )
            refs.append({
                "page": page_num,
                "thumbnail_path": path,
                "is_preview": False
            })
        return refs
    except Exception as e:
        print(f"[generate_and_store_page_thumbnails] Error: {e}")
        return []

def update_document_summary_metadata(document_id: str):
    """
    Recalculates a document's total page count and its flattened list 
    of page thumbnails based on all the files it currently contains.
    """
    doc_id = ObjectId(document_id)
    all_files = list(db.document_files.find({"document_id": doc_id}).sort("order", 1))
    
    total_pages = 0
    all_global_thumbs = []
    
    first_file_path = None
    first_thumb_path = None
    
    for f in all_files:
        if not first_file_path:
            first_file_path = f.get("file_path")
            first_thumb_path = f.get("thumbnail_path")
            
        file_thumbs = f.get("page_thumbnails", [])
        for t in file_thumbs:
            all_global_thumbs.append({
                "page": total_pages + 1,
                "thumbnail_path": t["thumbnail_path"],
                "is_preview": False
            })
            total_pages += 1
        
        # fallback if file has no page_thumbnails yet but has a count
        # (This happens if we haven't yet finished generating thumbnails for a newly added file)
        if not file_thumbs and f["page_count"] > 0:
            total_pages += f["page_count"]
            
    # Update main doc record
    db.documents.update_one(
        {"_id": doc_id},
        {"$set": {
            "page_count": total_pages,
            "page_thumbnails": all_global_thumbs,
            "pdf_file_path": first_file_path,
            "preview_thumbnail_path": first_thumb_path
        }}
    )

def guard_document_active(doc):
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc["status"] in TERMINAL_DOCUMENT_STATUSES:
        raise HTTPException(
            400,
            f"Document is {doc['status']}. No further actions allowed."
        )

def apply_status_watermark(pdf_bytes: bytes, status: str) -> bytes:
    watermark_text = {
        "draft": "DRAFT",
        "expired": "EXPIRED",
        "declined": "DECLINED",
        "voided": "VOID"
    }.get(status)
    
    if watermark_text:
        return PDFEngine.apply_watermark(pdf_bytes, watermark_text)
    return pdf_bytes


def update_document_role_counts(doc_id):
    def count(role):
        return db.recipients.count_documents({
            "document_id": ObjectId(doc_id),
            "role": role,
            "status": "completed"
        })

    signer_count = count("signer")
    in_person_signer_count = count("in_person_signer")
    approver_count = count("approver")
    witness_count = count("witness")
    form_filler_count = count("form_filler")
    viewer_count = count("viewer")

    signed_count = (
        signer_count
        + in_person_signer_count
        + approver_count
        + witness_count
        + form_filler_count
        + viewer_count
    )

    db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {
            "signer_count": signer_count,
            "in_person_signer_count": in_person_signer_count,
            "approver_count": approver_count,
            "witness_count": witness_count,
            "form_filler_count": form_filler_count,
            "viewer_count": viewer_count,
            "signed_count": signed_count
        }}
    )

    return signed_count

def serialize_log(log):
    return {
        "id": str(log.get("_id")),
        "document_id": str(log.get("document_id")) if log.get("document_id") else None,
        "user_id": str(log.get("user_id")) if log.get("user_id") else None,
        "email": log.get("email"),
        "action": log.get("action"),
        "metadata": log.get("metadata", {}),
        "timestamp": log.get("timestamp")
    }



def convert_objectids(value):
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, list):
        return [convert_objectids(v) for v in value]

    if isinstance(value, dict):
        return {k: convert_objectids(v) for k, v in value.items()}

    return value


def serialize_recipient(r):
    r = convert_objectids(r)
    # add canonical id alias
    r["id"] = r.get("_id")
    return r


# Add this function to handle field type-specific rendering
def get_field_render_data(field: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare field data for PDF rendering based on field type.
    """
    field_type = field.get("type", "")
    value = field.get("display_value") or field.get("value")
    
    base_data = {
        "id": field.get("id", str(field.get("_id", ""))),
        "type": field_type,
        "page": field.get("page", 0),
        "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
        "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
        "width": field.get("pdf_width") or field.get("width", 100),
        "height": field.get("pdf_height") or field.get("height", 30),
        "label": field.get("label", ""),
        "placeholder": field.get("placeholder", ""),
        "font_size": field.get("font_size", 12),
        "value": value,
        "required": field.get("required", True),
        "is_completed": field.get("is_completed", False),
        # CRITICAL: Pass through the rendering flag
        "_render_completed": field.get("_render_completed", field.get("is_completed", False)),
        
        # 🔑 CRITICAL: Include explicit PDF coordinate keys to trigger PDFEngine Priority 1
        "pdf_x": field.get("pdf_x"),
        "pdf_y": field.get("pdf_y"),
        "pdf_width": field.get("pdf_width"),
        "pdf_height": field.get("pdf_height"),
        "canvas_width": field.get("canvas_width"),
        "canvas_height": field.get("canvas_height")
    }
    
    # Add type-specific data
    if field_type == "dropdown":
        base_data["options"] = field.get("dropdown_options", [])
    
    elif field_type == "checkbox":
        base_data["checked"] = bool(value)
        
    elif field_type == "radio":
        base_data["group_name"] = field.get("group_name", "")
        base_data["options"] = field.get("dropdown_options", [])
    
    elif field_type == "mail":
        base_data["email_validation"] = field.get("email_validation", True)
    
    return base_data

def serialize_timeline_event(log, document):
    action = log.get("action") or log.get("type", "Activity")
    metadata = log.get("metadata", {}) or {}

    # Human-readable titles & descriptions
    ACTION_MAP = {
        # ------------------------
        # DOCUMENT LEVEL ACTIONS
        # ------------------------
        "upload_document": (
            "Document Uploaded",
            f"Document '{metadata.get('filename', document.get('filename'))}' was uploaded"
        ),
        "create_document_from_template": (
            "Created From Template",
            f"Document created from template (ID: {metadata.get('template_id')})"
        ),
        "rename_document": (
            "Document Renamed",
            f"Renamed from '{metadata.get('old_filename')}' to '{metadata.get('new_filename')}'"
        ),
        "set_envelope_id": (
            "Envelope ID Set",
            f"Envelope ID assigned: {metadata.get('envelope_id')}"
        ),
        "update_common_message": (
            "Message Updated",
            "Common message was updated"
        ),

        # ------------------------
        # RECIPIENT & SENDING
        # ------------------------
        "recipients_added": (
            "Recipients Added",
            f"Added {metadata.get('count', 0)} recipient(s) to the document"
        ),
        "recipient_updated": (
            "Recipient Updated",
            f"Recipient {metadata.get('new_email')} details were updated"
        ),
        "recipient_deleted": (
            "Recipient Removed",
            f"Recipient {metadata.get('email')} was removed from the document"
        ),
        "invites_sent": (
            "Invitation Sent",
            f"Sent {metadata.get('recipient_count', 0)} invitation(s) for document signing"
        ),
        "reminder_sent": (
            "Reminder Sent",
            f"Reminder sent to {metadata.get('recipient_email', 'recipient')}"
        ),
        "otp_verified": (
            "OTP Verified",
            "Recipient's identity verified via OTP"
        ),
        "otp_resent": (
            "OTP Resent",
            "A new authentication code was sent to the recipient"
        ),
        "accept_terms": (
            "Terms Accepted",
            "Recipient accepted electronic record and signature disclosure"
        ),
        "reaccept_terms": (
            "Terms Re-accepted",
            "Recipient re-accepted terms after a previous decline"
        ),
        "decline_terms": (
            "Terms Declined",
            f"Recipient declined terms: {metadata.get('reason', 'No reason provided')}"
        ),

        # ------------------------
        # SIGNING & FIELDS
        # ------------------------
        "field_completed": (
            "Field Signed/Completed",
            f"{metadata.get('field_type', 'Field').title()} field completed"
        ),
        "field_edited": (
            "Field Edited",
            f"{metadata.get('field_type', 'Field').title()} field value updated"
        ),
        "view_live_document": (
            "Document Viewed",
            "Recipient opened the live signing document"
        ),
        "viewer_completed": (
            "Review Completed",
            "Viewer has finished reviewing the document"
        ),
        "document_finalized": (
            "Document Finalized",
            f"All parties have signed. Total signers: {metadata.get('signed_count', 0)}"
        ),

        # ------------------------
        # FILE (ZOHO-STYLE) ACTIONS
        # ------------------------
        "file_added": (
            "File Added",
            f"'{metadata.get('filename')}' was added to the document"
        ),
        "file_deleted": (
            "File Deleted",
            f"'{metadata.get('filename')}' was removed from the document"
        ),
        "file_replaced": (
            "File Replaced",
            f"'{metadata.get('filename')}' was replaced with a new version"
        ),
        "reorder_files": (
            "Files Reordered",
            "The order of documents was changed"
        ),

        # ------------------------
        # VIEW & DOWNLOAD
        # ------------------------
        "download_original": (
            "Original Downloaded",
            f"Downloaded file '{metadata.get('filename')}'"
        ),
        "view_document": (
            "Document Viewed",
            f"Viewed document ({metadata.get('preview_type', 'standard')} preview)"
        ),
        "view_signed_preview": (
            "Signed Preview Viewed",
            "Viewed signed document preview"
        ),
        "download_signed_or_current_pdf": (
            "PDF Downloaded",
            "Downloaded signed/current PDF"
        ),
        "download_signed": (
            "Signed Document Downloaded",
            f"Downloaded signed version: {metadata.get('filename', 'signed.pdf')}"
        ),
        "download_package": (
            "Document Package Downloaded",
            "Full document package (ZIP) was downloaded"
        ),

        # ------------------------
        # EXPORT & REPORTS
        # ------------------------
        "document_summary_generated": (
            "Summary Report Generated",
            f"Document summary generated in {metadata.get('format', 'JSON').upper()} format"
        ),
        "export_recipients_csv": (
            "Recipients Exported",
            "Recipients list exported to CSV"
        ),
        "export_timeline_csv": (
            "Timeline Exported",
            "Activity timeline exported to CSV"
        ),
        "export_fields_csv": (
            "Fields Exported",
            "Field data and status exported to CSV"
        ),
        "generate_html_report": (
            "HTML Report Generated",
            "Comprehensive HTML signing report was generated"
        ),

        # ------------------------
        # STATUS CHANGES
        # ------------------------
        "void_document": (
            "Document Voided",
            "Document was voided"
        ),
        "soft_delete": (
            "Moved to Trash",
            "The document was moved to the trash folder"
        ),
        "permanent_delete": (
            "Permanently Deleted",
            "The document and all its associated files were permanently deleted"
        ),
        "restore_document": (
            "Document Restored",
            "Document restored from trash"
        ),
        "recipient_declined": (
            "Recipient Declined",
            f"Decline reason: {metadata.get('reason', 'Not specified')}"
        ),
        "export_recipients_csv": (
            "Recipients Exported",
            f"Recipient list exported as CSV ({metadata.get('recipients_count', 0)} recipients)"
        ),
        "export_timeline_csv": (
            "Timeline Exported",
            f"Full activity history exported as CSV ({metadata.get('events_count', 0)} events)"
        ),
        "export_fields_csv": (
            "Fields Exported",
            f"Document field data exported as CSV ({metadata.get('fields_count', 0)} fields)"
        ),
        "generate_html_report": (
            "Audit Report Generated",
            "A professional audit trail report was generated in HTML format"
        ),
    }


    action = log.get("action") or log.get("type", "Activity")
    title, description = ACTION_MAP.get(
        action,
        ("Activity", action.replace("_", " ").title())
    )

    # Actor extraction
    actor = log.get("actor", {})
    user_name = actor.get("name") or actor.get("email")
    if not user_name:
        user_name = log.get("email") or metadata.get("email") or metadata.get("actor_name") or "System"

    return {
        "id": str(log["_id"]) if "_id" in log else str(uuid.uuid4()),
        "action": action,
        "title": title,
        "description": description,
        "user": user_name,
        "timestamp": log.get("timestamp"),
        "metadata": metadata,
        "document_status": document.get("status"),
        "envelope_id": document.get("envelope_id") or metadata.get("envelope_id"),
    }


def apply_completed_fields_only(pdf_bytes: bytes, completed_fields: list, image_field_types: set) -> bytes:
    """Apply ONLY completed fields to PDF."""
    if not completed_fields:
        return pdf_bytes
    
    signatures = []
    form_fields = []
    
    for field in completed_fields:
        field_type = field.get("type", "")
        field_value = field.get("display_value") or field.get("value")
        
        if field_type in image_field_types:
            # Handle image-based fields
            image_data = extract_image_data(field_value)
            if image_data:
                signatures.append({
                    "field_id": field["id"],
                    "image": image_data,
                    "page": field.get("page", 0),
                    "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
                    "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
                    "width": field.get("pdf_width") or field.get("width", 100),
                    "height": field.get("pdf_height") or field.get("height", 30),
                    "opacity": 1.0,
                    "is_completed": True,
                    "pdf_x": field.get("pdf_x"),
                    "pdf_y": field.get("pdf_y"),
                    "pdf_width": field.get("pdf_width"),
                    "pdf_height": field.get("pdf_height")
                })
        else:
            # Handle form fields
            printable_value = extract_printable_value(field_value)
            if printable_value not in [None, ""]:
                form_field = create_form_field_data(field, printable_value)
                form_fields.append(form_field)
    
    # Apply form fields first
    if form_fields:
        pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
    
    # Apply signatures
    if signatures:
        pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
            pdf_bytes,
            signatures,
            completed_fields  # Pass field data for coordinate context
        )
    
    return pdf_bytes

def apply_all_completed_fields(pdf_bytes: bytes, completed_fields: list, image_field_types: set) -> bytes:
    """Apply all completed fields with proper handling."""
    return apply_completed_fields_only(pdf_bytes, completed_fields, image_field_types)

def apply_field_placeholders_only(
    pdf_bytes: bytes, 
    fields: list, 
    use_recipient_colors: bool = True,
    show_values: bool = False
) -> bytes:
    """Apply field placeholders only (for incomplete fields)."""
    if not fields:
        return pdf_bytes
    
    # Mark all fields as placeholders
    for field in fields:
        field["show_placeholder"] = True
        field["is_placeholder"] = True
        field["_render_completed"] = False
    
    return PDFEngine.apply_field_placeholders(
        pdf_bytes, 
        fields,
        show_values=show_values,
        use_recipient_colors=use_recipient_colors
    )

def extract_image_data(field_value) -> Optional[str]:
    """Extract base64 image data from field value."""
    if not field_value:
        return None
    
    # Handle different value formats
    if isinstance(field_value, dict):
        # Format 1: {"image": "data:image/png;base64,..."}
        if "image" in field_value:
            return field_value["image"]
        # Format 2: {"data": "data:image/png;base64,...", "type": "image"}
        elif field_value.get("type") == "image" and "data" in field_value:
            return field_value["data"]
        # Format 3: Nested value structure: {"value": "data:image..."} or {"value": {"image": "..."}}
        elif "value" in field_value:
            val = field_value["value"]
            if isinstance(val, str) and val.startswith("data:image"):
                return val
            elif isinstance(val, dict):
                if "image" in val:
                    return val["image"]
                elif "data" in val and val.get("type") == "image":
                    return val["data"]
    elif isinstance(field_value, str) and field_value.startswith("data:image"):
        # Direct base64 string
        return field_value
    
    return None

def extract_printable_value(field_value):
    """Extract printable value from field value."""
    if isinstance(field_value, dict):
        # Check for nested value structure
        if "value" in field_value:
            nested = field_value["value"]
            if isinstance(nested, dict):
                return nested.get("value") or nested.get("text")
            else:
                return nested
        elif "text" in field_value:
            return field_value["text"]
        elif "selected" in field_value:
            return field_value["selected"]
    return field_value

def create_form_field_data(field: dict, printable_value) -> dict:
    """Create form field data for PDF rendering."""
    form_field = {
        "field_id": field["id"],
        "type": field.get("type", "textbox"),
        "value": printable_value,
        "page": field.get("page", 0),
        "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
        "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
        "width": field.get("pdf_width") or field.get("width", 100),
        "height": field.get("pdf_height") or field.get("height", 30),
        "font_size": field.get("font_size", 12),
        "label": field.get("label"),
        "placeholder": field.get("placeholder"),
        "color": "#000000",
        "opacity": 1.0,
        "is_completed": True,
        # 🔑 CRITICAL: Include explicit PDF coordinate keys to trigger PDFEngine Priority 1
        "pdf_x": field.get("pdf_x"),
        "pdf_y": field.get("pdf_y"),
        "pdf_width": field.get("pdf_width"),
        "pdf_height": field.get("pdf_height"),
        "canvas_width": field.get("canvas_width"),
        "canvas_height": field.get("canvas_height")
    }
    
    # Add type-specific properties
    field_type = field.get("type", "")
    if field_type == "checkbox":
        form_field["checked"] = bool(printable_value)
    elif field_type == "radio":
        form_field["checked"] = True
    elif field_type == "dropdown":
        form_field["options"] = field.get("dropdown_options", [])
    
    return form_field

def apply_status_watermark(pdf_bytes: bytes, status: str) -> bytes:
    """Apply status-based watermark."""
    watermark_text = {
        "draft": "DRAFT",
        "expired": "EXPIRED",
        "declined": "DECLINED",
        "voided": "VOIDED",
        "sent": "IN PROGRESS",
        "in_progress": "IN PROGRESS",
        "completed": "COMPLETED"
    }.get(status)
    
    if watermark_text:
        return PDFEngine.apply_watermark(pdf_bytes, watermark_text)
    return pdf_bytes


def process_fields_for_rendering(fields: list) -> tuple:
    """
    Process fields for PDF rendering and separate them by type.
    Returns (signatures, form_fields, all_fields)
    """
    signatures = []
    form_fields = []
    all_fields_data = []
    
    for field in fields:
        field_type = field.get("type", "")
        field_value = field.get("display_value") or field.get("value")
        
        # Get field render data for all fields
        render_data = get_field_render_data(field)
        
        # Add to all fields list
        all_fields_data.append(render_data)
        
        # Handle image-based fields (signatures)
        if field_type in IMAGE_FIELDS:
            image_data = extract_image_data(field_value)
            if image_data:
                signatures.append({
                    "field_id": field.get("id", str(field.get("_id", ""))),
                    "image": image_data,
                    "page": field.get("page", 0),
                    "x": field.get("x", field.get("pdf_x", 0)),
                    "y": field.get("y", field.get("pdf_y", 0)),
                    "width": field.get("width", field.get("pdf_width", 100)),
                    "height": field.get("height", field.get("pdf_height", 30)),
                    "opacity": 1.0,
                    "is_completed": True
                })
        
        # Handle form fields (text, checkbox, etc.)
        elif field_type in TEXT_FIELDS.union(BOOLEAN_FIELDS):
            printable_value = extract_printable_value(field_value)
            if printable_value not in [None, ""]:
                form_field = {
                    "field_id": field.get("id", str(field.get("_id", ""))),
                    "type": field_type,
                    "value": printable_value,
                    "page": field.get("page", 0),
                    "x": field.get("x", field.get("pdf_x", 0)),
                    "y": field.get("y", field.get("pdf_y", 0)),
                    "width": field.get("width", field.get("pdf_width", 100)),
                    "height": field.get("height", field.get("pdf_height", 30)),
                    "font_size": field.get("font_size", 12),
                    "is_completed": True
                }
                if field_type == "checkbox":
                    form_field["checked"] = bool(printable_value)
                elif field_type == "dropdown":
                    form_field["options"] = field.get("dropdown_options", [])
                
                form_fields.append(form_field)
    
    return signatures, form_fields, all_fields_data

# Add this function to your documents.py if it's not already there
def apply_completed_fields_to_pdf(pdf_bytes: bytes, document_id: str, document: dict = None) -> bytes:
    """
    Apply ALL completed fields (signatures AND form fields) to PDF.
    """
    from database import db
    from bson import ObjectId
    
    if not document:
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            return pdf_bytes
    
    # Get ALL completed fields for this document
    completed_fields_query = {
        "document_id": ObjectId(document_id),
        "completed_at": {"$exists": True}
    }
    completed_fields = list(db.signature_fields.find(completed_fields_query))
    
    if not completed_fields:
        return pdf_bytes
    
    print(f"Applying {len(completed_fields)} completed fields to PDF")
    
    # Separate signatures and form fields
    signatures = []
    form_fields = []
    
    IMAGE_FIELDS = {"signature", "initials", "witness_signature", "stamp"}
    TEXT_FIELDS = {"textbox", "date", "mail", "dropdown", "radio", "attachment"}
    BOOLEAN_FIELDS = {"checkbox", "approval"}
    
    for field in completed_fields:
        field_type = field.get("type")
        field_value = field.get("value")
        
        # 🔥 CRITICAL: Add completion flags for PDFEngine
        field["_render_completed"] = True
        field["is_completed"] = True
        
        if field_type in IMAGE_FIELDS:
            # Use normalize_field_value to extract image data consistently
            norm_val = normalize_field_value(field)
            image_data = None
            if isinstance(norm_val, dict):
                image_data = norm_val.get("data") or norm_val.get("image")
            
            if not image_data:
                # Fallback to direct extraction
                if isinstance(field_value, dict):
                    image_data = field_value.get("image") or field_value.get("data")
                elif isinstance(field_value, str) and field_value.startswith("data:image"):
                    image_data = field_value
            
            if image_data:
                signatures.append({
                    "field_id": str(field["_id"]),
                    "image": image_data,
                    "type": field_type,
                    "page": field.get("page", 0),
                    "x": field.get("pdf_x", field.get("x", 0)),
                    "y": field.get("pdf_y", field.get("y", 0)),
                    "width": field.get("pdf_width", field.get("width", 100)),
                    "height": field.get("pdf_height", field.get("height", 30)),
                    "canvas_x": field.get("canvas_x"),
                    "canvas_y": field.get("canvas_y"),
                    "canvas_width": field.get("canvas_width") or document.get("canvas_width"),
                    "canvas_height": field.get("canvas_height") or document.get("canvas_height"),
                    "pdf_x": field.get("pdf_x"),
                    "pdf_y": field.get("pdf_y"),
                    "pdf_width": field.get("pdf_width"),
                    "pdf_height": field.get("pdf_height"),
                    "is_completed": True,
                    "_render_completed": True
                })
                print(f"  - Added signature field: {field_type}")
            else:
                print(f"  - WARNING: No image data for {field_type} field {field.get('_id')}")
                
        elif field_type in TEXT_FIELDS:
            # 🔥 USE CENTRALIZED NORMALIZATION
            actual_value = normalize_field_value(field)
            
            # If normalized value is a dict (e.g. for initials as text), extract text
            if isinstance(actual_value, dict):
                actual_value = (actual_value.get("text") or 
                               actual_value.get("value") or 
                               actual_value.get("filename") or
                               str(actual_value))
            
            # 🔥 CRITICAL: For date fields, ensure we have the date string if normalizer failed
            if field_type == "date" and not actual_value:
                if field.get("completed_at"):
                    actual_value = field["completed_at"].strftime("%Y-%m-%d")
            
            # Even if value is empty, we must add it as a completed field so PDFEngine 
            # renders it (potentially as blank or with its placeholder if needed)
            form_fields.append({
                "field_id": str(field["_id"]),
                "type": field_type,
                "value": actual_value or "",
                "page": field.get("page", 0),
                "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
                "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
                "width": field.get("pdf_width") if field.get("pdf_width") is not None else field.get("width", 100),
                "height": field.get("pdf_height") if field.get("pdf_height") is not None else field.get("height", 30),
                "canvas_x": field.get("canvas_x"),
                "canvas_y": field.get("canvas_y"),
                "canvas_width": field.get("canvas_width") or document.get("canvas_width") or 794.0,
                "canvas_height": field.get("canvas_height") or document.get("canvas_height") or 1123.0,
                "pdf_x": field.get("pdf_x"),
                "pdf_y": field.get("pdf_y"),
                "pdf_width": field.get("pdf_width"),
                "pdf_height": field.get("pdf_height"),
                "font_size": field.get("font_size", 12),
                "is_completed": True,
                "_render_completed": True
            })
            print(f"  - Added text/attachment field: {field_type} = '{actual_value}'")
                
        elif field_type in BOOLEAN_FIELDS:
            # Handle boolean fields
            boolean_value = False
            if isinstance(field_value, dict):
                boolean_value = (field_value.get("value") or 
                                field_value.get("checked") or 
                                field_value.get("approved") or 
                                False)
            elif isinstance(field_value, bool):
                boolean_value = field_value
            elif isinstance(field_value, str):
                boolean_value = field_value.lower() in ["true", "yes", "1", "checked", "approved"]
            
            form_fields.append({
                "field_id": str(field["_id"]),
                "type": field_type,
                "value": boolean_value,
                "page": field.get("page", 0),
                "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
                "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
                "width": field.get("pdf_width") if field.get("pdf_width") is not None else field.get("width", 100),
                "height": field.get("pdf_height") if field.get("pdf_height") is not None else field.get("height", 30),
                "canvas_x": field.get("canvas_x"),
                "canvas_y": field.get("canvas_y"),
                "canvas_width": field.get("canvas_width") or document.get("canvas_width") or 794.0,
                "canvas_height": field.get("canvas_height") or document.get("canvas_height") or 1123.0,
                "pdf_x": field.get("pdf_x"),
                "pdf_y": field.get("pdf_y"),
                "pdf_width": field.get("pdf_width"),
                "pdf_height": field.get("pdf_height"),
                "is_completed": True,
                "_render_completed": True
            })
            print(f"  - Added boolean field: {field_type} = {boolean_value}")
    
    print(f"Applying {len(form_fields)} form fields and {len(signatures)} signatures")
    
    # Apply form fields first (text appears under signatures)
    if form_fields:
        pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
    
    # Apply signatures on top
    if signatures:
        pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
            pdf_bytes,
            signatures,
            completed_fields
        )
    
    return pdf_bytes


# Add this near the top with other helper functions
async def get_active_subscription(email: str) -> Optional[Dict]:
    """
    Get active subscription for a user.
    Returns None if no active subscription.
    """
    try:
        # First try to find user by email
        user = db.users.find_one({"email": email})
        if not user:
            return None
        
        # Find active subscription
        subscription = db.subscriptions.find_one({
            "user_id": user["_id"],
            "status": "active",
            "expiry_date": {"$gte": datetime.utcnow()}
        })
        
        return subscription
    except Exception as e:
        print(f"Error getting subscription: {e}")
        return None

# Add PLAN_CONFIG if it's used
PLAN_CONFIG = {
    "free": {"name": "Free Plan", "price": 0},
    "basic": {"name": "Basic Plan", "price": 9.99},
    "pro": {"name": "Professional Plan", "price": 29.99},
    "enterprise": {"name": "Enterprise Plan", "price": 99.99},
    "free_trial": {"name": "Free Trial", "price": 0}
}



# -----------------------------
# UPLOAD DOCUMENT
# -----------------------------

async def process_document_upload_task(
    document_id: str,
    content: bytes,
    filename: str,
    user_id: str,
    email: str,
    ext: str,
    auto_generate_envelope: bool,
    envelope_id_value: str,
    request: Request = None
):
    """
    Background task to process document upload: 
    Conversion, storage, thumbnails, and final status update.
    """
    try:
        doc_oid = ObjectId(document_id)
        
        # 1. Start processing (already at 20% from initial read)
        
        # 2. Convert to PDF (Progress: 40%)
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 30, "processing_status": "Converting to PDF..."}}
        )
        
        converted_pdf_bytes = convert_to_pdf(content, filename)

        if not converted_pdf_bytes:
            db.documents.update_one(
                {"_id": doc_oid},
                {"$set": {"status": "error", "processing_status": "PDF conversion failed", "progress": 0}}
            )
            return

        page_count = get_pdf_page_count(converted_pdf_bytes)
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"page_count": page_count, "progress": 45, "processing_status": "Saving to storage..."}}
        )

        # 3. Upload Files (Progress: 60%)
        # Upload original file
        original_file_path = storage.upload(
            content, 
            filename,
            folder=f"users/{user_id}/originals"
        )

        # Upload converted PDF
        pdf_filename = filename.rsplit(".", 1)[0] + ".pdf"
        pdf_file_path = storage.upload(
            converted_pdf_bytes,
            pdf_filename,
            folder=f"users/{user_id}/pdfs"
        )

        # Generate PREVIEW thumbnail (first page as preview)
        preview_thumb_bytes = generate_file_thumbnail(converted_pdf_bytes, 0)

        # Upload preview thumbnail
        preview_thumb_path = storage.upload(
            preview_thumb_bytes,
            f"{filename}_preview.png",
            folder=f"users/{user_id}/thumbnails/previews"
        )
        
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 70, "processing_status": "Generating page thumbnails..."}}
        )

        # Generate page thumbnails for navigation
        page_thumbnail_refs = []
        all_page_thumbnails = generate_all_page_thumbnails(converted_pdf_bytes)
            
        for page_num, thumb_bytes in all_page_thumbnails.items():
            page_thumb_path = storage.upload(
                thumb_bytes,
                f"{filename}_page_{page_num}_thumb.png",
                folder=f"users/{user_id}/thumbnails/pages"
            )
            page_thumbnail_refs.append({
                "page": page_num,
                "thumbnail_path": page_thumb_path,
                "is_preview": False
            })
            
            # Incremental progress for many pages
            if page_count > 0:
                current_progress = 70 + int((page_num + 1) / page_count * 25)
                db.documents.update_one(
                    {"_id": doc_oid},
                    {"$set": {"progress": min(current_progress, 95)}}
                )

        # FINAL UPDATE (Progress: 100%)
        final_updates = {
            "pdf_file_path": pdf_file_path,
            "original_file_path": original_file_path,
            "preview_thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumbnail_refs,
            "status": "draft",
            "progress": 100,
            "processing_status": "Complete"
        }
        
        db.documents.update_one({"_id": doc_oid}, {"$set": final_updates})
        
        # Also insert entry into document_files for consistency
        db.document_files.insert_one({
            "document_id": doc_oid,
            "file_path": pdf_file_path,
            "thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumbnail_refs,
            "filename": filename,
            "page_count": page_count,
            "order": 1,
            "uploaded_at": datetime.utcnow(),
            "source": "original"
        })

        # Log event
        log_metadata = {
            "filename": filename,
            "envelope_auto_generated": auto_generate_envelope,
            "envelope_id": envelope_id_value
        }
        
        # Create a mock actor dict for _log_event
        actor = {"id": user_id, "email": email, "role": "owner"}
        _log_event(document_id, actor, "upload_document", log_metadata, request)
        
    except Exception as e:
        print(f"CRITICAL ERROR in document processing task: {e}")
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "error", "processing_status": f"System error: {str(e)}", "progress": 0}}
        )

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    payload: UploadDocumentPayload = None,
    envelope_id: Optional[str] = Form(None),
    auto_generate_envelope: bool = Form(True),
    envelope_prefix: str = Form("ENV"),
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    # Restriction: Only allow upload if user has an active plan (Admins bypass)
    if current_user.get("role") != "admin":
        # We fetch the latest user data from DB to ensure subscription status is current
        user_data = db.users.find_one({"_id": ObjectId(current_user["id"])})
        if not user_data or not user_data.get("has_active_subscription", False):
            raise HTTPException(
                status_code=403,
                detail="Active subscription required to upload documents. Please upgrade your plan."
            )

    # Validate file type
    ext = file.filename.split(".")[-1].lower()
    allowed = [
        "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
        "png", "jpg", "jpeg", "bmp", "webp", "tiff", "tif",
        "txt", "md", "csv", "json", "log", "html", "htm"
    ]
    
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload PDF, Office documents, or images."
        )

    # Get envelope_id from either JSON payload or form data
    envelope_id_value = None
    if payload and payload.envelope_id:
        envelope_id_value = payload.envelope_id
    elif envelope_id:
        envelope_id_value = envelope_id
    elif auto_generate_envelope:
        envelope_id_value = generate_envelope_id(
            prefix=envelope_prefix,
            user_id=current_user["id"]
        )

    # Check if envelope_id already exists (if provided)
    if envelope_id_value:
        existing_doc = db.documents.find_one({"envelope_id": envelope_id_value})
        if existing_doc:
            raise HTTPException(
                status_code=400,
                detail=f"Document with envelope ID '{envelope_id_value}' already exists"
            )

    # Default expiry and reminder from user settings
    reminder_days = current_user.get("reminder_days", 3)
    expiry_days = current_user.get("expiry_days", 30)

    # 1. Create Initial Document Record (Progress: 10%)
    doc_data = {
        "filename": file.filename,
        "uploaded_at": datetime.utcnow(),
        "owner_id": ObjectId(current_user["id"]),
        "owner_email": current_user.get("email"),
        "mime_type": file.content_type,
        "size": 0, 
        "page_count": 0,
        "status": "processing",
        "progress": 10,
        "processing_status": "Upload received, starting processing...",
        "common_message": "Please review and sign this document at your earliest convenience.",
        "expires_at": datetime.utcnow() + timedelta(days=expiry_days),
        "expiry_days": expiry_days,
        "reminder_period": reminder_days,
        "source": "local",
        "envelope_id": envelope_id_value
    }
    
    result = db.documents.insert_one(doc_data)
    document_id = str(result.inserted_id)

    # 2. Read content synchronously (Progress: 20%)
    content = await file.read()
    db.documents.update_one(
        {"_id": result.inserted_id},
        {"$set": {"size": len(content), "progress": 20}}
    )

    # 3. Schedule background processing
    background_tasks.add_task(
        process_document_upload_task,
        document_id=document_id,
        content=content,
        filename=file.filename,
        user_id=str(current_user["id"]),
        email=current_user.get("email"),
        ext=ext,
        auto_generate_envelope=auto_generate_envelope,
        envelope_id_value=envelope_id_value,
        request=request
    )

    # Return immediately with document metadata
    return {
        "message": "Document upload initiated", 
        "document": serialize_document(doc_data), # note: doc_data has _id but not as string yet? serialize_document handles it
        "document_id": document_id,
        "status": "processing",
        "progress": 20
    }


async def process_add_file_task(
    document_id: str,
    content: bytes,
    filename: str,
    user_id: str,
    email: str,
    request: Request = None
):
    """
    Background task to process adding/merging a file into a document.
    """
    try:
        doc_oid = ObjectId(document_id)
        
        # 1. Convert to PDF (Progress: 50%)
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 40, "processing_status": "Converting to PDF..."}}
        )
        
        pdf_bytes = convert_to_pdf(content, filename)

        if not pdf_bytes:
            db.documents.update_one(
                {"_id": doc_oid},
                {"$set": {"progress": 0, "status": "error", "processing_status": "Conversion failed"}}
            )
            return

        page_count = get_pdf_page_count(pdf_bytes)
        
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 60, "processing_status": "Uploading to storage..."}}
        )

        # 2. Upload to storage
        pdf_file_path = storage.upload(
            pdf_bytes,
            filename,
            folder=f"users/{user_id}/documents/{document_id}/files"
        )

        # 3. Handle document_files entry
        last = db.document_files.find_one(
            {"document_id": doc_oid},
            sort=[("order", -1)]
        )
        next_order = (last["order"] + 1) if last else 1
        
        # Generate thumbnails
        preview_thumb_bytes = generate_file_thumbnail(pdf_bytes, 0)
        preview_thumb_path = storage.upload(
            preview_thumb_bytes,
            f"{filename}_preview.png",
            folder=f"users/{user_id}/thumbnails/{document_id}"
        )

        page_thumbnails = generate_and_store_page_thumbnails(
            pdf_bytes, str(document_id), filename, user_id
        )

        db.document_files.insert_one({
            "document_id": doc_oid,
            "file_path": pdf_file_path,
            "thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumbnails,
            "filename": filename,
            "page_count": page_count,
            "order": next_order,
            "uploaded_at": datetime.utcnow(),
            "source": "added",
            "has_preview": True
        })

        # 4. Final Updates
        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 90, "processing_status": "Updating document metadata..."}}
        )
        
        update_document_summary_metadata(document_id)

        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {"progress": 100, "processing_status": "Complete"}}
        )

        _log_event(
            document_id,
            {"id": user_id, "email": email, "role": "owner"},
            "file_added",
            {
                "filename": filename,
                "pages": page_count,
                "file_path": pdf_file_path
            },
            request
        )

    except Exception as e:
        print(f"ERROR in add_file task: {e}")
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "error", "processing_status": f"System error: {str(e)}", "progress": 0}}
        )

@router.post("/{document_id}/add-file")
async def add_file_to_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if not doc:
        raise HTTPException(404, "Document not found")

    if doc["status"] != "draft":
        raise HTTPException(400, "Cannot add files after sending")

    # Start progress
    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"status": "processing", "progress": 10, "processing_status": "Receiving file..."}}
    )

    content = await file.read()
    
    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"progress": 25, "processing_status": "Processing initiated..."}}
    )
    
    background_tasks.add_task(
        process_add_file_task,
        document_id=document_id,
        content=content,
        filename=file.filename,
        user_id=str(current_user["id"]),
        email=current_user.get("email"),
        request=request
    )

    return {"message": "File addition initiated", "status": "processing", "progress": 25}


@router.get("/{document_id}/files")
async def list_files(document_id: str, current_user: dict = Depends(get_current_user)):
    files = list(
        db.document_files
        .find({"document_id": ObjectId(document_id)})
        .sort("order", 1)
    )

    current_page = 1
    response = []

    for f in files:
        start_page = current_page
        end_page = current_page + f["page_count"] - 1

        response.append({
            "id": str(f["_id"]),
            "filename": f["filename"],
            "pages": f["page_count"],
            "order": f["order"],
            "source": f.get("source", "added"),

            # NEW (Zoho-style)
            "start_page": start_page,
            "end_page": end_page,
            "page_range": (
                f"Page {start_page}"
                if start_page == end_page
                else f"Pages {start_page}–{end_page}"
            ),
            "thumbnail_url": f"/documents/{document_id}/files/{f['_id']}/thumbnail"
        })

        current_page = end_page + 1

    return response



@router.get("/{document_id}/files/{file_id}/thumbnails")
async def get_file_thumbnails(
    document_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    file = db.document_files.find_one({
        "_id": ObjectId(file_id),
        "document_id": ObjectId(document_id)
    })
    if not file:
        raise HTTPException(404, "File not found")

    # Calculate combined start_page
    files = list(
        db.document_files
        .find({"document_id": ObjectId(document_id)})
        .sort("order", 1)
    )

    current_page = 1
    start_page = 1
    for f in files:
        if f["_id"] == file["_id"]:
            start_page = current_page
            break
        current_page += f["page_count"]

    # Get PDF from Azure Storage
    pdf_bytes = storage.download(file["file_path"])
    thumbs = generate_pdf_thumbnails(pdf_bytes)

    return {
        "file_id": file_id,
        "filename": file["filename"],
        "start_page": start_page,
        "end_page": start_page + file["page_count"] - 1,
        "pages": [
            {
                "page_number": start_page + idx,
                "thumbnail": base64.b64encode(img).decode("utf-8")
            }
            for idx, img in enumerate(thumbs)
        ]
    }

@router.get("/{document_id}/files/{file_id}/thumbnail")
async def view_file_preview(
    document_id: str,
    file_id: str,
    request: Request,
    width: int = Query(400, ge=100, le=1200),
    height: int = Query(300, ge=100, le=800)
):
    """
    Get PREVIEW image for a file (first page as preview).
    """
    # 🔐 Token from query (img-safe)
    token = request.query_params.get("token")
    if not token:
        raise HTTPException(401, "Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id") or payload.get("_id")
    except JWTError:
        raise HTTPException(401, "Invalid token")

    file = db.document_files.find_one({
        "_id": ObjectId(file_id),
        "document_id": ObjectId(document_id)
    })

    if not file:
        raise HTTPException(404, "File not found")

    # ============================================
    # Get thumbnail from Azure Blob Storage
    # ============================================
    if file.get("thumbnail_path"):
        try:
            img_bytes = storage.download(file["thumbnail_path"])
        except Exception as e:
            print(f"Error loading thumbnail: {e}")
            # Generate from first page as fallback
            pdf_bytes = storage.download(file["file_path"])
            img_bytes = generate_file_thumbnail(pdf_bytes, 0)
    else:
        # Generate from first page
        pdf_bytes = storage.download(file["file_path"])
        img_bytes = generate_file_thumbnail(pdf_bytes, 0)
    
    # Resize if needed
    if width != 400 or height != 300:
        img = Image.open(io.BytesIO(img_bytes))
        img.thumbnail((width, height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        img_bytes = buffer.getvalue()

    return StreamingResponse(
        io.BytesIO(img_bytes),
        media_type="image/png",
        headers={
            "Cache-Control": "private, max-age=86400",
            "Content-Disposition": f'inline; filename="{file.get("filename", "file")}_preview.png"'
        }
    )

@router.get("/{document_id}/pages/{page_number}/thumbnail")
async def get_page_thumbnail(
    document_id: str,
    page_number: int,
    request: Request,
    width: int = Query(200, ge=50, le=1000),
    height: int = Query(300, ge=50, le=1000),
    token: Optional[str] = Query(None)
):
    """
    Get thumbnail for a specific page.
    Works for both owners and recipients (with token).
    """
    try:
        doc_id = ObjectId(document_id)
    except:
        raise HTTPException(400, "Invalid document ID")
    
    # Use standard helper to get user from token (query or header)
    user = await get_user_from_request(request)
    
    # Verify owner or recipient access
    doc = db.documents.find_one({
        "_id": doc_id,
        "owner_id": ObjectId(user["id"])
    })
    
    if not doc:
        # Check if it's a recipient access
        recipient = db.recipients.find_one({
            "document_id": doc_id,
            "email": user["email"]
        })
        if not recipient:
            raise HTTPException(403, "Not authorized to view this document")
        
        # Load the base document for recipient too
        doc = db.documents.find_one({"_id": doc_id})

    # Validate page number
    if page_number < 1 or page_number > doc.get("page_count", 0):
        raise HTTPException(400, f"Invalid page number. Must be between 1 and {doc.get('page_count', 0)}")
    
    # Try to get pre-generated thumbnail
    thumbnails = doc.get("page_thumbnails", [])
    page_thumbnail = next((t for t in thumbnails if t.get("page") == page_number), None)
    
    if page_thumbnail and page_thumbnail.get("thumbnail_path"):
        try:
            thumb_bytes = storage.download(page_thumbnail["thumbnail_path"])
            return StreamingResponse(
                io.BytesIO(thumb_bytes),
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Content-Disposition": f'inline; filename="page_{page_number}_thumb.png"'
                }
            )
        except Exception as e:
            print(f"Error loading stored thumbnail: {e}")
            # Fall through to generate on the fly
    
    # Generate thumbnail on the fly
    pdf_path = doc.get("pdf_file_path")
    if not pdf_path:
        raise HTTPException(404, "PDF not found")
    
    try:
        pdf_bytes = storage.download(pdf_path)
        thumb_bytes = generate_file_thumbnail(pdf_bytes, page_number - 1)  # 0-based index
        
        return StreamingResponse(
            io.BytesIO(thumb_bytes),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f'inline; filename="page_{page_number}_thumb.png"'
            }
        )
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        raise HTTPException(500, "Error generating thumbnail")


@router.delete("/{document_id}/files/{file_id}")
async def delete_document_file(
    document_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    try:
        doc_id = ObjectId(document_id)
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(400, "Invalid ID")

    # Owner only
    doc = db.documents.find_one({
        "_id": doc_id,
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    # Draft only
    if doc["status"] != "draft":
        raise HTTPException(400, "Cannot delete files after document is sent")

    # Fetch file
    file = db.document_files.find_one({
        "_id": file_oid,
        "document_id": doc_id
    })
    if not file:
        raise HTTPException(404, "File not found")

    # Fetch remaining files count
    total_files = db.document_files.count_documents({"document_id": doc_id})

    # ============================================
    # Delete from Azure Blob Storage
    # ============================================
    try:
        # Delete main file
        if file.get("file_path"):
            storage.delete(file["file_path"])
        
        # Delete thumbnail if exists
        if file.get("thumbnail_path"):
            storage.delete(file["thumbnail_path"])
    except Exception as e:
        print(f"Error deleting from storage: {e}")

    # Remove DB record
    db.document_files.delete_one({"_id": file_oid})

    # Update document state
    if total_files <= 1:
        # If it was the last file, clear all document-level summary fields
        db.documents.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "page_count": 0,
                    "pdf_file_path": None,
                    "preview_thumbnail_path": None,
                    "page_thumbnails": [],
                    "processing_status": "No files",
                    "progress": 0
                }
            }
        )
    else:
        # Reorder remaining files
        remaining = list(
            db.document_files.find({"document_id": doc_id}).sort("order", 1)
        )
        for idx, f in enumerate(remaining, start=1):
            db.document_files.update_one(
                {"_id": f["_id"]},
                {"$set": {"order": idx}}
            )

        # Refresh overall document metadata (page count, page_thumbnails)
        update_document_summary_metadata(document_id)

    # Audit log
    _log_event(
        document_id,
        current_user,
        "file_deleted",
        {
            "filename": file.get("filename"),
            "pages": file.get("page_count")
        },
        request
    )

    return {"message": "File deleted successfully"}



@router.get("/{document_id}/files/{file_id}/history")
async def get_file_history(
    document_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    # owner only
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    logs = list(
        db.document_timeline.find({
            "document_id": ObjectId(document_id),
            "metadata.file_id": file_id
        }).sort("timestamp", 1)
    )

    return [
        {
            "title": log.get("title"),
            "description": log.get("description"),
            "actor": log.get("actor", {}),
            "timestamp": log.get("timestamp")
        }
        for log in logs
    ]




@router.put("/{document_id}/files/reorder")
async def reorder_files(
    document_id: str,
    items: List[FileOrderItem],
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    for item in items:
        db.document_files.update_one(
            {
                "_id": ObjectId(item.file_id),
                "document_id": ObjectId(document_id)
            },
            {"$set": {"order": item.order}}
        )
        
    update_document_summary_metadata(document_id)

    _log_event(
        document_id,
        current_user,
        "files_reordered",
        {
            "new_order": [item.file_id for item in items]
        },
        request
    )

    return {"status": "ok"}



@router.put("/{document_id}/files/{file_id}/replace")
async def replace_document_file(
    document_id: str,
    file_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    try:
        doc_oid = ObjectId(document_id)
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(400, "Invalid document or file ID")

    # Owner + draft only
    doc = db.documents.find_one({
        "_id": doc_oid,
        "owner_id": ObjectId(current_user["id"]),
        "status": "draft"
    })
    if not doc:
        raise HTTPException(404, "Document not found or not editable")

    # Fetch existing file
    existing = db.document_files.find_one({
        "_id": file_oid,
        "document_id": doc_oid
    })
    if not existing:
        raise HTTPException(404, "File not found")

    old_pages = existing["page_count"]
    old_filename = existing["filename"]

    # Convert new file to PDF
    content = await file.read()
    pdf_bytes = convert_to_pdf(content, file.filename)
    if not pdf_bytes:
        raise HTTPException(400, "File cannot be converted to PDF")

    new_pages = get_pdf_page_count(pdf_bytes)

    # ============================================
    # Upload to Azure Blob Storage
    # ============================================
    new_pdf_path = storage.upload(
        pdf_bytes,
        file.filename,
        folder=f"users/{current_user['id']}/documents/{document_id}/files"
    )

    # Generate preview thumbnail
    preview_thumb_bytes = generate_file_thumbnail(pdf_bytes, 0)
    preview_thumb_path = storage.upload(
        preview_thumb_bytes,
        f"{file.filename}_preview.png",
        folder=f"users/{current_user['id']}/thumbnails/{document_id}"
    )

    # Delete old files
    try:
        if existing.get("file_path"):
            storage.delete(existing["file_path"])
        if existing.get("thumbnail_path"):
            storage.delete(existing["thumbnail_path"])
    except Exception as e:
        print(f"Error deleting old files: {e}")

    # Generate page-level thumbnails
    page_thumbnails = generate_and_store_page_thumbnails(
        pdf_bytes, str(document_id), file.filename, current_user["id"]
    )

    # Update document_files
    db.document_files.update_one(
        {"_id": file_oid},
        {"$set": {
            "file_path": new_pdf_path,
            "thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumbnails,
            "filename": file.filename,
            "page_count": new_pages,
            "updated_at": datetime.utcnow()
        }}
    )

    # Update overall document summary (metadata)
    update_document_summary_metadata(document_id)

    # Timeline log
    _log_event(
        document_id,
        current_user,
        "file_replaced",
        {
            "old_filename": old_filename,
            "new_filename": file.filename,
            "old_pages": old_pages,
            "new_pages": new_pages
        },
        request
    )

    return {
        "message": "File replaced successfully",
        "filename": file.filename,
        "pages": new_pages
    }



@router.put("/{document_id}/files/{file_id}/rename")
async def rename_document_file(
    document_id: str,
    file_id: str,
    payload: dict,  # { "filename": "New File Name.pdf" }
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    # -------------------------
    # Validate IDs
    # -------------------------
    try:
        doc_oid = ObjectId(document_id)
        file_oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(400, "Invalid document or file ID")

    # -------------------------
    # Owner + draft check
    # -------------------------
    doc = db.documents.find_one({
        "_id": doc_oid,
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    if doc["status"] != "draft":
        raise HTTPException(400, "Cannot rename files after sending")

    # -------------------------
    # Fetch file
    # -------------------------
    file = db.document_files.find_one({
        "_id": file_oid,
        "document_id": doc_oid
    })
    if not file:
        raise HTTPException(404, "File not found")

    new_name = payload.get("filename", "").strip()
    if not new_name:
        raise HTTPException(400, "filename is required")

    old_name = file.get("filename")

    # -------------------------
    # Preserve extension
    # -------------------------
    if "." not in new_name and "." in old_name:
        ext = old_name.rsplit(".", 1)[-1]
        new_name = f"{new_name}.{ext}"

    # -------------------------
    # Update filename
    # -------------------------
    db.document_files.update_one(
        {"_id": file_oid},
        {"$set": {
            "filename": new_name,
            "renamed_at": datetime.utcnow()
        }}
    )

    # -------------------------
    # Timeline log
    # -------------------------
    _log_event(
        document_id,
        current_user,
        "file_renamed",
        {
            "file_id": str(file_oid),
            "old_filename": old_name,
            "new_filename": new_name
        },
        request
    )

    # Fetch updated field to return its adjusted coordinates
    updated_field = db.signature_fields.find_one({"_id": fid})
    
    # Process updated_field for JSON serialization
    from bson import json_util
    import json
    updated_field_json = json.loads(json_util.dumps(updated_field))
    for key in ["_id", "document_id", "recipient_id"]:
        if key in updated_field_json and isinstance(updated_field_json[key], dict) and "$oid" in updated_field_json[key]:
            updated_field_json[key] = updated_field_json[key]["$oid"]

    return {
        "message": "Field completed successfully",
        "completed": True,
        "field_completed": True,
        "all_fields_completed": all_fields_completed,
        "remaining_fields": remaining_fields,
        "field_id": field_id,
        "field": updated_field_json
    }


@router.post("/{document_id}/files/merge")
async def merge_selected_files(
    document_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    file_ids = payload.get("file_ids", [])
    merged_filename = payload.get("merged_filename", "").strip()

    if len(file_ids) < 2:
        raise HTTPException(400, "Select at least 2 files to merge")

    if not merged_filename:
        raise HTTPException(400, "merged_filename is required")

    # Preserve extension
    if "." not in merged_filename:
        merged_filename += ".pdf"

    doc_oid = ObjectId(document_id)

    # Owner + draft check
    doc = db.documents.find_one({
        "_id": doc_oid,
        "owner_id": ObjectId(current_user["id"]),
        "status": "draft"
    })
    if not doc:
        raise HTTPException(404, "Document not found or not editable")

    # Fetch selected files IN USER ORDER
    selected_files = []
    for fid in file_ids:
        f = db.document_files.find_one({
            "_id": ObjectId(fid),
            "document_id": doc_oid
        })
        if not f:
            raise HTTPException(400, "Invalid file selection")
        selected_files.append(f)

    # Validate & load PDFs from Azure
    pdfs = []
    for f in selected_files:
        try:
            data = storage.download(f["file_path"])
            # Quick validation
            fitz.open(stream=data, filetype="pdf").close()
            pdfs.append(data)
        except Exception as e:
            raise HTTPException(
                400,
                f"File '{f['filename']}' is corrupted: {str(e)}"
            )

    # Merge PDFs
    merged_pdf = merge_pdfs(pdfs)
    total_pages = sum(f["page_count"] for f in selected_files)

    # Upload merged PDF to Azure
    merged_pdf_path = storage.upload(
        merged_pdf,
        merged_filename,
        folder=f"users/{current_user['id']}/documents/{document_id}/merged"
    )

    preview_thumb_bytes = generate_file_thumbnail(merged_pdf, 0)
    preview_thumb_path = storage.upload(
        preview_thumb_bytes,
        f"{merged_filename}_preview.png",
        folder=f"users/{current_user['id']}/thumbnails/{document_id}"
    )

    # Generate page-level thumbnails
    page_thumbnails = generate_and_store_page_thumbnails(
        merged_pdf, str(document_id), merged_filename, current_user["id"]
    )

    # Update base file with merged content
    base_file = selected_files[0]
    db.document_files.update_one(
        {"_id": base_file["_id"]},
        {"$set": {
            "file_path": merged_pdf_path,
            "thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumbnails,
            "filename": merged_filename,
            "page_count": total_pages,
            "updated_at": datetime.utcnow()
        }}
    )

    # Delete other merged files from Azure and DB
    for f in selected_files[1:]:
        try:
            if f.get("file_path"):
                storage.delete(f["file_path"])
            if f.get("thumbnail_path"):
                storage.delete(f["thumbnail_path"])
        except Exception as e:
            print(f"Error deleting file: {e}")
        
        db.document_files.delete_one({"_id": f["_id"]})

    # Reorder remaining files
    remaining = list(
        db.document_files
        .find({"document_id": doc_oid})
        .sort("order", 1)
    )

    for idx, f in enumerate(remaining, start=1):
        db.document_files.update_one(
            {"_id": f["_id"]},
            {"$set": {"order": idx}}
        )

    # Refresh document global metadata
    update_document_summary_metadata(document_id)

    # Timeline log
    _log_event(
        document_id,
        current_user,
        "files_merged",
        {
            "merged_files": [f["filename"] for f in selected_files],
            "result_filename": merged_filename
        },
        request
    )

    return {
        "message": "Files merged successfully",
        "filename": merged_filename,
        "pages": total_pages
    }




@router.post("/from-template")
async def create_document_from_template(
    payload: CreateFromTemplateRequest,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    # Restriction: Only allow if user has an active plan (Admins bypass)
    if current_user.get("role") != "admin":
        user_data = db.users.find_one({"_id": ObjectId(current_user["id"])})
        if not user_data or not user_data.get("has_active_subscription", False):
            raise HTTPException(
                status_code=403,
                detail="Active subscription required to use templates. Please upgrade your plan."
            )

    # 1️⃣ Validate template ID
    try:
        template_oid = ObjectId(payload.template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template ID")

    # 2️⃣ Fetch ACTIVE template (admin uploaded)
    template = db.document_templates.find_one({
        "_id": template_oid,
        "is_active": True
    })

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # 3️⃣ Load PDF from template storage path
    template_file_path = template.get("file_path")
    if not template_file_path:
        raise HTTPException(status_code=404, detail="Template file missing")

    try:
        pdf_bytes = storage.download(template_file_path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Template PDF not found in storage: {str(e)}")

    # 4️⃣ Store PDF as a NEW document in user's storage
    pdf_file_path = storage.upload(
        pdf_bytes,
        f"{payload.title}.pdf",
        folder=f"users/{current_user['id']}/documents/from_template"
    )

    # 5️⃣ Generate envelope ID
    envelope_id = generate_envelope_id(
        prefix="ENV",
        user_id=current_user["id"]
    )

    # 6️⃣ Default settings from user profile
    reminder_days = current_user.get("reminder_days", 3)
    expiry_days = current_user.get("expiry_days", 30)

    # 7️⃣ Create document
    document = {
        "filename": f"{payload.title}.pdf",
        "uploaded_at": datetime.utcnow(),
        "owner_id": ObjectId(current_user["id"]),
        "owner_email": current_user.get("email"),
        "mime_type": "application/pdf",
        "size": len(pdf_bytes),
        "status": "draft",
        "source": "template",
        "template_id": template_oid,
        "pdf_file_path": pdf_file_path,
        "original_file_path": None,
        "signed_pdf_path": None,
        "envelope_id": envelope_id,
        "envelope_auto_generated": True,
        "recipient_count": 0,
        "signed_count": 0,
        "page_count": template.get("page_count", 1),
        "is_converted": False,
        "common_message": "Please review and sign this document.",
        "expiry_days": expiry_days,
        "reminder_period": reminder_days,
        "expires_at": datetime.utcnow() + timedelta(days=expiry_days)
    }

    result = db.documents.insert_one(document)
    
    db.document_files.insert_one({
        "document_id": result.inserted_id,
        "file_path": pdf_file_path,
        "filename": f"{payload.title}.pdf",
        "page_count": template.get("page_count", 1),
        "order": 1,
        "uploaded_at": datetime.utcnow(),
        "source": "template"
    })

    _log_event(
        str(result.inserted_id),
        current_user,
        "create_document_from_template",
        {
            "template_id": payload.template_id,
            "envelope_id": envelope_id
        },
        request
    )

    return {
        "success": True,
        "document_id": str(result.inserted_id),
        "envelope_id": envelope_id
    }



@router.put("/{document_id}/rename")
async def rename_document(
    document_id: str,
    payload: dict,  # { "filename": "New Name.pdf" }
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Rename a document.
    Owner only.
    """

    # Validate ObjectId
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID")

    doc = db.documents.find_one({
        "_id": oid,
        "owner_id": ObjectId(current_user["id"])
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") == "deleted":
        raise HTTPException(
            status_code=400,
            detail="Cannot rename a deleted document"
        )

    new_name = payload.get("filename", "").strip()

    if not new_name:
        raise HTTPException(
            status_code=400,
            detail="filename is required"
        )

    # Preserve extension if missing
    old_name = doc.get("filename", "")
    if "." in old_name and "." not in new_name:
        ext = old_name.rsplit(".", 1)[-1]
        new_name = f"{new_name}.{ext}"

    # Update document
    db.documents.update_one(
        {"_id": oid},
        {"$set": {
            "filename": new_name,
            "renamed_at": datetime.utcnow()
        }}
    )

    # Audit log
    _log_event(
        document_id,
        current_user,
        "rename_document",
        {
            "old_filename": old_name,
            "new_filename": new_name
        },
        request
    )

    return {
        "message": "Document renamed successfully",
        "document_id": document_id,
        "filename": new_name
    }


# -----------------------------
# LIST DOCUMENTS
# -----------------------------
@router.get("")
@router.get("/")
async def list_documents(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    status: str | None = Query(None),
    include_deleted: bool = Query(False),
    envelope_id: str | None = Query(None)  # Add envelope_id filter
):
    """
    List documents owned by the current user.
    Filter by envelope_id if provided.
    """
    query = {"owner_id": ObjectId(current_user["id"])}

    if status:
        query["status"] = status
    elif not include_deleted:
        query["status"] = {"$ne": "deleted"}
        
    # Add envelope_id filter if provided
    if envelope_id:
        query["envelope_id"] = envelope_id

    docs = db.documents.find(query).sort("uploaded_at", -1).skip(skip).limit(limit)
    return [serialize_document(d) for d in docs]

@router.get("/paged")
async def list_documents_paged(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    include_deleted: bool = Query(False)
):
    owner_id = ObjectId(current_user["id"])

    query = {"owner_id": owner_id}

    if status:
        query["status"] = status
    elif not include_deleted:
        query["status"] = {"$ne": "deleted"}

    total = db.documents.count_documents(query)

    skip = (page - 1) * page_size

    docs = list(
        db.documents.find(query)
        .sort("uploaded_at", -1)
        .skip(skip)
        .limit(page_size)
    )

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
        "documents": [serialize_document(d) for d in docs]
    }


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    owner_id = ObjectId(current_user["id"])

    stats = {}

    for status in DOCUMENT_STATUSES:
        stats[status] = db.documents.count_documents({
            "owner_id": owner_id,
            "status": status
        })

    stats["total"] = sum(stats.values())

    return stats



@router.get("/recipients/active")
async def get_active_signers(current_user: dict = Depends(get_current_user)):

    owner_id = ObjectId(current_user["id"])

    # documents owned by user AND still active
    active_docs = list(db.documents.find({
        "owner_id": owner_id,
        "status": {"$in": ["sent", "in_progress"]}
    }, {"_id": 1}))

    doc_ids = [d["_id"] for d in active_docs]

    if not doc_ids:
        return []

    recipients = list(db.recipients.find({
        "document_id": {"$in": doc_ids},
        "status": {"$nin": ["completed", "declined", "expired"]}
    }))

    return [serialize_recipient(r) for r in recipients]



@router.get("/audit-logs/recent")
async def get_recent_activities(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100)
):
    owner_id = ObjectId(current_user["id"])

    docs = list(db.documents.find(
        {"owner_id": owner_id},
        {"_id": 1, "filename": 1, "status": 1}
    ))

    doc_map = {d["_id"]: d for d in docs}

    logs = list(
        db.document_timeline
        .find({"document_id": {"$in": list(doc_map.keys())}})
        .sort("timestamp", -1)
        .limit(limit)
    )


    results = []

    for log in logs:
        doc = doc_map.get(log["document_id"])
        if not doc:
            continue

        document_id = log["document_id"]

        total_signers = db.recipients.count_documents({
            "document_id": document_id,
            "role": "signer"
        })

        completed_signers = db.recipients.count_documents({
            "document_id": document_id,
            "role": "signer",
            "status": "completed"
        })

        results.append({
            "id": str(log["_id"]),
            "document_id": str(document_id),
            "document_name": doc.get("filename", "Untitled"),
            "status": doc.get("status", "draft"),
            "action": log.get("action"),
            "timestamp": log.get("timestamp"),

            "signers_total": total_signers,
            "signers_completed": completed_signers,
        })

    return results   # ← ADD THIS


# -----------------------------
# COMMON MESSAGE MANAGEMENT
# -----------------------------

@router.put("/{document_id}/common-message")
async def update_common_message(
    document_id: str,
    payload: dict,  # {"common_message": "Your common message"}
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Update common message for a document.
    Can be used at any stage (draft, sent, in_progress).
    """
    try:
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        common_message = payload.get("common_message", "").strip()
        
        if not common_message:
            raise HTTPException(status_code=400, detail="Common message cannot be empty")
        
        # Update document
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"common_message": common_message}}
        )
        
        _log_event(
            document_id,
            current_user,
            "update_common_message",
            {"message_preview": common_message[:50] + "..." if len(common_message) > 50 else common_message},
            request
        )
        
        return {"message": "Common message updated successfully", "common_message": common_message}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update common message")


@router.put("/{document_id}/settings")
async def update_document_settings(
    document_id: str,
    payload: dict,  # {"expiry_days": 30, "reminder_period": 7}
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Update document settings (expiry, reminders).
    Owner only, draft only.
    """
    try:
        doc_oid = ObjectId(document_id)
        doc = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Only allow updating in draft (or maybe sent too? The user said "more settings with dropdown its open to set expire time and automatic reminder")
        # Let's allow it in draft and sent for now.
        
        update_data = {}
        
        # Handle expiry_days if present
        if "expiry_days" in payload:
            expiry_days = int(payload.get("expiry_days", 0))
            update_data["expiry_days"] = expiry_days
            
            # Recalculate expires_at if document is already sent
            if doc.get("status") in ["sent", "in_progress"]:
                sent_at = doc.get("sent_at") or doc.get("uploaded_at")
                if expiry_days > 0 and sent_at:
                    update_data["expires_at"] = sent_at + timedelta(days=expiry_days)
                else:
                    update_data["expires_at"] = None
        
        # Handle reminder_period if present
        if "reminder_period" in payload:
            reminder_period = int(payload.get("reminder_period", 0))
            update_data["reminder_period"] = reminder_period
            
            # Recalculate next_reminder_at if document is already sent
            if doc.get("status") in ["sent", "in_progress"]:
                if reminder_period > 0:
                    update_data["next_reminder_at"] = datetime.utcnow() + timedelta(days=reminder_period)
                else:
                    update_data["next_reminder_at"] = None

        # Handle signing_order_enabled if present
        if "signing_order_enabled" in payload:
            update_data["signing_order_enabled"] = bool(payload["signing_order_enabled"])
        
        if not update_data:
            return {"message": "No changes provided"}

        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": update_data}
        )
        
        _log_event(
            document_id,
            current_user,
            "update_settings",
            update_data,
            request
        )
        
        return {"message": "Settings updated", "settings": update_data}
        
    except Exception as e:
        print(f"Error updating document settings: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{document_id}/common-message")
async def get_common_message(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get common message for a document.
    """
    try:
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"common_message": doc.get("common_message", "")}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/expiring")
async def get_expiring_documents(
    current_user: dict = Depends(get_current_user),
    days: int = Query(7, ge=1, le=90)
):
    """
    Returns documents owned by the current user that will expire within N days
    and are still active (sent or in progress).
    """

    owner_id = ObjectId(current_user["id"])

    now = datetime.utcnow()
    threshold = now + timedelta(days=days)

    docs = list(db.documents.find({
        "owner_id": owner_id,
        "status": {"$in": ["sent", "in_progress"]},
        "expires_at": {"$lte": threshold, "$gte": now}
    }).sort("expires_at", 1))

    return [serialize_document(d) for d in docs]


# -----------------------------
# GET SINGLE DOCUMENT
# -----------------------------
@router.get("/{document_id}")
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):

    # make invalid IDs safe instead of crashing
    try:
        oid = ObjectId(document_id)
    except Exception:
        raise HTTPException(400, "Invalid document ID")

    doc = db.documents.find_one({
        "_id": oid,
        "owner_id": ObjectId(current_user["id"])
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return serialize_document(doc)


@router.post("/{document_id}/remind-all")
async def remind_all_recipients(
    request: Request,
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send reminders to all incomplete recipients of a document"""
    try:
        doc_oid = ObjectId(document_id)
        document = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        if document.get("status") not in ["sent", "in_progress"]:
            raise HTTPException(status_code=400, detail="Reminders can only be sent for active documents")

        # Find all incomplete recipients
        # Incomplete if status not in ['signed', 'approved', 'completed', 'witnessed']
        recipients = list(db.recipients.find({
            "document_id": doc_oid,
            "status": {"$nin": ["signed", "approved", "completed", "witnessed", "voided", "declined"]}
        }))
        
        if not recipients:
            return {"message": "No pending recipients found to remind"}

        # Import send_reminder_email here to avoid circular imports
        from .recipients import send_reminder_email

        for recipient in recipients:
            background_tasks.add_task(
                send_reminder_email,
                recipient,
                document,
                current_user["email"]
            )
            
        _log_event(
            document_id,
            current_user,
            "remind_all_recipients",
            {"recipient_count": len(recipients)},
            request
        )
        
        return {"message": f"Reminders are being sent to {len(recipients)} recipients"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in remind-all: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{document_id}/expire-now")
async def expire_document_now(
    request: Request,
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Immediately expire a document"""
    try:
        doc_oid = ObjectId(document_id)
        document = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        if document.get("status") in ["draft", "completed", "voided", "expired"]:
            raise HTTPException(status_code=400, detail=f"Cannot expire document in {document.get('status')} status")

        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {
                "status": "expired",
                "expires_at": datetime.utcnow()
            }}
        )
        
        _log_event(
            document_id,
            current_user,
            "document_expired_manually",
            {},
            request
        )
        
        return {"message": "Document has been expired immediately"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{document_id}/extend-expiry")
async def extend_document_expiry(
    request: Request,
    document_id: str,
    payload: dict = Body(...), # {"days": 7}
    current_user: dict = Depends(get_current_user)
):
    """Extend document expiry by N days from current time or original upload?"""
    try:
        days = int(payload.get("days", 0))
        if days <= 0:
            raise HTTPException(status_code=400, detail="Extension days must be greater than 0")

        doc_oid = ObjectId(document_id)
        document = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Update expiry_days and recalculate expires_at
        # The user said "update expired days count"
        new_expiry_days = document.get("expiry_days", 0) + days
        
        # Calculate new expires_at relative to sent_at or now? 
        # Usually from sent_at if it exists, otherwise now.
        base_date = document.get("sent_at") or document.get("uploaded_at") or datetime.utcnow()
        new_expires_at = base_date + timedelta(days=new_expiry_days)

        db.documents.update_one(
            {"_id": doc_oid},
            {"$set": {
                "expiry_days": new_expiry_days,
                "expires_at": new_expires_at,
                "status": "sent" if document.get("status") == "expired" else document.get("status")
            }}
        )
        
        _log_event(
            document_id,
            current_user,
            "document_expiry_extended",
            {"added_days": days, "new_total_days": new_expiry_days},
            request
        )
        
        return {
            "message": f"Document expiry extended by {days} days",
            "new_expires_at": new_expires_at,
            "new_expiry_days": new_expiry_days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# DOWNLOAD ORIGINAL FILE
# -----------------------------
@router.get("/{document_id}/download")
async def download_document(
    document_id: str, 
    request: Request
):
    """
    Download the original uploaded file (not the converted PDF).
    Owner-only by default.
    """
    current_user = await get_user_from_request(request)

    doc = db.documents.find_one({
        "_id": ObjectId(document_id), 
        "owner_id": ObjectId(current_user["id"])
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Use converted PDF if original is not a PDF, to ensure compatibility with viewers
    # as mentioned by user: "filename use as owner-preview convert pdf"
    use_pdf = False
    original_filename = doc.get("filename", "document")
    
    if not original_filename.lower().endswith(".pdf") and doc.get("pdf_file_path"):
        use_pdf = True
        # Convert extension to .pdf
        base_name = original_filename.rsplit('.', 1)[0]
        filename = f"{base_name}.pdf"
    else:
        filename = original_filename

    # Prefer PDF version for preview downloads if it's a non-PDF original
    target_path = doc.get("pdf_file_path") if use_pdf else (doc.get("original_file_path") or doc.get("pdf_file_path"))
    
    if not target_path:
        raise HTTPException(status_code=404, detail="Document file missing")

    try:
        file_bytes = storage.download(target_path)
    except Exception as e:
        # Fallback to original if PDF fails for some reason
        if use_pdf and doc.get("original_file_path"):
            try:
                file_bytes = storage.download(doc.get("original_file_path"))
                filename = original_filename
                use_pdf = False
            except:
                raise HTTPException(status_code=404, detail=f"File not found in storage: {str(e)}")
        else:
            raise HTTPException(status_code=404, detail=f"File not found in storage: {str(e)}")

    # Log download
    _log_event(
        document_id, 
        current_user, 
        "download_original", 
        {
            "filename": filename,
            "original_filename": original_filename,
            "is_converted": use_pdf
        }, 
        request
    )

    media_type = "application/pdf" if use_pdf else doc.get("mime_type", "application/octet-stream")

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(file_bytes))
        }
    )


# -----------------------------
# SOFT DELETE (move to trash)
# -----------------------------
@router.delete("/{document_id}")
async def soft_delete_document(document_id: str, current_user: dict = Depends(get_current_user), request: Request = None):
    """
    Soft delete: mark document as deleted. Files remain in storage and can be restored.
    """
    doc = db.documents.find_one({"_id": ObjectId(document_id), "owner_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") == "deleted":
        raise HTTPException(status_code=400, detail="Document already deleted")

    db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": {"status": "deleted", "deleted_at": datetime.utcnow()}})

    _log_event(document_id, current_user, "soft_delete", request=request)
    return {"message": "Document moved to trash"}

@router.delete("/{document_id}/permanent")
async def permanent_delete(
    request: Request,
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    doc = db.documents.find_one(
        {"_id": ObjectId(document_id), "owner_id": ObjectId(current_user["id"])}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") != "deleted":
        raise HTTPException(status_code=400, detail="Document must be in trash to permanently delete")

    # ============================================
    # Delete files from Azure Blob Storage
    # ============================================
    for key in ["original_file_path", "pdf_file_path", "signed_pdf_path"]:
        if doc.get(key):
            try:
                storage.delete(doc[key])
            except Exception as e:
                print(f"Error deleting {key}: {e}")

    # Delete thumbnails
    if doc.get("preview_thumbnail_path"):
        try:
            storage.delete(doc["preview_thumbnail_path"])
        except:
            pass

    if doc.get("page_thumbnails"):
        for thumb in doc["page_thumbnails"]:
            if thumb.get("thumbnail_path"):
                try:
                    storage.delete(thumb["thumbnail_path"])
                except:
                    pass

    # Delete all document files
    doc_files = db.document_files.find({"document_id": ObjectId(document_id)})
    for f in doc_files:
        if f.get("file_path"):
            try:
                storage.delete(f["file_path"])
            except:
                pass
        if f.get("thumbnail_path"):
            try:
                storage.delete(f["thumbnail_path"])
            except:
                pass

    # Delete DB dependencies
    db.documents.delete_one({"_id": ObjectId(document_id)})
    db.recipients.delete_many({"document_id": ObjectId(document_id)})
    db.signatures.delete_many({"document_id": ObjectId(document_id)})
    db.document_files.delete_many({"document_id": ObjectId(document_id)})

    _log_event(document_id, current_user, "permanent_delete", request=request)

    return {"message": "Document permanently deleted"}


# -----------------------------
# TIMELINE / AUDIT FEED (document)
# -----------------------------
@router.get("/{document_id}/timeline")
async def get_document_timeline(document_id: str, current_user: dict = Depends(get_current_user)):
    doc = db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        # Check if the user is a recipient of this document
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "recipients.email": current_user.get("email")
        })
        if not doc:
            raise HTTPException(404, "Document not found or access denied")

    # 1. Fetch from document_timeline (Legacy/UI-specific)
    legacy_logs = list(
        db.document_timeline
        .find({"document_id": ObjectId(document_id)})
        .sort("timestamp", 1)
    )

    # 2. Fetch from audit_logs (Standardized)
    audit_logs = list(
        db.audit_logs
        .find({"document_id": ObjectId(document_id)})
        .sort("timestamp", 1)
    )

    # 3. Normalize audit logs to timeline format
    normalized_audit = []
    for log in audit_logs:
        # Avoid duplication if the same event was logged to both (possible during transition)
        # We'll use a simple heuristic: same action/type and very close timestamp (+/- 1s)
        normalized_audit.append({
            "type": log.get("action"),
            "timestamp": log.get("timestamp"),
            "metadata": {
                **log.get("details", {}),
                "ip": log.get("ip_address"),
                "user_agent": log.get("user_agent")
            },
            "actor_id": str(log.get("performed_by")) if log.get("performed_by") else None,
            "is_audit": True
        })

    # 4. Merge and Deduplicate
    all_events = legacy_logs + normalized_audit
    
    # Sort by timestamp
    all_events.sort(key=lambda x: x.get("timestamp") or datetime.min)

    # Simple de-duplication
    final_logs = []
    seen_keys = set() # (type, rounded_timestamp)
    
    for event in all_events:
        ts = event.get("timestamp")
        if not ts: continue
        
        # Round timestamp to nearest second for deduplication
        rounded_ts = ts.replace(microsecond=0)
        key = (event.get("type") or event.get("action"), rounded_ts)
        
        if key not in seen_keys:
            final_logs.append(event)
            seen_keys.add(key)
        elif event.get("is_audit") and not final_logs[-1].get("is_audit"):
            # If we see a duplicate and the new one is from audit logs, 
            # it might have better metadata, but legacy logs have titles/descriptions
            # Let's keep the legacy one for now as serialize_timeline_event handles it better
            pass

    return [
        serialize_timeline_event(log, doc)
        for log in final_logs
    ]




# -----------------------------
# GET DOCUMENT STATS
# -----------------------------
@router.get("/{document_id}/stats")
async def get_document_stats(document_id: str, current_user: dict = Depends(get_current_user)):

    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    total = db.recipients.count_documents({"document_id": ObjectId(document_id)})
    signed = db.recipients.count_documents({
        "document_id": ObjectId(document_id),
        "status": "completed"
    })


    return {
        "total_recipients": total,
        "signed_recipients": signed,
        "pending_recipients": total - signed,
        "completion_rate": (signed / total * 100) if total > 0 else 0
    }


@router.get("/{document_id}/preview")
async def get_document_preview(
    document_id: str,
    width: int = Query(400, ge=100, le=1200),
    height: int = Query(300, ge=100, le=800),
    token: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get the document PREVIEW image (first page as preview).
    """
    try:
        doc_id = ObjectId(document_id)
    except:
        raise HTTPException(400, "Invalid document ID")
    
    # Check permissions (same as before)
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("id") or payload.get("_id")
        except JWTError:
            raise HTTPException(401, "Invalid token")
            
        recipient = db.recipients.find_one({
            "document_id": doc_id,
            "$or": [
                {"email": payload.get("email")},
                {"_id": ObjectId(user_id) if user_id else None}
            ]
        })
        if not recipient:
            raise HTTPException(403, "Not authorized")
    elif current_user:
        doc = db.documents.find_one({
            "_id": doc_id,
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(403, "Not authorized")
    else:
        raise HTTPException(401, "Authentication required")
    
    # Get document
    doc = db.documents.find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    # Try to get PREVIEW thumbnail from Azure
    if doc.get("preview_thumbnail_path"):
        try:
            thumb_bytes = storage.download(doc["preview_thumbnail_path"])
            
            # Resize if needed
            if width != 400 or height != 300:
                img = Image.open(io.BytesIO(thumb_bytes))
                img.thumbnail((width, height), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                img.save(buffer, format='PNG', optimize=True)
                thumb_bytes = buffer.getvalue()
            
            return StreamingResponse(
                io.BytesIO(thumb_bytes),
                media_type="image/png",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Content-Disposition": f'inline; filename="{doc.get("filename", "document")}_preview.png"'
                }
            )
        except Exception as e:
            print(f"Error loading preview thumbnail: {e}")
            # Fall through to generate from PDF
    
    # Fallback: Generate preview from first page
    pdf_path = doc.get("pdf_file_path")
    if not pdf_path:
        raise HTTPException(404, "PDF not found")
    
    try:
        pdf_bytes = storage.download(pdf_path)
        thumb_bytes = generate_file_thumbnail(pdf_bytes, 0)  # First page
        
        return StreamingResponse(
            io.BytesIO(thumb_bytes),
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": f'inline; filename="{doc.get("filename", "document")}_preview.png"'
            }
        )
    except Exception as e:
        print(f"Error generating preview: {e}")
        raise HTTPException(500, "Error generating preview")

# -----------------------------
# DOWNLOAD FINAL SIGNED PDF
# -----------------------------
@router.get("/{document_id}/signed-download")
async def download_signed(
    document_id: str, 
    request: Request
):
    """
    Download signed document (accessible by both owner and recipients).
    Includes ALL completed signatures and form fields.
    """
    current_user = await get_user_from_request(request)

    doc = db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    is_owner = doc["owner_id"] == ObjectId(current_user["id"])
    is_recipient = db.recipients.find_one({
        "document_id": ObjectId(document_id), 
        "email": current_user["email"]
    })
    is_admin = current_user.get("role") == "admin"

    if not is_owner and not is_recipient and not is_admin:
        raise HTTPException(403, "Not authorized")

    # Load base PDF from Azure
    pdf_path = doc.get("pdf_file_path")
    if not pdf_path:
        raise HTTPException(404, "PDF not found")
    
    try:
        pdf_bytes = storage.download(pdf_path)
    except Exception as e:
        print(f"Error reading PDF: {str(e)}")
        raise HTTPException(404, "PDF file not found in storage")
    
    # APPLY COMPLETED FIELDS (CRITICAL FIX)
    pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, document_id, doc)
    
    # Add envelope header
    envelope_id = doc.get("envelope_id")
    if envelope_id:
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )

    name = doc["filename"].rsplit(".", 1)[0]
    filename = f"{name}_signed.pdf"

    _log_event(
        document_id,
        current_user,
        "download_signed_or_current_pdf",
        {
            "used_signed_version": False,  # We're generating dynamically
            "envelope_id": envelope_id
        },
        request=request
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# -----------------------------
# DOWNLOAD PROFESSIONAL SUMMARY PDF (OWNER)
# -----------------------------
@router.get("/{document_id}/summary/pdf")
async def download_summary_pdf(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Generate and download the professional document summary PDF for the owner.
    Matches the look and feel of DocuSign summary.
    """
    try:
        oid = ObjectId(document_id)
    except:
        raise HTTPException(400, "Invalid document ID")

    doc = db.documents.find_one({
        "_id": oid,
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(404, "Document not found")
        
    # Get details for summary
    all_recipients = list(db.recipients.find({"document_id": oid}).sort("signing_order", 1))
    all_fields = list(db.signature_fields.find({"document_id": oid}))
    timeline = list(db.document_timeline.find({"document_id": oid}).sort("timestamp", -1).limit(50))
    
    # Format dates
    created_date = doc.get("uploaded_at")
    created_date_str = created_date.strftime("%B %d, %Y") if created_date else "Unknown"
    completed_date = (doc.get("completed_at") or doc.get("finalized_at"))
    completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M %p") if completed_date else "Not completed"
    
    # Map participants
    participants = []
    for r in all_recipients:
        comp_time = ""
        # Determine logical completion date
        for t_field in ["signed_at", "approved_at", "form_completed_at", "viewer_at"]:
            if r.get(t_field):
                comp_time = r[t_field].strftime("%Y-%m-%d")
                break
                
        r_fields = [f for f in all_fields if str(f.get("recipient_id")) == str(r["_id"])]
        r_completed = len([f for f in r_fields if f.get("completed_at")])
        
        participants.append({
            "name": r.get("name", "Unknown"),
            "email": r.get("email", ""),
            "role": r.get("role", "signer"),
            "status": r.get("status", "pending"),
            "completed_at": comp_time or None,
            "signing_order": r.get("signing_order", 1),
            "fields_assigned": len(r_fields),
            "fields_completed": r_completed,
            "otp_verified": r.get("otp_verified", False),
            "terms_accepted": r.get("terms_accepted", False)
        })
        
    # Recent activity
    recent_activity = []
    for event in timeline[:20]:
        actor = event.get("actor", {})
        p_name = actor.get("name") or actor.get("email") or "System"
        e_date = event.get("timestamp").strftime("%Y-%m-%d %H:%M:%S") if event.get("timestamp") else ""
        
        details = event.get("description", "")
        if not details:
            details = event.get("title", event.get("type", "Activity").replace("_", " ").title())
            
        recent_activity.append({
            "date": e_date,
            "event": event.get("title", event.get("type", "Activity")),
            "participant": p_name,
            "details": details
        })
        
    # Compile summary data
    summary_data = {
        "envelope_id": doc.get("envelope_id", "N/A"),
        "document_name": doc.get("filename", "Untitled Document"),
        "document_status": doc.get("status", "unknown"),
        "created_date": created_date_str,
        "completed_date": completed_date_str,
        "total_pages": doc.get("page_count", 0),
        "owner_name": current_user.get("full_name") or current_user.get("name") or "You",
        "owner_email": doc.get("owner_email", current_user.get("email")),
        
        # Identity context for the requester
        "current_recipient": {
            "name": current_user.get("name", "Owner"),
            "email": current_user.get("email"),
            "role": "Owner",
            "status": "active",
            "completed_at": None,
            "ip_address": request.client.host if request and request.client else "Internal",
            "otp_verified": True,
            "terms_accepted": True,
            "signing_order": 0,
            "signature_value": None,
            "initials_value": None,
            "has_initials_field": False
        },
        
        "assigned_fields": [], # Owner isn't usually assigned fields in this view
        "all_recipients": participants,
        "statistics": {
            "total_recipients": len(all_recipients),
            "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"]),
            "total_fields": len(all_fields),
            "completed_fields": len([f for f in all_fields if f.get("completed_at")]),
            "completion_percentage": round((len([f for f in all_fields if f.get("completed_at")]) / len(all_fields) * 100), 1) if all_fields else 0,
            "assigned_to_you": 0,
            "completed_by_you": 0
        },
        "recent_activity": recent_activity,
        "summary_id": f"SUM-{uuid.uuid4().hex[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": current_user.get("email", "unknown"),
        "platform": "SafeSign Professional"
    }
    
    # Generate PDF via unified engine
    pdf_bytes = SafeSignSummaryEngine.create_document_summary_pdf(summary_data)
    
    # Sanitized filename
    clean_name = re.sub(r'[^\w\s-]', '', doc.get('filename', 'document'))
    filename = f"SafeSign_Summary_{doc.get('envelope_id', 'doc')}_{clean_name}.pdf"
    
    _log_event(document_id, current_user, "download_professional_summary", {"filename": filename, "format": "pdf"}, request)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
    
    
@router.get("/{doc_id}/builder-pdf")
async def builder_pdf(
    request: Request, 
    doc_id: str,
    show_fields: bool = Query(True),
    show_envelope_header: bool = Query(True)
):
    user = await get_user_from_request(request)

    doc = db.documents.find_one({
        "_id": ObjectId(doc_id),
        "owner_id": ObjectId(user["id"])
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id)
    }))

    # Always load merged PDF
    pdf_bytes = load_document_pdf(doc, doc_id)

    # Apply envelope header (FULL DOCUMENT)
    if show_envelope_header and doc.get("envelope_id"):
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=doc["envelope_id"],
            color="#000000"
        )

    # Apply fields to ALL pages
    # if show_fields and fields:
    #     enriched = [serialize_field_with_recipient(f) for f in fields]
    #     pdf_bytes = PDFEngine.apply_field_placeholders(
    #         pdf_bytes,
    #         enriched
    #     )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"}
    )



@router.get("/{doc_id}/owner-preview")
async def owner_preview(
    request: Request, 
    doc_id: str,
    show_fields: bool = Query(True, description="Show field overlays"),
    highlight_incomplete: bool = Query(True, description="Highlight incomplete fields"),
    show_status: bool = Query(True, description="Show current signing status"),
    use_recipient_colors: bool = Query(True, description="Use recipient colors for field placeholders"),
    show_envelope_header: bool = Query(True, description="Show envelope ID in header")  # NEW
):
    """
    Owner preview showing field placeholders with current signing status.
    Shows all fields with their current state (completed/pending).
    Uses recipient-based colors for field placeholders.
    """
    user = await get_user_from_request(request)
    
    print(f"\n--- Owner Preview: {doc_id} ---")
    print(f"👤 User: {user.get('email')}")

    doc = db.documents.find_one({
        "_id": ObjectId(doc_id),
        "owner_id": ObjectId(user["id"])
    })
    
    if not doc:
        print(f"❌ Document {doc_id} not found for user {user.get('id')}")
        raise HTTPException(404, "Document not found")

    # Check signing order
    signing_order_enabled = doc.get("signing_order_enabled", False)
    print(f"📄 Document: {doc.get('filename')} (Status: {doc.get('status')})")
    print(f"🔢 Signing Order Enabled: {signing_order_enabled}")

    # Get all fields for this document
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id)
    }))
    
    # Get all recipients for color mapping
    recipients = list(db.recipients.find({
        "document_id": ObjectId(doc_id)
    }))
    
    # Create recipient map
    recipient_map = {}
    for r in recipients:
        recipient_id = str(r["_id"])
        recipient_map[recipient_id] = {
            "id": recipient_id,
            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "color": r.get("color", "")
        }
    
    # Enrich fields with recipient info and completion status
    enriched_fields = []
    for field in fields:
        enriched = serialize_field_with_recipient(field)
        enriched["is_completed"] = field.get("completed_at") is not None
        
        # Add recipient info
        recipient_id = str(field.get("recipient_id"))
        if recipient_id in recipient_map:
            enriched["recipient"] = recipient_map[recipient_id]
        
        # ALWAYS normalize completed field values
        if enriched.get("is_completed"):
            enriched["display_value"] = normalize_field_value(field)
        
        enriched_fields.append(enriched)
    
    # Load PDF
    pdf_bytes = load_document_pdf(doc, doc_id)

    
    # ============================================
    # NEW: Apply envelope header if envelope ID exists
    # ============================================
    envelope_id = doc.get("envelope_id")
    if show_envelope_header and envelope_id:
        document_name = doc.get("filename", "Document")
        status = doc.get("status", "draft").replace("_", " ").title()
        
        # Get sender info
        sender_email = doc.get("owner_email", user.get("email", ""))
        sender_name = ""
        user_record = db.users.find_one({"_id": ObjectId(user["id"])})
        if user_record:
            sender_name = user_record.get("full_name") or user_record.get("name") or sender_email
        
        # Format dates
        created_date = doc.get("uploaded_at")
        if created_date:
            created_date = created_date.strftime("%Y-%m-%d") if hasattr(created_date, 'strftime') else str(created_date)[:10]
        
        # Apply minimal header for preview (not full header)
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    
    # Apply field placeholders if requested
    if show_fields and enriched_fields:
        # Apply completed field values first
        completed_fields = [f for f in enriched_fields if f.get("is_completed", False)]
        if completed_fields:
            signatures = []
            form_fields = []

            for field in completed_fields:
                field_type = field.get("type")
                field_value = field.get("display_value") or field.get("value")

                # 🔹 IMAGE FIELDS (signature / initials / stamp)
                if field_type in IMAGE_FIELDS:
                    if isinstance(field_value, dict) and field_value.get("image"):
                        signatures.append({
                            "field_id": field["id"],
                            "image": field_value["image"],
                            "page": field.get("page", 0),
                            "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
                            "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
                            "width": field.get("pdf_width") or field.get("width", 120),
                            "height": field.get("pdf_height") or field.get("height", 40),
                            "opacity": 1.0,
                            "is_completed": True,
                            "pdf_x": field.get("pdf_x"),
                            "pdf_y": field.get("pdf_y"),
                            "pdf_width": field.get("pdf_width"),
                            "pdf_height": field.get("pdf_height"),
                            "canvas_width": field.get("canvas_width"),
                            "canvas_height": field.get("canvas_height")
                        })

                # 🔹 FORM FIELDS (text / checkbox / radio / dropdown)
                else:
                    render_data = get_field_render_data(field)
                    render_data["_render_completed"] = True
                    render_data["is_completed"] = True
                    form_fields.append(render_data)

        
        # Apply placeholders for all fields with recipient colors
        pdf_bytes = PDFEngine.apply_field_placeholders(
            pdf_bytes, 
            enriched_fields,
            show_values=True,
            highlight_incomplete=highlight_incomplete,
            # border_style="professional",
            use_recipient_colors=use_recipient_colors
        )
    
    # Apply status-based watermark
    watermark_text = None
    if doc.get("status") == "draft":
        watermark_text = "DRAFT"
    elif doc.get("status") in ["sent", "in_progress"]:
        total_recipients = db.recipients.count_documents({"document_id": ObjectId(doc_id)})
        completed_recipients = db.recipients.count_documents({
            "document_id": ObjectId(doc_id),
            "status": "completed"
        })
        
        if total_recipients > 0:
            progress_percent = int((completed_recipients / total_recipients) * 100)
            watermark_text = f"IN PROGRESS - {completed_recipients}/{total_recipients} ({progress_percent}%)"
        else:
            watermark_text = "IN PROGRESS - NO RECIPIENTS"
    elif doc.get("status") == "completed":
        watermark_text = "COMPLETED"
    elif doc.get("status") == "declined":
        watermark_text = "DECLINED"
    elif doc.get("status") == "expired":
        watermark_text = "EXPIRED"
    elif doc.get("status") == "voided":
        watermark_text = "VOIDED"
    
    # if watermark_text:
    #     pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, watermark_text)
    
    # Add overall status summary at bottom of first page
    # if show_status and not doc.get("signed_pdf_id"):
    #     try:
    #         pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
            
    #         # 🔒 ONLY add overlay to page 0
    #         if show_status and len(pdf) > 0:
    #             page = pdf[0]
    #             rect = page.rect
                
    #             summary_rect = fitz.Rect(
    #                 rect.x0 + 20,
    #                 rect.y1 - 100,
    #                 rect.x1 - 20,
    #                 rect.y1 - 20
    #             )
                
    #             all_recipients = list(db.recipients.find({"document_id": ObjectId(doc_id)}))
    #             total = len(all_recipients)
    #             completed = sum(1 for r in all_recipients if r.get("status") == "completed")
    #             pending = total - completed
                
    #             status_text = f"DOCUMENT STATUS: {doc.get('status', 'unknown').upper()}\n"
    #             status_text += f"Signing Progress: {completed}/{total} completed ({int((completed/total)*100) if total > 0 else 0}%)\n"
    #             status_text += f"Pending Recipients: {pending}\n"
    #             status_text += f"Last Updated: {doc.get('updated_at', doc.get('uploaded_at')).strftime('%Y-%m-%d %H:%M') if doc.get('updated_at') or doc.get('uploaded_at') else 'N/A'}"
                
    #             # Add envelope ID to status summary if exists
    #             if envelope_id:
    #                 status_text += f"\nEnvelope ID: {envelope_id}"
                
    #             # page.draw_rect(
    #             #     summary_rect,
    #             #     color=(0.9, 0.9, 1.0),
    #             #     fill=(0.95, 0.95, 1.0),
    #             #     fill_opacity=0.3,
    #             #     overlay=True
    #             # )
                
    #             # page.draw_rect(
    #             #     summary_rect,
    #             #     color=(0.2, 0.2, 0.8),
    #             #     width=1,
    #             #     overlay=True
    #             # )
                
    #             page.insert_textbox(
    #                 summary_rect,
    #                 status_text,
    #                 fontsize=9,
    #                 fontname="Helvetica",
    #                 color=(0, 0, 0),
    #                 align=0,
    #                 overlay=True
    #             )
            
    #         pdf_bytes = pdf.tobytes(clean=True)
    #         pdf.close()
    #     except Exception as e:
    #         print(f"Error adding status summary: {e}")
    
    filename = f"{doc.get('filename', 'document').rsplit('.', 1)[0]}_owner_preview.pdf"
    
    # Log the view
    _log_event(
        doc_id,
        user,
        "owner_preview",
        {
            "show_fields": show_fields,
            "highlight_incomplete": highlight_incomplete,
            "show_status": show_status,
            "use_recipient_colors": use_recipient_colors,
            "show_envelope_header": show_envelope_header,
            "envelope_id": envelope_id,
            "document_status": doc.get("status")
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@router.get("/{doc_id}/view")
async def view_document(
    request: Request, 
    doc_id: str,
    show_fields: bool = Query(True, description="Show field overlays"),
    include_signatures: bool = Query(True, description="Include completed signatures"),
    show_placeholders: bool = Query(True, description="Show placeholders for pending fields"),
    preview_type: str = Query("all", description="'all', 'signed', or 'fields'"),
    render_type: str = Query("values", description="'values' (show actual values), 'placeholders' (show field boundaries)"),
    use_recipient_colors: bool = Query(True, description="Use recipient colors for field placeholders"),
    show_envelope_header: bool = Query(True, description="Show envelope ID in header")
):
    """
    Unified document viewer with ALL field types properly displayed.
    Image fields (signature, initials, stamp) are properly rendered when completed.
    """
    user = await get_user_from_request(request)

    # Get document
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    # Check permissions
    is_owner = doc.get("owner_id") == ObjectId(user["id"])
    is_recipient = db.recipients.find_one({
        "document_id": ObjectId(doc_id), 
        "email": user.get("email")
    })
    
    is_admin = user.get("role") == "admin"
    if not is_owner and not is_recipient and not is_admin:
        raise HTTPException(403, "Not authorized")

    # Get all fields
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id)
    }))
    
    # Enrich fields with consistent value normalization
    enriched_fields = []
    for field in fields:
        enriched = serialize_field_with_recipient(field)
        enriched["is_completed"] = field.get("completed_at") is not None
        
        # CRITICAL: Normalize ALL field values using the same function
        enriched["display_value"] = normalize_field_value(field)
        enriched["value"] = field.get("value")  # Keep original value too
        
        enriched_fields.append(enriched)
    
    # Load base PDF
    pdf_bytes = load_document_pdf(doc, doc_id)
    
    # Apply envelope header if envelope ID exists
    envelope_id = doc.get("envelope_id")
    if show_envelope_header and envelope_id:
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    
    # ============================================
    # UNIFIED FIELD PROCESSING LOGIC
    # ============================================
    
    # Define field type categories
    IMAGE_FIELDS = {"signature", "initials", "witness_signature", "stamp"}
    TEXT_FIELDS = {"textbox", "date", "mail", "dropdown", "radio"}
    BOOLEAN_FIELDS = {"checkbox", "approval"}
    ATTACHMENT_FIELDS = {"attachment"}
    
    # Separate fields by completion status
    completed_fields = [f for f in enriched_fields if f.get("is_completed", False)]
    incomplete_fields = [f for f in enriched_fields if not f.get("is_completed", False)]
    
    print(f"View - Total fields: {len(enriched_fields)}")
    print(f"  - Completed: {len(completed_fields)}")
    print(f"  - Incomplete: {len(incomplete_fields)}")
    
    # Log field types for debugging
    for field in completed_fields:
        field_type = field.get("type", "")
        has_image = False
        if field_type in IMAGE_FIELDS:
            value = field.get("display_value") or field.get("value")
            if isinstance(value, dict) and value.get("image"):
                has_image = True
            elif isinstance(value, str) and value.startswith("data:image"):
                has_image = True
        print(f"  - Field {field_type}: completed={field.get('is_completed')}, has_image={has_image}")
    
    # Handle different preview types
    if preview_type == "signed":
        # Show ONLY completed fields
        pdf_bytes = apply_completed_fields_only(pdf_bytes, completed_fields, IMAGE_FIELDS)
        
    elif preview_type == "fields":
        # Show ONLY field placeholders
        if show_placeholders:
            pdf_bytes = apply_field_placeholders_only(
                pdf_bytes, 
                incomplete_fields if show_placeholders else enriched_fields,
                use_recipient_colors=use_recipient_colors,
                show_values=(render_type != "placeholders")
            )
    
    else:  # preview_type == "all" (default)
        # Apply completed fields FIRST
        if include_signatures and completed_fields:
            pdf_bytes = apply_all_completed_fields(pdf_bytes, completed_fields, IMAGE_FIELDS)
        
        # Apply placeholders for incomplete fields if requested
        if show_fields and show_placeholders and incomplete_fields:
            print(f"Applying {len(incomplete_fields)} incomplete fields as placeholders")
            
            pdf_bytes = apply_field_placeholders_only(
                pdf_bytes, 
                incomplete_fields,
                use_recipient_colors=use_recipient_colors,
                show_values=(render_type != "placeholders")
            )

    # Apply status-based watermarks
    pdf_bytes = apply_status_watermark(pdf_bytes, doc.get("status"))
    
    # Generate filename
    filename_base = doc.get("filename", "document").rsplit(".", 1)[0]
    preview_suffix = {
        "all": "preview",
        "signed": "signed",
        "fields": "fields"
    }.get(preview_type, "view")
    filename = f"{filename_base}_{preview_suffix}.pdf"
    
    # Log the view
    _log_event(
        doc_id,
        user,
        "view_document",
        {
            "preview_type": preview_type,
            "show_fields": show_fields,
            "include_signatures": include_signatures,
            "show_placeholders": show_placeholders,
            "completed_count": len(completed_fields),
            "incomplete_count": len(incomplete_fields),
            "envelope_id": envelope_id
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )



@router.get("/{doc_id}/signed-preview")
async def view_signed_preview(
    request: Request,
    doc_id: str,
    include_audit_trail: bool = Query(True, description="Include audit footer"),
    include_all_fields: bool = Query(True, description="Include all field types"),
    show_envelope_header: bool = Query(True, description="Show envelope ID in header")
):
    """
    View the fully signed document with ALL completed signatures and form fields.
    Image fields (signature, initials, stamp) are properly rendered.
    """
    user = await get_user_from_request(request)

    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    # Check permissions
    is_owner = doc.get("owner_id") == ObjectId(user["id"])
    is_recipient = db.recipients.find_one({
        "document_id": ObjectId(doc_id), 
        "email": user.get("email")
    })
    
    is_admin = user.get("role") == "admin"
    if not is_owner and not is_recipient and not is_admin:
        raise HTTPException(403, "Not authorized")

    # Get all completed fields (or all fields if requested)
    query = {
        "document_id": ObjectId(doc_id),
        "completed_at": {"$exists": True}
    }
    
    if not include_all_fields:
        # Only get fields that should be visible in signed preview
        query["type"] = {"$nin": ["attachment"]}  # Exclude attachment fields
    
    completed_fields = list(db.signature_fields.find(query))
    
    if not completed_fields:
        # If no completed fields, get placeholder fields for preview
        completed_fields = list(db.signature_fields.find({
            "document_id": ObjectId(doc_id)
        }).limit(10))  # Limit to avoid excessive processing
    
    # Enrich fields with consistent normalization
    enriched_fields = []
    for field in completed_fields:
        enriched = serialize_field_with_recipient(field)
        enriched["is_completed"] = field.get("completed_at") is not None
        enriched["display_value"] = normalize_field_value(field)
        enriched["value"] = field.get("value")
        
        # Ensure proper rendering flags
        enriched["_render_completed"] = True
        enriched["show_placeholder"] = False
        enriched["is_placeholder"] = False
        
        enriched_fields.append(enriched)
    
    print(f"Signed preview - Processing {len(enriched_fields)} fields")
    
    # Load base PDF
    pdf_bytes = load_document_pdf(doc, doc_id)
    
    # Apply envelope header if envelope ID exists
    envelope_id = doc.get("envelope_id")
    if show_envelope_header and envelope_id:
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    
    # Process all field types
    signatures = []
    form_fields = []
    
    for field in enriched_fields:
        field_type = field.get("type", "")
        field_value = field.get("display_value") or field.get("value")
        
        if field_type in IMAGE_FIELDS:
            # Handle image-based fields
            image_data = extract_image_data(field_value)
            if image_data:
                signatures.append({
                    "field_id": field["id"],
                    "image": image_data,
                    "page": field.get("page", 0),
                    "x": field.get("pdf_x") if field.get("pdf_x") is not None else field.get("x", 0),
                    "y": field.get("pdf_y") if field.get("pdf_y") is not None else field.get("y", 0),
                    "width": field.get("pdf_width") or field.get("width", 100),
                    "height": field.get("pdf_height") or field.get("height", 30),
                    "opacity": 1.0,
                    "is_completed": True,
                    "pdf_x": field.get("pdf_x"),
                    "pdf_y": field.get("pdf_y"),
                    "pdf_width": field.get("pdf_width"),
                    "pdf_height": field.get("pdf_height"),
                    "canvas_width": field.get("canvas_width"),
                    "canvas_height": field.get("canvas_height")
                })
                print(f"  - Added {field_type} image for field {field['id']}")
            else:
                print(f"  - No image data for {field_type} field {field['id']}, value: {type(field_value)}")
        else:
            # Handle all other field types
            printable_value = extract_printable_value(field_value)
            if printable_value not in [None, ""]:
                form_field = create_form_field_data(field, printable_value)
                form_fields.append(form_field)
                preview_value = str(printable_value)
                print(f"  - Added {field_type} form field with value: {preview_value[:50]}")
    
    print(f"Processing {len(signatures)} signatures and {len(form_fields)} form fields")
    
    # Apply form fields first (text appears under signatures)
    if form_fields:
        pdf_bytes = PDFEngine.apply_form_fields_with_values(pdf_bytes, form_fields)
    
    # Apply signatures on top
    if signatures:
        pdf_bytes = PDFEngine.apply_signatures_with_field_positions(
            pdf_bytes,
            signatures,
            enriched_fields  # Pass field data for coordinate context
        )
    
    # Add audit trail if requested
    # if include_audit_trail:
    #     pdf_bytes = PDFEngine.apply_audit_footer(
    #         pdf_bytes,
    #         user.get("email", "unknown"),
    #         request.client.host if request and request.client else "0.0.0.0",
    #         datetime.utcnow().isoformat()
    #     )
    
    # Apply "SIGNED" watermark if all recipients completed
    all_recipients = list(db.recipients.find({"document_id": ObjectId(doc_id)}))
    all_completed = all(r.get("status") == "completed" for r in all_recipients)
    
    if all_completed:
        pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, "SIGNED")
    elif doc.get("status") == "in_progress":
        pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, "IN PROGRESS")
    elif doc.get("status") == "completed":
        pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, "FINAL")
    
    filename = f"{doc.get('filename', 'document').rsplit('.', 1)[0]}_signed_preview.pdf"
    
    # Log the view
    _log_event(
        doc_id,
        user,
        "view_signed_preview",
        {
            "include_audit_trail": include_audit_trail,
            "include_all_fields": include_all_fields,
            "show_envelope_header": show_envelope_header,
            "envelope_id": envelope_id,
            "field_count": len(enriched_fields),
            "signature_count": len(signatures),
            "form_field_count": len(form_fields)
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
    
@router.get("/{document_id}/view-with-fields")
async def view_document_with_fields(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    preview_type: str = Query("overlay", description="'overlay' or 'final'"),
    show_envelope_header: bool = Query(True, description="Show envelope ID in header")
):
    """
    View document with field overlays or final signatures.
    """
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(404, "Document not found")
    
    # Get all fields with recipient info
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(document_id)
    }))
    
    enriched_fields = []
    for field in fields:
        enriched = serialize_field_with_recipient(field)
        enriched_fields.append(enriched)
    
    # Load PDF
    if preview_type == "final" and doc.get("signed_pdf_path"):
        pdf_bytes = storage.download(doc["signed_pdf_path"])
    else:
        pdf_bytes = load_document_pdf(doc, document_id)
        
        # Apply field overlays
        if enriched_fields:
            pdf_bytes = PDFEngine.apply_field_placeholders(pdf_bytes, enriched_fields)
    
    # Apply envelope header if envelope ID exists
    envelope_id = doc.get("envelope_id")
    if show_envelope_header and envelope_id:
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    
    filename = f"{doc['filename'].rsplit('.', 1)[0]}_with_fields.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )

@router.get("/{doc_id}/field-preview")
async def view_field_preview(
    request: Request,
    doc_id: str,
    show_values: bool = Query(True, description="Show field values if completed"),
    highlight_incomplete: bool = Query(True, description="Highlight incomplete fields"),
    show_envelope_header: bool = Query(True, description="Show envelope ID in header")  # NEW
):
    """
    Optimized field preview showing all fields with clear visual indicators.
    Completed fields show values, incomplete fields show placeholders.
    """
    user = await get_user_from_request(request)

    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    # Owner only for field preview
    if doc.get("owner_id") != ObjectId(user["id"]):
        raise HTTPException(403, "Only document owner can view field preview")

    # Get all fields
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id)
    }))
    
    # Enrich fields
    enriched_fields = []
    for field in fields:
        enriched = serialize_field_with_recipient(field)
        enriched["is_completed"] = field.get("completed_at") is not None
        
        # ALWAYS normalize completed field values
        if enriched.get("is_completed"):
            enriched["display_value"] = normalize_field_value(field)
                
        enriched_fields.append(enriched)
    
    # Load PDF
    pdf_bytes = load_document_pdf(doc, doc_id)

    
    # ============================================
    # NEW: Apply envelope header if envelope ID exists
    # ============================================
    envelope_id = doc.get("envelope_id")
    if show_envelope_header and envelope_id:
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    
    # Separate completed and incomplete fields
    completed_fields = [f for f in enriched_fields if f.get("is_completed", False)]
    incomplete_fields = [f for f in enriched_fields if not f.get("is_completed", False)]
    
    # Apply completed field values if requested
    if show_values and completed_fields:
        field_data = []
        for field in completed_fields:
            render_data = get_field_render_data(field)
            render_data["is_completed"] = True
            render_data["_render_completed"] = True 
            field_data.append(render_data)
        
        pdf_bytes = PDFEngine.apply_all_fields(pdf_bytes, field_data)
    
    # Apply placeholders for all fields
    # Note: Completed fields won't get borders/backgrounds in apply_field_placeholders
    if enriched_fields:
        pdf_bytes = PDFEngine.apply_field_placeholders(
            pdf_bytes, 
            enriched_fields,
            show_values=show_values,
            highlight_incomplete=highlight_incomplete
        )
    
    # Add preview watermark
    if doc.get("status") == "draft":
        pdf_bytes = PDFEngine.apply_watermark(pdf_bytes, "FIELD PREVIEW")
    
    filename = f"{doc.get('filename', 'document').rsplit('.', 1)[0]}_field_preview.pdf"
    
    # Log the view
    _log_event(
        doc_id,
        user,
        "view_field_preview",
        {
            "show_values": show_values,
            "highlight_incomplete": highlight_incomplete,
            "show_envelope_header": show_envelope_header,
            "envelope_id": envelope_id,
            "completed_count": len(completed_fields),
            "incomplete_count": len(incomplete_fields)
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )  

# -----------------------------
# VOID DOCUMENT (prevent further signing)
# -----------------------------
@router.post("/{document_id}/void")
async def void_document(document_id: str, current_user: dict = Depends(get_current_user), request: Request = None):
    doc = db.documents.find_one({"_id": ObjectId(document_id), "owner_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") == "voided":
        raise HTTPException(status_code=400, detail="Document already voided")

    db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": {"status": "voided", "voided_at": datetime.utcnow()}})
    _log_event(document_id, current_user, "void_document", request=request)
    return {"message": "Document voided successfully"}

@router.post("/{document_id}/unvoid")
async def unvoid_document(
    request: Request,
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    doc = db.documents.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") != "voided":
        raise HTTPException(status_code=400, detail="Document is not voided")

    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"status": "draft", "unvoided_at": datetime.utcnow()}}
    )

    _log_event(document_id, current_user, "unvoid_document", request=request)

    return {"message": "Void canceled. Document is now draft."}

# -----------------------------
# RESTORE (from deleted or voided)
# -----------------------------
@router.post("/{document_id}/restore")
async def restore_document(document_id: str, current_user: dict = Depends(get_current_user), request: Request = None):
    doc = db.documents.find_one({"_id": ObjectId(document_id), "owner_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.get("status") not in ["deleted", "voided"]:
        raise HTTPException(status_code=400, detail="Document cannot be restored")

    db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": {"status": "draft", "restored_at": datetime.utcnow()}})
    _log_event(document_id, current_user, "restore_document", request=request)
    return {"message": "Document restored successfully"}



@router.post("/signing/recipient/{recipient_id}/decline")
async def decline_document(
    recipient_id: str,
    payload: DeclinePayload,
    request: Request ,
    current_user: dict = Depends(get_current_user),
    
):
    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(400, "Invalid recipient ID")

    recipient = db.recipients.find_one({
        "_id": rid,
        "email": current_user["email"]
    })
    if not recipient:
        raise HTTPException(403, "Not authorized")

    if recipient["status"] in ["completed", "declined", "expired"]:
        raise HTTPException(400, "Cannot decline at this stage")

    doc = db.documents.find_one({"_id": recipient["document_id"]})
    guard_document_active(doc)

    if doc["status"] not in ["sent", "in_progress"]:
        raise HTTPException(400, "Document is not active")

    now = datetime.utcnow()

    # 1️⃣ Mark recipient declined
    db.recipients.update_one(
        {"_id": rid},
        {"$set": {
            "status": "declined",
            "declined_at": now,
            "decline_reason": payload.reason
        }}
    )

    # 2️⃣ Expire all other pending recipients
    db.recipients.update_many(
        {
            "document_id": doc["_id"],
            "_id": {"$ne": rid},
            "status": {"$nin": ["completed", "declined"]}
        },
        {"$set": {"status": "expired", "expired_at": now}}
    )

    # 3️⃣ Auto-cancel document
    db.documents.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "status": "declined",
            "declined_at": now
        }}
    )

    # 4️⃣ Audit log
    _log_event(
        str(doc["_id"]),
        current_user,
        "recipient_declined",
        {"reason": payload.reason},
        request
    )

    return {"message": "Document declined successfully"}



@router.post("/{document_id}/set-expiry")
async def set_document_expiry(
    document_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if not doc:
        raise HTTPException(404, "Document not found")

    if doc["status"] not in ["draft", "sent", "in_progress"]:
        raise HTTPException(
            400,
            "Cannot set expiry for completed, declined, expired, or deleted documents"
        )

    expiry_days = payload.get("expiry_days")

    # 🔹 Remove expiry
    if expiry_days is None:
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$unset": {"expires_at": "", "expiry_days": ""}}
        )

        _log_event(
            document_id,
            current_user,
            "expiry_removed",
            request=request
        )

        return {"message": "Expiry removed successfully"}

    # 🔹 Validate expiry days
    try:
        expiry_days = int(expiry_days)
        if expiry_days <= 0:
            raise ValueError()
    except:
        raise HTTPException(400, "expiry_days must be a positive integer")

    expires_at = datetime.utcnow() + timedelta(days=expiry_days)

    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {
            "expires_at": expires_at,
            "expiry_days": expiry_days,
            "expiry_updated_at": datetime.utcnow()
        }}
    )

    _log_event(
        document_id,
        current_user,
        "expiry_set",
        {"expiry_days": expiry_days, "expires_at": expires_at.isoformat()},
        request
    )

    return {
        "message": "Expiry set successfully",
        "expires_at": expires_at.isoformat()
    }


@router.put("/{document_id}/envelope-id")
async def set_envelope_id(
    document_id: str,
    payload: dict,  # {"envelope_id": "your-envelope-id"}
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Set or update envelope ID for a document.
    """
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    envelope_id = payload.get("envelope_id")
    
    if not envelope_id:
        raise HTTPException(status_code=400, detail="envelope_id is required")
    
    # Validate envelope ID format (optional)
    if not envelope_id.startswith("ENV-"):
        raise HTTPException(
            status_code=400,
            detail="Envelope ID should start with 'ENV-'"
        )
    
    # Check if envelope_id already exists for another document
    if not validate_envelope_id(envelope_id, document_id):
        raise HTTPException(
            status_code=400,
            detail=f"Envelope ID '{envelope_id}' is already in use by another document"
        )
    
    # Update document with envelope_id
    update_data = {
        "envelope_id": envelope_id,
        "envelope_auto_generated": False,
        "envelope_updated_at": datetime.utcnow()
    }
    
    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": update_data}
    )
    
    _log_event(
        document_id,
        current_user,
        "set_envelope_id",
        {"envelope_id": envelope_id},
        request
    )
    
    return {"message": "Envelope ID set successfully", "envelope_id": envelope_id}

@router.delete("/{document_id}/envelope-id")
async def remove_envelope_id(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Remove envelope ID from a document.
    """
    doc = db.documents.find_one({
        "_id": ObjectId(document_id),
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not doc.get("envelope_id"):
        raise HTTPException(status_code=400, detail="Document has no envelope ID")
    
    # Remove envelope_id
    db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {"$unset": {"envelope_id": ""}}
    )
    
    _log_event(
        document_id,
        current_user,
        "remove_envelope_id",
        request=request
    )
    
    return {"message": "Envelope ID removed successfully"}

@router.get("/by-envelope/{envelope_id}")
async def get_document_by_envelope_id(
    envelope_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get document by envelope ID.
    """
    doc = db.documents.find_one({
        "envelope_id": envelope_id,
        "owner_id": ObjectId(current_user["id"])
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return serialize_document(doc)

@router.get("/search/envelope")
async def search_by_envelope_id(
    envelope_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Search documents by envelope ID (partial match).
    """
    query = {
        "owner_id": ObjectId(current_user["id"]),
        "envelope_id": {"$regex": envelope_id, "$options": "i"}
    }
    
    docs = db.documents.find(query).sort("uploaded_at", -1).skip(skip).limit(limit)
    
    return [serialize_document(d) for d in docs]

@router.get("/{doc_id}/envelope-preview")
async def view_document_with_envelope(
    request: Request,
    doc_id: str,
    show_fields: bool = Query(True, description="Show field overlays"),
    header_style: str = Query("full", description="Header style: 'full', 'minimal', or 'none'"),
    include_recipients: bool = Query(True, description="Show recipient info in header")
):
    """
    Preview document with Docusign-like envelope header showing envelope ID.
    """
    user = await get_user_from_request(request)

    # Get document
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    # Check permissions
    is_owner = doc.get("owner_id") == ObjectId(user["id"])
    is_recipient = db.recipients.find_one({
        "document_id": ObjectId(doc_id), 
        "email": user.get("email")
    })
    
    is_admin = user.get("role") == "admin"
    if not is_owner and not is_recipient and not is_admin:
        raise HTTPException(403, "Not authorized")

    # Check if envelope ID exists
    envelope_id = doc.get("envelope_id")
    if not envelope_id:
        raise HTTPException(400, "Document has no envelope ID")

    # Get document data for header
    document_name = doc.get("filename", "Document")
    status = doc.get("status", "draft").replace("_", " ").title()
    
    # Get sender info
    sender_email = doc.get("owner_email", user.get("email", ""))
    sender_name = ""
    
    # Try to get sender name from users collection
    user_record = db.users.find_one({"_id": ObjectId(user["id"])})
    if user_record:
        sender_name = user_record.get("full_name") or user_record.get("name") or sender_email
    
    # Format dates
    created_date = doc.get("uploaded_at")
    if created_date:
        created_date = created_date.strftime("%Y-%m-%d") if hasattr(created_date, 'strftime') else str(created_date)[:10]
    
    expires_date = doc.get("expires_at")
    if expires_date:
        expires_date = expires_date.strftime("%Y-%m-%d") if hasattr(expires_date, 'strftime') else str(expires_date)[:10]
    
    # Get all fields for rendering
    fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id)
    }))
    
    # Get all recipients for header
    recipients_list = []
    if include_recipients:
        recipients = list(db.recipients.find({
            "document_id": ObjectId(doc_id)
        }))
        
        for r in recipients:
            recipients_list.append({
                "name": r.get("name", ""),
                "email": r.get("email", ""),
                "role": r.get("role", "signer"),
                "status": r.get("status", "created")
            })
    
    # Enrich fields
    enriched_fields = []
    for field in fields:
        enriched = serialize_field_with_recipient(field)
        enriched["is_completed"] = field.get("completed_at") is not None
        
        # ALWAYS normalize completed field values
        if enriched.get("is_completed"):
            enriched["display_value"] = normalize_field_value(field)
        
        enriched_fields.append(enriched)
    
    # Load base PDF
    pdf_bytes = load_document_pdf(doc, doc_id)

    
    # Apply envelope header
    if header_style == "full":
        # Apply full Docusign-like header
        pdf_bytes = PDFEngine.apply_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            document_name=document_name,
            status=status,
            sender=sender_name or sender_email,
            created_date=created_date,
            expires_date=expires_date,
            color="#000000"  
        )
    elif header_style == "minimal":
        # Apply minimal header
        pdf_bytes = PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )
    # else "none" - no header
    
    # Apply field placeholders if requested
    if show_fields and enriched_fields:
        pdf_bytes = PDFEngine.apply_field_placeholders(
            pdf_bytes, 
            enriched_fields,
            show_values=True,
            highlight_incomplete=True,
            # border_style="professional",
            use_recipient_colors=True
        )
    
    # Apply completed fields
    completed_fields = [f for f in enriched_fields if f.get("is_completed", False)]
    if completed_fields:
        field_data = []
        for field in completed_fields:
            render_data = get_field_render_data(field)
            render_data["is_completed"] = True
            render_data["_render_completed"] = True 
            field_data.append(render_data)
        
        pdf_bytes = PDFEngine.apply_all_fields(pdf_bytes, field_data)
    
    filename = f"{doc.get('filename', 'document').rsplit('.', 1)[0]}_envelope_{envelope_id}.pdf"
    
    # Log the view
    _log_event(
        doc_id,
        user,
        "view_envelope_preview",
        {
            "envelope_id": envelope_id,
            "header_style": header_style,
            "show_fields": show_fields,
            "include_recipients": include_recipients
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@router.get("/{doc_id}/final-with-envelope")
async def get_final_document_with_envelope(
    request: Request,
    doc_id: str,
    include_audit_trail: bool = Query(True, description="Include audit footer")
):
    """
    Get final signed document with envelope header.
    This is the version to send to recipients.
    """
    user = await get_user_from_request(request)

    # Get document
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")

    # Check permissions (owner only for final)
    if doc.get("owner_id") != ObjectId(user["id"]):
        raise HTTPException(403, "Only document owner can generate final version")

    # Check if envelope ID exists
    envelope_id = doc.get("envelope_id")
    if not envelope_id:
        raise HTTPException(400, "Document has no envelope ID")

    # Get completed fields
    completed_fields = list(db.signature_fields.find({
        "document_id": ObjectId(doc_id),
        "completed_at": {"$exists": True}
    }))
    
    # Load base PDF
    pdf_bytes = load_document_pdf(doc, doc_id)

    
    # Apply completed fields
    if completed_fields:
        field_data = []
        for field in completed_fields:
            enriched = serialize_field_with_recipient(field)
            enriched["is_completed"] = True

            render_data = get_field_render_data(enriched)
            render_data["_render_completed"] = True
            render_data["is_completed"] = True

            field_data.append(render_data)

        
        pdf_bytes = PDFEngine.apply_all_fields(pdf_bytes, field_data)
    
    # Apply envelope header
    document_name = doc.get("filename", "Document")
    status = "COMPLETED" if doc.get("status") == "completed" else doc.get("status", "draft").replace("_", " ").upper()
    
    # Get sender info
    sender_email = doc.get("owner_email", user.get("email", ""))
    sender_name = ""
    user_record = db.users.find_one({"_id": ObjectId(user["id"])})
    if user_record:
        sender_name = user_record.get("full_name") or user_record.get("name") or sender_email
    
    # Format dates
    created_date = doc.get("uploaded_at")
    if created_date:
        created_date = created_date.strftime("%Y-%m-%d") if hasattr(created_date, 'strftime') else str(created_date)[:10]
    
    completed_date = doc.get("completed_at") or doc.get("updated_at")
    if completed_date:
        completed_date = completed_date.strftime("%Y-%m-%d") if hasattr(completed_date, 'strftime') else str(completed_date)[:10]
    
    pdf_bytes = PDFEngine.apply_envelope_header(
        pdf_bytes,
        envelope_id=envelope_id,
        document_name=document_name,
        status=status,
        sender=sender_name or sender_email,
        created_date=created_date,
        expires_date=completed_date,  # Show completion date instead of expiry
        color="#0d9488"
    )
    
    # Add audit trail if requested
    if include_audit_trail:
        pdf_bytes = PDFEngine.apply_audit_footer(
            pdf_bytes,
            user.get("email", "unknown"),
            request.client.host if request and request.client else "0.0.0.0",
            datetime.utcnow().isoformat()
        )
    
    filename = f"{document_name.rsplit('.', 1)[0]}_envelope_{envelope_id}_final.pdf"
    
    # Log the generation
    _log_event(
        doc_id,
        user,
        "generate_final_with_envelope",
        {
            "envelope_id": envelope_id,
            "include_audit_trail": include_audit_trail
        },
        request
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
    
    
@router.get("/{document_id}/download/certificate")
async def download_certificate_owner(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None,
    include_timeline: bool = Query(True, description="Include detailed field completion timeline")
):
    """
    Download professional Certificate of Completion for document owner.
    Same professional design as recipient certificate.
    """
    try:
        # Validate document ID
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            raise HTTPException(400, "Invalid document ID format")
        
        # Get document
        doc = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Check if document is completed
        doc_status = doc.get("status")
        if doc_status != "completed":
            raise HTTPException(
                400, 
                f"Certificate can only be generated for completed documents. Current status: {doc_status}"
            )
        
        # ========== GATHER ALL DOCUMENT DATA (same as recipient) ==========
        
        # Get all recipients
        recipients = list(db.recipients.find({
            "document_id": doc_oid
        }).sort("signing_order", 1))
        
        # Get all fields
        all_fields = list(db.signature_fields.find({
            "document_id": doc_oid
        }))
        
        # Get completed fields
        completed_fields = [f for f in all_fields if f.get("completed_at")]
        
        # Calculate detailed field statistics
        total_signatures = len([f for f in all_fields if f.get("type") in ["signature", "witness_signature"]])
        completed_signatures = len([f for f in completed_fields if f.get("type") in ["signature", "witness_signature"]])
        
        total_initials = len([f for f in all_fields if f.get("type") == "initials"])
        completed_initials = len([f for f in completed_fields if f.get("type") == "initials"])
        
        total_form_fields = len([f for f in all_fields if f.get("type") in ["textbox", "date", "mail", "dropdown"]])
        completed_form_fields = len([f for f in completed_fields if f.get("type") in ["textbox", "date", "mail", "dropdown"]])
        
        total_checkboxes = len([f for f in all_fields if f.get("type") in ["checkbox", "radio"]])
        completed_checkboxes = len([f for f in completed_fields if f.get("type") in ["checkbox", "radio"]])
        
        # Get owner/user details
        owner_name = ""
        owner_record = db.users.find_one({"_id": doc.get("owner_id")})
        if owner_record:
            owner_name = owner_record.get("full_name") or owner_record.get("name") or doc.get("owner_email", "")
        
        # Get sender IP from document creation
        sender_ip = None
        creation_log = db.document_timeline.find_one({
            "document_id": doc_oid,
            "action": "upload_document"
        })
        if creation_log and creation_log.get("metadata"):
            sender_ip = creation_log["metadata"].get("ip") or creation_log.get("metadata", {}).get("ip_address")
        
        # Prepare recipients with detailed completion data
        recipients_data = []
        for r in recipients:
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
            })
        
        # Prepare field completion history
        field_history = []
        if include_timeline:
            for field in completed_fields[:25]:
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
            
            field_history.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
        
        # Format dates
        created_date = doc.get("uploaded_at")
        created_date_str = created_date.strftime("%B %d, %Y") if created_date else "Unknown"
        
        completed_date = doc.get("completed_at") or doc.get("finalized_at")
        completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M %p") if completed_date else "Unknown"
        
        # Generate unique certificate ID
        certificate_id = f"CERT-{doc.get('envelope_id', uuid.uuid4().hex[:8])}-{datetime.utcnow().strftime('%Y%m%d')}"
        
        # ========== PREPARE CERTIFICATE DATA ==========
        certificate_data = {
            "envelope_id": doc.get("envelope_id", "N/A"),
            "document_name": doc.get("filename", "Unknown Document"),
            "document_id": str(doc["_id"]),
            "page_count": doc.get("page_count", 0),
            "status": doc_status,
            
            # Dates
            "created_date": created_date_str,
            "completed_date": completed_date_str,
            
            # Owner information
            "owner_name": owner_name or doc.get("owner_email", ""),
            "owner_email": doc.get("owner_email", current_user.get("email", "")),
            "owner_ip": sender_ip or "Unknown",
            
            # Statistics
            "statistics": {
                "total_recipients": len(recipients),
                "completed_recipients": len([r for r in recipients if r.get("status") == "completed"]),
                "total_fields": len(all_fields),
                "completed_fields": len(completed_fields),
                "completion_percentage": round((len(completed_fields) / len(all_fields) * 100), 1) if all_fields else 0,
                
                "total_signatures": total_signatures,
                "signatures_completed": completed_signatures,
                "signatures_percentage": int((completed_signatures / total_signatures * 100)) if total_signatures > 0 else 0,
                
                "total_initials": total_initials,
                "initials_completed": completed_initials,
                "initials_percentage": int((completed_initials / total_initials * 100)) if total_initials > 0 else 0,
                
                "total_form_fields": total_form_fields,
                "form_fields_completed": completed_form_fields,
                "form_fields_percentage": int((completed_form_fields / total_form_fields * 100)) if total_form_fields > 0 else 0,
                
                "total_checkboxes": total_checkboxes,
                "checkboxes_completed": completed_checkboxes,
                "checkboxes_percentage": int((completed_checkboxes / total_checkboxes * 100)) if total_checkboxes > 0 else 0,
            },
            
            # Recipients
            "recipients": recipients_data,
            
            # Field history
            "field_history": field_history if include_timeline else [],
            
            # Certificate metadata
            "certificate_id": certificate_id,
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": current_user.get("email", "unknown"),
            "platform": "SafeSign Professional"
        }
        
        # ========== GENERATE PROFESSIONAL CERTIFICATE PDF ==========
        try:
            pdf_bytes = ProfessionalCertificateEngine.create_certificate_pdf(certificate_data)
        except Exception as e:
            print(f"Error creating certificate PDF: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Use fallback
            from reportlab.pdfgen import canvas
            
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            c.setFillColor(colors.HexColor(ProfessionalCertificateEngine.BRAND_PRIMARY))
            c.rect(0, height - 60, width, 60, fill=1, stroke=0)
            
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 20)
            c.drawString(50, height - 40, "SafeSign")
            c.drawString(width - 200, height - 40, "CERTIFICATE OF COMPLETION")
            
            c.setFillColor(colors.black)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, height - 100, f"Document: {doc.get('filename', 'Unknown')}")
            
            c.setFont("Helvetica", 11)
            c.drawString(50, height - 130, f"Envelope ID: {doc.get('envelope_id', 'N/A')}")
            c.drawString(50, height - 150, f"Completed: {completed_date_str}")
            c.drawString(50, height - 170, f"Total Signers: {len(recipients)}")
            c.drawString(50, height - 190, f"Certificate ID: {certificate_id}")
            
            c.setFont("Helvetica", 9)
            c.drawString(50, 50, f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %I:%M:%S %p UTC')}")
            c.drawString(50, 30, "Verified by SafeSign Secure Digital Signature Platform")
            
            c.save()
            buffer.seek(0)
            pdf_bytes = buffer.read()
        
        # ========== CREATE FILENAME ==========
        safe_name = re.sub(r'[^\w\s-]', '', doc.get('filename', 'document'))
        base_name = safe_name.rsplit('.', 1)[0][:40]
        envelope_short = doc.get('envelope_id', certificate_id)[-8:]
        
        filename = f"SafeSign_Certificate_{envelope_short}_{base_name}.pdf"
        filename = re.sub(r'\s+', '_', filename)
        
        # ========== LOG THE DOWNLOAD ==========
        try:
            _log_event(
                str(doc["_id"]),
                current_user,
                "download_certificate",
                {
                    "download_type": "certificate",
                    "filename": filename,
                    "envelope_id": doc.get("envelope_id"),
                    "certificate_id": certificate_id,
                    "total_recipients": len(recipients),
                    "total_fields": len(completed_fields)
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
                "X-Envelope-ID": doc.get("envelope_id", "none"),
                "X-Certificate-ID": certificate_id,
                "X-Document-Status": "completed",
                "X-Generated-At": certificate_data["generated_at"]
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading certificate: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading certificate")  
       
@router.post("/{document_id}/email")
async def email_document_owner(
    document_id: str,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Email the document to specified recipients.
    Includes ALL completed signatures and form fields.
    """
    try:
        doc_oid = ObjectId(document_id)
        
        # Get document
        doc = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Get recipients from payload
        recipients_list = payload.get("recipients", [])
        if not recipients_list:
            raise HTTPException(400, "At least one recipient is required")
        
        # Validate email addresses
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        valid_recipients = []
        
        for recipient in recipients_list:
            email = recipient.get("email", "").strip()
            if not email:
                continue
                
            if not re.match(email_pattern, email):
                raise HTTPException(400, f"Invalid email address: {email}")
            
            valid_recipients.append({
                "email": email,
                "name": recipient.get("name", "").strip() or email.split('@')[0]
            })
        
        if not valid_recipients:
            raise HTTPException(400, "No valid email addresses provided")
        
        # Load base PDF from Azure
        pdf_path = doc.get("pdf_file_path")
        if not pdf_path:
            raise HTTPException(404, "PDF not found")
        
        try:
            pdf_bytes = storage.download(pdf_path)
        except Exception as e:
            print(f"Error reading PDF: {str(e)}")
            raise HTTPException(404, "PDF file not found in storage")
        
        # APPLY COMPLETED FIELDS (CRITICAL FIX)
        pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, document_id, doc)
        
        # Add envelope header if exists
        envelope_id = doc.get("envelope_id")
        if envelope_id:
            try:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#000000"
                )
            except Exception as e:
                print(f"Warning: Could not apply envelope header: {str(e)}")
        
        # Prepare email content
        subject = payload.get("subject", f"Document: {doc.get('filename', 'Document')}")
        body = payload.get("body", "Please find the attached document.")
        
        if envelope_id:
            body += f"\n\nEnvelope ID: {envelope_id}"
        
        sender_email = current_user.get("email", "noreply@example.com")
        sender_name = current_user.get("name", "Document Sender")
        
        from .email_service import send_document_email
        
        success_count = 0
        failed_recipients = []
        
        for recipient in valid_recipients:
            try:
                success = send_document_email(
                    to_email=recipient["email"],
                    to_name=recipient["name"],
                    sender_email=sender_email,
                    sender_name=sender_name,
                    subject=subject,
                    body=body,
                    document_name=doc.get("filename", "document.pdf"),
                    pdf_bytes=pdf_bytes,
                    envelope_id=envelope_id
                )
                
                if success:
                    success_count += 1
                else:
                    failed_recipients.append(recipient["email"])
            except Exception as e:
                print(f"Error sending email to {recipient.get('email')}: {str(e)}")
                failed_recipients.append(recipient["email"])
        
        # Log the email event
        _log_event(
            str(doc["_id"]),
            current_user,
            "email_document",
            {
                "recipients_count": len(valid_recipients),
                "success_count": success_count,
                "failed_recipients": failed_recipients,
                "subject": subject,
                "envelope_id": envelope_id
            },
            request
        )
        
        response_data = {
            "message": f"Document sent to {success_count} recipient(s) successfully",
            "total_recipients": len(valid_recipients),
            "success_count": success_count
        }
        
        if failed_recipients:
            response_data["failed_recipients"] = failed_recipients
        
        return response_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error emailing document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while emailing document")
       
@router.get("/{document_id}/download/signed")
async def download_signed_document_owner(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Download signed document for document owner.
    Includes ALL completed signatures and form fields.
    """
    try:
        # Validate document ID
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            raise HTTPException(400, "Invalid document ID format")
        
        # Get document
        doc = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Load base PDF from Azure
        pdf_path = doc.get("pdf_file_path")
        if not pdf_path:
            raise HTTPException(404, "PDF not found")
        
        try:
            pdf_bytes = storage.download(pdf_path)
        except Exception as e:
            print(f"Error reading PDF: {str(e)}")
            raise HTTPException(404, "PDF file not found in storage")
        
        # APPLY COMPLETED FIELDS (CRITICAL FIX)
        pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, document_id, doc)
        
        # Apply "SIGNED" watermark
        try:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "SIGNED DOCUMENT",
                color="#4CAF50",
                opacity=0.1,
                font_size=48,
                angle=45
            )
        except Exception as e:
            print(f"Warning: Could not apply watermark: {str(e)}")
        
        # Add envelope header if exists
        envelope_id = doc.get("envelope_id")
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
        original_filename = doc.get("filename", "document.pdf")
        base_name = original_filename.rsplit('.', 1)[0]
        filename = f"signed_{base_name}.pdf"
        
        # Log the download
        try:
            _log_event(
                str(doc["_id"]),
                current_user,
                "download_signed_document",
                {
                    "download_type": "signed",
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
                "X-Document-Status": doc.get("status", "unknown"),
                "X-Download-Type": "signed",
                "X-Filename": filename
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading signed document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, "Internal server error while downloading document")
    

@router.get("/{document_id}/download/original")
async def download_original_document_owner(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Download original (unsigned) document for document owner.
    """
    try:
        # Validate document ID
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            raise HTTPException(400, "Invalid document ID format")
        
        # Get document
        doc = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Get original PDF path
        pdf_path = doc.get("pdf_file_path")
        if not pdf_path:
            raise HTTPException(404, "PDF not found")
        
        # Get PDF from Azure Storage
        try:
            pdf_bytes = storage.download(pdf_path)
        except Exception as e:
            print(f"Error reading PDF: {str(e)}")
            raise HTTPException(404, "PDF file not found in storage")
        
        # Apply "ORIGINAL" watermark
        try:
            pdf_bytes = PDFEngine.apply_watermark(
                pdf_bytes,
                "ORIGINAL UNSIGNED COPY",
                color="#666666",
                opacity=0.1,
                font_size=36,
                angle=45
            )
        except Exception as e:
            print(f"Warning: Could not apply watermark: {str(e)}")
        
        # Add envelope header if exists
        envelope_id = doc.get("envelope_id")
        if envelope_id:
            try:
                pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                    pdf_bytes,
                    envelope_id=envelope_id,
                    color="#666666"
                )
            except Exception as e:
                print(f"Warning: Could not apply envelope header: {str(e)}")
        
        # Create filename
        original_filename = doc.get("filename", "document.pdf")
        base_name = original_filename.rsplit('.', 1)[0]
        filename = f"original_{base_name}.pdf"
        
        # Log the download
        try:
            _log_event(
                str(doc["_id"]),
                current_user,
                "download_original_document",
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
                "X-Document-Status": doc.get("status", "unknown"),
                "X-Download-Type": "original",
                "X-Filename": filename
            }
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error downloading original document: {str(e)}")
        raise HTTPException(500, "Internal server error while downloading document")


@router.get("/{document_id}/download/package")
async def download_document_package_owner(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Download full document package (ZIP) for document owner.
    """
    try:
        # Validate document ID
        try:
            doc_oid = ObjectId(document_id)
        except Exception:
            raise HTTPException(400, "Invalid document ID format")
        
        # Get document and verify ownership
        document = db.documents.find_one({
            "_id": doc_oid,
            "owner_id": ObjectId(current_user["id"])
        })
        if not document:
            raise HTTPException(404, "Document not found or you're not the owner")
            
        # Verify document is completed
        if document.get("status") != "completed":
            raise HTTPException(400, "Document package only available after completion")
            
        # Import package generator (inside function to avoid circular imports)
        from .email_service import generate_document_package
        
        # Get overall branding/owner info
        owner = current_user
        sender_email = document.get("owner_email", owner.get("email", ""))
        sender_name = owner.get("full_name", "") or owner.get("name", "")
        sender_organization = owner.get("organization_name", "")
        
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        # Use request.base_url to get current backend URL
        base_url = str(request.base_url).rstrip('/')
        logo_url = f"{base_url}/branding/logo/file" if branding.get("logo_file_path") else None
        
        # Get first recipient for context if needed for summary/certificate
        recipient = db.recipients.find_one({"document_id": doc_oid})
        if not recipient:
            # Fallback to a dummy recipient object for core info if no recipients exist (unlikely for completed)
            recipient = {
                "_id": ObjectId(),
                "name": sender_name,
                "email": sender_email,
                "role": "owner"
            }
        
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
        log_activity(document_id, current_user, "package_downloaded")
        
        # Return ZIP as streaming response
        return StreamingResponse(
            io.BytesIO(package["zip_bytes"]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{package["zip_filename"]}"',
                "Content-Length": str(len(package["zip_bytes"]))
            }
        )
        
    except HTTPException: raise
    except Exception as e:
        print(f"Error generating owner package: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal error during package generation: {str(e)}")


    
    
    
@router.post("/{document_id}/send-completed")
async def send_completed_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Manually trigger sending completed documents to all recipients.
    Only works if document is completed.
    """
    try:
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if doc.get("status") != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot send completed document. Current status: {doc.get('status')}"
            )
        
        # Trigger both completion (Final Copy) for recipients and package ZIP for owner
        from .email_service import send_completed_document_package
        
        background_tasks.add_task(
            send_completed_document_to_recipients,
            document_id=document_id
        )
        
        background_tasks.add_task(
            send_completed_document_package,
            document_id=document_id
        )
        
        _log_event(
            document_id,
            current_user,
            "trigger_completed_document_email",
            request=request
        )
        
        return {
            "message": "Completed document emails are being sent to all recipients",
            "status": "processing"
        }
        
    except Exception as e:
        print(f"Error sending completed document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/search")
async def search_documents(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(8, ge=1, le=20, description="Maximum number of results"),
    current_user: dict = Depends(get_current_user)
):
    """
    Search documents by filename, envelope ID, or content.
    
    Features:
    - General search across filename and envelope_id
    - Advanced search syntax:
      * filename:contract - search by filename
      * status:completed - filter by status
      * envelope:ENV-123 - search by envelope ID
      * date:2024-01 - filter by date (YYYY-MM)
    
    Returns:
        List of matching documents with metadata
    """
    try:
        # Log search request for debugging
        print(f"Search request - Query: '{q}', Limit: {limit}, User: {current_user.get('email')}")
        
        # Initialize search query with owner filter
        search_query = {"owner_id": ObjectId(current_user["id"])}
        
        # Parse search query
        q = q.strip()
        
        # Check if query is empty after stripping
        if not q:
            return []
        
        # Handle advanced search syntax
        if ':' in q and not q.startswith('http'):  # Avoid treating URLs as advanced search
            parts = q.split(':', 1)
            field = parts[0].strip().lower()
            value = parts[1].strip()
            
            print(f"Advanced search - Field: '{field}', Value: '{value}'")
            
            if field == 'filename':
                # Search by filename
                search_query['filename'] = {'$regex': value, '$options': 'i'}
                
            elif field == 'status':
                # Filter by status - check if valid status
                valid_statuses = ['draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'voided', 'deleted']
                if value in valid_statuses:
                    search_query['status'] = value
                else:
                    # Invalid status - return empty results
                    print(f"Invalid status: {value}")
                    return []
                    
            elif field == 'envelope':
                # Search by envelope ID
                search_query['envelope_id'] = {'$regex': value, '$options': 'i'}
                
            elif field == 'date':
                try:
                    # Parse YYYY-MM format
                    year, month = value.split('-')
                    start_date = datetime(int(year), int(month), 1)
                    
                    # Calculate end date (first day of next month)
                    if int(month) == 12:
                        end_date = datetime(int(year) + 1, 1, 1)
                    else:
                        end_date = datetime(int(year), int(month) + 1, 1)
                    
                    search_query['uploaded_at'] = {
                        '$gte': start_date,
                        '$lt': end_date
                    }
                except (ValueError, IndexError) as e:
                    # Invalid date format - fallback to general search
                    print(f"Invalid date format: {value}, error: {e}")
                    search_query['$or'] = [
                        {'filename': {'$regex': q, '$options': 'i'}},
                        {'envelope_id': {'$regex': q, '$options': 'i'}}
                    ]
            else:
                # Unknown field - fallback to general search on the full query
                search_query['$or'] = [
                    {'filename': {'$regex': q, '$options': 'i'}},
                    {'envelope_id': {'$regex': q, '$options': 'i'}}
                ]
        else:
            # General search - search in filename and envelope_id
            search_query['$or'] = [
                {'filename': {'$regex': q, '$options': 'i'}},
                {'envelope_id': {'$regex': q, '$options': 'i'}}
            ]
        
        # Always exclude deleted documents unless specifically searching for them
        if 'status' not in search_query or search_query.get('status') != 'deleted':
            search_query['status'] = {'$ne': 'deleted'}
        
        print(f"MongoDB Query: {search_query}")
        
        # Execute search with sorting
        documents = list(db.documents.find(search_query)
                        .sort([('uploaded_at', -1)])
                        .limit(limit))
        
        print(f"Found {len(documents)} documents")
        
        # Serialize results
        results = []
        for doc in documents:
            try:
                # Get recipient count
                recipient_count = db.recipients.count_documents({
                    "document_id": doc['_id']
                })
                
                # Format uploaded_at
                uploaded_at = doc.get('uploaded_at')
                if uploaded_at:
                    if isinstance(uploaded_at, datetime):
                        uploaded_at = uploaded_at.isoformat()
                
                results.append({
                    'id': str(doc['_id']),
                    'filename': doc.get('filename', 'Untitled'),
                    'uploaded_at': uploaded_at,
                    'status': doc.get('status', 'unknown'),
                    'envelope_id': doc.get('envelope_id'),
                    'recipient_count': recipient_count,
                    'source': doc.get('source', 'local'),
                    'thumbnail': f"/documents/{doc['_id']}/preview",
                    'page_count': doc.get('page_count', 0),
                    'size': doc.get('size', 0)
                })
            except Exception as e:
                print(f"Error serializing document {doc.get('_id')}: {e}")
                continue
        
        return results
        
    except Exception as e:
        print(f"Search error: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of 500 error for better UX
        return []
    
@router.get("/analytics/complete")
async def get_complete_analytics(
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Get complete high-level analytics data for dashboard using high-performance aggregation.
    Consolidates data from documents, recipients, fields, and timeline.
    """
    try:
        owner_id = ObjectId(current_user["id"])
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # 1. Consolidated Document & Recipient Aggregation
        # Using $facet to run multiple independent aggregations in ONE database call
        agg_results = list(db.documents.aggregate([
            {"$match": {"owner_id": owner_id, "status": {"$ne": "deleted"}}},
            {"$facet": {
                "document_stats": [
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}},
                    {"$project": {"status": "$_id", "count": 1, "_id": 0}}
                ],
                "recipient_stats": [
                    {"$lookup": {
                        "from": "recipients",
                        "localField": "_id",
                        "foreignField": "document_id",
                        "as": "recips"
                    }},
                    {"$unwind": "$recips"},
                    {"$group": {
                        "_id": "$recips.status",
                        "count": {"$sum": 1},
                        "total_time": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$eq": ["$recips.status", "completed"]},
                                        {"$gt": ["$recips.sent_at", None]},
                                        {"$or": [{"$gt": ["$recips.signed_at", None]}, {"$gt": ["$recips.completed_at", None]}]}
                                    ]},
                                    {"$divide": [
                                        {"$subtract": [
                                            {"$ifNull": ["$recips.signed_at", "$recips.completed_at"]},
                                            "$recips.sent_at"
                                        ]},
                                        3600000 # convert ms to hours
                                    ]},
                                    0
                                ]
                            }
                        },
                        "comp_count": {
                            "$sum": {"$cond": [{"$eq": ["$recips.status", "completed"]}, 1, 0]}
                        }
                    }}
                ],
                "role_distribution": [
                    {"$lookup": {
                        "from": "recipients",
                        "localField": "_id",
                        "foreignField": "document_id",
                        "as": "recips"
                    }},
                    {"$unwind": "$recips"},
                    {"$group": {"_id": "$recips.role", "count": {"$sum": 1}}}
                ],
                "monthly_trends": [
                    {"$match": {"uploaded_at": {"$gte": now - timedelta(days=180)}}},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$uploaded_at"},
                            "month": {"$month": "$uploaded_at"}
                        },
                        "total": {"$sum": 1},
                        "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1}}
                ]
            }}
        ]))[0]

        # Process Aggregation Results
        doc_stats = {s: 0 for s in DOCUMENT_STATUSES}
        total_docs = 0
        for item in agg_results.get("document_stats", []):
            st = item["status"]
            if st in doc_stats:
                doc_stats[st] = item["count"]
                total_docs += item["count"]
        doc_stats["total"] = total_docs

        recip_stats = {"total": 0, "avg_signing_time": 0, "completion_rate": 0, "by_role": {}}
        total_recips = 0
        total_comp = 0
        sum_hours = 0.0
        
        for item in agg_results.get("recipient_stats", []):
            status = item["_id"] or "created"
            count = item["count"]
            recip_stats[status] = count
            total_recips += count
            if status == "completed":
                total_comp = count
                sum_hours = item["total_time"]
        
        recip_stats["total"] = total_recips
        recip_stats["avg_signing_time"] = round(sum_hours / max(total_comp, 1), 1)
        recip_stats["completion_rate"] = round((total_comp / max(total_recips, 1)) * 100, 1)

        for item in agg_results.get("role_distribution", []):
            role = item["_id"] or "signer"
            recip_stats["by_role"][role] = item["count"]

        # 2. Field Analysis Pipeline
        field_agg = list(db.signature_fields.aggregate([
            {"$lookup": {
                "from": "documents",
                "localField": "document_id",
                "foreignField": "_id",
                "as": "doc"
            }},
            {"$match": {"doc.owner_id": owner_id, "doc.status": {"$ne": "deleted"}}},
            {"$facet": {
                "counters": [
                    {"$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "completed": {"$sum": {"$cond": [{"$ne": ["$completed_at", None]}, 1, 0]}}
                    }}
                ],
                "by_type": [
                    {"$group": {
                        "_id": "$type",
                        "total": {"$sum": 1},
                        "completed": {"$sum": {"$cond": [{"$ne": ["$completed_at", None]}, 1, 0]}}
                    }}
                ]
            }}
        ]))[0]

        field_stats = {
            "total_fields": 0, "completed_fields": 0, "completion_percentage": 0,
            "by_type": {}, "signatures": {"total": 0, "completed": 0},
            "initials": {"total": 0, "completed": 0}, "form_fields": {"total": 0, "completed": 0},
            "checkboxes": {"total": 0, "completed": 0}
        }

        if field_agg.get("counters"):
            c = field_agg["counters"][0]
            field_stats["total_fields"] = c["total"]
            field_stats["completed_fields"] = c["completed"]
            field_stats["completion_percentage"] = round((c["completed"] / max(c["total"], 1)) * 100, 1)

        for item in field_agg.get("by_type", []):
            ftype = item["_id"]
            if not ftype: continue
            
            total = int(item.get("total", 0))
            completed = int(item.get("completed", 0))
            percentage = round((completed / max(total, 1)) * 100, 1)
            
            field_stats["by_type"][ftype] = {
                "total": total, 
                "completed": completed, 
                "percentage": percentage
            }
            
            if ftype in ["signature", "witness_signature", "stamp"]:
                field_stats["signatures"]["total"] += total
                field_stats["signatures"]["completed"] += completed
            elif ftype == "initials":
                field_stats["initials"]["total"] += total
                field_stats["initials"]["completed"] += completed
            elif ftype in ["textbox", "date", "mail", "dropdown"]:
                field_stats["form_fields"]["total"] += total
                field_stats["form_fields"]["completed"] += completed
            elif ftype in ["checkbox", "radio"]:
                field_stats["checkboxes"]["total"] += total
                field_stats["checkboxes"]["completed"] += completed

        # Calculate category percentages
        for cat in ["signatures", "initials", "form_fields", "checkboxes"]:
            field_stats[cat]["percentage"] = round((field_stats[cat]["completed"] / max(field_stats[cat]["total"], 1)) * 100, 1)

        # 3. Timeline & Activity Intelligence
        # Get list of user's document IDs for timeline queries
        doc_ids_list = [d["_id"] for d in db.documents.find({"owner_id": owner_id, "status": {"$ne": "deleted"}}, {"_id": 1})]
        
        timeline_agg = list(db.document_timeline.aggregate([
            {"$match": {"document_id": {"$in": doc_ids_list}}},
            {"$facet": {
                "events": [{"$sort": {"timestamp": -1}}, {"$limit": 500}],
                "type_counts": [
                    {"$group": {"_id": "$type", "count": {"$sum": 1}}}
                ],
                "time_distribution": [
                    {"$project": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "hour": {"$hour": "$timestamp"}
                    }},
                    {"$group": {"_id": {"date": "$date", "hour": "$hour"}, "count": {"$sum": 1}}}
                ]
            }}
        ]))[0]

        # Activity Intelligence
        act_stats: Dict[str, Any] = {
            "total": sum(int(i.get("count", 0)) for i in timeline_agg.get("type_counts", [])),
            "counts": {str(i.get("_id", "unknown")): int(i.get("count", 0)) for i in timeline_agg.get("type_counts", [])},
            "timeline": [], 
            "hourly": [0]*24, 
            "platforms": {}
        }
        
        # Process hourly and daily trends
        day_counts: Dict[str, int] = {}
        time_dist = timeline_agg.get("time_distribution", [])
        if isinstance(time_dist, list):
            for item in time_dist:
                if isinstance(item, dict):
                    id_data = item.get("_id", {})
                    if isinstance(id_data, dict):
                        d = str(id_data.get("date", ""))
                        h_val = id_data.get("hour")
                        h = int(h_val) if h_val is not None else -1
                        c = int(item.get("count") or 0)
                        if d:
                            day_counts[d] = day_counts.get(d, 0) + c
                        if 0 <= h < 24:
                            act_stats["hourly"][h] += c
            
        # Get sorted timeline entries
        timeline_items = sorted(day_counts.items())
        act_stats["timeline"] = [{"date": d, "count": c} for d, c in timeline_items[-30:]]

        # Platform detection from latest events
        events_list = timeline_agg.get("events", [])
        if isinstance(events_list, list):
            for ev in events_list:
                if isinstance(ev, dict):
                    metadata = ev.get("metadata", {})
                    if isinstance(metadata, dict):
                        ua = str(metadata.get("user_agent", ""))
                        if ua:
                            pf = "Mobile" if "Mobi" in ua else "Tablet" if "Tablet" in ua else "Desktop"
                            act_stats["platforms"][pf] = act_stats.get("platforms", {}).get(pf, 0) + 1

        # 4. Funnel Analytics - Multi-stage conversion tracking
        funnel_data = {
            "uploaded": int(doc_stats.get("total", 0)),
            "sent": sum(int(doc_stats.get(s, 0)) for s in ["sent", "in_progress", "completed"]),
            "viewed": int(act_stats.get("counts", {}).get("document_viewed", 0) or 
                         act_stats.get("counts", {}).get("recipient_viewed", 0) or 
                         act_stats.get("counts", {}).get("viewed", 0)),
            "started": int(field_stats.get("completed_fields", 0)),
            "completed": int(doc_stats.get("completed", 0))
        }

        # 5. Monthly Trends Data
        trend_list = []
        monthly_trends_list = agg_results.get("monthly_trends", [])
        if isinstance(monthly_trends_list, list):
            for item in monthly_trends_list:
                if isinstance(item, dict):
                    id_info = item.get("_id", {})
                    if isinstance(id_info, dict):
                        y = int(id_info.get("year", now.year))
                        m = int(id_info.get("month", now.month))
                        try:
                            dt = datetime(y, m, 1)
                            trend_list.append({
                                "month": dt.strftime("%b %Y"),
                                "total": int(item.get("total", 0)),
                                "completed": int(item.get("completed", 0))
                            })
                        except (ValueError, TypeError):
                            continue

        # Subscription & Active Count
        sub_record = await get_active_subscription(current_user["email"])
        sub_info = {"has_active": False, "status": "inactive", "plan": "Free", "days_left": 0}
        if sub_record:
            exp_date = sub_record.get("expiry_date")
            sub_info.update({
                "has_active": True, "status": str(sub_record.get("status", "active")),
                "plan": str(PLAN_CONFIG.get(str(sub_record.get("plan_type")), {}).get("name", "Active Plan")),
                "days_left": max(0, (exp_date - now).days) if isinstance(exp_date, datetime) else 0
            })

        # Efficiency metrics calculation
        hourly_series = act_stats.get("hourly", [0]*24)
        peak_hr = 0
        if any(hourly_series):
            peak_hr = hourly_series.index(max(hourly_series))
        
        platforms_dist = act_stats.get("platforms", {})
        top_pf = "Desktop"
        if isinstance(platforms_dist, dict) and platforms_dist:
            top_pf = max(platforms_dist, key=lambda k: platforms_dist[k])
        
        return {
            "documents": doc_stats,
            "recipients": recip_stats,
            "fields": field_stats,
            "activities": act_stats,
            "funnel": funnel_data,
            "trends": trend_list,
            "efficiency": {
                "velocity": round((int(doc_stats.get("completed", 0)) / max(int(doc_stats.get("total", 0)), 1)) * 100, 1),
                "completion_rate": recip_stats.get("completion_rate", 0),
                "peak_hour": peak_hr,
                "top_platform": top_pf,
                "avg_signing_time": recip_stats.get("avg_signing_time", 0)
            },
            "subscription": sub_info,
            "contacts": {"total_contacts": db.contacts.count_documents({"owner_id": owner_id})}
        }
        
    except Exception as exc:
        print(f"CRITICAL ANALYTICS ERROR: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to aggregate complete analytics")
