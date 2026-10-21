import os
import hashlib
import threading
from typing import Optional
from collections import OrderedDict

# Dedicated cache directory inside backend/uploads/cache
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

class StorageCache:
    """
    High-performance 2-tier storage cache:
    - Tier 1: In-memory LRU cache for instant 0ms access to active documents
    - Tier 2: Local disk cache for fast persistent retrieval without Azure WAN round-trips
    """
    def __init__(self, max_memory_items: int = 50, max_memory_bytes: int = 64 * 1024 * 1024):
        self._lock = threading.Lock()
        self._memory_cache = OrderedDict()  # key -> bytes
        self._memory_bytes = 0
        self._max_memory_items = max_memory_items
        self._max_memory_bytes = max_memory_bytes
        self._disk_cache_dir = CACHE_DIR

    def _hash_key(self, key: str) -> str:
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def _get_disk_path(self, key: str) -> str:
        hashed = self._hash_key(key)
        # Partition by first 2 chars for filesystem efficiency
        sub_dir = os.path.join(self._disk_cache_dir, hashed[:2])
        os.makedirs(sub_dir, exist_ok=True)
        return os.path.join(sub_dir, hashed)

    def get(self, key: str) -> Optional[bytes]:
        if not key:
            return None

        # 1. Check in-memory LRU
        with self._lock:
            if key in self._memory_cache:
                self._memory_cache.move_to_end(key)
                return self._memory_cache[key]

        # 2. Check disk cache
        try:
            disk_path = self._get_disk_path(key)
            if os.path.isfile(disk_path):
                with open(disk_path, "rb") as f:
                    data = f.read()
                # Promote to memory cache
                self.put_memory(key, data)
                return data
        except Exception as e:
            print(f"[CACHE] Disk read notice: {e}")

        return None

    def put_memory(self, key: str, data: bytes):
        if not key or not data or len(data) > self._max_memory_bytes:
            return

        with self._lock:
            if key in self._memory_cache:
                self._memory_bytes -= len(self._memory_cache[key])
                del self._memory_cache[key]

            # Evict if exceeding limits
            while (len(self._memory_cache) >= self._max_memory_items or
                   (self._memory_bytes + len(data)) > self._max_memory_bytes) and self._memory_cache:
                oldest_key, oldest_val = self._memory_cache.popitem(last=False)
                self._memory_bytes -= len(oldest_val)

            self._memory_cache[key] = data
            self._memory_bytes += len(data)

    def put(self, key: str, data: bytes):
        if not key or not data:
            return

        # Store in memory
        self.put_memory(key, data)

        # Store on disk
        try:
            disk_path = self._get_disk_path(key)
            temp_path = disk_path + ".tmp"
            with open(temp_path, "wb") as f:
                f.write(data)
            os.replace(temp_path, disk_path)
        except Exception as e:
            print(f"[CACHE] Disk write notice: {e}")

    def delete(self, key: str):
        if not key:
            return

        with self._lock:
            if key in self._memory_cache:
                self._memory_bytes -= len(self._memory_cache[key])
                del self._memory_cache[key]

        try:
            disk_path = self._get_disk_path(key)
            if os.path.isfile(disk_path):
                os.remove(disk_path)
        except Exception:
            pass

# Global singleton
blob_cache = StorageCache()
