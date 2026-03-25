import io
import base64
import uuid
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from PIL import Image

from database import db
from storage import storage  # Import Azure storage provider

router = APIRouter(prefix="/api/signatures", tags=["signatures"])

# Note: GridFS is removed - we now use Azure Blob Storage

class SignatureService:
    def __init__(self):
        pass

    def validate_image_file(self, file: UploadFile) -> bool:
        """Validate uploaded image file"""
        allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp']
        if file.content_type not in allowed_types:
            return False
        
        # Check file size (10MB max)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            return False
            
        return True

    def process_signature_image(self, image_data: bytes, max_width: int = 800, max_height: int = 400) -> bytes:
        """Process and optimize signature image"""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save as optimized PNG
            output = io.BytesIO()
            image.save(output, format='PNG', optimize=True)
            return output.getvalue()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image processing failed: {str(e)}"
            )

    def save_to_storage(self, file_data: bytes, filename: str, content_type: str, metadata: dict) -> str:
        """Save file to Azure Blob Storage with metadata and return file path"""
        # Generate a unique filename to avoid collisions
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Create folder structure for signatures
        folder = f"signatures/{metadata.get('owner_id', 'unknown')}"
        
        # Upload to Azure
        file_path = storage.upload(
            file_data,
            unique_filename,
            folder=folder
        )
        
        return file_path

    def get_from_storage(self, file_path: str) -> bytes:
        """Get file from Azure Blob Storage"""
        return storage.download(file_path)

    def delete_from_storage(self, file_path: str):
        """Delete file from Azure Blob Storage"""
        storage.delete(file_path)

# Initialize service
signature_service = SignatureService()

def serialize_signature(sig):
    """Serialize signature document for JSON response"""
    return {
        "id": str(sig["_id"]),
        "name": sig.get("name"),
        "signature_type": sig.get("signature_type"),
        "font": sig.get("font"),
        "color": sig.get("color"),
        "file_path": sig.get("file_path"),  # Changed from file_id to file_path
        "filename": sig.get("filename"),
        "mime_type": sig.get("mime_type"),
        "size": sig.get("size"),
        "created_at": sig.get("created_at").isoformat() if sig.get("created_at") else None,
        "updated_at": sig.get("updated_at").isoformat() if sig.get("updated_at") else None,
        "url": f"/api/signatures/{sig['_id']}/image" if sig.get("file_path") else None
    }

# Simple mock user for testing (remove this in production)
MOCK_USER_ID = ObjectId("507f1f77bcf86cd799439011")

@router.get("/", response_model=List[dict])
async def get_all_signatures(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search by signature name"),
    signature_type: Optional[str] = Query(None, description="Filter by signature type")
):
    """
    Get all signatures with pagination and filtering
    """
    try:
        # Build query - using mock user for testing
        query = {"owner_id": MOCK_USER_ID}
        
        # Apply search filter
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        # Apply type filter
        if signature_type:
            query["signature_type"] = signature_type
        
        # Get total count
        total = db.signatures.count_documents(query)
        
        # Get signatures with pagination
        signatures = list(db.signatures.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit))
        
        return JSONResponse(
            content={
                "signatures": [serialize_signature(sig) for sig in signatures],
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch signatures: {str(e)}"
        )

@router.post("/")
async def create_signature(
    name: str = Form(..., description="Signature name"),
    signature_type: str = Form(..., description="Signature type (draw, type, upload)"),
    font: Optional[str] = Form(None, description="Font name for typed signatures"),
    color: Optional[str] = Form(None, description="Signature color"),
    image_file: Optional[UploadFile] = File(None, description="Signature image file")
):
    """
    Create a new signature
    """
    try:
        # Validate signature type
        if signature_type not in ['draw', 'type', 'upload']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature type. Must be 'draw', 'type', or 'upload'"
            )
        
        # Check if signature with same name already exists
        existing_signature = db.signatures.find_one({
            "name": name,
            "owner_id": MOCK_USER_ID
        })
        if existing_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signature with this name already exists"
            )
        
        file_path = None
        filename = None
        mime_type = None
        size = 0
        
        # Handle image upload
        if image_file and image_file.filename:
            if not signature_service.validate_image_file(image_file):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image file. Allowed types: PNG, JPEG, JPG, GIF, BMP. Max size: 10MB"
                )
            
            # Read and process image
            image_content = await image_file.read()
            processed_image = signature_service.process_signature_image(image_content)
            
            # Save to Azure Blob Storage
            metadata = {
                "owner_id": str(MOCK_USER_ID),
                "signature_name": name,
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
            file_path = signature_service.save_to_storage(
                file_data=processed_image,
                filename=image_file.filename,
                content_type="image/png",
                metadata=metadata
            )
            
            filename = image_file.filename
            mime_type = "image/png"
            size = len(processed_image)
        
        # Create signature document
        signature_doc = {
            "name": name,
            "signature_type": signature_type,
            "font": font,
            "color": color,
            "file_path": file_path,  # Changed from file_id to file_path
            "filename": filename,
            "mime_type": mime_type,
            "size": size,
            "owner_id": MOCK_USER_ID,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into signatures collection
        result = db.signatures.insert_one(signature_doc)
        signature_doc["_id"] = result.inserted_id
        
        return {
            "message": "Signature created successfully",
            "signature": serialize_signature(signature_doc)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create signature: {str(e)}"
        )

@router.get("/{signature_id}/image")
async def get_signature_image(signature_id: str):
    """
    Get signature image (direct image response)
    """
    try:
        signature = db.signatures.find_one({
            "_id": ObjectId(signature_id),
            "owner_id": MOCK_USER_ID
        })
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signature not found"
            )
        
        if not signature.get("file_path"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signature image not found"
            )
        
        # Get file from Azure Blob Storage
        try:
            file_bytes = signature_service.get_from_storage(signature["file_path"])
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Signature image not found in storage: {str(e)}"
            )
        
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=signature.get("mime_type", "image/png"),
            headers={
                "Content-Disposition": f"inline; filename={signature.get('filename', 'signature.png')}",
                "Cache-Control": "public, max-age=86400"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get signature image: {str(e)}"
        )

@router.delete("/{signature_id}")
async def delete_signature(signature_id: str):
    """
    Delete a signature
    """
    try:
        signature = db.signatures.find_one({
            "_id": ObjectId(signature_id),
            "owner_id": MOCK_USER_ID
        })
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signature not found"
            )
        
        # Delete associated Azure Blob Storage file if exists
        if signature.get("file_path"):
            try:
                signature_service.delete_from_storage(signature["file_path"])
            except Exception as e:
                print(f"Warning: Could not delete Azure file: {e}")
        
        # Delete from signatures collection
        db.signatures.delete_one({"_id": ObjectId(signature_id)})
        
        return {
            "message": "Signature deleted successfully",
            "signature_id": signature_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete signature: {str(e)}"
        )

@router.get("/{signature_id}/base64")
async def get_signature_base64(signature_id: str):
    """
    Get signature image as base64 encoded string
    """
    try:
        signature = db.signatures.find_one({
            "_id": ObjectId(signature_id),
            "owner_id": MOCK_USER_ID
        })
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signature not found"
            )
        
        if not signature.get("file_path"):
            # Return empty image for non-image signatures
            return {
                "signature_id": signature_id,
                "name": signature.get("name"),
                "signature_type": signature.get("signature_type"),
                "font": signature.get("font"),
                "color": signature.get("color"),
                "image_base64": None
            }
        
        # Get file from Azure Blob Storage
        try:
            file_bytes = signature_service.get_from_storage(signature["file_path"])
            image_base64 = base64.b64encode(file_bytes).decode('utf-8')
            
            # Add data URL prefix
            mime_type = signature.get("mime_type", "image/png")
            data_url = f"data:{mime_type};base64,{image_base64}"
            
            return {
                "signature_id": signature_id,
                "name": signature.get("name"),
                "signature_type": signature.get("signature_type"),
                "font": signature.get("font"),
                "color": signature.get("color"),
                "image_base64": image_base64,
                "data_url": data_url,
                "mime_type": mime_type
            }
        except Exception as e:
            return {
                "signature_id": signature_id,
                "name": signature.get("name"),
                "signature_type": signature.get("signature_type"),
                "font": signature.get("font"),
                "color": signature.get("color"),
                "image_base64": None,
                "error": str(e)
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get signature as base64: {str(e)}"
        )

@router.put("/{signature_id}")
async def update_signature(
    signature_id: str,
    name: Optional[str] = Form(None, description="Signature name"),
    font: Optional[str] = Form(None, description="Font name for typed signatures"),
    color: Optional[str] = Form(None, description="Signature color"),
    image_file: Optional[UploadFile] = File(None, description="New signature image file")
):
    """
    Update an existing signature
    """
    try:
        signature = db.signatures.find_one({
            "_id": ObjectId(signature_id),
            "owner_id": MOCK_USER_ID
        })
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signature not found"
            )
        
        update_data = {"updated_at": datetime.utcnow()}
        
        # Update name if provided
        if name is not None:
            # Check if new name conflicts with existing signature
            existing = db.signatures.find_one({
                "name": name,
                "owner_id": MOCK_USER_ID,
                "_id": {"$ne": ObjectId(signature_id)}
            })
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Another signature with this name already exists"
                )
            update_data["name"] = name
        
        # Update font if provided
        if font is not None:
            update_data["font"] = font
        
        # Update color if provided
        if color is not None:
            update_data["color"] = color
        
        # Handle image update
        if image_file and image_file.filename:
            if not signature_service.validate_image_file(image_file):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image file. Allowed types: PNG, JPEG, JPG, GIF, BMP. Max size: 10MB"
                )
            
            # Read and process new image
            image_content = await image_file.read()
            processed_image = signature_service.process_signature_image(image_content)
            
            # Delete old file if exists
            if signature.get("file_path"):
                try:
                    signature_service.delete_from_storage(signature["file_path"])
                except Exception as e:
                    print(f"Warning: Could not delete old file: {e}")
            
            # Save new file to Azure
            metadata = {
                "owner_id": str(MOCK_USER_ID),
                "signature_name": update_data.get("name", signature.get("name")),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            new_file_path = signature_service.save_to_storage(
                file_data=processed_image,
                filename=image_file.filename,
                content_type="image/png",
                metadata=metadata
            )
            
            update_data["file_path"] = new_file_path
            update_data["filename"] = image_file.filename
            update_data["mime_type"] = "image/png"
            update_data["size"] = len(processed_image)
        
        # Update signature
        db.signatures.update_one(
            {"_id": ObjectId(signature_id)},
            {"$set": update_data}
        )
        
        # Get updated signature
        updated_signature = db.signatures.find_one({"_id": ObjectId(signature_id)})
        
        return {
            "message": "Signature updated successfully",
            "signature": serialize_signature(updated_signature)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update signature: {str(e)}"
        )