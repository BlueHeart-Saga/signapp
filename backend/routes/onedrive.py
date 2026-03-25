import os
import requests
import uuid
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from database import db
from .auth import get_current_user
from storage import storage  # Import Azure storage provider

load_dotenv()

router = APIRouter(prefix="/onedrive", tags=["OneDrive"])

# OneDrive configuration
ONEDRIVE_CLIENT_ID = os.getenv("ONEDRIVE_CLIENT_ID")
ONEDRIVE_CLIENT_SECRET = os.getenv("ONEDRIVE_CLIENT_SECRET")
ONEDRIVE_REDIRECT_URI = os.getenv("ONEDRIVE_REDIRECT_URI")

# OneDrive API endpoints
ONEDRIVE_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
ONEDRIVE_FILE_URL = "https://graph.microsoft.com/v1.0/me/drive/items/{file_id}"
ONEDRIVE_DOWNLOAD_URL = "https://graph.microsoft.com/v1.0/me/drive/items/{file_id}/content"

# Note: GridFS is removed - we now use Azure Blob Storage

class OneDriveFileRequest(BaseModel):
    file_id: str
    filename: str
    download_url: str
    size: int
    access_token: Optional[str] = None  # Added for token storage

class OneDriveTokenRequest(BaseModel):
    code: str

def serialize_doc(doc):
    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename"),
        "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
        "owner_id": str(doc.get("owner_id")),
        "source": doc.get("source", "onedrive"),
        "external_url": doc.get("external_url"),
        "provider_file_id": doc.get("provider_file_id"),
        "mime_type": doc.get("mime_type"),
        "size": doc.get("size"),
        "file_path": doc.get("file_path")  # Add Azure storage path
    }

@router.post("/token")
async def exchange_onedrive_token(payload: OneDriveTokenRequest):
    """Exchange authorization code for OneDrive access token"""
    data = {
        "grant_type": "authorization_code",
        "code": payload.code,
        "client_id": ONEDRIVE_CLIENT_ID,
        "client_secret": ONEDRIVE_CLIENT_SECRET,
        "redirect_uri": ONEDRIVE_REDIRECT_URI,
        "scope": "Files.Read Files.ReadWrite offline_access"
    }

    try:
        response = requests.post(ONEDRIVE_TOKEN_URL, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token provided")

        return {
            "access_token": access_token,
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in")
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

@router.post("/upload-file")
async def upload_onedrive_file(
    data: OneDriveFileRequest, 
    access_token: str = Body(..., embed=True),  # Get access token from request body
    current_user: dict = Depends(get_current_user)
):
    """Download a OneDrive file and save to Azure Blob Storage"""
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        # Get file metadata first to determine mime type
        file_info_res = requests.get(ONEDRIVE_FILE_URL.format(file_id=data.file_id), headers=headers)
        file_info_res.raise_for_status()
        
        file_info = file_info_res.json()
        filename = data.filename or file_info.get("name", "unnamed_file")
        size = data.size or file_info.get("size", 0)
        
        # Get mime type from file info
        mime_type = "application/octet-stream"
        if file_info.get("file"):
            mime_type = file_info.get("file", {}).get("mimeType", "application/octet-stream")
        else:
            # Try to determine from filename extension
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            mime_types = {
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'txt': 'text/plain',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif'
            }
            mime_type = mime_types.get(ext, 'application/octet-stream')

        # Download file
        download_res = requests.get(ONEDRIVE_DOWNLOAD_URL.format(file_id=data.file_id), headers=headers, stream=True)
        download_res.raise_for_status()

        # Collect file bytes
        file_bytes = b""
        for chunk in download_res.iter_content(chunk_size=8192):
            if chunk:
                file_bytes += chunk

        # ============================================
        # Upload to Azure Blob Storage instead of GridFS
        # ============================================
        # Generate a unique filename to avoid collisions
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Upload to Azure
        file_path = storage.upload(
            file_bytes,
            unique_filename,
            folder=f"users/{current_user['_id']}/onedrive"
        )

        # Save document metadata with Azure storage path
        doc = {
            "filename": filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "onedrive",
            "provider_file_id": data.file_id,
            "size": size,
            "mime_type": mime_type,
            "file_path": file_path,  # Azure storage path
            "original_filename": filename,
            "storage_provider": "azure"
        }
        
        result = db.documents.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Also save to document_files collection for consistency with main app
        db.document_files.insert_one({
            "document_id": result.inserted_id,
            "file_path": file_path,
            "filename": filename,
            "page_count": 1,  # Will be updated when PDF conversion happens
            "order": 1,
            "uploaded_at": datetime.utcnow(),
            "source": "onedrive"
        })

        return {
            "status": "success",
            "message": "File downloaded from OneDrive and saved to Azure successfully",
            "document": serialize_doc(doc)
        }

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OneDrive API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/select-file")
async def select_onedrive_file(
    data: OneDriveFileRequest, 
    access_token: Optional[str] = Body(None, embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Save OneDrive file metadata without downloading the file"""
    
    # Determine mime type from filename
    filename = data.filename
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'csv': 'text/csv'
    }
    mime_type = mime_types.get(ext, 'application/octet-stream')

    # Save document metadata only
    doc = {
        "filename": filename,
        "uploaded_at": datetime.utcnow(),
        "owner_id": ObjectId(current_user["_id"]),
        "source": "onedrive",
        "provider_file_id": data.file_id,
        "external_url": data.download_url,
        "size": data.size,
        "mime_type": mime_type,
        "status": "pending_download",  # Mark as not downloaded yet
        "file_path": None,  # Will be filled when actually downloaded
        "onedrive_access_token": access_token  # Store token for later download
    }
    
    result = db.documents.insert_one(doc)
    doc["_id"] = result.inserted_id

    return {
        "status": "success",
        "message": "OneDrive file metadata saved successfully",
        "document": serialize_doc(doc)
    }

# Optional: Add an endpoint to actually download a previously selected file
@router.post("/download/{document_id}")
async def download_selected_onedrive_file(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a previously selected OneDrive file to Azure storage"""
    try:
        # Find the document
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "onedrive",
            "file_path": None  # Only if not downloaded yet
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or already downloaded")
        
        # Check if we have the access token
        access_token = doc.get("onedrive_access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token found for this file")
        
        provider_file_id = doc.get("provider_file_id")
        if not provider_file_id:
            raise HTTPException(status_code=400, detail="No OneDrive file ID found")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Download file from OneDrive
        download_res = requests.get(
            ONEDRIVE_DOWNLOAD_URL.format(file_id=provider_file_id), 
            headers=headers, 
            stream=True
        )
        
        if download_res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired OneDrive access token")
        download_res.raise_for_status()

        # Collect file bytes
        file_bytes = b""
        for chunk in download_res.iter_content(chunk_size=8192):
            if chunk:
                file_bytes += chunk

        # Upload to Azure Blob Storage
        unique_filename = f"{uuid.uuid4()}_{doc['filename']}"
        file_path = storage.upload(
            file_bytes,
            unique_filename,
            folder=f"users/{current_user['_id']}/onedrive"
        )

        # Update document with file path
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {
                "file_path": file_path,
                "status": "downloaded",
                "downloaded_at": datetime.utcnow()
            }}
        )

        # Add to document_files
        db.document_files.insert_one({
            "document_id": ObjectId(document_id),
            "file_path": file_path,
            "filename": doc["filename"],
            "page_count": 1,
            "order": 1,
            "uploaded_at": datetime.utcnow(),
            "source": "onedrive"
        })

        # Get updated document
        updated_doc = db.documents.find_one({"_id": ObjectId(document_id)})
        
        return {
            "status": "success",
            "message": "OneDrive file downloaded successfully",
            "document": serialize_doc(updated_doc)
        }
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OneDrive download error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# Optional: Endpoint to refresh access token
@router.post("/refresh-token")
async def refresh_onedrive_token(
    refresh_token: str = Body(..., embed=True)
):
    """Refresh OneDrive access token using refresh token"""
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": ONEDRIVE_CLIENT_ID,
        "client_secret": ONEDRIVE_CLIENT_SECRET,
        "scope": "Files.Read Files.ReadWrite offline_access"
    }

    try:
        response = requests.post(ONEDRIVE_TOKEN_URL, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        
        return {
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in")
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")