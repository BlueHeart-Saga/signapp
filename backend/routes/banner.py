from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi.responses import StreamingResponse, JSONResponse
import io
import base64
from PIL import Image
import uuid
from database import db
from .auth import role_required, get_current_user
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/banners", tags=["Banner Management"])

# Note: GridFS is removed - we now use Azure Blob Storage

# Helper function to generate thumbnail
def generate_thumbnail(image_bytes: bytes, size: tuple = (300, 150)) -> str:
    """Generate base64 thumbnail from image bytes"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Convert to bytes
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return ""

# Helper to serialize banner
def serialize_banner(banner):
    """Serialize banner for frontend response"""
    return {
        "id": str(banner["_id"]),
        "_id": str(banner["_id"]),
        "title": banner.get("title", ""),
        "subtitle": banner.get("subtitle", ""),
        "description": banner.get("description", ""),
        "image_url": f"/banners/file/{banner['_id']}",
        "link": banner.get("link", ""),
        "link_url": banner.get("link", ""),
        "button_text": banner.get("button_text", "Learn More"),
        "order": banner.get("order", 1),
        "is_active": banner.get("is_active", True),
        "isActive": banner.get("is_active", True),
        "start_date": banner.get("start_date"),
        "end_date": banner.get("end_date"),
        "background_color": banner.get("background_color", ""),
        "text_color": banner.get("text_color", "#ffffff"),
        "button_color": banner.get("button_color", "#fbbf24"),
        "button_text_color": banner.get("button_text_color", "#1f2937"),
        "features": banner.get("features", []),
        "tags": banner.get("tags", []),
        "clicks": banner.get("clicks", 0),
        "impressions": banner.get("impressions", 0),
        "filename": banner.get("filename", ""),
        "content_type": banner.get("content_type", ""),
        "thumbnail": banner.get("thumbnail", ""),
        "created_at": banner.get("created_at"),
        "updated_at": banner.get("updated_at"),
        "created_by": str(banner.get("created_by")) if banner.get("created_by") else None,
        "file_path": banner.get("file_path")  # Add Azure storage path
    }

@router.post("/", summary="Upload banner with full details")
async def upload_banner(
    title: str = Form(...),
    subtitle: Optional[str] = Form(""),
    description: Optional[str] = Form(""),
    link: Optional[str] = Form(None),
    button_text: Optional[str] = Form("Learn More"),
    order: int = Form(1),
    is_active: bool = Form(True),
    background_color: Optional[str] = Form("#667eea"),
    text_color: Optional[str] = Form("#ffffff"),
    button_color: Optional[str] = Form("#fbbf24"),
    button_text_color: Optional[str] = Form("#1f2937"),
    features: Optional[str] = Form(""),  # Comma-separated
    tags: Optional[str] = Form(""),  # Comma-separated
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Upload a new banner with all metadata"""
    
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image too large. Maximum size is 5MB"
        )
    
    # ============================================
    # Upload to Azure Blob Storage instead of GridFS
    # ============================================
    # Generate a unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    
    # Upload to Azure with metadata
    file_path = storage.upload(
        content,
        unique_filename,
        folder=f"banners/{current_user['id']}"
    )
    
    # Generate thumbnail
    thumbnail = generate_thumbnail(content)
    
    # Parse features and tags
    features_list = [f.strip() for f in features.split(",") if f.strip()] if features else []
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    # Parse dates
    start_date_obj = None
    end_date_obj = None
    try:
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except:
        pass
    
    # Create banner document with Azure file path
    banner = {
        "title": title,
        "subtitle": subtitle,
        "description": description,
        "link": link,
        "button_text": button_text,
        "order": order,
        "is_active": is_active,
        "background_color": background_color,
        "text_color": text_color,
        "button_color": button_color,
        "button_text_color": button_text_color,
        "features": features_list,
        "tags": tags_list,
        "start_date": start_date_obj,
        "end_date": end_date_obj,
        "file_path": file_path,  # Azure storage path
        "filename": file.filename,
        "content_type": file.content_type,
        "thumbnail": thumbnail,
        "clicks": 0,
        "impressions": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": ObjectId(current_user["id"]),
        "storage_provider": "azure"
    }
    
    result = db.banners.insert_one(banner)
    banner["_id"] = result.inserted_id
    
    return {
        "message": "Banner uploaded successfully",
        "banner_id": str(result.inserted_id),
        "banner": serialize_banner(banner)
    }

@router.get("/active", summary="Get active banners")
async def get_active_banners(current_user: dict = Depends(get_current_user)):
    """Get all active banners that are currently valid"""
    now = datetime.utcnow()
    
    # Build query for active banners
    query = {
        "is_active": True,
        "$or": [
            {"start_date": {"$exists": False}},
            {"start_date": None},
            {"start_date": {"$lte": now}}
        ],
        "$or": [
            {"end_date": {"$exists": False}},
            {"end_date": None},
            {"end_date": {"$gte": now}}
        ]
    }
    
    banners = db.banners.find(query).sort("order", 1)
    
    response = []
    for banner in banners:
        response.append(serialize_banner(banner))
    
    return response

@router.get("/all", summary="Get all banners (admin only)")
async def get_all_banners(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get all banners with pagination (admin only)"""
    total = db.banners.count_documents({})
    
    banners = list(db.banners.find()
        .sort([("is_active", -1), ("order", 1), ("created_at", -1)])
        .skip(skip)
        .limit(limit))
    
    return {
        "banners": [serialize_banner(b) for b in banners],
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": total,
            "has_more": skip + limit < total
        }
    }

@router.get("/file/{banner_id}", summary="Serve banner image")
async def serve_banner(banner_id: str):
    """Serve banner image file"""
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    try:
        # ============================================
        # Download from Azure Blob Storage
        # ============================================
        if banner.get("file_path"):
            image_bytes = storage.download(banner["file_path"])
        else:
            # Fallback for legacy banners
            raise HTTPException(status_code=404, detail="Banner image missing")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Banner image missing: {str(e)}")
    
    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type=banner.get("content_type", "image/png"),
        headers={
            "Content-Disposition": f'inline; filename="{banner.get("filename", "banner.jpg")}"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.get("/{banner_id}", summary="Get banner details")
async def get_banner(banner_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(banner_id):
        raise HTTPException(status_code=400, detail="Invalid banner ID")

    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    return serialize_banner(banner)


@router.put("/{banner_id}", summary="Update banner")
async def update_banner(
    banner_id: str,
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    link: Optional[str] = Form(None),
    button_text: Optional[str] = Form(None),
    order: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    background_color: Optional[str] = Form(None),
    text_color: Optional[str] = Form(None),
    button_color: Optional[str] = Form(None),
    button_text_color: Optional[str] = Form(None),
    features: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Update banner metadata"""
    
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = {}
    
    # Basic fields
    if title is not None:
        update_data["title"] = title
    if subtitle is not None:
        update_data["subtitle"] = subtitle
    if description is not None:
        update_data["description"] = description
    if link is not None:
        update_data["link"] = link
    if button_text is not None:
        update_data["button_text"] = button_text
    if order is not None:
        update_data["order"] = order
    if is_active is not None:
        update_data["is_active"] = is_active
    
    # Color fields
    if background_color is not None:
        update_data["background_color"] = background_color
    if text_color is not None:
        update_data["text_color"] = text_color
    if button_color is not None:
        update_data["button_color"] = button_color
    if button_text_color is not None:
        update_data["button_text_color"] = button_text_color
    
    # Date fields
    try:
        if start_date is not None:
            update_data["start_date"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        if end_date is not None:
            update_data["end_date"] = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # List fields
    if features is not None:
        update_data["features"] = [f.strip() for f in features.split(",") if f.strip()]
    if tags is not None:
        update_data["tags"] = [t.strip() for t in tags.split(",") if t.strip()]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    db.banners.update_one(
        {"_id": ObjectId(banner_id)},
        {"$set": update_data}
    )
    
    # Get updated banner
    updated_banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    return {
        "message": "Banner updated successfully",
        "banner": serialize_banner(updated_banner)
    }

@router.put("/{banner_id}/image", summary="Replace banner image")
async def replace_banner_image(
    banner_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Replace banner image and regenerate thumbnail"""
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    # Validate file
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed: {', '.join(allowed_types)}"
        )
    
    content = await file.read()
    
    # Generate new thumbnail
    thumbnail = generate_thumbnail(content)
    
    # ============================================
    # Delete old image from Azure
    # ============================================
    try:
        if banner.get("file_path"):
            storage.delete(banner["file_path"])
    except Exception as e:
        print(f"Error deleting old banner image: {e}")
    
    # Upload new image to Azure
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    new_file_path = storage.upload(
        content,
        unique_filename,
        folder=f"banners/{current_user['id']}"
    )
    
    # Update banner
    db.banners.update_one(
        {"_id": ObjectId(banner_id)},
        {"$set": {
            "file_path": new_file_path,
            "filename": file.filename,
            "content_type": file.content_type,
            "thumbnail": thumbnail,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Banner image replaced successfully"}

@router.post("/{banner_id}/click", summary="Track banner click")
async def track_banner_click(
    banner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Increment click counter for a banner"""
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    # Update click count
    db.banners.update_one(
        {"_id": ObjectId(banner_id)},
        {
            "$inc": {"clicks": 1},
            "$set": {"last_clicked": datetime.utcnow()}
        }
    )
    
    # Log click event
    db.banner_clicks.insert_one({
        "banner_id": ObjectId(banner_id),
        "user_id": ObjectId(current_user["id"]) if current_user.get("id") else None,
        "user_email": current_user.get("email"),
        "clicked_at": datetime.utcnow(),
        "source": "banner_slider"
    })
    
    return {"message": "Click tracked successfully"}

@router.post("/{banner_id}/impression", summary="Track banner impression")
async def track_banner_impression(
    banner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Increment impression counter for a banner"""
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    # Update impression count
    db.banners.update_one(
        {"_id": ObjectId(banner_id)},
        {
            "$inc": {"impressions": 1},
            "$set": {"last_viewed": datetime.utcnow()}
        }
    )
    
    # Log impression event
    db.banner_impressions.insert_one({
        "banner_id": ObjectId(banner_id),
        "user_id": ObjectId(current_user["id"]) if current_user.get("id") else None,
        "user_email": current_user.get("email"),
        "viewed_at": datetime.utcnow(),
        "source": "banner_slider"
    })
    
    return {"message": "Impression tracked successfully"}

@router.get("/stats", summary="Get overall banner statistics")
async def get_overall_banner_stats(
    current_user: dict = Depends(role_required(["admin"]))
):
    total = db.banners.count_documents({})
    active = db.banners.count_documents({"is_active": True})

    clicks = sum(b.get("clicks", 0) for b in db.banners.find())
    impressions = sum(b.get("impressions", 0) for b in db.banners.find())

    ctr = (clicks / impressions * 100) if impressions > 0 else 0

    return {
        "total_banners": total,
        "active_banners": active,
        "total_clicks": clicks,
        "total_impressions": impressions,
        "overall_ctr": round(ctr, 2)
    }


@router.delete("/{banner_id}", summary="Delete banner")
async def delete_banner(
    banner_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Delete a banner and its associated image"""
    banner = db.banners.find_one({"_id": ObjectId(banner_id)})
    
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    # ============================================
    # Delete image from Azure Blob Storage
    # ============================================
    try:
        if banner.get("file_path"):
            storage.delete(banner["file_path"])
    except Exception as e:
        print(f"Error deleting banner image: {e}")
    
    # Delete banner document
    db.banners.delete_one({"_id": ObjectId(banner_id)})
    
    # Clean up related data (optional)
    db.banner_clicks.delete_many({"banner_id": ObjectId(banner_id)})
    db.banner_impressions.delete_many({"banner_id": ObjectId(banner_id)})
    
    return {"message": "Banner deleted successfully"}