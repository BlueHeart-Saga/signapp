# box.py - Updated with Azure Blob Storage
import os
import requests
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId
from database import db
from .auth import get_current_user
from storage import storage  # Import Azure storage provider

load_dotenv()

router = APIRouter(prefix="/box", tags=["Box"])

# Box configuration
BOX_CLIENT_ID = os.getenv("BOX_CLIENT_ID")
BOX_CLIENT_SECRET = os.getenv("BOX_CLIENT_SECRET")
BOX_REDIRECT_URI = os.getenv("BOX_REDIRECT_URI")

# Box API endpoints
TOKEN_URL = "https://api.box.com/oauth2/token"
FILE_INFO_URL = "https://api.box.com/2.0/files/{file_id}"
DOWNLOAD_URL = "https://api.box.com/2.0/files/{file_id}/content"
FOLDER_ITEMS_URL = "https://api.box.com/2.0/folders/{folder_id}/items"

# Note: GridFS is removed - we now use Azure Blob Storage

class BoxTokenRequest(BaseModel):
    code: str

class BoxFileDownloadRequest(BaseModel):
    file_id: str
    access_token: str

def serialize_doc(doc):
    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename"),
        "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
        "owner_id": str(doc.get("owner_id")),
        "source": doc.get("source", "box"),
        "external_url": doc.get("external_url"),
        "provider_file_id": doc.get("provider_file_id"),
        "mime_type": doc.get("mime_type"),
        "size": doc.get("size"),
        "file_path": doc.get("file_path")  # Add Azure storage path
    }

@router.post("/token")
async def exchange_box_token(payload: BoxTokenRequest):
    """Exchange authorization code for Box access token"""
    data = {
        "grant_type": "authorization_code",
        "code": payload.code,
        "client_id": BOX_CLIENT_ID,
        "client_secret": BOX_CLIENT_SECRET,
        "redirect_uri": BOX_REDIRECT_URI,
    }

    try:
        response = requests.post(TOKEN_URL, data=data)
        
        if response.status_code != 200:
            error_detail = response.json() if response.content else "Unknown error"
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Box token exchange failed: {error_detail}"
            )
        
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
async def upload_box_file(data: BoxFileDownloadRequest, current_user: dict = Depends(get_current_user)):
    """Download a selected Box file and save to Azure Blob Storage"""
    headers = {"Authorization": f"Bearer {data.access_token}"}

    try:
        # Fetch file details
        info_res = requests.get(FILE_INFO_URL.format(file_id=data.file_id), headers=headers)
        
        if info_res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
        info_res.raise_for_status()
        
        file_info = info_res.json()
        filename = file_info.get("name", "unnamed_file")
        size = file_info.get("size")

        # Download file
        download_res = requests.get(DOWNLOAD_URL.format(file_id=data.file_id), headers=headers, stream=True)
        
        if download_res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
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
        
        # Determine content type
        content_type = download_res.headers.get('content-type', 'application/octet-stream')
        
        # Upload to Azure
        file_path = storage.upload(
            file_bytes,
            unique_filename,
            folder=f"users/{current_user['_id']}/box"
        )

        # Save document metadata with Azure storage path
        doc = {
            "filename": filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "box",
            "provider_file_id": data.file_id,
            "size": size,
            "mime_type": content_type,
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
            "source": "box"
        })

        return {
            "status": "success",
            "message": "File downloaded from Box and saved to Azure successfully",
            "document": serialize_doc(doc)
        }

    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Box API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/select-file")
async def select_box_file(data: BoxFileDownloadRequest, current_user: dict = Depends(get_current_user)):
    """Save Box file metadata without downloading the file immediately"""
    headers = {"Authorization": f"Bearer {data.access_token}"}

    try:
        # Fetch file details only, don't download
        info_res = requests.get(FILE_INFO_URL.format(file_id=data.file_id), headers=headers)
        
        if info_res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
        info_res.raise_for_status()
        
        file_info = info_res.json()
        filename = file_info.get("name", "unnamed_file")
        size = file_info.get("size")
        
        # Determine mime type
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        content_type = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }.get(extension, 'application/octet-stream')

        # Save document metadata only (no file downloaded yet)
        doc = {
            "filename": filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "box",
            "provider_file_id": data.file_id,
            "size": size,
            "mime_type": content_type,
            "status": "pending_download",  # Mark as not downloaded yet
            "file_path": None,  # Will be filled when actually downloaded
            "box_access_token": data.access_token  # Store token for later download
        }
        
        result = db.documents.insert_one(doc)
        doc["_id"] = result.inserted_id

        return {
            "status": "success",
            "message": "Box file metadata saved successfully",
            "document": serialize_doc(doc)
        }
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Box API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save Box file: {str(e)}")

@router.get("/folder/{folder_id}")
async def get_box_folder_items(
    folder_id: str, 
    access_token: str = Query(..., description="Box access token"),
    current_user: dict = Depends(get_current_user)
):
    """Get files and folders from Box through backend"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        url = FOLDER_ITEMS_URL.format(folder_id=folder_id)
        response = requests.get(url, headers=headers)
        
        # Handle authentication errors specifically
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="Insufficient permissions for Box API")
        
        response.raise_for_status()
        
        data = response.json()
        files = []
        
        for item in data.get("entries", []):
            files.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "type": item.get("type"),
                "size": item.get("size"),
                "modified_at": item.get("modified_at")
            })
        
        return {"files": files}
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch Box files: {str(e)}"
        )

@router.get("/folder-info/{folder_id}")
async def get_box_folder_info(
    folder_id: str,
    access_token: str = Query(..., description="Box access token"),
    current_user: dict = Depends(get_current_user)
):
    """Get Box folder information for navigation"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        url = f"https://api.box.com/2.0/folders/{folder_id}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
        response.raise_for_status()
        
        folder_info = response.json()
        return {
            "id": folder_info.get("id"),
            "name": folder_info.get("name"),
            "parent": folder_info.get("parent")
        }
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch Box folder info: {str(e)}"
        )

# Optional: Add an endpoint to download a previously selected file
@router.post("/download/{document_id}")
async def download_selected_box_file(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a previously selected Box file to Azure storage"""
    try:
        # Find the document
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "box",
            "file_path": None  # Only if not downloaded yet
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or already downloaded")
        
        # Check if we have the access token
        access_token = doc.get("box_access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token found for this file")
        
        provider_file_id = doc.get("provider_file_id")
        if not provider_file_id:
            raise HTTPException(status_code=400, detail="No Box file ID found")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Download file from Box
        download_res = requests.get(
            DOWNLOAD_URL.format(file_id=provider_file_id), 
            headers=headers, 
            stream=True
        )
        
        if download_res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired Box access token")
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
            folder=f"users/{current_user['_id']}/box"
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
            "source": "box"
        })

        # Get updated document
        updated_doc = db.documents.find_one({"_id": ObjectId(document_id)})
        
        return {
            "status": "success",
            "message": "Box file downloaded successfully",
            "document": serialize_doc(updated_doc)
        }
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Box download error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")