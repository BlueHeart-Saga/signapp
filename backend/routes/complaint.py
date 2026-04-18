# schemas/complaint.py
from fastapi import APIRouter, Request, HTTPException, Query, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from typing import Literal
from fastapi.responses import StreamingResponse
import io

from database import complaints_collection
import gridfs
from database import db

router = APIRouter(prefix="/e-sign/complaints", tags=["Complaints"])

fs = gridfs.GridFS(db)

class ComplaintCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None

    incident_date: Optional[datetime] = None

    sender_name: Optional[str] = None
    sender_email: Optional[EmailStr] = None

    document_id: Optional[str] = None
    document_name: Optional[str] = None

    complaint_type: str
    message: str


class ComplaintOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    company: Optional[str]

    complaint_type: str
    message: str
    status: str

    created_at: datetime
    resolved_at: Optional[datetime]


class ComplaintStatusUpdate(BaseModel):
    status: Literal["open", "investigating", "resolved", "rejected"]


def serialize_id(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def complaint_doc(data, request):
    return {
        **data,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "status": "open",
        "created_at": datetime.utcnow(),
        "resolved_at": None,
        "admin_note": None,
    }
    
    
# ─────────────────────────────
# PUBLIC: SUBMIT COMPLAINT
# ─────────────────────────────
@router.post("")
async def submit_complaint(
    request: Request,

    name: str = Form(...),
    email: str = Form(...),
    company: str = Form(None),

    incident_date: str = Form(None),

    sender_name: str = Form(None),
    sender_email: str = Form(None),

    document_id: str = Form(None),
    document_name: str = Form(None),

    complaint_type: str = Form(...),
    message: str = Form(...),

    evidence: UploadFile = File(...)
):
    if not evidence:
        raise HTTPException(status_code=400, detail="Evidence file is required")

    # ⬇️ Store file in GridFS
    file_id = fs.put(
        evidence.file,   # file-like object
        filename=evidence.filename,
        content_type=evidence.content_type,
    )


    complaint = {
        "name": name,
        "email": email,
        "company": company,
        "incident_date": incident_date,

        "sender_name": sender_name,
        "sender_email": sender_email,

        "document_id": document_id,
        "document_name": document_name,

        "complaint_type": complaint_type,
        "message": message,

        "evidence_file_id": str(file_id),

        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),

        "status": "open",
        "created_at": datetime.utcnow(),
        "resolved_at": None,
    }

    complaints_collection.insert_one(complaint)

    return {
        "success": True,
        "message": "Complaint submitted successfully"
    }

# ─────────────────────────────
# ADMIN: LIST COMPLAINTS (PAGINATED)
# ─────────────────────────────
@router.get("/admin")
async def list_complaints(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, le=100),
):
    query = {}
    if status:
        query["status"] = status

    skip = (page - 1) * page_size

    cursor = (
        complaints_collection
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(page_size)
    )

    complaints = [serialize_id(c) for c in cursor]
    total = complaints_collection.count_documents(query)

    return {
        "items": complaints,
        "page": page,
        "page_size": page_size,
        "total": total,
    }


# ─────────────────────────────
# ADMIN: VIEW SINGLE COMPLAINT
# ─────────────────────────────
@router.get("/admin/{id}")
async def get_complaint(id: str):
    complaint = complaints_collection.find_one({"_id": ObjectId(id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return serialize_id(complaint)


# ─────────────────────────────
# ADMIN: UPDATE STATUS
# ─────────────────────────────
@router.put("/admin/{id}/status")
async def update_status(id: str, data: ComplaintStatusUpdate):
    update = {
        "status": data.status,
    }

    if data.status in ["resolved", "rejected"]:
        update["resolved_at"] = datetime.utcnow()

    result = complaints_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": update}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {"success": True, "message": "Status updated"}


# ─────────────────────────────
# ADMIN: ADD INTERNAL NOTE
# ─────────────────────────────
@router.put("/admin/{id}/note")
async def add_admin_note(id: str, note: str):
    complaints_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"admin_note": note}}
    )
    return {"success": True}


# ─────────────────────────────
# ADMIN: DELETE COMPLAINT (HARD DELETE)
# ─────────────────────────────
@router.delete("/admin/{id}")
async def delete_complaint(id: str):
    result = complaints_collection.delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {"success": True, "message": "Complaint deleted"}

@router.get("/admin/{id}/evidence")
async def download_evidence(id: str):
    complaint = complaints_collection.find_one({"_id": ObjectId(id)})
    if not complaint or "evidence_file_id" not in complaint:
        raise HTTPException(status_code=404, detail="Evidence not found")

    grid_out = fs.get(ObjectId(complaint["evidence_file_id"]))

    return StreamingResponse(
        io.BytesIO(grid_out.read()),
        media_type=grid_out.content_type,
        headers={
            "Content-Disposition": f"attachment; filename={grid_out.filename}"
        }
    )