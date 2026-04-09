from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, ValidationInfo
from typing import List, Optional, Union, Any, Dict
from enum import Enum

from database import db
from .auth import get_current_user


router = APIRouter(prefix="/documents", tags=["Signature Fields"])


# ---------------------------
# ENUMS & CONSTANTS
# ---------------------------

class FieldType(str, Enum):
    signature = "signature"
    initials = "initials"
    date = "date"
    textbox = "textbox"
    checkbox = "checkbox"
    radio = "radio"
    dropdown = "dropdown"
    attachment = "attachment"
    approval = "approval"
    witness_signature = "witness_signature"
    stamp = "stamp"
    mail = "mail"

UNIVERSAL_FIELDS = {
    FieldType.date.value,
    FieldType.textbox.value,
    FieldType.checkbox.value,
    FieldType.radio.value,
    FieldType.dropdown.value,
    FieldType.attachment.value,
    FieldType.mail.value,
}

ROLE_FIELD_RULES = {
    "signer": "ALL",
    "in_person_signer": {
        FieldType.signature.value,
        FieldType.initials.value,
        *UNIVERSAL_FIELDS,
    },
    "witness": "ALL",
    "approver": {
        FieldType.approval.value,
        *UNIVERSAL_FIELDS,
    },
    "form_filler": UNIVERSAL_FIELDS,
    "viewer": set(),
}

# ---------------------------
# SCHEMAS
# ---------------------------

class FieldCreate(BaseModel):
    page: int = Field(..., ge=0, description="Page number (0-indexed)")
    x: float = Field(..., description="X position on canvas in pixels")
    y: float = Field(..., description="Y position on canvas in pixels")
    width: float = Field(..., gt=0, description="Width in pixels")
    height: float = Field(..., gt=0, description="Height in pixels")

    # Canvas dimensions
    canvas_width: float = Field(..., gt=0, description="Canvas width in pixels")
    canvas_height: float = Field(..., gt=0, description="Canvas height in pixels")
    
    # Page dimensions in PDF points (72 DPI)
    page_width: float = Field(..., gt=0, description="Page width in PDF points")
    page_height: float = Field(..., gt=0, description="Page height in PDF points")

    type: FieldType
    recipient_id: Optional[str] = Field(None, description="Recipient ID")
    required: bool = True
    label: Optional[str] = None
    placeholder: Optional[str] = None
    dropdown_options: Optional[List[str]] = Field(None, description="Required for dropdown fields")
    email_validation: Optional[bool] = True
    font_size: Optional[int] = Field(12, ge=8, le=72)
    
    # For checkbox/radio fields
    checked: Optional[bool] = False
    group_name: Optional[str] = Field(None, description="For radio button groups")

    model_config = ConfigDict(use_enum_values=True)

    @field_validator('dropdown_options')
    def validate_dropdown_options(cls, v, info: ValidationInfo):
        if info.data.get('type') == FieldType.dropdown:
            if not v or len(v) == 0:
                raise ValueError('dropdown_options is required for dropdown fields')
        return v

    @field_validator('placeholder')
    def validate_mail_placeholder(cls, v, info: ValidationInfo):
        if info.data.get('type') == FieldType.mail:
            if not v:
                raise ValueError('placeholder is required for mail fields')
        return v

class FieldUpdate(BaseModel):
    type: Optional[FieldType] = None
    page: Optional[int] = Field(None, ge=0)
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    required: Optional[bool] = None
    label: Optional[str] = None
    placeholder: Optional[str] = None
    font_size: Optional[int] = Field(None, ge=8, le=72)
    dropdown_options: Optional[List[str]] = None
    checked: Optional[bool] = None
    group_name: Optional[str] = None
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    value: Optional[Any] = None

class FieldResponse(BaseModel):
    id: str
    document_id: str
    recipient_id: str
    type: str
    page: int
    x: float
    y: float
    width: float
    height: float
    required: bool
    label: Optional[str]
    placeholder: Optional[str]
    font_size: Optional[int]
    dropdown_options: Optional[List[str]]
    email_validation: Optional[bool]
    checked: Optional[bool]
    group_name: Optional[str]
    canvas_x: Optional[float]
    canvas_y: Optional[float]
    canvas_width: Optional[float]
    canvas_height: Optional[float]
    pdf_x: Optional[float]
    pdf_y: Optional[float]
    pdf_width: Optional[float]
    pdf_height: Optional[float]
    added_at: str
    modified_at: Optional[str]

# ---------------------------
# HELPERS - FIXED
# ---------------------------

def serialize_field(field: Dict) -> Dict:
    serialized = {
        "id": str(field["_id"]),
        "document_id": str(field["document_id"]),
        "recipient_id": str(field["recipient_id"]),
        "type": field["type"],
        "page": field["page"],
        "required": field.get("required", True),
        "label": field.get("label"),
        "placeholder": field.get("placeholder"),
        "font_size": field.get("font_size", 12),
        "dropdown_options": field.get("dropdown_options"),
        "email_validation": field.get("email_validation"),
        "checked": field.get("checked", False),
        "group_name": field.get("group_name"),
        
        # Completion fields
        "is_completed": field.get("is_completed", False),
        "completed_at": field.get("completed_at").isoformat() if field.get("completed_at") and isinstance(field.get("completed_at"), datetime) else field.get("completed_at"),
        "value": field.get("value"),
        
        "added_at": field["added_at"].isoformat() if isinstance(field["added_at"], datetime) else field["added_at"],
        "modified_at": field.get("modified_at").isoformat() if field.get("modified_at") and isinstance(field.get("modified_at"), datetime) else field.get("modified_at"),
    }

    # Canvas coordinates (for UI)
    if "canvas_x" in field:
        serialized.update({
            "canvas_x": field["canvas_x"],
            "canvas_y": field["canvas_y"],
            "canvas_width": field["canvas_width"],
            "canvas_height": field["canvas_height"],
        })

    # PDF coordinates (for stamping)
    if "pdf_x" in field:
        serialized.update({
            "pdf_x": field["pdf_x"],
            "pdf_y": field["pdf_y"],
            "pdf_width": field["pdf_width"],
            "pdf_height": field["pdf_height"],
        })

    # 🔥 UI must use canvas pixels, NOT PDF points
    serialized.update({
        "x": field.get("canvas_x", field.get("x")),
        "y": field.get("canvas_y", field.get("y")),
        "width": field.get("width"),
        "height": field.get("height"),
    })

    return serialized


def serialize_field_with_recipient(field, recipient_info=None):
    """Enhanced serialization with recipient info and completion status."""
    # 🔴 CRITICAL FIX: Get completion status from the field document
    is_completed = field.get("completed_at") is not None
    
    result = {
        "id": str(field["_id"]),
        "document_id": str(field["document_id"]),
        "recipient_id": str(field["recipient_id"]),
        "type": field["type"],
        "page": field["page"],
        # Use PDF coordinates for rendering
        "x": field.get("canvas_x", field.get("x", 0)),
        "y": field.get("canvas_y", field.get("y", 0)),
        "width": field.get("width", field.get("pdf_width", 100)),
        "height": field.get("height", field.get("pdf_height", 30)),
        "required": field.get("required", True),
        "label": field.get("label"),
        "placeholder": field.get("placeholder"),
        "font_size": field.get("font_size", 12),
        "dropdown_options": field.get("dropdown_options"),
        "group_name": field.get("group_name"),
        "email_validation": field.get("email_validation"),
        "added_at": field["added_at"].isoformat() if "added_at" in field else None,
        "canvas_x": field.get("canvas_x"),
        "canvas_y": field.get("canvas_y"),
        "canvas_width": field.get("canvas_width"),
        "canvas_height": field.get("canvas_height"),
        "pdf_x": field.get("pdf_x"),
        "pdf_y": field.get("pdf_y"),
        "pdf_width": field.get("pdf_width"),
        "pdf_height": field.get("pdf_height"),
        "value": field.get("value"),
        "completed_at": field.get("completed_at"),
        # 🔴 FIX: Set is_completed based on completed_at
        "is_completed": is_completed,
        "created_at": field.get("created_at").isoformat() if field.get("created_at") else None,
    }
    
    # 🔴 IMPROVED: Handle recipient info in two ways:
    # 1. If recipient_info is provided as parameter, use it
    # 2. Otherwise, fetch from database
    
    if recipient_info:
        # Use provided recipient info
        if isinstance(recipient_info, dict):
            result["recipient"] = recipient_info
            result["recipient_name"] = recipient_info.get("name", "")
            result["recipient_email"] = recipient_info.get("email", "")
            result["recipient_role"] = recipient_info.get("role", "")
            result["recipient_status"] = recipient_info.get("status", "")
            result["recipient_color"] = recipient_info.get("color", "#666666")
    else:
        # Fetch recipient from database
        try:
            recipient = db.recipients.find_one({"_id": ObjectId(field["recipient_id"])})
            if recipient:
                # 🔴 IMPORTANT: Ensure recipient has a color field
                # Generate color if not present
                recipient_color = recipient.get("color")
                if not recipient_color:
                    # Generate consistent color from email
                    import hashlib
                    email_hash = hashlib.md5(recipient.get("email", "").encode()).hexdigest()
                    colors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2", 
                             "#EF476F", "#FFD166", "#06D6A0", "#073B4C", "#7209B7"]
                    color_index = int(email_hash, 16) % len(colors)
                    recipient_color = colors[color_index]
                
                result["recipient"] = {
                    "id": str(recipient["_id"]),
                    "name": recipient.get("name", ""),
                    "email": recipient.get("email", ""),
                    "role": recipient.get("role", ""),
                    "status": recipient.get("status", ""),
                    "color": recipient_color  # 🔴 Add color here
                }
                result["recipient_name"] = recipient.get("name", "")
                result["recipient_email"] = recipient.get("email", "")
                result["recipient_role"] = recipient.get("role", "")
                result["recipient_status"] = recipient.get("status", "")
                result["recipient_color"] = recipient_color  # 🔴 Also add as top-level field
            else:
                # Default values if recipient not found
                result["recipient"] = {
                    "id": str(field["recipient_id"]),
                    "name": "Unknown",
                    "email": "",
                    "role": "",
                    "status": "",
                    "color": "#666666"
                }
                result["recipient_name"] = "Unknown"
                result["recipient_email"] = ""
                result["recipient_role"] = ""
                result["recipient_status"] = ""
                result["recipient_color"] = "#666666"
        except Exception as e:
            print(f"Error getting recipient for field {field['_id']}: {e}")
            # Fallback if recipient retrieval fails
            result["recipient"] = {
                "id": str(field["recipient_id"]),
                "name": "Unknown",
                "email": "",
                "role": "",
                "status": "",
                "color": "#666666"
            }
            result["recipient_name"] = "Unknown"
            result["recipient_email"] = ""
            result["recipient_role"] = ""
            result["recipient_status"] = ""
            result["recipient_color"] = "#666666"
    
    # Add normalized value for display
    result["display_value"] = normalize_field_value(field)
    
    return result

def normalize_field_value(field: Dict[str, Any]) -> Any:
    """
    Normalize field value for different field types.
    
    Returns appropriate value based on field type for PDF rendering.
    """
    value = field.get("value")
    
    # 🔴 FIX: Check if field is completed but value might be in different format
    if field.get("completed_at") and not value:
        # Field is completed but value is None or empty
        # Return appropriate placeholder for completed field
        field_type = field.get("type", "")
        if field_type == "signature":
            return {"type": "completed", "text": "✓ Signed"}
        elif field_type == "checkbox":
            return True
        elif field_type == "approval":
            return True
        elif field_type == "date":
            return field.get("completed_at", {}).get("date", "Completed")
    
    if value is None:
        return ""
    
    field_type = field.get("type", "")
    
    # Handle by field type
    if field_type == "signature":
        # Return signature image data
        if isinstance(value, dict) and value.get("image"):
            return {"type": "image", "data": value["image"]}
        elif isinstance(value, str) and value.startswith("data:image"):
            return {"type": "image", "data": value}
        return ""
    
    elif field_type == "initials":
        # Initials can be image or text
        if isinstance(value, dict):
            if value.get("image"):
                return {"type": "image", "data": value["image"]}
            elif value.get("text"):
                return {"type": "text", "text": str(value.get("text", ""))}
        elif isinstance(value, str):
            if value.startswith("data:image"):
                return {"type": "image", "data": value}
            else:
                return {"type": "text", "text": value}
        return ""
    
    elif field_type == "date":
        # Date field
        if isinstance(value, dict):
            return value.get("date", value.get("text", ""))
        elif isinstance(value, str):
            return value
        return ""
    
    elif field_type == "textbox":
        # Text field
        if isinstance(value, dict):
            return value.get("text", "")
        return str(value)
    
    elif field_type == "checkbox":
        # Checkbox (checked/unchecked)
        if isinstance(value, dict):
            return value.get("checked", False)
        elif isinstance(value, bool):
            return value
        elif isinstance(value, str):
            return value.lower() in ["true", "yes", "checked", "1"]
        return False
    
    elif field_type == "radio":
        # Radio button (selected option)
        if isinstance(value, dict):
            return value.get("selected", "")
        return str(value)
    
    elif field_type == "dropdown":
        # Dropdown (selected option)
        if isinstance(value, dict):
            return value.get("selected", "")
        return str(value)
    
    elif field_type == "attachment":
        # Attachment field (filename)
        if isinstance(value, dict):
            return value.get("filename", "")
        return str(value)
    
    elif field_type == "approval":
        # Approval field (checkbox style)
        if isinstance(value, dict):
            return value.get("value", value.get("approved", False))
        elif isinstance(value, bool):
            return value
        elif isinstance(value, str):
            return value.lower() in ["true", "yes", "approved", "1"]
        return False
    
    elif field_type == "witness_signature":
        # Witness signature (image)
        if isinstance(value, dict) and value.get("image"):
            return {"type": "image", "data": value["image"]}
        elif isinstance(value, str) and value.startswith("data:image"):
            return {"type": "image", "data": value}
        return ""
    
    elif field_type == "stamp":
        # Stamp (image)
        if isinstance(value, dict) and value.get("image"):
            return {"type": "image", "data": value["image"]}
        elif isinstance(value, str) and value.startswith("data:image"):
            return {"type": "image", "data": value}
        return ""
    
    elif field_type == "mail":
        # Email field
        if isinstance(value, dict):
            return value.get("value") or value.get("email", "")
        return str(value)
    
    # Default case
    return str(value)

def convert_canvas_to_pdf_points(
    canvas_x, canvas_y,
    canvas_width, canvas_height,
    page_width_pt, page_height_pt,
    field_width_px, field_height_px,
    page_number=0  # Add page number parameter
):
    scale_x = page_width_pt / canvas_width
    scale_y = page_height_pt / canvas_height

    x = canvas_x * scale_x
    width = field_width_px * scale_x
    height = field_height_px * scale_y

    # Flip Y axis (PDF is bottom-left origin)
    # y = page_height_pt - y_canvas_bottom gives page-relative bottom-based points
    y_canvas_bottom = (canvas_y + field_height_px) * scale_y
    y = page_height_pt - y_canvas_bottom

    print(f"[FIELDS-ROUTE-DEBUG] Convert Canvas -> PDF")
    print(f"  - Canvas: page={page_number}, x={canvas_x}, y={canvas_y}, w={field_width_px}, h={field_height_px}")
    print(f"  - PDF: x={x}, y={y}, w={width}, h={height}")

    return {
        "x": x,
        "y": y,
        "width": width,
        "height": height
    }



def get_document_or_404(document_id: str, user_id: str):
    """Get document with proper authorization."""
    try:
        doc_id = ObjectId(document_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )

    document = db.documents.find_one({
        "_id": doc_id,
        "owner_id": ObjectId(user_id)
    })

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document

def get_recipient_or_400(document_id: str, recipient_id: Optional[str]):
    """Validate recipient belongs to document."""
    if not recipient_id:
        # Return a mock for unassigned fields (common in draft/builders)
        return {"_id": None, "role": "signer", "name": "Unassigned"}

    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recipient ID"
        )

    recipient = db.recipients.find_one({
        "_id": rid,
        "document_id": ObjectId(document_id)
    })

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient does not belong to this document"
        )

    return recipient

def validate_field_role(recipient_role: str, field_type: str):
    """
    Validate if recipient role can create/use this field type.
    """
    # Universal fields for everyone
    if field_type in UNIVERSAL_FIELDS:
        return True
    
    role_rule = ROLE_FIELD_RULES.get(recipient_role)
    
    if role_rule is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown recipient role: {recipient_role}"
        )
    
    if role_rule == "ALL":
        return True
    
    if field_type in role_rule:
        return True
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"{recipient_role} cannot have {field_type} field"
    )

def validate_field_coordinates(x: float, y: float, width: float, height: float):
    """Validate field coordinates are reasonable."""
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Width and height must be positive"
        )
    
    MAX_SIZE = 5000  # pixels
    if width > MAX_SIZE or height > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field size too large (max {MAX_SIZE}px)"
        )

def validate_field_type_specific_rules(field: FieldCreate):
    """Validate type-specific rules."""
    if field.type == FieldType.dropdown and not field.dropdown_options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dropdown fields require dropdown_options"
        )
    
    if field.type == FieldType.mail and not field.placeholder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mail fields require a placeholder email"
        )
    
    if field.type == FieldType.radio and not field.group_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Radio fields require a group_name"
        )

# ---------------------------
# ROUTES - IMPLEMENTED
# ---------------------------

@router.get("/fields", response_model=List[FieldResponse])
async def get_all_fields(
    document_id: Optional[str] = Query(None, description="Filter by document ID"),
    recipient_id: Optional[str] = Query(None, description="Filter by recipient ID"),
    page: Optional[int] = Query(None, ge=0, description="Filter by page number"),
    type: Optional[FieldType] = Query(None, description="Filter by field type"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all signature fields across documents (with filters).
    Requires document_id or other filters.
    """
    query = {}
    
    if document_id:
        try:
            query["document_id"] = ObjectId(document_id)
            # Verify user has access to this document
            get_document_or_404(document_id, current_user["id"])
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document ID"
            )
    
    if recipient_id:
        try:
            query["recipient_id"] = ObjectId(recipient_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recipient ID"
            )
    
    if page is not None:
        query["page"] = page
    
    if type:
        query["type"] = type.value
    
    # If no document_id provided, get all documents user has access to
    if not document_id:
        user_docs = db.documents.find(
            {"owner_id": ObjectId(current_user["id"])},
            {"_id": 1}
        )
        doc_ids = [doc["_id"] for doc in user_docs]
        query["document_id"] = {"$in": doc_ids}
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one filter parameter is required"
        )
    
    fields = list(
        db.signature_fields.find(query).sort([
            ("document_id", 1),
            ("page", 1),
            ("added_at", 1)
        ])
    )
    
    return [serialize_field(f) for f in fields]

@router.post("/{document_id}/fields", response_model=dict)
async def add_or_replace_fields(
    document_id: str,
    fields: List[FieldCreate],
    current_user: dict = Depends(get_current_user)
):
    """
    Add or replace signature fields for a document.
    
    Stores coordinates in both canvas pixels AND PDF points for accurate placement.
    """
    document = get_document_or_404(document_id, current_user["id"])
    
    # Debug logging
    print(f"📄 Document has {document.get('page_count', 1)} pages total")
    
    for i, f in enumerate(fields):
        print(f"📝 Field {i}: page={f.page}, type={f.type}, x={f.x}, y={f.y}")

    # 🔒 Only owner can modify fields in draft status
    if document["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fields are locked after sending"
        )

    created_fields = []
    
    # Validate all fields before any database operation
    for f in fields:
        recipient = get_recipient_or_400(document_id, f.recipient_id)
        role = str(recipient.get("role", "signer"))
        validate_field_role(role, f.type)  
        validate_field_coordinates(f.x, f.y, f.width, f.height)
        validate_field_type_specific_rules(f)

    # Start transaction-like pattern
    try:
        # 🔥 Replace mode: Delete all existing fields for this document
        db.signature_fields.delete_many({
            "document_id": ObjectId(document_id)
        })

        # Insert all new fields
        for f in fields:
            recipient = get_recipient_or_400(document_id, f.recipient_id)
            
            # Convert canvas coordinates to PDF points
            pdf_coords = convert_canvas_to_pdf_points(
                canvas_x=f.x,
                canvas_y=f.y,
                canvas_width=f.canvas_width,
                canvas_height=f.canvas_height,
                page_width_pt=f.page_width,
                page_height_pt=f.page_height,
                field_width_px=f.width,
                field_height_px=f.height,
                page_number=f.page
            )

            field_doc = {
                "document_id": ObjectId(document_id),
                "recipient_id": ObjectId(f.recipient_id) if f.recipient_id else None,
                "type": f.type,
                "page": f.page,
                
                # Canvas coordinates (pixels) - for frontend
                "canvas_x": f.x,
                "canvas_y": f.y,
                "width": f.width,
                "height": f.height,
                "canvas_width": f.canvas_width,
                "canvas_height": f.canvas_height,

                
                # PDF coordinates (points) - for PDF rendering
                "pdf_x": pdf_coords["x"],
                "pdf_y": pdf_coords["y"],
                "pdf_width": pdf_coords["width"],
                "pdf_height": pdf_coords["height"],
                
                # Type-specific fields
                "dropdown_options": f.dropdown_options if f.type == FieldType.dropdown else None,
                "email_validation": f.email_validation if f.type == FieldType.mail else None,
                "checked": f.checked if f.type in [FieldType.checkbox, FieldType.radio] else None,
                "group_name": f.group_name if f.type == FieldType.radio else None,
                
                # Common fields
                "required": f.required,
                "label": f.label,
                "placeholder": f.placeholder,
                "font_size": f.font_size,
                # Completion status - NEW
                "is_completed": False,
                "completed_at": None,
                "value": None,
                
                "added_at": datetime.utcnow(),
                "coordinate_type": "pdf_points_from_bottom"
            }

            result = db.signature_fields.insert_one(field_doc)
            field_doc["_id"] = result.inserted_id
            created_fields.append(serialize_field(field_doc))

        # Update document's last modified timestamp
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"last_modified": datetime.utcnow()}}
        )

        return {
            "message": "Fields saved successfully",
            "count": len(created_fields),
            "fields": created_fields
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving fields for document {document_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save fields: {str(e)}"
        )

@router.get("/{document_id}/fields", response_model=List[FieldResponse])
async def get_document_fields(
    document_id: str,
    recipient_id: Optional[str] = Query(None, description="Filter by recipient"),
    page: Optional[int] = Query(None, ge=0, description="Filter by page number"),
    type: Optional[FieldType] = Query(None, description="Filter by field type"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get signature fields for a specific document.
    
    Returns coordinates in PDF points as stored.
    """
    get_document_or_404(document_id, current_user["id"])

    query = {"document_id": ObjectId(document_id)}

    # Apply filters
    if recipient_id:
        try:
            query["recipient_id"] = ObjectId(recipient_id)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recipient ID"
            )
    
    if page is not None:
        query["page"] = page
    
    if type:
        query["type"] = type.value

    fields = list(
        db.signature_fields.find(query).sort([
            ("page", 1),
            ("added_at", 1)
        ])
    )

    return [serialize_field(f) for f in fields]

@router.get("/{document_id}/fields/{field_id}", response_model=FieldResponse)
async def get_field(
    document_id: str,
    field_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific field by ID."""
    get_document_or_404(document_id, current_user["id"])

    try:
        field_obj_id = ObjectId(field_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid field ID"
        )

    field = db.signature_fields.find_one({
        "_id": field_obj_id,
        "document_id": ObjectId(document_id)
    })

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    return serialize_field(field)

@router.put("/{document_id}/fields/{field_id}", response_model=FieldResponse)
async def update_field(
    document_id: str,
    field_id: str,
    update_data: FieldUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a specific field (partial update).
    
    Note: When updating coordinates, you need to provide all canvas info again
    or we'll need to store the original canvas context.
    """
    document = get_document_or_404(document_id, current_user["id"])

    if document["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fields are locked after sending"
        )

    try:
        field_obj_id = ObjectId(field_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid field ID"
        )

    # Get existing field
    field = db.signature_fields.find_one({
        "_id": field_obj_id,
        "document_id": ObjectId(document_id)
    })

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    # Get recipient for role validation if type is being changed
    if update_data.type:
        recipient = db.recipients.find_one({"_id": field["recipient_id"]})
        if recipient:
            validate_field_role(recipient["role"], update_data.type.value)

    # Prepare update data
    update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items()}
    
    # Validate coordinates if they're being updated
    if any(k in update_dict for k in ['x', 'y', 'width', 'height']):
        x = update_dict.get('x', field.get('canvas_x', field.get('x', 0)))
        y = update_dict.get('y', field.get('canvas_y', field.get('y', 0)))
        width = update_dict.get('width', field.get('canvas_width', field.get('width', 100)))
        height = update_dict.get('height', field.get('canvas_height', field.get('height', 30)))
        validate_field_coordinates(x, y, width, height)

    # Add last modified timestamp
    update_dict["modified_at"] = datetime.utcnow()

    # Perform update
    result = db.signature_fields.update_one(
        {"_id": field_obj_id},
        {"$set": update_dict}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update field"
        )

    # Return updated field
    updated_field = db.signature_fields.find_one({"_id": field_obj_id})
    return serialize_field(updated_field)

@router.delete("/{document_id}/fields/{field_id}")
async def delete_field(
    document_id: str,
    field_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific field."""
    document = get_document_or_404(document_id, current_user["id"])

    if document["status"] != "draft":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fields are locked after sending"
        )

    try:
        field_obj_id = ObjectId(field_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid field ID"
        )

    result = db.signature_fields.delete_one({
        "_id": field_obj_id,
        "document_id": ObjectId(document_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    return {"message": "Field deleted successfully"}

@router.get("/{document_id}/fields/recipient/{recipient_id}", response_model=List[FieldResponse])
async def get_fields_by_recipient(
    document_id: str,
    recipient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all fields assigned to a specific recipient in a document.
    """
    get_document_or_404(document_id, current_user["id"])

    try:
        rid = ObjectId(recipient_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recipient ID"
        )

    fields = list(
        db.signature_fields.find({
            "document_id": ObjectId(document_id),
            "recipient_id": rid
        }).sort([
            ("page", 1),
            ("added_at", 1)
        ])
    )

    return [serialize_field(f) for f in fields]