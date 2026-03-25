from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi.responses import StreamingResponse
import os
import uuid
from database import db
from .auth import role_required, serialize_doc
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/admin/templates", tags=["Admin Templates"])

# Note: GridFS is removed - we now use Azure Blob Storage

# Allowed file types
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
}

# Simplified Models
class TemplateCategory(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None

class DocumentTemplate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    category_id: str
    tags: List[str] = []
    is_free: bool = True
    is_active: bool = True

# Helper Functions
def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_template_to_storage(file: UploadFile, template_id: str, metadata: dict) -> str:
    """Save uploaded template file to Azure Blob Storage and return file path"""
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS.keys())}"
        )
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{template_id}_{uuid.uuid4().hex}.{ext}"
    
    # Read file content
    file_content = file.file.read()
    
    # Upload to Azure Blob Storage
    try:
        file_path = storage.upload(
            file_content,
            unique_filename,
            folder=f"templates/{template_id}"
        )
        return file_path
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file to storage: {str(e)}"
        )

def delete_template_from_storage(file_path: str):
    """Delete template file from Azure Blob Storage"""
    try:
        if file_path:
            storage.delete(file_path)
    except Exception as e:
        print(f"Error deleting file from storage: {str(e)}")

def get_file_from_storage(file_path: str):
    """Get file from Azure Blob Storage"""
    if not file_path:
        return None
    
    try:
        file_bytes = storage.download(file_path)
        return file_bytes
    except Exception as e:
        print(f"Error getting file from storage: {str(e)}")
        return None

def validate_category_exists(category_id: str):
    """Validate that category exists"""
    if not ObjectId.is_valid(category_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category ID format"
        )
    
    category = db.template_categories.find_one({
        "_id": ObjectId(category_id),
        "is_active": True
    })
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or inactive"
        )
    
    return category

# Category Management
@router.post("/categories", summary="Create a new template category")
async def create_category(
    category: TemplateCategory,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Create a new template category"""
    try:
        # Check if category already exists
        existing_category = db.template_categories.find_one({
            "name": {"$regex": f"^{category.name}$", "$options": "i"},
            "is_active": True
        })
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        
        # Create category document
        category_doc = {
            "name": category.name,
            "description": category.description or "",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "created_by": str(current_user["id"]),
            "template_count": 0
        }
        
        # Insert category
        result = db.template_categories.insert_one(category_doc)
        
        return {
            "message": "Category created successfully",
            "category_id": str(result.inserted_id),
            "category": serialize_doc(category_doc)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating category"
        )

@router.get("/categories", summary="Get all template categories")
async def get_categories(
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get all template categories"""
    try:
        categories = list(db.template_categories.find({"is_active": True}).sort("name", 1))
        
        return {
            "categories": serialize_doc(categories),
            "total": len(categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving categories"
        )

@router.delete("/categories/{category_id}", summary="Delete template category")
async def delete_category(
    category_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Delete a template category"""
    try:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category ID format"
            )
        
        # Check if category has active templates
        active_templates = db.document_templates.count_documents({
            "category_id": category_id,
            "is_active": True
        })
        
        if active_templates > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {active_templates} active templates"
            )
        
        # Soft delete category
        result = db.template_categories.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": {
                "is_active": False,
                "deleted_at": datetime.utcnow(),
                "deleted_by": str(current_user["id"])
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return {
            "message": "Category deleted successfully",
            "category_id": category_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting category"
        )

# Template Management
@router.post("/upload", summary="Upload a new document template")
async def upload_template(
    title: str = Form(..., min_length=3, max_length=200),
    description: Optional[str] = Form(None),
    category_id: str = Form(...),
    tags: str = Form(""),
    is_free: bool = Form(True),
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Upload a new document template"""
    try:
        # Validate category
        category = validate_category_exists(category_id)
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        
        # Create template document
        template_doc = {
            "title": title,
            "description": description or "",
            "category_id": category_id,
            "category_name": category["name"],
            "tags": tag_list,
            "is_free": is_free,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "created_by": str(current_user["id"]),
            "download_count": 0
        }
        
        # Insert template
        result = db.document_templates.insert_one(template_doc)
        template_id = str(result.inserted_id)
        
        # Prepare metadata for storage
        metadata = {
            "created_by": str(current_user["id"]),
            "title": title,
            "category": category["name"]
        }
        
        # Save template file to Azure Blob Storage
        file_path = save_template_to_storage(file, template_id, metadata)
        
        # Update template with file information
        db.document_templates.update_one(
            {"_id": result.inserted_id},
            {"$set": {
                "filename": file.filename,
                "file_path": file_path,  # Changed from file_id to file_path
                "content_type": ALLOWED_EXTENSIONS.get(file.filename.rsplit('.', 1)[1].lower(), "application/octet-stream")
            }}
        )
        
        # Update category template count
        db.template_categories.update_one(
            {"_id": ObjectId(category_id)},
            {"$inc": {"template_count": 1}}
        )
        
        # Get the created template
        created_template = db.document_templates.find_one({"_id": result.inserted_id})
        
        return {
            "message": "Template uploaded successfully",
            "template_id": template_id,
            "template": serialize_doc(created_template)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up if template was created but file upload failed
        if 'result' in locals():
            db.document_templates.delete_one({"_id": result.inserted_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading template: {str(e)}"
        )

@router.get("/", summary="Get all templates")
async def get_templates(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get all templates with pagination"""
    try:
        # Build query
        query = {"is_active": True}
        
        if category_id and ObjectId.is_valid(category_id):
            query["category_id"] = category_id
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}}
            ]
        
        # Count total matching templates
        total_templates = db.document_templates.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get templates
        templates_cursor = db.document_templates.find(query).sort("created_at", -1).skip(skip).limit(limit)
        templates = list(templates_cursor)
        
        return {
            "templates": serialize_doc(templates),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_templates,
                "pages": (total_templates + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving templates"
        )

@router.get("/{template_id}", summary="Get template details")
async def get_template_details(
    template_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get detailed information about a specific template"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get template
        template = db.document_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return serialize_doc(template)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving template details"
        )

@router.put("/{template_id}/status", summary="Update template status")
async def update_template_status(
    template_id: str,
    is_active: bool = Query(...),
    current_user: dict = Depends(role_required(["admin"]))
):
    """Activate or deactivate a template"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get template to get category ID
        template = db.document_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Update template status
        update_data = {
            "is_active": is_active,
            "updated_at": datetime.utcnow()
        }
        
        if is_active:
            update_data["activated_at"] = datetime.utcnow()
            update_data["activated_by"] = str(current_user["id"])
            # Increment category count
            if template.get("category_id"):
                db.template_categories.update_one(
                    {"_id": ObjectId(template["category_id"])},
                    {"$inc": {"template_count": 1}}
                )
        else:
            update_data["deactivated_at"] = datetime.utcnow()
            update_data["deactivated_by"] = str(current_user["id"])
            # Decrement category count
            if template.get("category_id"):
                db.template_categories.update_one(
                    {"_id": ObjectId(template["category_id"])},
                    {"$inc": {"template_count": -1}}
                )
        
        result = db.document_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update template status"
            )
        
        return {
            "message": f"Template {'activated' if is_active else 'deactivated'} successfully",
            "template_id": template_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating template status"
        )

@router.delete("/{template_id}", summary="Delete template")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Delete a template"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get template
        template = db.document_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Delete file from Azure Blob Storage if exists
        file_path = template.get("file_path")
        if file_path:
            delete_template_from_storage(file_path)
        
        # Delete template from database
        result = db.document_templates.delete_one({"_id": ObjectId(template_id)})
        
        # Decrement category template count
        category_id = template.get("category_id")
        if category_id and template.get("is_active"):
            db.template_categories.update_one(
                {"_id": ObjectId(category_id)},
                {"$inc": {"template_count": -1}}
            )
        
        return {
            "message": "Template deleted successfully",
            "template_id": template_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting template"
        )

@router.get("/stats/summary", summary="Get template statistics")
async def get_template_stats(
    current_user: dict = Depends(role_required(["admin"]))
):
    """Get template statistics"""
    try:
        # Total counts
        total_templates = db.document_templates.count_documents({})
        active_templates = db.document_templates.count_documents({"is_active": True})
        free_templates = db.document_templates.count_documents({"is_free": True, "is_active": True})
        
        # Category distribution
        categories = list(db.template_categories.find({"is_active": True}))
        category_distribution = []
        for category in categories:
            category_id = str(category["_id"])
            template_count = db.document_templates.count_documents({
                "category_id": category_id,
                "is_active": True
            })
            category_distribution.append({
                "category_id": category_id,
                "category_name": category["name"],
                "template_count": template_count
            })
        
        # Most downloaded templates
        popular_templates = list(db.document_templates.find(
            {"is_active": True}
        ).sort("download_count", -1).limit(5))
        
        return {
            "summary": {
                "total_templates": total_templates,
                "active_templates": active_templates,
                "free_templates": free_templates,
                "premium_templates": active_templates - free_templates
            },
            "category_distribution": serialize_doc(category_distribution),
            "popular_templates": serialize_doc(popular_templates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving template statistics"
        )

@router.get("/download/{template_id}", summary="Download template file")
async def download_template(
    template_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Download template file"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get template
        template = db.document_templates.find_one({
            "_id": ObjectId(template_id),
            "is_active": True
        })
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or inactive"
            )
        
        file_path = template.get("file_path")
        filename = template.get("filename", "template")
        
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template file not found"
            )
        
        # Get file from Azure Blob Storage
        file_bytes = get_file_from_storage(file_path)
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template file not found in storage"
            )
        
        # Increment download count
        db.document_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$inc": {"download_count": 1}}
        )
        
        # Return file for download
        from fastapi.responses import StreamingResponse
        import io
        
        return StreamingResponse(
            content=io.BytesIO(file_bytes),
            media_type=template.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading template: {str(e)}"
        )
        
        
# User-facing template endpoints
@router.get("/user/available", summary="Get available templates for users")
async def get_user_templates(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    free_only: bool = Query(default=False, description="Show only free templates"),
    current_user: dict = Depends(role_required(["user", "admin"]))  # Both users and admins can access
):
    """Get all active templates available for users"""
    try:
        # Build query for active templates only
        query = {"is_active": True}
        
        if category_id and ObjectId.is_valid(category_id):
            query["category_id"] = category_id
        
        if free_only:
            query["is_free"] = True
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search]}}
            ]
        
        # Count total matching templates
        total_templates = db.document_templates.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get templates - exclude sensitive fields for users
        templates_cursor = db.document_templates.find(
            query,
            {
                "file_path": 0,  # Hide file_path from users
                "created_by": 0,  # Hide creator info
                "updated_at": 0,
                "activated_at": 0,
                "activated_by": 0,
                "deactivated_at": 0,
                "deactivated_by": 0
            }
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        templates = list(templates_cursor)
        
        return {
            "templates": serialize_doc(templates),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_templates,
                "pages": (total_templates + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving templates"
        )

@router.get("/user/categories", summary="Get active template categories for users")
async def get_user_categories(
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    """Get all active template categories with template counts for users"""
    try:
        # Get active categories with their template counts
        categories = list(db.template_categories.find({"is_active": True}).sort("name", 1))
        
        # Add template counts for each category
        enhanced_categories = []
        for category in categories:
            category_id = str(category["_id"])
            template_count = db.document_templates.count_documents({
                "category_id": category_id,
                "is_active": True
            })
            
            enhanced_category = {
                "_id": category["_id"],
                "name": category["name"],
                "description": category.get("description", ""),
                "template_count": template_count
            }
            enhanced_categories.append(enhanced_category)
        
        return {
            "categories": serialize_doc(enhanced_categories),
            "total": len(enhanced_categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving categories"
        )

@router.get("/user/{template_id}", summary="Get template details for user")
async def get_user_template_details(
    template_id: str,
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    """Get template details for user viewing"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get active template only
        template = db.document_templates.find_one({
            "_id": ObjectId(template_id),
            "is_active": True
        })
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or inactive"
            )
        
        # Remove sensitive fields for users
        template.pop("file_path", None)
        template.pop("created_by", None)
        template.pop("updated_at", None)
        template.pop("activated_at", None)
        template.pop("activated_by", None)
        template.pop("deactivated_at", None)
        template.pop("deactivated_by", None)
        
        # Get category details
        if template.get("category_id"):
            category = db.template_categories.find_one({
                "_id": ObjectId(template["category_id"]),
                "is_active": True
            })
            if category:
                template["category_details"] = {
                    "name": category["name"],
                    "description": category.get("description", "")
                }
        
        return serialize_doc(template)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving template details"
        )

@router.post("/user/download/{template_id}", summary="Download template as user")
async def user_download_template(
    template_id: str,
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    """Download template file as a user"""
    try:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid template ID format"
            )
        
        # Get active template
        template = db.document_templates.find_one({
            "_id": ObjectId(template_id),
            "is_active": True
        })
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found or inactive"
            )
        
        # Check if template is free or user has permission
        if not template.get("is_free", True):
            # Here you can add premium template access logic
            # For example, check if user has purchased or subscribed
            # For now, we'll allow all users to download
            pass
        
        file_path = template.get("file_path")
        filename = template.get("filename", "template")
        
        if not file_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template file not found"
            )
        
        # Get file from Azure Blob Storage
        file_bytes = get_file_from_storage(file_path)
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template file not found in storage"
            )
        
        # Increment download count
        db.document_templates.update_one(
            {"_id": ObjectId(template_id)},
            {"$inc": {"download_count": 1}}
        )
        
        # Log user download (optional)
        download_log = {
            "user_id": str(current_user["id"]),
            "template_id": template_id,
            "template_title": template.get("title"),
            "downloaded_at": datetime.utcnow(),
            "is_free": template.get("is_free", True)
        }
        db.template_downloads.insert_one(download_log)
        
        # Return file for download
        from fastapi.responses import StreamingResponse
        import io
        
        return StreamingResponse(
            content=io.BytesIO(file_bytes),
            media_type=template.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading template: {str(e)}"
        )

@router.get("/user/stats/popular", summary="Get popular templates for users")
async def get_popular_templates(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    """Get most downloaded templates for user display"""
    try:
        # Get popular active templates
        popular_templates = list(db.document_templates.find(
            {"is_active": True}
        ).sort("download_count", -1).limit(limit))
        
        # Remove sensitive fields
        for template in popular_templates:
            template.pop("file_path", None)
            template.pop("created_by", None)
        
        return {
            "popular_templates": serialize_doc(popular_templates),
            "count": len(popular_templates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving popular templates"
        )

@router.get("/user/search/suggestions", summary="Get search suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=1),
    limit: int = Query(default=10, ge=1, le=20),
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    """Get search suggestions for templates"""
    try:
        # Search in titles and tags
        suggestions = []
        
        # Search in titles
        title_matches = db.document_templates.find({
            "title": {"$regex": query, "$options": "i"},
            "is_active": True
        }).limit(limit // 2)
        
        for template in title_matches:
            suggestions.append({
                "type": "template",
                "value": template["title"],
                "template_id": str(template["_id"]),
                "category": template.get("category_name", "")
            })
        
        # Search in tags if we need more results
        if len(suggestions) < limit:
            tag_matches = db.document_templates.aggregate([
                {"$match": {
                    "tags": {"$regex": query, "$options": "i"},
                    "is_active": True
                }},
                {"$unwind": "$tags"},
                {"$match": {
                    "tags": {"$regex": query, "$options": "i"}
                }},
                {"$group": {
                    "_id": "$tags",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}},
                {"$limit": limit - len(suggestions)}
            ])
            
            for tag_match in tag_matches:
                suggestions.append({
                    "type": "tag",
                    "value": tag_match["_id"],
                    "count": tag_match["count"]
                })
        
        return {
            "suggestions": suggestions[:limit],
            "count": len(suggestions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving search suggestions"
        )
        
        
@router.get("/user/view/{template_id}", summary="View template PDF inline")
async def user_view_template(
    template_id: str,
    current_user: dict = Depends(role_required(["user", "admin"]))
):
    if not ObjectId.is_valid(template_id):
        raise HTTPException(status_code=400, detail="Invalid template ID")

    template = db.document_templates.find_one({
        "_id": ObjectId(template_id),
        "is_active": True
    })

    if not template or not template.get("file_path"):
        raise HTTPException(status_code=404, detail="Template not found")

    file_bytes = get_file_from_storage(template["file_path"])
    if not file_bytes:
        raise HTTPException(status_code=404, detail="File not found")

    from fastapi.responses import StreamingResponse
    import io
    
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=template.get("content_type", "application/pdf"),
        headers={
            "Content-Disposition": f"inline; filename={template.get('filename', 'template.pdf')}"
        }
    )