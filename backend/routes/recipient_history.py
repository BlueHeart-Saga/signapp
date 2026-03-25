from fastapi import APIRouter, Depends, HTTPException, Query, Request
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr


from database import db
from routes.recipient_documents import get_recipient_from_request

router = APIRouter(prefix="/api/recipient-history", tags=["Recipient History"])


class HistoryItem(BaseModel):
    id: str
    document_id: str
    document_name: str
    document_status: str
    envelope_id: Optional[str] = None
    action: str
    action_type: str  # 'viewed', 'signed', 'downloaded', 'completed', 'otp_verified', 'terms_accepted'
    timestamp: datetime
    details: Optional[dict] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None

class SigningSummary(BaseModel):
    total_documents: int
    completed_documents: int
    pending_documents: int
    expired_documents: int
    total_signatures: int
    average_completion_time_days: Optional[float] = None
    first_document_date: Optional[datetime] = None
    last_document_date: Optional[datetime] = None
    most_active_month: Optional[str] = None
    documents_by_role: dict
    documents_by_status: dict

@router.get("/all")
async def get_recipient_history(
    recipient: dict = Depends(get_recipient_from_request),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None)
):
    """
    Get complete history of recipient's interactions with documents.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return {"history": [], "total": 0}
        
        # Get all document IDs
        document_ids = [r["document_id"] for r in recipients]
        
        # Get all documents
        documents = list(db.documents.find({
            "_id": {"$in": document_ids}
        }))
        
        # Create document lookup
        doc_lookup = {str(doc["_id"]): doc for doc in documents}
        
        # Build recipient lookup
        recipient_lookup = {str(r["document_id"]): r for r in recipients}
        
        # Build history items from various sources
        history = []
        
        # 1. From recipient events (timeline events related to this recipient)
        timeline_events = list(db.document_timeline.find({
            "document_id": {"$in": document_ids},
            "$or": [
                {"actor.email": recipient["email"]},
                {"metadata.recipient_email": recipient["email"]}
            ]
        }).sort("timestamp", -1))
        
        for event in timeline_events:
            doc_id = str(event["document_id"])
            doc = doc_lookup.get(doc_id)
            
            if not doc:
                continue
            
            recipient_doc = recipient_lookup.get(doc_id)
            
            action_type_map = {
                "otp_verified": "otp_verified",
                "accept_terms": "terms_accepted",
                "field_completed": "field_completed",
                "recipient_completed": "completed",
                "viewer_completed": "completed",
                "document_downloaded": "downloaded",
                "view_live_document": "viewed",
                "recipient_signed_preview": "previewed",
                "download_signed": "downloaded"
            }
            
            mapped_type = action_type_map.get(event.get("type", ""), event.get("type", "unknown"))
            
            # Apply filters
            if action_type and mapped_type != action_type:
                continue
                
            if from_date and event.get("timestamp") and event["timestamp"] < from_date:
                continue
                
            if to_date and event.get("timestamp") and event["timestamp"] > to_date:
                continue
            
            # Get sender info
            sender_name = None
            if doc.get("owner_id"):
                owner = db.users.find_one({"_id": doc["owner_id"]})
                if owner:
                    sender_name = owner.get("full_name") or owner.get("name")
            
            history.append(HistoryItem(
                id=str(event["_id"]),
                document_id=doc_id,
                document_name=doc.get("filename", "Unknown Document"),
                document_status=doc.get("status", "unknown"),
                envelope_id=doc.get("envelope_id"),
                action=event.get("title", mapped_type.replace("_", " ").title()),
                action_type=mapped_type,
                timestamp=event.get("timestamp", datetime.utcnow()),
                details=event.get("metadata", {}),
                sender_name=sender_name,
                sender_email=doc.get("owner_email")
            ))
        
        # 2. From recipient document status changes
        for recipient_doc in recipients:
            doc_id = str(recipient_doc["document_id"])
            doc = doc_lookup.get(doc_id)
            
            if not doc:
                continue
            
            # Add signed_at event if exists
            if recipient_doc.get("signed_at"):
                signed_event = {
                    "_id": f"signed_{recipient_doc['_id']}",
                    "timestamp": recipient_doc["signed_at"],
                    "title": "Document Signed",
                    "type": "signed",
                    "metadata": {
                        "role": recipient_doc.get("role"),
                        "signing_order": recipient_doc.get("signing_order")
                    }
                }
                
                # Apply filters
                if action_type and "signed" != action_type:
                    continue
                    
                if from_date and signed_event["timestamp"] < from_date:
                    continue
                    
                if to_date and signed_event["timestamp"] > to_date:
                    continue
                
                sender_name = None
                if doc.get("owner_id"):
                    owner = db.users.find_one({"_id": doc["owner_id"]})
                    if owner:
                        sender_name = owner.get("full_name") or owner.get("name")
                
                history.append(HistoryItem(
                    id=signed_event["_id"],
                    document_id=doc_id,
                    document_name=doc.get("filename", "Unknown Document"),
                    document_status=doc.get("status", "unknown"),
                    envelope_id=doc.get("envelope_id"),
                    action="Document Signed",
                    action_type="signed",
                    timestamp=signed_event["timestamp"],
                    details=signed_event["metadata"],
                    sender_name=sender_name,
                    sender_email=doc.get("owner_email")
                ))
            
            # Add completed_at event if exists (different from signed for some roles)
            if recipient_doc.get("completed_at") and not recipient_doc.get("signed_at"):
                completed_event = {
                    "_id": f"completed_{recipient_doc['_id']}",
                    "timestamp": recipient_doc["completed_at"],
                    "title": f"{recipient_doc.get('role', 'Recipient').title()} Completed",
                    "type": "completed",
                    "metadata": {
                        "role": recipient_doc.get("role")
                    }
                }
                
                # Apply filters
                if action_type and "completed" != action_type:
                    continue
                    
                if from_date and completed_event["timestamp"] < from_date:
                    continue
                    
                if to_date and completed_event["timestamp"] > to_date:
                    continue
                
                sender_name = None
                if doc.get("owner_id"):
                    owner = db.users.find_one({"_id": doc["owner_id"]})
                    if owner:
                        sender_name = owner.get("full_name") or owner.get("name")
                
                history.append(HistoryItem(
                    id=completed_event["_id"],
                    document_id=doc_id,
                    document_name=doc.get("filename", "Unknown Document"),
                    document_status=doc.get("status", "unknown"),
                    envelope_id=doc.get("envelope_id"),
                    action=f"{recipient_doc.get('role', 'Recipient').title()} Completed",
                    action_type="completed",
                    timestamp=completed_event["timestamp"],
                    details=completed_event["metadata"],
                    sender_name=sender_name,
                    sender_email=doc.get("owner_email")
                ))
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply pagination
        paginated = history[skip:skip + limit]
        
        return {
            "history": [h.dict() for h in paginated],
            "total": len(history),
            "skip": skip,
            "limit": limit,
            "email": recipient["email"]
        }
        
    except Exception as e:
        print(f"Error getting recipient history: {e}")
        raise HTTPException(500, "Error retrieving history")

@router.get("/summary")
async def get_signing_summary(
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get summary statistics of recipient's signing activity.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return SigningSummary(
                total_documents=0,
                completed_documents=0,
                pending_documents=0,
                expired_documents=0,
                total_signatures=0,
                documents_by_role={},
                documents_by_status={}
            )
        
        document_ids = [r["document_id"] for r in recipients]
        
        # Get all documents
        documents = list(db.documents.find({
            "_id": {"$in": document_ids}
        }))
        
        # Create lookup
        recipient_lookup = {str(r["document_id"]): r for r in recipients}
        
        total = len(documents)
        completed = 0
        pending = 0
        expired = 0
        total_signatures = 0
        documents_by_role = {}
        documents_by_status = {}
        
        completion_times = []
        dates = []
        
        for doc in documents:
            status = doc.get("status", "draft")
            documents_by_status[status] = documents_by_status.get(status, 0) + 1
            
            if status == "completed":
                completed += 1
            elif status == "expired":
                expired += 1
            else:
                pending += 1
            
            # Get recipient for this document
            doc_recipient = recipient_lookup.get(str(doc["_id"]))
            if doc_recipient:
                role = doc_recipient.get("role", "signer")
                documents_by_role[role] = documents_by_role.get(role, 0) + 1
                
                # Count signatures for this recipient
                if role in ["signer", "in_person_signer", "witness"]:
                    # Count signature fields
                    signature_count = db.signature_fields.count_documents({
                        "document_id": doc["_id"],
                        "recipient_id": doc_recipient["_id"],
                        "type": {"$in": ["signature", "witness_signature"]},
                        "completed_at": {"$exists": True}
                    })
                    total_signatures += signature_count
                
                # Calculate completion time
                if status == "completed" and doc.get("uploaded_at") and doc.get("completed_at"):
                    if isinstance(doc["uploaded_at"], datetime) and isinstance(doc["completed_at"], datetime):
                        time_diff = (doc["completed_at"] - doc["uploaded_at"]).total_seconds() / 86400  # in days
                        completion_times.append(time_diff)
                
                # Track dates
                if doc.get("uploaded_at"):
                    dates.append(doc["uploaded_at"])
        
        # Calculate average completion time
        avg_completion_time = None
        if completion_times:
            avg_completion_time = sum(completion_times) / len(completion_times)
        
        # Get first and last document dates
        first_date = min(dates) if dates else None
        last_date = max(dates) if dates else None
        
        # Find most active month
        most_active_month = None
        if dates:
            months = {}
            for date in dates:
                month_key = date.strftime("%Y-%m")
                months[month_key] = months.get(month_key, 0) + 1
            if months:
                most_active_month = max(months, key=months.get)
        
        return SigningSummary(
            total_documents=total,
            completed_documents=completed,
            pending_documents=pending,
            expired_documents=expired,
            total_signatures=total_signatures,
            average_completion_time_days=avg_completion_time,
            first_document_date=first_date,
            last_document_date=last_date,
            most_active_month=most_active_month,
            documents_by_role=documents_by_role,
            documents_by_status=documents_by_status
        )
        
    except Exception as e:
        print(f"Error getting signing summary: {e}")
        raise HTTPException(500, "Error generating summary")

@router.get("/documents/{document_id}/history")
async def get_document_history_for_recipient(
    document_id: str,
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get detailed history for a specific document from recipient's perspective.
    """
    try:
        # Verify document exists
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(404, "Document not found")
        
        # Verify recipient is assigned
        recipient_doc = db.recipients.find_one({
            "document_id": ObjectId(document_id),
            "email": recipient["email"]
        })
        
        if not recipient_doc:
            raise HTTPException(403, "Not authorized")
        
        # Get document owner info
        sender = None
        if doc.get("owner_id"):
            sender = db.users.find_one({"_id": doc["owner_id"]})
        
        # Get all events for this document related to this recipient
        events = list(db.document_timeline.find({
            "document_id": ObjectId(document_id),
            "$or": [
                {"actor.email": recipient["email"]},
                {"metadata.recipient_email": recipient["email"]}
            ]
        }).sort("timestamp", 1))
        
        # Get all recipient's fields and their completion history
        fields = list(db.signature_fields.find({
            "document_id": ObjectId(document_id),
            "recipient_id": recipient_doc["_id"]
        }))
        
        field_history = []
        for field in fields:
            if field.get("completed_at"):
                field_history.append({
                    "field_id": str(field["_id"]),
                    "field_type": field.get("type", ""),
                    "field_label": field.get("label", ""),
                    "page": field.get("page", 0),
                    "completed_at": field.get("completed_at"),
                    "ip_address": field.get("completed_ip", "Unknown")
                })
        
        # Build timeline
        timeline = []
        for event in events:
            timeline.append({
                "id": str(event["_id"]),
                "timestamp": event.get("timestamp"),
                "action": event.get("title", event.get("type", "Unknown")),
                "description": event.get("description", ""),
                "details": event.get("metadata", {})
            })
        
        # Add key milestones from recipient document
        milestones = []
        
        # OTP verification
        if recipient_doc.get("otp_verified"):
            milestones.append({
                "type": "otp_verified",
                "timestamp": recipient_doc.get("otp_verified_at"),
                "description": "Identity verified via OTP"
            })
        
        # Terms acceptance
        if recipient_doc.get("terms_accepted"):
            milestones.append({
                "type": "terms_accepted",
                "timestamp": recipient_doc.get("terms_accepted_at"),
                "description": "Terms and conditions accepted"
            })
        
        # First view
        first_view = db.document_timeline.find_one({
            "document_id": ObjectId(document_id),
            "actor.email": recipient["email"],
            "type": "view_live_document"
        })
        if first_view:
            milestones.append({
                "type": "first_view",
                "timestamp": first_view.get("timestamp"),
                "description": "First viewed document"
            })
        
        # Signing/Completion
        if recipient_doc.get("signed_at"):
            milestones.append({
                "type": "signed",
                "timestamp": recipient_doc.get("signed_at"),
                "description": "Document signed"
            })
        elif recipient_doc.get("completed_at"):
            milestones.append({
                "type": "completed",
                "timestamp": recipient_doc.get("completed_at"),
                "description": f"{recipient_doc.get('role', 'Recipient').title()} completed"
            })
        
        # Downloads
        downloads = [e for e in events if e.get("type") in ["document_downloaded", "download_signed"]]
        download_count = len(downloads)
        
        return {
            "document_id": document_id,
            "document_name": doc.get("filename", "Unknown"),
            "envelope_id": doc.get("envelope_id"),
            "document_status": doc.get("status"),
            "sender": {
                "name": sender.get("full_name") or sender.get("name") if sender else doc.get("owner_email"),
                "email": doc.get("owner_email"),
                "organization": sender.get("organization_name") if sender else None
            } if sender else {"email": doc.get("owner_email")},
            "recipient": {
                "id": str(recipient_doc["_id"]),
                "name": recipient_doc.get("name"),
                "email": recipient_doc["email"],
                "role": recipient_doc.get("role"),
                "status": recipient_doc.get("status"),
                "signing_order": recipient_doc.get("signing_order")
            },
            "milestones": sorted(milestones, key=lambda x: x["timestamp"], reverse=True) if milestones else [],
            "field_history": field_history,
            "timeline": timeline,
            "download_count": download_count,
            "first_viewed_at": first_view.get("timestamp") if first_view else None,
            "completed_at": recipient_doc.get("signed_at") or recipient_doc.get("completed_at"),
            "statistics": {
                "total_fields": len(fields),
                "completed_fields": len([f for f in fields if f.get("completed_at")]),
                "completion_percentage": (len([f for f in fields if f.get("completed_at")]) / len(fields) * 100) if fields else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting document history: {e}")
        raise HTTPException(500, "Error retrieving document history")

@router.get("/timeline")
async def get_recipient_timeline(
    recipient: dict = Depends(get_recipient_from_request),
    days: int = Query(30, ge=1, le=365),
    group_by: str = Query("day", pattern="^(day|week|month)$")
):
    """
    Get timeline of recipient's activity grouped by time period.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return {"timeline": []}
        
        document_ids = [r["document_id"] for r in recipients]
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get all events in date range
        events = list(db.document_timeline.find({
            "document_id": {"$in": document_ids},
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "$or": [
                {"actor.email": recipient["email"]},
                {"metadata.recipient_email": recipient["email"]}
            ]
        }).sort("timestamp", 1))
        
        # Group events by time period
        timeline = {}
        
        for event in events:
            timestamp = event.get("timestamp")
            if not timestamp:
                continue
            
            # Determine group key
            if group_by == "day":
                key = timestamp.strftime("%Y-%m-%d")
                display = timestamp.strftime("%b %d, %Y")
            elif group_by == "week":
                # Get week number
                year, week, _ = timestamp.isocalendar()
                key = f"{year}-W{week:02d}"
                display = f"Week {week}, {year}"
            else:  # month
                key = timestamp.strftime("%Y-%m")
                display = timestamp.strftime("%B %Y")
            
            if key not in timeline:
                timeline[key] = {
                    "period": key,
                    "display": display,
                    "count": 0,
                    "actions": {},
                    "documents": set()
                }
            
            timeline[key]["count"] += 1
            
            action_type = event.get("type", "unknown")
            timeline[key]["actions"][action_type] = timeline[key]["actions"].get(action_type, 0) + 1
            
            doc_id = str(event["document_id"])
            timeline[key]["documents"].add(doc_id)
        
        # Convert to list and add document count
        result = []
        for key, data in timeline.items():
            result.append({
                "period": data["period"],
                "display": data["display"],
                "event_count": data["count"],
                "document_count": len(data["documents"]),
                "actions": data["actions"]
            })
        
        # Sort by period
        result.sort(key=lambda x: x["period"])
        
        return {
            "timeline": result,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "group_by": group_by,
            "total_events": len(events)
        }
        
    except Exception as e:
        print(f"Error getting timeline: {e}")
        raise HTTPException(500, "Error generating timeline")

@router.get("/documents/by-sender")
async def get_documents_grouped_by_sender(
    recipient: dict = Depends(get_recipient_from_request)
):
    """
    Get recipient's documents grouped by sender.
    """
    try:
        # Find all recipients with this email
        recipients = list(db.recipients.find({
            "email": recipient["email"]
        }))
        
        if not recipients:
            return {"senders": []}
        
        document_ids = [r["document_id"] for r in recipients]
        
        # Get all documents
        documents = list(db.documents.find({
            "_id": {"$in": document_ids}
        }))
        
        # Group by sender
        senders = {}
        
        for doc in documents:
            sender_email = doc.get("owner_email", "Unknown")
            
            # Get sender name
            sender_name = sender_email
            if doc.get("owner_id"):
                owner = db.users.find_one({"_id": doc["owner_id"]})
                if owner:
                    sender_name = owner.get("full_name") or owner.get("name") or sender_email
            
            sender_key = f"{sender_name} ({sender_email})"
            
            if sender_key not in senders:
                senders[sender_key] = {
                    "name": sender_name,
                    "email": sender_email,
                    "documents": [],
                    "total_documents": 0,
                    "completed_documents": 0,
                    "pending_documents": 0
                }
            
            # Find recipient for this document
            doc_recipient = next(
                (r for r in recipients if str(r["document_id"]) == str(doc["_id"])),
                None
            )
            
            senders[sender_key]["documents"].append({
                "id": str(doc["_id"]),
                "name": doc.get("filename", "Unknown"),
                "status": doc.get("status", "unknown"),
                "envelope_id": doc.get("envelope_id"),
                "uploaded_at": doc.get("uploaded_at"),
                "completed_at": doc.get("completed_at"),
                "recipient_role": doc_recipient.get("role") if doc_recipient else "unknown",
                "recipient_status": doc_recipient.get("status") if doc_recipient else "unknown",
                "signed_at": doc_recipient.get("signed_at") if doc_recipient else None
            })
            
            senders[sender_key]["total_documents"] += 1
            if doc.get("status") == "completed":
                senders[sender_key]["completed_documents"] += 1
            else:
                senders[sender_key]["pending_documents"] += 1
        
        # Convert to list and sort by most documents
        result = list(senders.values())
        result.sort(key=lambda x: x["total_documents"], reverse=True)
        
        return {
            "senders": result,
            "total_senders": len(result),
            "email": recipient["email"]
        }
        
    except Exception as e:
        print(f"Error grouping by sender: {e}")
        raise HTTPException(500, "Error grouping documents")

@router.get("/export")
async def export_history(
    recipient: dict = Depends(get_recipient_from_request),
    format: str = Query("json", pattern="^(json|csv)$")
):
    """
    Export recipient's complete history as JSON or CSV.
    """
    try:
        # Get all history (unlimited for export)
        history_response = await get_recipient_history(recipient, limit=1000, skip=0)
        history = history_response["history"]
        
        if format == "json":
            return {
                "exported_at": datetime.utcnow().isoformat(),
                "email": recipient["email"],
                "total_events": len(history),
                "history": history
            }
        else:  # csv
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                "Timestamp", "Document ID", "Document Name", "Envelope ID",
                "Action", "Action Type", "Document Status", "Sender Email"
            ])
            
            # Write rows
            for item in history:
                writer.writerow([
                    item.get("timestamp"),
                    item.get("document_id"),
                    item.get("document_name"),
                    item.get("envelope_id"),
                    item.get("action"),
                    item.get("action_type"),
                    item.get("document_status"),
                    item.get("sender_email")
                ])
            
            output.seek(0)
            
            from fastapi.responses import Response
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f'attachment; filename="recipient_history_{recipient["email"]}_{datetime.utcnow().strftime("%Y%m%d")}.csv"'
                }
            )
        
    except Exception as e:
        print(f"Error exporting history: {e}")
        raise HTTPException(500, "Error exporting history")