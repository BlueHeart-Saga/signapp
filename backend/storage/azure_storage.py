from azure.storage.blob import BlobServiceClient, ContentSettings
import os
import uuid
from typing import Union, BinaryIO
from .base import StorageProvider

class AzureBlobStorage(StorageProvider):
    def __init__(self):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container_name = os.getenv("AZURE_STORAGE_CONTAINER", "uploads")
        
        if not connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING not set")
        
        self.blob_service = BlobServiceClient.from_connection_string(connection_string)
        self.container_name = container_name
        
        # Create container if it doesn't exist
        self.container_client = self.blob_service.get_container_client(container_name)
        try:
            self.container_client.create_container()
        except Exception:
            # Container might already exist
            pass
    
    def upload(self, file_data: Union[bytes, BinaryIO], filename: str, folder: str = "") -> str:
        # Create blob name with folder structure
        blob_name = f"{folder}/{uuid.uuid4()}_{filename}" if folder else f"{uuid.uuid4()}_{filename}"
        blob_name = blob_name.replace('\\', '/')  # Ensure forward slashes for Azure
        
        blob_client = self.container_client.get_blob_client(blob_name)
        
        # Detect content type
        content_type = self._get_content_type(filename)
        
        if isinstance(file_data, bytes):
            blob_client.upload_blob(
                file_data, 
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type)
            )
        else:
            blob_client.upload_blob(
                file_data.read(), 
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type)
            )
        
        return blob_name
    
    def download(self, file_identifier: str) -> bytes:
        blob_client = self.container_client.get_blob_client(file_identifier)
        return blob_client.download_blob().readall()
    
    def delete(self, file_identifier: str) -> bool:
        try:
            blob_client = self.container_client.get_blob_client(file_identifier)
            blob_client.delete_blob()
            return True
        except Exception:
            return False
    
    def get_url(self, file_identifier: str) -> str:
        blob_client = self.container_client.get_blob_client(file_identifier)
        return blob_client.url
    
    def _get_content_type(self, filename: str) -> str:
        """Determine content type based on file extension"""
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        content_types = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        return content_types.get(ext, 'application/octet-stream')