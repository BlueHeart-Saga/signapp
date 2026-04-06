import os
import re
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
import fitz  # PyMuPDF
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, ConfigDict
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, red, blue
import base64
import gridfs
from fastapi.responses import StreamingResponse
# Import your existing dependencies
from database import db
from .auth import get_current_user
from .converter import convert_to_pdf

router = APIRouter(prefix="/templates", tags=["Templates"])

fs = gridfs.GridFS(db)

# ✅ MongoDB Collections
templates_collection = db["templates"]
pdf_files_collection = db["pdf_files"]

# ✅ Constants

SIGNATURE_FIELDS = ["signature", "sig", "sign", "signature_block", "signature_line"]
TEXT_FIELDS_REGEX = r"\[(.*?)\]|\{(.*?)\}|\<(.*?)\>|___+|name|date|address|email|phone"

# ----- 🔹 Models -----
class FieldItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "text", "signature", "date", "checkbox", "dropdown"
    x: float
    y: float
    width: float
    height: float
    page: int
    value: Optional[str] = None
    placeholder: Optional[str] = None
    required: bool = False
    font_size: Optional[int] = 12
    font_family: Optional[str] = "Helvetica"
    options: Optional[List[str]] = None  # For dropdown fields
    
    model_config = ConfigDict(
        json_encoders={ObjectId: str}
    )

class SignatureData(BaseModel):
    image_data: str  # base64 encoded signature image
    field_id: str
    page: int
    x: float
    y: float
    width: float
    height: float

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[FieldItem]
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[FieldItem]] = None

class FillTemplateRequest(BaseModel):
    template_id: str
    field_values: Dict[str, str]
    signatures: List[SignatureData] = []
    output_format: str = "pdf"  # pdf or json

# ----- 🔹 Utility Functions -----
def serialize_template(template):
    """Convert MongoDB template to JSON serializable format"""
    return {
        "id": str(template["_id"]),
        "name": template.get("name"),
        "description": template.get("description", ""),
        "fields": template.get("fields", []),
        "pdf_file_id": str(template.get("pdf_file_id")),
        "page_count": template.get("page_count", 1),
        "uploadedAt": template["uploadedAt"].isoformat() if isinstance(template["uploadedAt"], datetime) else template["uploadedAt"],
        "createdBy": str(template.get("createdBy")),
        "thumbnail": template.get("thumbnail")  # base64 thumbnail
    }

def detect_fields_in_pdf_from_bytes(pdf_bytes: bytes):
    """
    Automatically detect form fields and signature areas in PDF
    """
    detected_fields = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        # Detect signature fields (based on keywords)
        for sig_keyword in SIGNATURE_FIELDS:
            # Search for signature indicators
            text_instances = page.search_for(sig_keyword)
            for inst in text_instances:
                detected_fields.append({
                    "id": str(uuid.uuid4()),
                    "name": f"signature_{len([f for f in detected_fields if f.get('type') == 'signature'])}",
                    "type": "signature",
                    "x": inst.x0 - 50,  # Expand area
                    "y": page.rect.height - inst.y1 - 30,  # Convert coordinates
                    "width": 200,
                    "height": 50,
                    "page": page_num,
                    "placeholder": "SIGNATURE",
                    "required": True
                })
        
        # Detect text fields using regex
        matches = re.findall(TEXT_FIELDS_REGEX, text, re.IGNORECASE)
        for match in matches:
            field_name = ''.join([m for m in match if m])
            if field_name and len(field_name) > 1:
                # Find the position of the field in text
                text_instances = page.search_for(field_name)
                for inst in text_instances:
                    detected_fields.append({
                        "id": str(uuid.uuid4()),
                        "name": f"field_{len(detected_fields)}",
                        "type": "text",
                        "x": inst.x0,
                        "y": page.rect.height - inst.y1,
                        "width": 150,
                        "height": 25,
                        "page": page_num,
                        "placeholder": field_name,
                        "required": False
                    })
    
    doc.close()
    return detected_fields

def generate_pdf_thumbnail_from_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(0.2, 0.2))
    img = pix.tobytes("png")
    doc.close()
    return base64.b64encode(img).decode()


def validate_field_coordinates(page_count: int, fields: List[FieldItem]) -> bool:
    """Validate that field coordinates are within page bounds"""
    for field in fields:
        if field.page >= page_count:
            return False
        if field.x < 0 or field.y < 0 or field.width <= 0 or field.height <= 0:
            return False
    return True

# ----- 📤 Upload PDF and Auto-detect Fields -----
@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    auto_detect: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    file_bytes = await file.read()
    
    pdf_bytes = convert_to_pdf(file_bytes, file.filename)
    if not pdf_bytes:
        raise HTTPException(400, "The file could not be converted to a PDF.")
        
    pdf_filename = file.filename.rsplit(".", 1)[0] + ".pdf"

    # 1️⃣ Store PDF in GridFS
    pdf_file_id = fs.put(
        pdf_bytes,
        filename=pdf_filename,
        content_type="application/pdf"
    )

    # 2️⃣ Read PDF from memory (not disk)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = len(doc)

    detected_fields = []
    if auto_detect:
        detected_fields = detect_fields_in_pdf_from_bytes(pdf_bytes)

    thumbnail = generate_pdf_thumbnail_from_bytes(pdf_bytes)
    doc.close()

    # 3️⃣ Save template metadata
    template_doc = {
        "name": name,
        "description": description,
        "pdf_file_id": pdf_file_id,   # ✅ KEY CHANGE
        "page_count": page_count,
        "fields": detected_fields,
        "uploadedAt": datetime.utcnow(),
        "createdBy": ObjectId(current_user["_id"]),
        "thumbnail": thumbnail
    }

    result = templates_collection.insert_one(template_doc)

    return {
        "message": "Template uploaded successfully",
        "id": str(result.inserted_id),
        "page_count": page_count
    }

# ----- 🧾 Create / Save Template -----
@router.post("/save")
def save_template(data: TemplateCreate, current_user: dict = Depends(get_current_user)):
    """Save a new PDF template with field coordinates"""
    try:
        template_doc = {
            "name": data.name,
            "description": data.description,
            "fields": [field.model_dump() for field in data.fields],
            "uploadedAt": data.uploadedAt,
            "createdBy": ObjectId(current_user["_id"]),
            "page_count": max([field.page for field in data.fields]) + 1 if data.fields else 1
        }

        result = templates_collection.insert_one(template_doc)
        return {"message": "Template saved successfully", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving template: {str(e)}")

# ----- ✏️ Update Template -----
@router.put("/{template_id}")
def update_template(
    template_id: str,
    data: TemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing template"""
    try:
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description
        if data.fields is not None:
            update_data["fields"] = [field.model_dump() for field in data.fields]
            update_data["page_count"] = max([field.page for field in data.fields]) + 1
        
        if update_data:
            templates_collection.update_one(
                {"_id": ObjectId(template_id)},
                {"$set": update_data}
            )
        
        return {"message": "Template updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}")

# ----- 📥 List All Templates -----
@router.get("/")
def list_templates(current_user: dict = Depends(get_current_user)):
    """List all templates created by the logged-in user"""
    try:
        templates = list(templates_collection.find(
            {"createdBy": ObjectId(current_user["_id"])}
        ).sort("uploadedAt", -1))
        
        return [serialize_template(t) for t in templates]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching templates: {str(e)}")

# ----- 📄 Get Template by ID -----
@router.get("/{template_id}")
def get_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch a single template by ID"""
    try:
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return serialize_template(template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching template: {str(e)}")

# ----- 📄 Get PDF File -----
@router.get("/{template_id}/pdf")
def get_pdf_file(template_id: str, current_user: dict = Depends(get_current_user)):
    template = templates_collection.find_one({
        "_id": ObjectId(template_id),
        "createdBy": ObjectId(current_user["_id"])
    })

    if not template:
        raise HTTPException(404, "Template not found")

    file = fs.get(ObjectId(template["pdf_file_id"]))

    return StreamingResponse(
        io.BytesIO(file.read()),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{template["name"]}.pdf"'
        }
    )


# ----- 🔍 Re-detect Fields -----
@router.post("/{template_id}/detect-fields")
def redetect_fields(template_id: str, current_user: dict = Depends(get_current_user)):
    """Re-detect fields in an existing template"""
    try:
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template or "pdf_file_id" not in template:
            raise HTTPException(status_code=404, detail="Template PDF not found")

        
        file = fs.get(ObjectId(template["pdf_file_id"]))
        detected_fields = detect_fields_in_pdf_from_bytes(file.read())

        
        # Update template with detected fields
        templates_collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": {"fields": detected_fields}}
        )
        
        return {
            "message": "Fields re-detected successfully",
            "detected_fields": len(detected_fields)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting fields: {str(e)}")

# ----- ✍️ Fill Template with Data -----
@router.post("/fill")
def fill_template(
    data: FillTemplateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Fill template fields with provided data and signatures (GridFS-based)"""
    try:
        # 1️⃣ Fetch template
        template = templates_collection.find_one({
            "_id": ObjectId(data.template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        if "pdf_file_id" not in template:
            raise HTTPException(status_code=404, detail="Template PDF missing")

        # 2️⃣ Load PDF from GridFS
        pdf_file = fs.get(ObjectId(template["pdf_file_id"]))
        pdf_bytes = pdf_file.read()

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # 3️⃣ Fill text fields
        for field in template.get("fields", []):
            field_id = field.get("id")

            if field_id in data.field_values and field["type"] == "text":
                page = doc[field["page"]]

                rect = fitz.Rect(
                    field["x"],
                    field["y"],
                    field["x"] + field["width"],
                    field["y"] + field["height"]
                )

                page.insert_textbox(
                    rect,
                    data.field_values[field_id],
                    fontsize=field.get("font_size", 12),
                    fontname=field.get("font_family", "helv"),
                    color=(0, 0, 0)
                )

        # 4️⃣ Insert signatures
        for signature in data.signatures:
            if signature.page >= len(doc):
                continue

            page = doc[signature.page]

            signature_bytes = base64.b64decode(
                signature.image_data.split(",")[-1]
            )

            img = fitz.Pixmap(signature_bytes)

            rect = fitz.Rect(
                signature.x,
                signature.y,
                signature.x + signature.width,
                signature.y + signature.height
            )

            page.insert_image(rect, pixmap=img)

        # 5️⃣ Save filled PDF to memory
        filled_pdf_bytes = doc.write()
        doc.close()

        # 6️⃣ Store filled PDF in GridFS
        filled_pdf_id = fs.put(
            filled_pdf_bytes,
            filename=f"filled_{template['name']}.pdf",
            content_type="application/pdf"
        )

        # 7️⃣ Return response
        if data.output_format == "json":
            return {
                "message": "Template filled successfully",
                "pdf_file_id": str(filled_pdf_id)
            }

        return StreamingResponse(
            io.BytesIO(filled_pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="filled_{template["name"]}.pdf"'
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error filling template: {str(e)}"
        )

# ----- 📊 Get Template Statistics -----
@router.get("/{template_id}/stats")
def get_template_stats(template_id: str, current_user: dict = Depends(get_current_user)):
    """Get statistics about template fields"""
    try:
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        fields = template.get("fields", [])
        
        stats = {
            "total_fields": len(fields),
            "text_fields": len([f for f in fields if f.get("type") == "text"]),
            "signature_fields": len([f for f in fields if f.get("type") == "signature"]),
            "date_fields": len([f for f in fields if f.get("type") == "date"]),
            "required_fields": len([f for f in fields if f.get("required")]),
            "pages_with_fields": len(set([f.get("page", 0) for f in fields]))
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

# ----- 🗑️ Delete Template -----
@router.delete("/{template_id}")
def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a saved template and associated files"""
    try:
        # Get template first to find file path
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Delete associated PDF file if exists
        if "file_path" in template and os.path.exists(template["file_path"]):
            try:
                fs.delete(ObjectId(template["pdf_file_id"]))
            except:
                pass  # Don't fail if file deletion fails
        
        # Delete from database
        result = templates_collection.delete_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        # Delete associated PDF file record
        pdf_files_collection.delete_one({"template_id": ObjectId(template_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found or unauthorized")

        return {"message": "Template deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting template: {str(e)}")

# ----- 📋 Export Template as JSON -----
@router.get("/{template_id}/export")
def export_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Export template as JSON configuration"""
    try:
        template = templates_collection.find_one({
            "_id": ObjectId(template_id),
            "createdBy": ObjectId(current_user["_id"]),
        })
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create export data
        export_data = {
            "template_name": template["name"],
            "description": template.get("description", ""),
            "export_date": datetime.utcnow().isoformat(),
            "fields": template.get("fields", []),
            "page_count": template.get("page_count", 1),
            "metadata": {
                "original_id": str(template["_id"]),
                "created_by": str(template.get("createdBy")),
                "created_at": template["uploadedAt"].isoformat() if isinstance(template["uploadedAt"], datetime) else template["uploadedAt"]
            }
        }
        
        return JSONResponse(content=export_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting template: {str(e)}")