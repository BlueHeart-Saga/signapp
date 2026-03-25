import os
from .base import StorageProvider
from .fs_storage import FileSystemStorage
from .azure_storage import AzureBlobStorage

def get_storage_provider() -> StorageProvider:
    """
    Factory function to get the appropriate storage provider
    based on environment configuration
    """
    storage_type = os.getenv("STORAGE_TYPE", "filesystem").lower()
    
    if storage_type == "azure":
        return AzureBlobStorage()
    elif storage_type == "filesystem":
        upload_dir = os.getenv("UPLOAD_DIR", "uploads")
        return FileSystemStorage(base_path=upload_dir)
    else:
        raise ValueError(f"Unknown storage type: {storage_type}")

# Create a global storage instance
storage = get_storage_provider()