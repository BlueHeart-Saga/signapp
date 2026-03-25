import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId
from database import db
from .auth import get_current_user
from storage import storage  # Import Azure storage provider
import uuid

load_dotenv()

router = APIRouter(prefix="/dropbox", tags=["Dropbox"])

# Dropbox configuration
DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET")
DROPBOX_REDIRECT_URI = os.getenv("DROPBOX_REDIRECT_URI")

# Dropbox API endpoints
DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token"
DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download"
DROPBOX_METADATA_URL = "https://api.dropboxapi.com/2/files/get_metadata"

# Note: GridFS is removed - we now use Azure Blob Storage

class DropboxFileRequest(BaseModel):
    file_id: str
    filename: str
    link: str
    bytes: int

class DropboxTokenRequest(BaseModel):
    code: str

def serialize_doc(doc):
    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename"),
        "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
        "owner_id": str(doc.get("owner_id")),
        "source": doc.get("source", "dropbox"),
        "external_url": doc.get("external_url"),
        "provider_file_id": doc.get("provider_file_id"),
        "mime_type": doc.get("mime_type"),
        "size": doc.get("size"),
        "file_path": doc.get("file_path")  # Add Azure storage path
    }

@router.post("/token")
async def exchange_dropbox_token(payload: DropboxTokenRequest):
    """Exchange authorization code for Dropbox access token"""
    data = {
        "grant_type": "authorization_code",
        "code": payload.code,
        "client_id": DROPBOX_APP_KEY,
        "client_secret": DROPBOX_APP_SECRET,
        "redirect_uri": DROPBOX_REDIRECT_URI,
    }

    try:
        response = requests.post(DROPBOX_TOKEN_URL, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token provided")

        return {
            "access_token": access_token,
            "expires_in": token_data.get("expires_in")
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

@router.post("/upload-file")
async def upload_dropbox_file(data: DropboxFileRequest, current_user: dict = Depends(get_current_user)):
    """Download a Dropbox file and save to Azure Blob Storage"""
    try:
        # For Dropbox Chooser, we need to convert the sharing link to a direct download link
        # Dropbox Chooser returns links like: https://www.dropbox.com/s/xyz/file.pdf?dl=0
        # We need to change dl=0 to dl=1 for direct download
        direct_download_link = data.link.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
        
        # Download file from Dropbox
        download_res = requests.get(direct_download_link, stream=True)
        download_res.raise_for_status()

        # Get content type from response or filename
        content_type = 'application/octet-stream'
        if data.filename.lower().endswith('.pdf'):
            content_type = 'application/pdf'
        elif data.filename.lower().endswith('.jpg') or data.filename.lower().endswith('.jpeg'):
            content_type = 'image/jpeg'
        elif data.filename.lower().endswith('.png'):
            content_type = 'image/png'

        # Collect file bytes
        file_bytes = b""
        for chunk in download_res.iter_content(chunk_size=8192):
            if chunk:
                file_bytes += chunk

        # ============================================
        # Upload to Azure Blob Storage instead of GridFS
        # ============================================
        # Generate a unique filename to avoid collisions
        unique_filename = f"{uuid.uuid4()}_{data.filename}"
        
        # Upload to Azure
        file_path = storage.upload(
            file_bytes,
            unique_filename,
            folder=f"users/{current_user['_id']}/dropbox"
        )

        # Save document metadata with Azure storage path
        doc = {
            "filename": data.filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "dropbox",
            "provider_file_id": data.file_id,
            "size": data.bytes,
            "mime_type": content_type,
            "file_path": file_path,  # Azure storage path
            "original_filename": data.filename,
            "storage_provider": "azure"
        }
        
        result = db.documents.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Also save to document_files collection for consistency with your main app
        db.document_files.insert_one({
            "document_id": result.inserted_id,
            "file_path": file_path,
            "filename": data.filename,
            "page_count": 1,  # Will be updated when PDF conversion happens
            "order": 1,
            "uploaded_at": datetime.utcnow(),
            "source": "dropbox"
        })

        return {
            "status": "success",
            "message": "File downloaded from Dropbox and saved to Azure successfully",
            "document": serialize_doc(doc)
        }

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Dropbox download error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/select-file")
async def select_dropbox_file(data: DropboxFileRequest, current_user: dict = Depends(get_current_user)):
    """Save Dropbox file metadata without downloading the file"""
    try:
        # Convert to direct download link
        direct_download_link = data.link.replace('?dl=0', '?dl=1')

        # Determine mime type based on filename
        content_type = 'application/octet-stream'
        if data.filename.lower().endswith('.pdf'):
            content_type = 'application/pdf'
        elif data.filename.lower().endswith('.jpg') or data.filename.lower().endswith('.jpeg'):
            content_type = 'image/jpeg'
        elif data.filename.lower().endswith('.png'):
            content_type = 'image/png'

        # Save document metadata only (no file downloaded yet)
        doc = {
            "filename": data.filename,
            "uploaded_at": datetime.utcnow(),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "dropbox",
            "provider_file_id": data.file_id,
            "external_url": direct_download_link,
            "size": data.bytes,
            "mime_type": content_type,
            "status": "pending_download",  # Mark as not downloaded yet
            "file_path": None  # Will be filled when actually downloaded
        }
        
        result = db.documents.insert_one(doc)
        doc["_id"] = result.inserted_id

        return {
            "status": "success",
            "message": "Dropbox file metadata saved successfully",
            "document": serialize_doc(doc)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save Dropbox file: {str(e)}")

# Optional: Add an endpoint to actually download a previously selected file
@router.post("/download/{document_id}")
async def download_selected_file(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a previously selected Dropbox file to Azure storage"""
    try:
        # Find the document
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["_id"]),
            "source": "dropbox",
            "file_path": None  # Only if not downloaded yet
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or already downloaded")
        
        if not doc.get("external_url"):
            raise HTTPException(status_code=400, detail="No external URL found for this document")
        
        # Download file from Dropbox
        download_res = requests.get(doc["external_url"], stream=True)
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
            folder=f"users/{current_user['_id']}/dropbox"
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
            "source": "dropbox"
        })

        # Get updated document
        updated_doc = db.documents.find_one({"_id": ObjectId(document_id)})
        
        return {
            "status": "success",
            "message": "Dropbox file downloaded successfully",
            "document": serialize_doc(updated_doc)
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Dropbox download error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")