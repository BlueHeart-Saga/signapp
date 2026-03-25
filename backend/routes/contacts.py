from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

from database import db
from .auth import get_current_user

router = APIRouter(prefix="/contacts", tags=["Contacts"])

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    favorite: bool = False


class ContactUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    favorite: Optional[bool]


class ContactResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    favorite: bool
    created_at: datetime


def serialize_contact(contact):
    return {
        "id": str(contact["_id"]),
        "name": contact["name"],
        "email": contact["email"],
        "favorite": contact.get("favorite", False),
        "created_at": contact["created_at"].isoformat()
    }


@router.post("/", response_model=ContactResponse)
async def create_contact(
    data: ContactCreate,
    current_user: dict = Depends(get_current_user)
):
    existing = db.contacts.find_one({
        "email": data.email,
        "owner_id": ObjectId(current_user["id"])
    })

    if existing:
        raise HTTPException(400, "Contact already exists")

    contact = {
        "name": data.name.strip(),
        "email": data.email,
        "favorite": data.favorite,
        "owner_id": ObjectId(current_user["id"]),
        "created_at": datetime.utcnow()
    }

    result = db.contacts.insert_one(contact)
    contact["_id"] = result.inserted_id

    return serialize_contact(contact)


@router.get("/", response_model=List[ContactResponse])
async def get_contacts(
    favorite: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"owner_id": ObjectId(current_user["id"])}

    if favorite is not None:
        query["favorite"] = favorite

    contacts = list(
        db.contacts.find(query).sort("created_at", -1)
    )

    return [serialize_contact(c) for c in contacts]


@router.patch("/{contact_id}/favorite")
async def toggle_favorite(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    contact = db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if not contact:
        raise HTTPException(404, "Contact not found")

    new_value = not contact.get("favorite", False)

    db.contacts.update_one(
        {"_id": contact["_id"]},
        {"$set": {"favorite": new_value}}
    )

    return {
        "message": "Favorite updated",
        "favorite": new_value
    }


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    data: ContactUpdate,
    current_user: dict = Depends(get_current_user)
):
    contact = db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if not contact:
        raise HTTPException(404, "Contact not found")

    update_data = {k: v for k, v in data.dict().items() if v is not None}

    db.contacts.update_one(
        {"_id": contact["_id"]},
        {"$set": update_data}
    )

    updated = db.contacts.find_one({"_id": contact["_id"]})
    return serialize_contact(updated)

@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = db.contacts.delete_one({
        "_id": ObjectId(contact_id),
        "owner_id": ObjectId(current_user["id"])
    })

    if result.deleted_count == 0:
        raise HTTPException(404, "Contact not found")

    return {"message": "Contact deleted"}


@router.get("/search", response_model=List[ContactResponse])
async def search_contacts(
    q: str,
    current_user: dict = Depends(get_current_user)
):
    contacts = db.contacts.find({
        "owner_id": ObjectId(current_user["id"]),
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }).limit(20)

    return [serialize_contact(c) for c in contacts]
