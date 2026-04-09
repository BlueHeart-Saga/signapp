import io
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from bson import ObjectId

import fitz  # PyMuPDF
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY

from database import db
from .auth import get_current_user
from storage import storage
from .documents import generate_envelope_id, serialize_document, generate_file_thumbnail, generate_all_page_thumbnails

# Initialize Router
router = APIRouter(prefix="/api/ai/workflow", tags=["AI Workflow Builder"])

class WorkflowGenerateRequest(BaseModel):
    prompt: str
    document_type: str = "Contract"
    language: str = "English"
    country: str = "India"

def clean_html_for_reportlab(html: str) -> str:
    """Simple cleanup of HTML for reportlab Paragraph"""
    # Remove unsupported tags but keep basic ones
    html = re.sub(r'<(?!/?(b|i|u|strong|em|p|br|h1|h2|h3|h4|h5|h6|li|ul|ol|font))[^>]+>', '', html)
    # Convert markers to something easy to find but consistent
    # We'll use standard placeholders like {{marker}}
    return html

def find_markers_in_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Find {{field_name}} markers in PDF and return their coordinates"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    markers = []
    
    # Pattern to match {{...}}
    pattern = r"\{\{([^{}]+)\}\}"
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Search for text matching the pattern
        text_page = page.get_text("words") # Get words for better positioning
        
        # Alternatively, search for specific strings if we know them
        # However, AI might generate dynamic markers.
        # Let's search for entire text blocks and find matches
        all_text = page.get_text("dict")
        for block in all_text["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        match = re.search(pattern, span["text"])
                        if match:
                            marker_name = match.group(1).strip()
                            # Get bbox of the span
                            bbox = span["bbox"] # (x0, y0, x1, y1)
                            
                            markers.append({
                                "name": marker_name,
                                "page": page_num + 1,
                                "x": bbox[0],
                                "y": bbox[1],
                                "width": bbox[2] - bbox[0],
                                "height": bbox[3] - bbox[1],
                                "text": span["text"]
                            })
                            
    doc.close()
    return markers

@router.post("/generate")
async def generate_workflow_document(
    data: WorkflowGenerateRequest,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """
    Reworked AI Builder:
    1. Generates professional content.
    2. Creates a real PDF.
    3. Maps internal markers to coordinates.
    4. Creates a document + fields + recipients.
    5. Redirects to main editor.
    """
    from .aidoc import client, build_document_prompt # Use existing cohere client
    
    if not client:
        raise HTTPException(500, "AI Service not initialized")

    try:
        # 1. Generate content with Markers
        prompt = build_document_prompt(data)
        prompt += "\n\nCRITICAL: You MUST include markers for signatures and dates using double curly braces, e.g., {{signer_1_signature}}, {{signer_1_date}}, {{signer_1_name}}."
        
        # Robust handling for Cohere V1 vs V2
        if hasattr(client, 'chat_stream') and not hasattr(client, 'chat'): # Some versions of V2
             # This is a fallback check
             pass

        try:
            # Try V2 style first
            response = client.chat(
                model="command-r-plus-08-2024",
                messages=[
                    {"role": "system", "content": "You are a legal document drafting assistant. Use {{marker_name}} for all fillable fields."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
        except TypeError as e:
            if 'messages' in str(e):
                # Fallback to V1 style
                response = client.chat(
                    model="command-r-plus-08-2024",
                    message=prompt,
                    preamble="You are a legal document drafting assistant. Use {{marker_name}} for all fillable fields.",
                    temperature=0.2,
                    max_tokens=2000
                )
            else:
                raise e
        
        # Robust content extraction
        if hasattr(response, 'message'):
            # V2 SDK check
            msg = response.message
            if isinstance(msg, str):
                html_content = msg.strip()
            elif hasattr(msg, 'content') and isinstance(msg.content, list) and len(msg.content) > 0:
                html_content = msg.content[0].text.strip()
            else:
                html_content = str(msg).strip()
        elif hasattr(response, 'text'):
            # V1 SDK check
            html_content = response.text.strip()
        elif isinstance(response, str):
            # Direct string return
            html_content = response.strip()
        else:
            # Fallback for unexpected formats
            html_content = str(response).strip()

        # 2. Convert HTML/Text to PDF using ReportLab
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        
        # Custom style for justification
        styles.add(ParagraphStyle(name='Justify', parent=styles['Normal'], alignment=TA_JUSTIFY))
        
        elements = []
        # Split by double newline to handle paragraphs
        paragraphs = html_content.split('\n\n')
        for p in paragraphs:
            # Clean up raw HTML tags and replace with reportlab-safe ones
            clean_p = clean_html_for_reportlab(p)
            if clean_p.strip():
                elements.append(Paragraph(clean_p, styles['Justify']))
                elements.append(Spacer(1, 12))
        
        doc.build(elements)
        pdf_bytes = pdf_buffer.getvalue()
        
        # 3. Find Markers and map to coordinates
        detected_markers = find_markers_in_pdf(pdf_bytes)
        
        # 4. Create Core Document Record
        filename = f"{data.document_type.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Generate Envelope ID
        envelope_id = generate_envelope_id(prefix="AI", user_id=current_user["id"])
        
        # Save to storage
        pdf_path = storage.upload(
            pdf_bytes,
            filename,
            folder=f"users/{current_user['id']}/pdfs"
        )
        
        # Generate thumbnails
        preview_thumb_bytes = generate_file_thumbnail(pdf_bytes, 0)
        preview_thumb_path = storage.upload(
            preview_thumb_bytes,
            f"{filename}_preview.png",
            folder=f"users/{current_user['id']}/thumbnails/previews"
        )
        
        all_thumbnails = generate_all_page_thumbnails(pdf_bytes)
        page_thumb_refs = []
        for pnum, tbytes in all_thumbnails.items():
            tpath = storage.upload(
                tbytes,
                f"{filename}_page_{pnum}_thumb.png",
                folder=f"users/{current_user['id']}/thumbnails/pages"
            )
            page_thumb_refs.append({"page": pnum, "thumbnail_path": tpath, "is_preview": False})

        # Create Document Data
        doc_record = {
            "filename": filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["id"]),
            "owner_email": current_user["email"],
            "status": "draft",
            "pdf_file_path": pdf_path,
            "original_file_path": pdf_path,
            "preview_thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumb_refs,
            "page_count": len(all_thumbnails),
            "size": len(pdf_bytes),
            "source": "ai_builder",
            "envelope_id": envelope_id,
            "common_message": f"Please review and sign this {data.document_type} generated by AI."
        }
        
        result = db.documents.insert_one(doc_record)
        document_id = result.inserted_id
        
        # Insert into document_files
        db.document_files.insert_one({
            "document_id": document_id,
            "file_path": pdf_path,
            "thumbnail_path": preview_thumb_path,
            "page_thumbnails": page_thumb_refs,
            "filename": filename,
            "page_count": len(all_thumbnails),
            "order": 1,
            "uploaded_at": datetime.utcnow(),
            "source": "ai_builder"
        })

        # 5. Create Recipients and Fields based on Markers
        # Group markers by signer index if possible
        recipients_map = {} # marker_prefix -> recipient_id
        
        # 🔹 Always add OR find the owner/sender as the first recipient 
        # This makes the document "ready" for the professional editor
        owner_recipient = {
            "document_id": document_id,
            "name": current_user.get("full_name") or current_user.get("name") or "Owner",
            "email": current_user.get("email"),
            "role": "signer",
            "signing_order": 0,
            "status": "created",
            "added_at": datetime.utcnow(),
            "is_owner": True
        }
        res = db.recipients.insert_one(owner_recipient)
        recipients_map["owner"] = res.inserted_id
        
        for marker in detected_markers:
            # Extract role/rank from marker name like 'signer_1_signature'
            # We'll default to 'signer'
            marker_name = marker["name"].lower()
            
            # Simple heuristic: signer_1, signer_2, etc.
            recipient_key = "signer_1"
            if "signer_2" in marker_name: recipient_key = "signer_2"
            elif "signer_3" in marker_name: recipient_key = "signer_3"
            
            if recipient_key not in recipients_map:
                recipient_data = {
                    "document_id": document_id,
                    "name": recipient_key.replace('_', ' ').title(),
                    "email": "",
                    "role": "signer",
                    "signing_order": int(recipient_key.split('_')[-1]),
                    "status": "created",
                    "added_at": datetime.utcnow()
                }
                rec_result = db.recipients.insert_one(recipient_data)
                recipients_map[recipient_key] = rec_result.inserted_id
            
            # Map marker type to field type
            field_type = "textbox"
            if "signature" in marker_name: field_type = "signature"
            elif "date" in marker_name: field_type = "date"
            elif "initial" in marker_name: field_type = "initials"
            
            # Create field
            field_record = {
                "document_id": document_id,
                "recipient_id": recipients_map[recipient_key],
                "type": field_type,
                "page": marker["page"],
                "x": marker["x"],
                "y": marker["y"],
                "width": max(marker["width"], 120 if field_type == "signature" else 80),
                "height": max(marker["height"], 60 if field_type == "signature" else 30),
                "required": True,
                "added_at": datetime.utcnow(),
                # Store original marker for debugging
                "ai_marker": marker["name"]
            }
            db.signature_fields.insert_one(field_record)

        return {
            "success": True,
            "document_id": str(document_id),
            "message": "AI Document generated and workflow initialized."
        }

    except Exception as e:
        print(f"Workflow Generation Error: {str(e)}")
        raise HTTPException(500, f"Failed to generate document workflow: {str(e)}")
