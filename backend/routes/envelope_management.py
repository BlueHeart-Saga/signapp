from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import uuid
import random
import string

from database import db
from .auth import get_current_user, role_required, serialize_doc
from .documents import generate_envelope_id

router = APIRouter(prefix="/envelope", tags=["Envelope Management"])

# Models
class EnvelopeUpdate(BaseModel):
    custom_id: str

@router.get("/list", summary="List all document envelopes")
async def list_envelopes(
    current_user: dict = Depends(role_required(["admin"])),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None
):
    """
    List all envelopes with search and pagination for admin management.
    Searchable by envelope_id, filename, or owner_email.
    """
    try:
        query = {}
        if search:
            query["$or"] = [
                {"envelope_id": {"$regex": search, "$options": "i"}},
                {"filename": {"$regex": search, "$options": "i"}},
                {"owner_email": {"$regex": search, "$options": "i"}}
            ]
            
        total = db.documents.count_documents(query)
        cursor = db.documents.find(query).sort("uploaded_at", -1).skip((page-1)*limit).limit(limit)
        documents = list(cursor)
        
        return {
            "envelopes": serialize_doc(documents),
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        print(f"Error listing envelopes: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving envelope list")

@router.get("/find/{envelope_id}", summary="Find document by Envelope ID")
async def find_by_envelope(
    envelope_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Find a specific document by its Envelope ID"""
    try:
        doc = db.documents.find_one({"envelope_id": envelope_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Document with this Envelope ID not found")
        
        return serialize_doc(doc)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding envelope: {e}")
        raise HTTPException(status_code=500, detail="Error searching for envelope")

@router.post("/regenerate/{doc_id}", summary="Regenerate envelope ID for a document")
async def regenerate_envelope_id_route(
    doc_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Regenerate a new randomized Envelope ID for an existing document"""
    try:
        if not ObjectId.is_valid(doc_id):
            raise HTTPException(status_code=400, detail="Invalid Document ID format")
            
        doc = db.documents.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Using the unified generator from documents.py
        new_id = generate_envelope_id(user_id=doc.get("owner_id"))
        
        db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "envelope_id": new_id, 
                "envelope_id_updated_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "message": "Envelope ID successfully regenerated", 
            "new_id": new_id,
            "document_id": doc_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error regenerating envelope ID: {e}")
        raise HTTPException(status_code=500, detail="Error regenerating envelope ID")

@router.put("/custom/{doc_id}", summary="Set custom envelope ID for a document")
async def set_custom_envelope_id(
    doc_id: str,
    data: EnvelopeUpdate,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Set a manually specified Envelope ID for a document"""
    try:
        if not ObjectId.is_valid(doc_id):
            raise HTTPException(status_code=400, detail="Invalid Document ID format")

        # Check for duplication
        existing = db.documents.find_one({"envelope_id": data.custom_id, "_id": {"$ne": ObjectId(doc_id)}})
        if existing:
            raise HTTPException(status_code=400, detail="This Envelope ID is already in use by another document")

        db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "envelope_id": data.custom_id, 
                "envelope_id_custom": True,
                "updated_at": datetime.utcnow()
            }}
        )
        return {"message": "Custom Envelope ID applied successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting custom envelope ID: {e}")
        raise HTTPException(status_code=500, detail="Error setting custom ID")
