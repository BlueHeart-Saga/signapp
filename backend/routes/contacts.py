import re
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
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    favorite: Optional[bool] = None


class ContactResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    favorite: bool
    created_at: datetime


def serialize_contact(contact):
    name = contact.get("name") or contact.get("recipient_name") or ""
    email = contact.get("email") or ""
    favorite = bool(contact.get("favorite") or contact.get("is_favorite", False))
    raw_date = contact.get("created_at") or datetime.utcnow()
    created_at = raw_date.isoformat() if isinstance(raw_date, datetime) else str(raw_date)
    return {
        "id": str(contact["_id"]),
        "name": name,
        "email": email,
        "favorite": favorite,
        "created_at": created_at
    }


@router.post("", response_model=ContactResponse)
async def create_contact(
    data: ContactCreate,
    current_user: dict = Depends(get_current_user)
):
    user_oid = ObjectId(current_user["id"])
    trimmed_email = data.email.strip()
    trimmed_name = data.name.strip()

    # Check duplicate email across both owner_id and user_id
    escaped_email = re.escape(trimmed_email)
    existing_email = await db.contacts.find_one({
        "email": {"$regex": f"^{escaped_email}$", "$options": "i"},
        "owner_id": user_oid
    }) or await db.contacts.find_one({
        "email": {"$regex": f"^{escaped_email}$", "$options": "i"},
        "user_id": user_oid
    })
    if existing_email:
        raise HTTPException(400, "This email already exists")

    # Check duplicate name across both owner_id and user_id
    escaped_name = re.escape(trimmed_name)
    existing_name = await db.contacts.find_one({
        "name": {"$regex": f"^{escaped_name}$", "$options": "i"},
        "owner_id": user_oid
    }) or await db.contacts.find_one({
        "name": {"$regex": f"^{escaped_name}$", "$options": "i"},
        "user_id": user_oid
    })
    if existing_name:
        raise HTTPException(400, "This name already exists")

    contact = {
        "name": trimmed_name,
        "email": trimmed_email,
        "favorite": data.favorite,
        "is_favorite": data.favorite,
        "owner_id": user_oid,
        "user_id": user_oid,
        "created_at": datetime.utcnow()
    }

    result = await db.contacts.insert_one(contact)
    contact["_id"] = result.inserted_id

    return serialize_contact(contact)


@router.get("", response_model=List[ContactResponse])
async def get_contacts(
    favorite: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    user_oid = ObjectId(current_user["id"])
    c_owner = await db.contacts.find({"owner_id": user_oid}).sort("created_at", -1).to_list(length=1000)
    c_user = await db.contacts.find({"user_id": user_oid}).sort("created_at", -1).to_list(length=1000)

    seen = set()
    contacts = []
    for c in c_owner + c_user:
        cid = str(c["_id"])
        if cid not in seen:
            seen.add(cid)
            fav = bool(c.get("favorite") or c.get("is_favorite", False))
            if favorite is not None and fav != favorite:
                continue
            contacts.append(serialize_contact(c))

    return contacts


@router.patch("/{contact_id}/favorite")
async def toggle_favorite(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_oid = ObjectId(current_user["id"])
    contact = await db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "owner_id": user_oid
    }) or await db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "user_id": user_oid
    })

    if not contact:
        raise HTTPException(404, "Contact not found")

    new_value = not bool(contact.get("favorite") or contact.get("is_favorite", False))

    await db.contacts.update_one(
        {"_id": contact["_id"]},
        {"$set": {"favorite": new_value, "is_favorite": new_value}}
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
    user_oid = ObjectId(current_user["id"])
    contact = await db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "owner_id": user_oid
    }) or await db.contacts.find_one({
        "_id": ObjectId(contact_id),
        "user_id": user_oid
    })

    if not contact:
        raise HTTPException(404, "Contact not found")

    if data.name is not None and data.name.strip():
        escaped_name = re.escape(data.name.strip())
        existing_name = await db.contacts.find_one({
            "_id": {"$ne": ObjectId(contact_id)},
            "owner_id": user_oid,
            "name": {"$regex": f"^{escaped_name}$", "$options": "i"}
        }) or await db.contacts.find_one({
            "_id": {"$ne": ObjectId(contact_id)},
            "user_id": user_oid,
            "name": {"$regex": f"^{escaped_name}$", "$options": "i"}
        })
        if existing_name:
            raise HTTPException(400, "This name already exists")

    if data.email is not None and data.email.strip():
        escaped_email = re.escape(data.email.strip())
        existing_email = await db.contacts.find_one({
            "_id": {"$ne": ObjectId(contact_id)},
            "owner_id": user_oid,
            "email": {"$regex": f"^{escaped_email}$", "$options": "i"}
        }) or await db.contacts.find_one({
            "_id": {"$ne": ObjectId(contact_id)},
            "user_id": user_oid,
            "email": {"$regex": f"^{escaped_email}$", "$options": "i"}
        })
        if existing_email:
            raise HTTPException(400, "This email already exists")

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if "name" in update_data and isinstance(update_data["name"], str):
        update_data["name"] = update_data["name"].strip()
    if "email" in update_data and isinstance(update_data["email"], str):
        update_data["email"] = update_data["email"].strip()
    if "favorite" in update_data:
        update_data["is_favorite"] = update_data["favorite"]

    await db.contacts.update_one(
        {"_id": contact["_id"]},
        {"$set": update_data}
    )

    updated = await db.contacts.find_one({"_id": contact["_id"]})
    return serialize_contact(updated)


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_oid = ObjectId(current_user["id"])
    result = await db.contacts.delete_one({
        "_id": ObjectId(contact_id),
        "owner_id": user_oid
    })
    if result.deleted_count == 0:
        result = await db.contacts.delete_one({
            "_id": ObjectId(contact_id),
            "user_id": user_oid
        })

    if result.deleted_count == 0:
        raise HTTPException(404, "Contact not found")

    return {"message": "Contact deleted"}


@router.get("/search", response_model=List[ContactResponse])
async def search_contacts(
    q: str,
    current_user: dict = Depends(get_current_user)
):
    if not q or not q.strip():
        return []
    user_oid = ObjectId(current_user["id"])
    escaped_q = re.escape(q.strip())
    regex_filter = {
        "$or": [
            {"name": {"$regex": escaped_q, "$options": "i"}},
            {"email": {"$regex": escaped_q, "$options": "i"}}
        ]
    }

    res_owner = await db.contacts.find({
        "owner_id": user_oid,
        **regex_filter
    }).limit(50).to_list(length=50)

    res_user = await db.contacts.find({
        "user_id": user_oid,
        **regex_filter
    }).limit(50).to_list(length=50)

    seen = set()
    results = []
    for c in res_owner + res_user:
        cid = str(c["_id"])
        if cid not in seen:
            seen.add(cid)
            results.append(serialize_contact(c))

    return results
