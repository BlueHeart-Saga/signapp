from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi.responses import StreamingResponse
import io
import uuid
from database import db
from .auth import role_required
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/branding", tags=["Branding / Logo Management"])

# Note: GridFS is removed - we now use Azure Blob Storage

@router.get("/config")
async def get_branding_config():
    config = db.branding.find_one({})

    if not config:
        return {
            "platform_name": "Esigniva",
            "tagline": "Secure Digital Document Signing",
            "logo_url": None
        }

    return {
        "platform_name": config.get("platform_name", "Esigniva"),
        "tagline": config.get("tagline", ""),
        "logo_url": "/branding/logo/file" if config.get("logo_file_path") else None
    }

@router.post("/update", summary="Update platform name / tagline")
async def update_branding(
    platform_name: Optional[str] = Form(None),
    tagline: Optional[str] = Form(None),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Admin can update:
    - Platform / Product Name
    - Tagline
    """
    update_data = {}

    if platform_name:
        update_data["platform_name"] = platform_name

    if tagline:
        update_data["tagline"] = tagline

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow()

    db.branding.update_one({}, {"$set": update_data}, upsert=True)

    return {"message": "Branding updated successfully", "data": update_data}

@router.post("/logo", summary="Upload or replace platform logo (Azure Storage)")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["admin"]))
):
    allowed_types = ["image/png", "image/jpeg", "image/svg+xml", "image/jpg", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 2MB for logos)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Logo too large. Maximum size is 2MB"
        )

    # Get current branding config
    branding = db.branding.find_one({})

    # ============================================
    # Delete old logo from Azure if exists
    # ============================================
    if branding and branding.get("logo_file_path"):
        try:
            storage.delete(branding["logo_file_path"])
            print(f"Deleted old logo: {branding['logo_file_path']}")
        except Exception as e:
            print(f"Error deleting old logo: {e}")

    # ============================================
    # Upload new logo to Azure Blob Storage
    # ============================================
    # Generate a unique filename to avoid collisions
    unique_filename = f"logo_{uuid.uuid4()}_{file.filename}"
    
    # Upload to Azure in a dedicated branding folder
    logo_file_path = storage.upload(
        content,
        unique_filename,
        folder="branding/logo"
    )

    # Save reference in branding collection
    db.branding.update_one(
        {},
        {
            "$set": {
                "logo_file_path": logo_file_path,
                "logo_filename": file.filename,
                "logo_content_type": file.content_type,
                "logo_size": len(content),
                "updated_at": datetime.utcnow(),
                "updated_by": str(current_user["id"])
            }
        },
        upsert=True
    )

    return {
        "message": "Logo uploaded successfully",
        "logo_url": "/branding/logo/file",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content)
    }

DEFAULT_LOGO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="180" height="48" viewBox="0 0 180 48" fill="none">
  <g transform="translate(6, 10)">
    <rect width="28" height="28" rx="8" fill="#0f766e"/>
    <path d="M14 6C14 6 20 7.2 20 12.8C20 19.6 14 25.2 14 25.2C14 25.2 8 19.6 8 12.8C8 7.2 14 6 14 6Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M10.8 13.6L12.8 15.6L16.8 10.8" stroke="#5eead4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="44" y="31" fill="#0f766e" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" letter-spacing="-0.5">Esigniva</text>
</svg>"""

@router.get("/logo/file", summary="Serve platform logo from Azure Storage")
async def serve_logo():
    branding = db.branding.find_one({})

    if branding and branding.get("logo_file_path"):
        try:
            image_bytes = storage.download(branding["logo_file_path"])
            content_type = branding.get("logo_content_type", "image/png")
            filename = branding.get("logo_filename", "logo.png")
            
            return StreamingResponse(
                io.BytesIO(image_bytes),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Cache-Control": "public, max-age=86400",
                    "Content-Length": str(len(image_bytes))
                }
            )
        except Exception as e:
            print(f"Error downloading logo from storage: {e}")

    # Serve fallback Esigniva logo SVG
    svg_bytes = DEFAULT_LOGO_SVG.encode("utf-8")
    return StreamingResponse(
        io.BytesIO(svg_bytes),
        media_type="image/svg+xml",
        headers={
            "Content-Disposition": 'inline; filename="esigniva_logo.svg"',
            "Cache-Control": "public, max-age=86400",
            "Content-Length": str(len(svg_bytes))
        }
    )

@router.delete("/logo", summary="Delete platform logo")
async def delete_logo(
    current_user: dict = Depends(role_required(["admin"]))
):
    """Delete the platform logo"""
    branding = db.branding.find_one({})

    if not branding or not branding.get("logo_file_path"):
        raise HTTPException(status_code=404, detail="Logo not found")

    # ============================================
    # Delete from Azure Blob Storage
    # ============================================
    try:
        storage.delete(branding["logo_file_path"])
    except Exception as e:
        print(f"Error deleting logo: {e}")

    # Remove logo reference from database
    db.branding.update_one(
        {},
        {
            "$unset": {
                "logo_file_path": "",
                "logo_filename": "",
                "logo_content_type": "",
                "logo_size": ""
            },
            "$set": {
                "logo_deleted_at": datetime.utcnow(),
                "logo_deleted_by": str(current_user["id"])
            }
        }
    )

    return {"message": "Logo deleted successfully"}

@router.get("/logo/info", summary="Get logo information")
async def get_logo_info(
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get detailed information about the current logo"""
    branding = db.branding.find_one({})

    if not branding or not branding.get("logo_file_path"):
        return {"has_logo": False}

    return {
        "has_logo": True,
        "filename": branding.get("logo_filename"),
        "content_type": branding.get("logo_content_type"),
        "size": branding.get("logo_size"),
        "uploaded_at": branding.get("updated_at"),
        "file_path": branding.get("logo_file_path")
    }