import os
import uuid
import shutil
from pathlib import Path
from typing import Union, BinaryIO
from .base import StorageProvider

class FileSystemStorage(StorageProvider):
    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
    
    def upload(self, file_data: Union[bytes, BinaryIO], filename: str, folder: str = "") -> str:
        # Create folder path
        folder_path = self.base_path / folder
        folder_path.mkdir(exist_ok=True, parents=True)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = folder_path / unique_filename
        
        # Save file
        if isinstance(file_data, bytes):
            with open(file_path, 'wb') as f:
                f.write(file_data)
        else:
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(file_data, f)
        
        # Return relative path as identifier
        return str(Path(folder) / unique_filename)
    
    def download(self, file_identifier: str) -> bytes:
        file_path = self.base_path / file_identifier
        with open(file_path, 'rb') as f:
            return f.read()
    
    def delete(self, file_identifier: str) -> bool:
        file_path = self.base_path / file_identifier
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def get_url(self, file_identifier: str) -> str:
        # For local development, you might serve files via a static route
        return f"/static/uploads/{file_identifier}"