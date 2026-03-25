from abc import ABC, abstractmethod
from typing import BinaryIO, Union
import os

class StorageProvider(ABC):
    """Abstract base class for storage providers"""
    
    @abstractmethod
    def upload(self, file_data: Union[bytes, BinaryIO], filename: str, folder: str = "") -> str:
        """Upload file and return file path/identifier"""
        pass
    
    @abstractmethod
    def download(self, file_identifier: str) -> bytes:
        """Download file by identifier"""
        pass
    
    @abstractmethod
    def delete(self, file_identifier: str) -> bool:
        """Delete file by identifier"""
        pass
    
    @abstractmethod
    def get_url(self, file_identifier: str) -> str:
        """Get public URL for file (if applicable)"""
        pass