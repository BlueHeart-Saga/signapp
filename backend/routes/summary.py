"""
Document Summary and Reporting Router
Provides comprehensive document analytics, reports, and exports
Includes complete signing history, timeline, and audit trail
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from bson import ObjectId
from datetime import datetime, timedelta
import io
import json
import csv
import uuid
import hashlib
import base64
from io import StringIO, BytesIO
from typing import List, Dict, Any, Optional
import traceback

import re
from storage import storage
from database import db
from .auth import get_current_user
from .documents import serialize_document, _log_event, serialize_timeline_event
from .recipient_signing import serialize_recipient

router = APIRouter(prefix="/documents", tags=["Document Reports & Analytics"])

# ======================
# CONSTANTS
# ======================

STATUS_COLORS = {
    "draft": "#718096",
    "sent": "#3182CE",
    "in_progress": "#D69E2E",
    "completed": "#38A169",
    "declined": "#E53E3E",
    "expired": "#805AD5",
    "voided": "#2D3748",
    "deleted": "#A0AEC0"
}

ROLE_COLORS = {
    "signer": "#3182CE",
    "in_person_signer": "#805AD5",
    "approver": "#38A169",
    "viewer": "#718096",
    "form_filler": "#D69E2E",
    "witness": "#DD6B20",
    "notary": "#C53030"
}

# ======================
# HELPER FUNCTIONS
# ======================

def format_datetime_csv(dt_val) -> str:
    """Format datetime cleanly for CSV spreadsheet export."""
    if not dt_val:
        return "N/A"
    if isinstance(dt_val, str):
        try:
            dt_val = datetime.fromisoformat(dt_val.replace("Z", "+00:00"))
        except Exception:
            return dt_val
    if hasattr(dt_val, "strftime"):
        return dt_val.strftime("%Y-%m-%d %H:%M:%S UTC")
    return str(dt_val)

def format_datetime_html(dt_val) -> str:
    """Format datetime with month name and seconds for HTML audit report."""
    if not dt_val:
        return "N/A"
    if isinstance(dt_val, str):
        try:
            dt_val = datetime.fromisoformat(dt_val.replace("Z", "+00:00"))
        except Exception:
            return dt_val
    if hasattr(dt_val, "strftime"):
        return dt_val.strftime("%b %d, %Y &bull; %H:%M:%S UTC")
    return str(dt_val)

async def get_document_with_owner(document_id: str, current_user: dict):
    """Get document with owner verification."""
    try:
        doc = await db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid document ID")

async def get_complete_document_data(document_id: str) -> Dict[str, Any]:
    from routes.email_service import send_completed_document_to_recipients
    """Get all data related to a document."""
    try:
        doc = await db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            return None
        
        # Get all recipients
        recipients = await db.recipients.find(
            {"document_id": ObjectId(document_id)}
        ).sort("signing_order", 1).to_list(length=1000)
        
        # Get all signature fields
        signature_fields = await db.signature_fields.find(
            {"document_id": ObjectId(document_id)}
        ).to_list(length=1000)
        
        # 1. Get legacy timeline events (from document_timeline collection)
        legacy_logs = await db.document_timeline.find({
            "$or": [
                {"document_id": ObjectId(document_id)},
                {"document_id": str(document_id)}
            ]
        }).sort("timestamp", 1).to_list(length=1000)
        
        # 2. Get audit logs (from audit_logs collection)
        audit_logs = await db.audit_logs.find({
            "$or": [
                {"document_id": ObjectId(document_id)},
                {"document_id": str(document_id)}
            ]
        }).sort("timestamp", 1).to_list(length=1000)

        # 3. Normalize audit logs to match timeline format
        normalized_audit = []
        for log in audit_logs:
            normalized_audit.append({
                "type": log.get("action"),
                "action": log.get("action"),
                "timestamp": log.get("timestamp") or log.get("created_at"),
                "title": log.get("title") or (log.get("action") or "").replace("_", " ").title(),
                "description": log.get("description") or (log.get("details") or {}).get("description") or f"Action {log.get('action')} was performed",
                "metadata": {
                    **(log.get("details") or {}),
                    "ip": log.get("ip_address"),
                    "user_agent": log.get("user_agent")
                },
                "actor": {
                    "id": str(log.get("performed_by")) if log.get("performed_by") else None,
                    "name": (log.get("details") or {}).get("actor_name") or log.get("actor_name"),
                    "email": (log.get("details") or {}).get("actor_email") or log.get("actor_email"),
                    "role": (log.get("details") or {}).get("actor_role") or "signer"
                },
                "actor_id": str(log.get("performed_by")) if log.get("performed_by") else None,
                "is_audit": True
            })

        def _parse_event_ts(e):
            ts = e.get("timestamp") or e.get("created_at")
            if isinstance(ts, datetime):
                return ts
            if isinstance(ts, str):
                try:
                    return datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
                except Exception:
                    pass
            return datetime.min

        all_raw_events = legacy_logs + normalized_audit
        all_raw_events.sort(key=_parse_event_ts)

        merged_events = []
        seen_keys = set()
        for event in all_raw_events:
            dt = _parse_event_ts(event)
            rounded_ts = dt.replace(microsecond=0)
            action_key = event.get("type") or event.get("action")
            key = (action_key, rounded_ts)
            if key not in seen_keys:
                merged_events.append(event)
                seen_keys.add(key)

        if not merged_events:
            initial_ts = doc.get("created_at") or doc.get("uploaded_at") or datetime.utcnow()
            owner_email = doc.get("owner_email") or doc.get("sender_email") or "Owner"
            merged_events = [{
                "document_id": doc["_id"],
                "type": "upload_document",
                "action": "upload_document",
                "timestamp": initial_ts,
                "title": "Document Uploaded",
                "description": f"Document '{doc.get('filename', 'document')}' was uploaded to the platform",
                "metadata": {
                    "filename": doc.get("filename"),
                    "page_count": doc.get("page_count", 1),
                    "envelope_id": doc.get("envelope_id")
                },
                "actor": {
                    "id": str(doc.get("owner_id")) if doc.get("owner_id") else None,
                    "email": owner_email,
                    "role": "owner",
                    "name": doc.get("owner_name") or owner_email.split("@")[0]
                }
            }]

        timeline_events = []
        for log in merged_events:
            serialized = serialize_timeline_event(log, doc)
            if not serialized.get("actor") and log.get("actor"):
                serialized["actor"] = log.get("actor")
            if not serialized.get("type"):
                serialized["type"] = serialized.get("action") or log.get("type")
            timeline_events.append(serialized)
        
        # Get all users for enrichment
        user_ids = set()
        if doc.get("owner_id"):
            user_ids.add(doc["owner_id"])
        for event in timeline_events:
            if event.get("actor") and event["actor"].get("id"):
                try:
                    user_ids.add(ObjectId(event["actor"]["id"]))
                except:
                    pass
        
        users_map = {}
        if user_ids:
            users = await db.users.find({"_id": {"$in": list(user_ids)}}).to_list(length=1000)
            for user in users:
                users_map[str(user["_id"])] = {
                    "name": user.get("full_name") or user.get("name") or user.get("email", ""),
                    "email": user.get("email", ""),
                    "role": user.get("role", "user")
                }
        
        # Enrich recipients with their fields and timeline
        enriched_recipients = []
        for recipient in recipients:
            # Get recipient's fields
            recipient_fields = [
                field for field in signature_fields 
                if str(field.get("recipient_id")) == str(recipient["_id"])
            ]
            
            # Get recipient's timeline events
            recipient_events = []
            for event in timeline_events:
                actor_id = str(event.get("actor", {}).get("id") or event.get("actor_id") or "")
                actor_email = (event.get("actor", {}).get("email") or event.get("metadata", {}).get("recipient_email") or "").lower()
                recip_email = (recipient.get("email") or "").lower()
                if actor_id == str(recipient["_id"]) or (recip_email and actor_email == recip_email):
                    recipient_events.append(event)
            
            # Calculate recipient statistics
            fields_completed = len([f for f in recipient_fields if f.get("completed_at")])
            total_fields = len(recipient_fields)
            
            enriched_recipients.append({
                **serialize_recipient(recipient),
                "fields": [
                    {
                        "id": str(field["_id"]),
                        "type": field["type"],
                        "label": field.get("label", field["type"].title()),
                        "page": field.get("page", 1),
                        "completed_at": field.get("completed_at"),
                        "value_preview": str(field.get("value", ""))[:100] if field.get("value") else None,
                        "is_completed": field.get("completed_at") is not None,
                        "required": field.get("required", True)
                    }
                    for field in recipient_fields
                ],
                "timeline_events": recipient_events,
                "statistics": {
                    "total_fields": total_fields,
                    "completed_fields": fields_completed,
                    "completion_rate": f"{(fields_completed / total_fields * 100):.1f}%" if total_fields > 0 else "0%",
                    "signing_time": calculate_signing_time(recipient_events, recipient)
                }
            })
        
        # Calculate document statistics
        total_recipients = len(recipients)
        completed_recipients = len([r for r in recipients if r.get("status") == "completed"])
        declined_recipients = len([r for r in recipients if r.get("status") == "declined"])
        pending_recipients = total_recipients - completed_recipients - declined_recipients
        
        total_fields = len(signature_fields)
        completed_fields = len([f for f in signature_fields if f.get("completed_at")])
        
        # Calculate signing duration
        signing_duration = calculate_document_signing_duration(timeline_events, doc)
        
        return {
            "document": await serialize_document(doc),
            "recipients": enriched_recipients,
            "timeline_events": timeline_events,
            "audit_logs": audit_logs,
            "users": users_map,
            "statistics": {
                "total_recipients": total_recipients,
                "completed_recipients": completed_recipients,
                "declined_recipients": declined_recipients,
                "pending_recipients": pending_recipients,
                "completion_rate": f"{(completed_recipients / total_recipients * 100):.1f}%" if total_recipients > 0 else "0%",
                "total_fields": total_fields,
                "completed_fields": completed_fields,
                "field_completion_rate": f"{(completed_fields / total_fields * 100):.1f}%" if total_fields > 0 else "0%",
                "signing_duration": signing_duration,
                "average_time_per_recipient": calculate_average_recipient_time(enriched_recipients)
            },
            "metadata": {
                "report_generated": datetime.utcnow().isoformat() + "Z",
                "data_points": len(timeline_events) + len(audit_logs)
            }
        }
        
    except Exception as e:
        print(f"Error getting document data: {str(e)}")
        traceback.print_exc()
        return None

def calculate_signing_time(events: List[Dict], recipient: Dict) -> str:
    """Calculate signing time for a recipient."""
    viewed_time = None
    completed_time = None
    
    for event in events:
        if event.get("type") == "recipient_viewed":
            viewed_time = event.get("timestamp")
        elif event.get("type") == "recipient_completed":
            completed_time = event.get("timestamp")
    
    if viewed_time and completed_time:
        try:
            if isinstance(viewed_time, str):
                viewed_time = datetime.fromisoformat(viewed_time.replace('Z', '+00:00'))
            if isinstance(completed_time, str):
                completed_time = datetime.fromisoformat(completed_time.replace('Z', '+00:00'))
            
            duration = completed_time - viewed_time
            return format_duration(duration)
        except:
            pass
    
    # Fallback to recipient timestamps
    if recipient.get("viewed_at") and recipient.get("signed_at"):
        try:
            viewed = recipient["viewed_at"]
            signed = recipient["signed_at"]
            if isinstance(viewed, str):
                viewed = datetime.fromisoformat(viewed.replace('Z', '+00:00'))
            if isinstance(signed, str):
                signed = datetime.fromisoformat(signed.replace('Z', '+00:00'))
            duration = signed - viewed
            return format_duration(duration)
        except:
            pass
    
    return "N/A"

def calculate_document_signing_duration(events: List[Dict], document: Dict) -> str:
    """Calculate total signing duration for document."""
    sent_event = None
    completed_event = None
    
    for event in events:
        if event.get("type") in ["document_sent", "envelope_sent"] or "sent" in str(event.get("title", "")).lower():
            sent_event = event
        elif event.get("type") in ["document_completed", "document_finalized"] or "completed" in str(event.get("title", "")).lower():
            completed_event = event
    
    # Fallback to document timestamps
    if not sent_event and document.get("sent_at"):
        sent_event = {"timestamp": document["sent_at"]}
    if not completed_event and document.get("completed_at"):
        completed_event = {"timestamp": document["completed_at"]}
    
    if sent_event and completed_event and sent_event.get("timestamp") and completed_event.get("timestamp"):
        try:
            sent_time = sent_event["timestamp"]
            completed_time = completed_event["timestamp"]
            
            if isinstance(sent_time, str):
                sent_time = datetime.fromisoformat(sent_time.replace('Z', '+00:00'))
            if isinstance(completed_time, str):
                completed_time = datetime.fromisoformat(completed_time.replace('Z', '+00:00'))
            
            duration = completed_time - sent_time
            return format_duration(duration)
        except Exception as e:
            print(f"Error calculating duration: {e}")
    
    return "N/A"

def calculate_average_recipient_time(recipients: List[Dict]) -> str:
    """Calculate average signing time per recipient."""
    times = []
    for recipient in recipients:
        time_str = recipient.get("statistics", {}).get("signing_time")
        if time_str and time_str != "N/A":
            try:
                minutes = parse_duration_to_minutes(time_str)
                if minutes > 0:
                    times.append(minutes)
            except:
                pass
    
    if times:
        avg_minutes = sum(times) / len(times)
        return format_duration(timedelta(minutes=avg_minutes))
    return "N/A"

def parse_duration_to_minutes(duration_str: str) -> float:
    """Parse duration string to minutes."""
    try:
        if 'second' in duration_str:
            seconds = float(duration_str.split()[0])
            return seconds / 60
        elif 'minute' in duration_str:
            return float(duration_str.split()[0])
        elif 'hour' in duration_str:
            hours = float(duration_str.split()[0])
            return hours * 60
        elif 'day' in duration_str:
            days = float(duration_str.split()[0])
            return days * 24 * 60
    except:
        return 0
    return 0

def format_duration(duration: timedelta) -> str:
    """Format duration to readable string."""
    total_seconds = duration.total_seconds()
    
    if total_seconds < 60:
        return f"{total_seconds:.0f} seconds"
    elif total_seconds < 3600:
        minutes = total_seconds / 60
        return f"{minutes:.0f} minutes"
    elif total_seconds < 86400:
        hours = total_seconds / 3600
        return f"{hours:.1f} hours"
    else:
        days = total_seconds / 86400
        return f"{days:.1f} days"

# ======================
# JSON SUMMARY ENDPOINTS
# ======================

@router.get("/{document_id}/summary/json")
async def get_document_summary_json(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Get complete document summary in JSON format."""
    doc = await get_document_with_owner(document_id, current_user)
    data = await get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Log the request
    await _log_event(
        document_id,
        current_user,
        "document_summary_generated",
        {"format": "json", "recipients_count": len(data["recipients"])},
        request
    )
    
    return JSONResponse(
        content=data,
        media_type="application/json"
    )

@router.get("/{document_id}/summary/minimal")
async def get_minimal_summary(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get minimal summary (quick overview)."""
    doc = await get_document_with_owner(document_id, current_user)
    
    # Get basic counts
    total_recipients = await db.recipients.count_documents({"document_id": ObjectId(document_id)})
    completed_recipients = await db.recipients.count_documents({
        "document_id": ObjectId(document_id),
        "status": "completed"
    })
    
    total_fields = await db.signature_fields.count_documents({"document_id": ObjectId(document_id)})
    completed_fields = await db.signature_fields.count_documents({
        "document_id": ObjectId(document_id),
        "completed_at": {"$exists": True}
    })
    
    # Get recent activity
    recent_activity = await db.document_timeline.find({
        "$or": [
            {"document_id": ObjectId(document_id)},
            {"document_id": str(document_id)}
        ]
    }).sort("timestamp", -1).limit(5).to_list(length=5)
    
    return {
        "document": {
            "id": str(doc["_id"]),
            "filename": doc.get("filename"),
            "envelope_id": doc.get("envelope_id"),
            "status": doc.get("status"),
            "uploaded_at": doc.get("uploaded_at").isoformat() + "Z" if doc.get("uploaded_at") else None,
            "completed_at": doc.get("completed_at").isoformat() + "Z" if doc.get("completed_at") else None
        },
        "statistics": {
            "recipients": {
                "total": total_recipients,
                "completed": completed_recipients,
                "completion_rate": f"{(completed_recipients / total_recipients * 100):.1f}%" if total_recipients > 0 else "0%"
            },
            "fields": {
                "total": total_fields,
                "completed": completed_fields,
                "completion_rate": f"{(completed_fields / total_fields * 100):.1f}%" if total_fields > 0 else "0%"
            }
        },
        "recent_activity": [
            {
                "timestamp": event.get("timestamp").isoformat() + "Z" if hasattr(event.get("timestamp"), 'isoformat') else str(event.get("timestamp")),
                "title": event.get("title"),
                "actor": event.get("actor", {}).get("name") or event.get("actor", {}).get("email")
            }
            for event in recent_activity
        ]
    }

# ======================
# ======================
# CSV & REPORT HELPERS
# ======================

async def get_brand_logo_html() -> tuple:
    """Retrieve brand logo (as base64 data URI or inline vector SVG), platform name, and tagline."""
    branding = await db.branding.find_one({}) or {}
    platform_name = branding.get("platform_name") or "Esigniva"
    tagline = branding.get("tagline") or "Secure Digital Document Signing"
    
    logo_html = None
    if branding.get("logo_file_path"):
        try:
            image_bytes = storage.download(branding["logo_file_path"])
            content_type = branding.get("logo_content_type") or "image/png"
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            logo_html = f'<img src="data:{content_type};base64,{b64_img}" alt="{platform_name}" class="brand-img" />'
        except Exception as e:
            print(f"Error fetching branding logo: {e}")
            logo_html = None
    
    if not logo_html:
        logo_html = f'''<div class="brand-badge">
            <div class="brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                </svg>
            </div>
            <div>
                <div class="brand-title">{platform_name}</div>
                <div class="brand-sub">{tagline}</div>
            </div>
        </div>'''
        
    return logo_html, platform_name, tagline

# ======================
# CSV EXPORT ENDPOINTS
# ======================

@router.get("/{document_id}/summary/recipients-csv")
async def export_recipients_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export recipients data as professional CSV spreadsheet with metadata block and UTF-8 BOM."""
    doc = await get_document_with_owner(document_id, current_user)
    data = await get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    # Metadata Header Block
    doc_name = doc.get("filename") or "Untitled Document"
    envelope_id = doc.get("envelope_id") or str(doc["_id"])
    doc_status = str(doc.get("status") or "draft").upper()
    stats = data.get("statistics", {})
    
    writer.writerow(["ESIGNIVA DIGITAL TRANSACTION PLATFORM - RECIPIENT AUDIT ROSTER"])
    writer.writerow(["Document Name:", doc_name])
    writer.writerow(["Envelope ID:", envelope_id])
    writer.writerow(["Document Status:", doc_status])
    writer.writerow(["Report Generated (UTC):", format_datetime_csv(datetime.utcnow())])
    writer.writerow([
        "Total Recipients:", stats.get("total_recipients", 0),
        "Completed:", stats.get("completed_recipients", 0),
        "Pending:", stats.get("pending_recipients", 0),
        "Declined:", stats.get("declined_recipients", 0)
    ])
    writer.writerow([
        "Recipient Completion Rate:", stats.get("completion_rate", "0%"),
        "Signing Duration:", stats.get("signing_duration", "N/A"),
        "Average Time / Recipient:", stats.get("average_time_per_recipient", "N/A")
    ])
    writer.writerow([])  # Blank separator line
    
    # Table Column Headers
    writer.writerow([
        "Order",
        "Recipient Name",
        "Email Address",
        "Role",
        "Status",
        "OTP Verified",
        "Terms Accepted",
        "Fields Completed",
        "Total Fields",
        "Completion Rate",
        "Turnaround Time",
        "Date Added (UTC)",
        "First Viewed (UTC)",
        "Signed At (UTC)",
        "Declined At (UTC)",
        "Decline Reason"
    ])
    
    # Recipient Rows
    for recipient in data.get("recipients", []):
        r_stats = recipient.get("statistics", {})
        writer.writerow([
            recipient.get("signing_order", 1),
            recipient.get("name", "Unknown"),
            recipient.get("email", ""),
            str(recipient.get("role", "signer")).replace("_", " ").title(),
            str(recipient.get("status", "pending")).capitalize(),
            "Verified (Yes)" if recipient.get("otp_verified") else "No",
            "Accepted (Yes)" if recipient.get("terms_accepted") else "No",
            r_stats.get("completed_fields", 0),
            r_stats.get("total_fields", 0),
            r_stats.get("completion_rate", "0%"),
            r_stats.get("signing_time", "N/A"),
            format_datetime_csv(recipient.get("added_at")),
            format_datetime_csv(recipient.get("viewed_at")),
            format_datetime_csv(recipient.get("signed_at")),
            format_datetime_csv(recipient.get("declined_at")),
            recipient.get("decline_reason") or "N/A"
        ])
    
    csv_bytes = b'\xef\xbb\xbf' + output.getvalue().encode("utf-8")
    output.close()
    
    clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', doc_name.rsplit('.', 1)[0])
    filename = f"recipients_{clean_name}_{envelope_id}.csv"
    
    await _log_event(
        document_id,
        current_user,
        "export_recipients_csv",
        {"recipients_count": len(data.get("recipients", []))},
        request
    )
    
    return StreamingResponse(
        BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/{document_id}/summary/timeline-csv")
async def export_timeline_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export complete chronological timeline & audit trail as professional CSV with UTF-8 BOM."""
    doc = await get_document_with_owner(document_id, current_user)
    data = await get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    doc_name = doc.get("filename") or "Untitled Document"
    envelope_id = doc.get("envelope_id") or str(doc["_id"])
    doc_status = str(doc.get("status") or "draft").upper()
    timeline_events = data.get("timeline_events", [])
    stats = data.get("statistics", {})
    
    # Metadata Header Block
    writer.writerow(["ESIGNIVA DIGITAL TRANSACTION PLATFORM - COMPLETE AUDIT TIMELINE"])
    writer.writerow(["Document Name:", doc_name])
    writer.writerow(["Envelope ID:", envelope_id])
    writer.writerow(["Document Status:", doc_status])
    writer.writerow(["Report Generated (UTC):", format_datetime_csv(datetime.utcnow())])
    writer.writerow(["Total Recorded Events:", len(timeline_events)])
    writer.writerow(["Overall Signing Duration:", stats.get("signing_duration", "N/A")])
    writer.writerow(["Compliance Verification:", "E-SIGN Act (15 U.S.C. § 7001) & UETA Compliant Audit Trail"])
    writer.writerow([])  # Blank separator
    
    # Column Headers
    writer.writerow([
        "Event #",
        "Timestamp (UTC)",
        "Event Category",
        "Action / Title",
        "Description / Activity Details",
        "Actor Name",
        "Actor Email",
        "Actor Role",
        "IP Address",
        "Client / User Agent"
    ])
    
    def categorize_event(evt):
        act = str(evt.get("action") or evt.get("type") or "").lower()
        title = str(evt.get("title") or "").lower()
        comb = act + " " + title
        if any(k in comb for k in ["upload", "create", "rename", "convert"]):
            return "Document Creation"
        if any(k in comb for k in ["send", "sent", "invite", "reminder"]):
            return "Envelope Communication"
        if any(k in comb for k in ["view", "preview", "open", "access"]):
            return "Access & Viewing"
        if any(k in comb for k in ["otp", "auth", "verify", "code", "terms"]):
            return "Authentication & Consent"
        if any(k in comb for k in ["sign", "field", "initial", "form", "fill", "completed_field"]):
            return "Signature & Fields"
        if any(k in comb for k in ["complete", "final"]):
            return "Envelope Completion"
        if any(k in comb for k in ["decline", "void", "reject", "cancel"]):
            return "Decline & Revocation"
        if any(k in comb for k in ["download", "export", "report", "summary"]):
            return "Export & Evidence"
        return "System Activity"
    
    for idx, event in enumerate(timeline_events, start=1):
        actor = event.get("actor") or {}
        metadata = event.get("metadata") or {}
        
        actor_name = actor.get("name") or (actor.get("email", "").split("@")[0] if actor.get("email") else "System")
        actor_email = actor.get("email") or "system@esigniva.com"
        actor_role = str(actor.get("role") or event.get("role") or "System").replace("_", " ").title()
        
        ip_addr = metadata.get("ip") or event.get("ip_address") or "N/A"
        user_agent = metadata.get("user_agent") or event.get("user_agent") or "N/A"
        
        writer.writerow([
            idx,
            format_datetime_csv(event.get("timestamp")),
            categorize_event(event),
            event.get("title") or event.get("action") or "Activity Event",
            event.get("description") or "—",
            actor_name,
            actor_email,
            actor_role,
            ip_addr,
            user_agent
        ])
    
    csv_bytes = b'\xef\xbb\xbf' + output.getvalue().encode("utf-8")
    output.close()
    
    clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', doc_name.rsplit('.', 1)[0])
    filename = f"timeline_{clean_name}_{envelope_id}.csv"
    
    await _log_event(
        document_id,
        current_user,
        "export_timeline_csv",
        {"events_count": len(timeline_events)},
        request
    )
    
    return StreamingResponse(
        BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/{document_id}/summary/fields-csv")
async def export_fields_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export all field definitions, completion states, and values as professional CSV."""
    doc = await get_document_with_owner(document_id, current_user)
    
    fields = await db.signature_fields.find({"document_id": ObjectId(document_id)}).to_list(length=2000)
    
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    doc_name = doc.get("filename") or "Untitled Document"
    envelope_id = doc.get("envelope_id") or str(doc["_id"])
    doc_status = str(doc.get("status") or "draft").upper()
    
    total_fields = len(fields)
    completed_fields = len([f for f in fields if f.get("completed_at") or (f.get("value") is not None and str(f.get("value")).strip() != "")])
    completion_rate = f"{(completed_fields / total_fields * 100):.1f}%" if total_fields > 0 else "0.0%"
    
    # Metadata Header Block
    writer.writerow(["ESIGNIVA DIGITAL TRANSACTION PLATFORM - FIELD DATA & VALUES AUDIT"])
    writer.writerow(["Document Name:", doc_name])
    writer.writerow(["Envelope ID:", envelope_id])
    writer.writerow(["Document Status:", doc_status])
    writer.writerow(["Report Generated (UTC):", format_datetime_csv(datetime.utcnow())])
    writer.writerow([
        "Total Form Fields:", total_fields,
        "Completed Fields:", completed_fields,
        "Field Completion Rate:", completion_rate
    ])
    writer.writerow([])  # Blank separator
    
    # Column Headers
    writer.writerow([
        "Field #",
        "Page",
        "Field Type",
        "Field Label / Identifier",
        "Assigned Recipient",
        "Recipient Email",
        "Required",
        "Field Status",
        "Recorded Value / Input State",
        "Completed At (UTC)",
        "Position Coordinates (X, Y)",
        "Dimensions (W x H)",
        "Field ID"
    ])
    
    # Pre-fetch recipients for fast mapping
    recipients = await db.recipients.find({"document_id": ObjectId(document_id)}).to_list(length=1000)
    recipients_map = {str(r["_id"]): r for r in recipients}
    
    if not fields:
        writer.writerow(["—", "—", "—", "No form or signature fields configured for this document", "—", "—", "—", "—", "—", "—", "—", "—", "—"])
    else:
        def field_sort_key(f):
            try:
                p = int(f.get("page", 1))
            except (ValueError, TypeError):
                p = 1
            try:
                y = float(f.get("y", 0))
            except (ValueError, TypeError):
                y = 0.0
            try:
                x = float(f.get("x", 0))
            except (ValueError, TypeError):
                x = 0.0
            return (p, y, x)
        
        sorted_fields = sorted(fields, key=field_sort_key)
        
        for idx, field in enumerate(sorted_fields, start=1):
            rec_id = str(field.get("recipient_id") or "")
            recipient = recipients_map.get(rec_id)
            
            ftype = str(field.get("type") or "text").lower()
            val = field.get("value")
            is_completed = bool(field.get("completed_at")) or (val is not None and str(val).strip() != "")
            
            # Format field values safely for spreadsheet cells (prevent base64 overflow)
            if ftype in ("signature", "initials"):
                if val:
                    val_str = str(val).strip()
                    if val_str.startswith("data:image"):
                        display_val = f"[Captured {ftype.capitalize()} Image]"
                    else:
                        display_val = f"[Signed: {val_str}]"
                else:
                    display_val = "[Unsigned]"
            elif ftype == "checkbox":
                if val in (True, "true", "True", "checked", "1", 1):
                    display_val = "Checked (True)"
                elif is_completed:
                    display_val = "Unchecked (False)"
                else:
                    display_val = "[Pending Selection]"
            elif val is not None and str(val).strip() != "":
                val_str = str(val).strip()
                if len(val_str) > 1000:
                    display_val = val_str[:1000] + "... (truncated)"
                else:
                    display_val = val_str
            else:
                display_val = "[Empty]" if is_completed else "[Pending Input]"
            
            # Position and dimensions
            pos_str = f"({field.get('x', 0)}, {field.get('y', 0)})"
            dim_str = f"{field.get('width', 0)} x {field.get('height', 0)}"
            
            writer.writerow([
                idx,
                field.get("page", 1),
                ftype.replace("_", " ").title(),
                field.get("label") or field.get("name") or f"{ftype}_{idx}",
                recipient.get("name", "Unassigned") if recipient else "Unassigned",
                recipient.get("email", "—") if recipient else "—",
                "Yes" if field.get("required", True) else "Optional (No)",
                "Completed" if is_completed else "Pending",
                display_val,
                format_datetime_csv(field.get("completed_at")),
                pos_str,
                dim_str,
                str(field["_id"])
            ])
    
    csv_bytes = b'\xef\xbb\xbf' + output.getvalue().encode("utf-8")
    output.close()
    
    clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', doc_name.rsplit('.', 1)[0])
    filename = f"field_data_{clean_name}_{envelope_id}.csv"
    
    await _log_event(
        document_id,
        current_user,
        "export_fields_csv",
        {"fields_count": total_fields},
        request
    )
    
    return StreamingResponse(
        BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# ======================
# HTML REPORT ENDPOINT
# ======================

@router.get("/{document_id}/summary/html")
async def generate_html_report(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Generate high-end executive Audit Trail & Certificate Report with dynamic brand logo, document data, and complete timeline."""
    doc = await get_document_with_owner(document_id, current_user)
    data = await get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Retrieve brand logo and platform identity
    brand_logo_html, platform_name, tagline = await get_brand_logo_html()
    
    doc_info = data["document"]
    stats = data["statistics"]
    recipients = data["recipients"]
    timeline_events = data["timeline_events"]
    
    doc_name = doc_info.get("filename") or "Untitled Document"
    envelope_id = doc_info.get("envelope_id") or str(doc["_id"])
    raw_status = (doc_info.get("status") or "draft").lower().replace(" ", "_")
    
    # Status styling
    status_configs = {
        "completed": {
            "label": "Completed & Executed",
            "bg": "#ecfdf5",
            "color": "#065f46",
            "border": "#a7f3d0",
            "dot": "#10b981",
            "icon": "bi-shield-fill-check"
        },
        "sent": {
            "label": "In Progress / Sent",
            "bg": "#eff6ff",
            "color": "#1e40af",
            "border": "#bfdbfe",
            "dot": "#3b82f6",
            "icon": "bi-send-fill"
        },
        "in_progress": {
            "label": "In Progress",
            "bg": "#eff6ff",
            "color": "#1e40af",
            "border": "#bfdbfe",
            "dot": "#3b82f6",
            "icon": "bi-hourglass-split"
        },
        "draft": {
            "label": "Draft Document",
            "bg": "#f8fafc",
            "color": "#334155",
            "border": "#cbd5e1",
            "dot": "#64748b",
            "icon": "bi-pencil-square"
        },
        "declined": {
            "label": "Declined by Recipient",
            "bg": "#fef2f2",
            "color": "#991b1b",
            "border": "#fecaca",
            "dot": "#ef4444",
            "icon": "bi-x-circle-fill"
        },
        "voided": {
            "label": "Voided Envelope",
            "bg": "#f1f5f9",
            "color": "#0f172a",
            "border": "#94a3b8",
            "dot": "#475569",
            "icon": "bi-slash-circle-fill"
        }
    }
    current_status_cfg = status_configs.get(raw_status, {
        "label": raw_status.replace("_", " ").title(),
        "bg": "#f1f5f9",
        "color": "#334155",
        "border": "#cbd5e1",
        "dot": "#64748b",
        "icon": "bi-info-circle-fill"
    })
    
    # Calculate deterministic security checksum
    hash_seed = f"{doc['_id']}:{envelope_id}:{doc_info.get('uploaded_at')}:{len(timeline_events)}"
    sha256_checksum = hashlib.sha256(hash_seed.encode("utf-8")).hexdigest().upper()
    formatted_checksum = " ".join([sha256_checksum[i:i+8] for i in range(0, len(sha256_checksum), 8)])
    
    # Dates
    uploaded_at_str = format_datetime_html(doc_info.get("uploaded_at"))
    sent_at_str = format_datetime_html(doc_info.get("sent_at"))
    completed_at_str = format_datetime_html(doc_info.get("completed_at")) if raw_status == "completed" else "Pending Execution"
    
    # Turnaround
    duration_str = stats.get("signing_duration", "N/A")
    completion_rate_str = stats.get("completion_rate", "0%")
    field_completion_str = stats.get("field_completion_rate", "0%")
    
    # Recipient rows HTML
    recipients_html_rows = ""
    for r in recipients:
        r_name = r.get("name") or "Unknown Signer"
        r_email = r.get("email") or "—"
        r_role = str(r.get("role") or "Signer").replace("_", " ").title()
        r_status = str(r.get("status") or "pending").lower()
        
        status_badge_bg = "#ecfdf5" if r_status == "completed" else ("#fef2f2" if r_status == "declined" else "#eff6ff")
        status_badge_color = "#065f46" if r_status == "completed" else ("#991b1b" if r_status == "declined" else "#1e40af")
        
        r_stats = r.get("statistics") or {}
        f_comp = r_stats.get("completed_fields", 0)
        f_total = r_stats.get("total_fields", 0)
        pct = (f_comp / f_total * 100) if f_total > 0 else (100 if r_status == "completed" else 0)
        
        otp_badge = '<span class="sec-badge sec-badge-success"><i class="bi bi-shield-check"></i> Verified</span>' if r.get("otp_verified") else '<span class="sec-badge sec-badge-muted">—</span>'
        terms_badge = '<span class="sec-badge sec-badge-success"><i class="bi bi-check-circle"></i> Accepted</span>' if r.get("terms_accepted") else '<span class="sec-badge sec-badge-muted">—</span>'
        
        avatar_initial = r_name[0].upper() if r_name else "?"
        
        recipients_html_rows += f"""
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="user-avatar">{avatar_initial}</div>
                    <div>
                        <div class="fw-bold text-dark">{r_name}</div>
                        <div class="small text-muted">{r_email}</div>
                    </div>
                </div>
            </td>
            <td><span class="role-pill">{r_role}</span></td>
            <td>
                <span class="status-pill" style="background: {status_badge_bg}; color: {status_badge_color};">
                    {r_status.upper()}
                </span>
            </td>
            <td>{otp_badge}</td>
            <td>{terms_badge}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 6px; min-width: 60px;">
                        <div class="progress-bar bg-teal" role="progressbar" style="width: {pct}%"></div>
                    </div>
                    <span class="small text-muted">{f_comp}/{f_total}</span>
                </div>
            </td>
            <td class="text-end small">
                <div class="text-dark fw-medium">{r_stats.get("signing_time", "N/A")}</div>
                <div class="text-muted" style="font-size: 0.72rem;">{format_datetime_html(r.get("signed_at") or r.get("viewed_at"))}</div>
            </td>
        </tr>
        """
        
    # Timeline items HTML
    timeline_html_items = ""
    for idx, evt in enumerate(timeline_events, start=1):
        ts = format_datetime_html(evt.get("timestamp"))
        title = evt.get("title") or evt.get("action") or "Audit Event"
        desc = evt.get("description") or ""
        
        actor = evt.get("actor") or {}
        actor_name = actor.get("name") or (actor.get("email", "").split("@")[0] if actor.get("email") else "System")
        actor_role = str(actor.get("role") or evt.get("role") or "System").replace("_", " ").title()
        
        meta = evt.get("metadata") or {}
        ip_val = meta.get("ip") or evt.get("ip_address")
        ua_val = meta.get("user_agent") or evt.get("user_agent")
        
        # Determine category icon & styling
        title_lower = (str(title) + " " + str(evt.get("action", ""))).lower()
        if any(w in title_lower for w in ["completed", "finalized", "tamper"]):
            t_icon = "bi-check2-circle"
            t_color = "#059669"
            t_bg = "#ecfdf5"
        elif any(w in title_lower for w in ["sign", "field", "initial", "form"]):
            t_icon = "bi-pen-fill"
            t_color = "#d97706"
            t_bg = "#fef3c7"
        elif any(w in title_lower for w in ["view", "preview", "open"]):
            t_icon = "bi-eye-fill"
            t_color = "#7c3aed"
            t_bg = "#f5f3ff"
        elif any(w in title_lower for w in ["otp", "verify", "auth", "terms"]):
            t_icon = "bi-shield-check"
            t_color = "#0d9488"
            t_bg = "#ccfbf1"
        elif any(w in title_lower for w in ["send", "sent", "invite", "reminder"]):
            t_icon = "bi-send-fill"
            t_color = "#2563eb"
            t_bg = "#eff6ff"
        elif any(w in title_lower for w in ["decline", "void", "reject", "delete"]):
            t_icon = "bi-x-circle-fill"
            t_color = "#dc2626"
            t_bg = "#fef2f2"
        elif any(w in title_lower for w in ["download", "export"]):
            t_icon = "bi-download"
            t_color = "#0284c7"
            t_bg = "#f0f9ff"
        else:
            t_icon = "bi-activity"
            t_color = "#4b5563"
            t_bg = "#f3f4f6"
            
        ip_badge = f'<span class="meta-tag"><i class="bi bi-globe"></i> {ip_val}</span>' if ip_val else ""
        ua_badge = f'<span class="meta-tag text-truncate" style="max-width: 280px;" title="{ua_val}"><i class="bi bi-laptop"></i> {ua_val}</span>' if ua_val else ""
        
        timeline_html_items += f"""
        <div class="timeline-entry">
            <div class="timeline-marker" style="background: {t_bg}; color: {t_color}; border-color: {t_color};">
                <i class="bi {t_icon}"></i>
            </div>
            <div class="timeline-body">
                <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <div class="d-flex align-items-center gap-2">
                        <span class="timeline-seq">#{idx}</span>
                        <span class="timeline-title">{title}</span>
                    </div>
                    <span class="timeline-time">{ts}</span>
                </div>
                {f'<p class="timeline-desc mb-2">{desc}</p>' if desc else ''}
                <div class="timeline-meta d-flex flex-wrap gap-2 align-items-center">
                    <span class="meta-tag"><i class="bi bi-person"></i> {actor_name} <span class="text-muted">({actor_role})</span></span>
                    {ip_badge}
                    {ua_badge}
                </div>
            </div>
        </div>
        """
        
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Trail & Evidence Report - {doc_name}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        :root {{
            --primary: #0f766e;
            --primary-light: #ccfbf1;
            --primary-dark: #115e59;
            --dark-surface: #0f172a;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-900: #0f172a;
        }}
        
        body {{
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f1f5f9;
            color: var(--slate-900);
            line-height: 1.55;
            margin: 0;
            padding: 30px 15px;
        }}
        
        .report-wrapper {{
            max-width: 1060px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            border: 1px solid var(--slate-200);
            overflow: hidden;
        }}
        
        .header-top {{
            padding: 32px 40px;
            border-bottom: 1px solid var(--slate-200);
            background: linear-gradient(to right, #ffffff, #f8fafc);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }}
        
        .brand-badge {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .brand-icon {{
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.3);
        }}
        
        .brand-title {{
            font-size: 1.45rem;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.03em;
            line-height: 1.1;
        }}
        
        .brand-sub {{
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--slate-600);
            letter-spacing: 0.02em;
        }}
        
        .brand-img {{
            height: 44px;
            max-width: 220px;
            object-fit: contain;
        }}
        
        .btn-print {{
            background: var(--slate-900);
            color: #ffffff;
            border: none;
            padding: 9px 18px;
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        .btn-print:hover {{
            background: var(--primary);
            color: #ffffff;
        }}
        
        .status-badge-lg {{
            padding: 8px 18px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.82rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid transparent;
        }}
        
        .status-dot {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }}
        
        .banner-section {{
            padding: 30px 40px;
            background: #ffffff;
            border-bottom: 1px solid var(--slate-200);
        }}
        
        .doc-title-main {{
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--slate-900);
            letter-spacing: -0.02em;
            margin-bottom: 8px;
            word-break: break-word;
        }}
        
        .envelope-badge {{
            font-family: 'JetBrains Mono', monospace;
            background: var(--slate-100);
            color: var(--slate-700);
            border: 1px solid var(--slate-200);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }}
        
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }}
        
        .kpi-card {{
            background: var(--slate-50);
            border: 1px solid var(--slate-200);
            border-radius: 12px;
            padding: 16px 20px;
        }}
        
        .kpi-label {{
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--slate-600);
            margin-bottom: 4px;
        }}
        
        .kpi-val {{
            font-size: 1.4rem;
            font-weight: 800;
            color: var(--slate-900);
            letter-spacing: -0.02em;
        }}
        
        .kpi-sub {{
            font-size: 0.75rem;
            color: var(--slate-600);
            margin-top: 2px;
        }}
        
        .security-banner {{
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 20px 24px;
            margin-top: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }}
        
        .checksum-code {{
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            color: #5eead4;
            background: rgba(0, 0, 0, 0.35);
            padding: 6px 12px;
            border-radius: 6px;
            letter-spacing: 0.05em;
            word-break: break-all;
        }}
        
        .content-body {{
            padding: 36px 40px;
        }}
        
        .section-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--slate-100);
        }}
        
        .section-title {{
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--slate-900);
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
        }}
        
        .section-title i {{
            color: var(--primary);
            font-size: 1.25rem;
        }}
        
        .details-table {{
            width: 100%;
            margin-bottom: 36px;
            background: var(--slate-50);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--slate-200);
        }}
        
        .details-table td {{
            padding: 12px 20px;
            font-size: 0.88rem;
            border-bottom: 1px solid var(--slate-200);
        }}
        
        .details-table tr:last-child td {{
            border-bottom: none;
        }}
        
        .details-table .label-col {{
            width: 24%;
            font-weight: 600;
            color: var(--slate-600);
            background: rgba(0,0,0,0.015);
        }}
        
        .details-table .val-col {{
            width: 76%;
            font-weight: 500;
            color: var(--slate-900);
        }}
        
        .user-avatar {{
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #0d9488;
            color: #ffffff;
            font-weight: 700;
            font-size: 0.82rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .role-pill {{
            background: var(--slate-100);
            color: var(--slate-700);
            font-size: 0.72rem;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            text-transform: capitalize;
        }}
        
        .status-pill {{
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-block;
        }}
        
        .sec-badge {{
            font-size: 0.72rem;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
        }}
        
        .sec-badge-success {{
            background: #d1fae5;
            color: #065f46;
        }}
        
        .sec-badge-muted {{
            color: var(--slate-600);
        }}
        
        .bg-teal {{
            background-color: #0f766e !important;
        }}
        
        /* TIMELINE STYLES */
        .timeline-container {{
            position: relative;
            padding-left: 20px;
            margin-top: 10px;
        }}
        
        .timeline-container::before {{
            content: '';
            position: absolute;
            left: 35px;
            top: 15px;
            bottom: 25px;
            width: 2px;
            background: var(--slate-200);
        }}
        
        .timeline-entry {{
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 20px;
            padding-bottom: 24px;
        }}
        
        .timeline-marker {{
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            flex-shrink: 0;
            z-index: 2;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }}
        
        .timeline-body {{
            flex: 1;
            background: #ffffff;
            border: 1px solid var(--slate-200);
            border-radius: 10px;
            padding: 14px 18px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }}
        
        .timeline-seq {{
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--primary);
            background: var(--primary-light);
            padding: 2px 6px;
            border-radius: 4px;
        }}
        
        .timeline-title {{
            font-size: 0.94rem;
            font-weight: 700;
            color: var(--slate-900);
        }}
        
        .timeline-time {{
            font-size: 0.78rem;
            font-weight: 500;
            color: var(--slate-600);
        }}
        
        .timeline-desc {{
            font-size: 0.84rem;
            color: var(--slate-700);
        }}
        
        .meta-tag {{
            font-size: 0.75rem;
            background: var(--slate-100);
            color: var(--slate-700);
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }}
        
        .report-footer {{
            padding: 30px 40px;
            background: var(--slate-50);
            border-top: 1px solid var(--slate-200);
            text-align: center;
            color: var(--slate-600);
            font-size: 0.82rem;
        }}
        
        @media print {{
            body {{
                background: #ffffff;
                padding: 0;
            }}
            .report-wrapper {{
                box-shadow: none;
                border: none;
                border-radius: 0;
            }}
            .no-print {{
                display: none !important;
            }}
            .timeline-entry, .details-table, .kpi-card {{
                page-break-inside: avoid;
            }}
            * {{
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }}
        }}
    </style>
</head>
<body>
    <div class="report-wrapper">
        <!-- HEADER TOP -->
        <div class="header-top">
            <div class="d-flex align-items-center gap-3">
                {brand_logo_html}
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="status-badge-lg" style="background: {current_status_cfg['bg']}; color: {current_status_cfg['color']}; border-color: {current_status_cfg['border']};">
                    <span class="status-dot" style="background: {current_status_cfg['dot']};"></span>
                    <i class="bi {current_status_cfg['icon']}"></i>
                    {current_status_cfg['label']}
                </span>
                <button class="btn-print no-print" onclick="window.print()">
                    <i class="bi bi-printer"></i> Print / PDF
                </button>
            </div>
        </div>

        <!-- BANNER & KPI SECTION -->
        <div class="banner-section">
            <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
                <div>
                    <h1 class="doc-title-main">{doc_name}</h1>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="envelope-badge">
                            <i class="bi bi-hash"></i> {envelope_id}
                        </span>
                        <span class="badge bg-light text-secondary border">
                            <i class="bi bi-file-earmark-pdf"></i> PDF Document
                        </span>
                    </div>
                </div>
                <div class="text-end text-muted small">
                    <div>Generated: <strong>{format_datetime_html(datetime.utcnow())}</strong></div>
                    <div>Source: <strong>{platform_name} Security Authority</strong></div>
                </div>
            </div>

            <!-- KPI GRID -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Recipients</div>
                    <div class="kpi-val">{stats.get('completed_recipients', 0)} / {stats.get('total_recipients', 0)}</div>
                    <div class="kpi-sub">{stats.get('pending_recipients', 0)} pending • {stats.get('declined_recipients', 0)} declined</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completion Rate</div>
                    <div class="kpi-val">{completion_rate_str}</div>
                    <div class="kpi-sub">Overall envelope fulfillment</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Fields Completed</div>
                    <div class="kpi-val">{stats.get('completed_fields', 0)} / {stats.get('total_fields', 0)}</div>
                    <div class="kpi-sub">{field_completion_str} fields populated</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Signing Turnaround</div>
                    <div class="kpi-val">{duration_str}</div>
                    <div class="kpi-sub">Sent to finalized execution</div>
                </div>
            </div>

            <!-- CRYPTOGRAPHIC INTEGRITY BANNER -->
            <div class="security-banner">
                <div>
                    <div class="fw-bold d-flex align-items-center gap-2" style="font-size: 0.95rem;">
                        <i class="bi bi-shield-lock-fill text-warning"></i> Tamper-Evident SHA-256 Envelope Fingerprint
                    </div>
                    <div class="small text-light opacity-75 mt-1">
                        Cryptographically binds all document transactions, signature events, and biometric inputs.
                    </div>
                </div>
                <div class="checksum-code">
                    {formatted_checksum}
                </div>
            </div>
        </div>

        <!-- CONTENT BODY -->
        <div class="content-body">
            <!-- DOCUMENT SPECIFICATIONS -->
            <div class="section-header">
                <h2 class="section-title">
                    <i class="bi bi-info-circle-fill"></i> Document Metadata & Specifications
                </h2>
                <span class="text-muted small">Official Transaction Attributes</span>
            </div>

            <table class="details-table">
                <tbody>
                    <tr>
                        <td class="label-col">File Name</td>
                        <td class="val-col fw-bold">{doc_name}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Unique Envelope ID</td>
                        <td class="val-col font-monospace">{envelope_id}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Document Creator / Owner</td>
                        <td class="val-col">{doc_info.get('owner_email') or 'Esigniva Registered Owner'}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Creation & Upload Time</td>
                        <td class="val-col">{uploaded_at_str}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Sent for Signatures</td>
                        <td class="val-col">{sent_at_str or 'Draft Stage'}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Finalized Execution Time</td>
                        <td class="val-col">{completed_at_str}</td>
                    </tr>
                    <tr>
                        <td class="label-col">Compliance Standard</td>
                        <td class="val-col">
                            <span class="badge bg-success bg-opacity-10 text-success border border-success">
                                <i class="bi bi-check-circle"></i> E-SIGN Act (15 U.S.C. § 7001)
                            </span>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success ms-1">
                                <i class="bi bi-check-circle"></i> Uniform Electronic Transactions Act (UETA)
                            </span>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success ms-1">
                                <i class="bi bi-check-circle"></i> eIDAS Regulation (EU) 910/2014
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- RECIPIENTS ROSTER -->
            <div class="section-header">
                <h2 class="section-title">
                    <i class="bi bi-people-fill"></i> Signing Parties & Recipient Roster ({len(recipients)})
                </h2>
                <span class="text-muted small">Party Verification & Signature Summary</span>
            </div>

            <div class="table-responsive mb-5">
                <table class="table table-hover align-middle" style="border: 1px solid var(--slate-200); border-radius: 10px; overflow: hidden;">
                    <thead style="background: var(--slate-100); font-size: 0.78rem; text-transform: uppercase; color: var(--slate-600); letter-spacing: 0.04em;">
                        <tr>
                            <th>Recipient</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>OTP Security</th>
                            <th>Terms Consent</th>
                            <th>Field Progress</th>
                            <th class="text-end">Turnaround</th>
                        </tr>
                    </thead>
                    <tbody style="font-size: 0.88rem;">
                        {recipients_html_rows if recipients_html_rows else '<tr><td colspan="7" class="text-center py-4 text-muted">No recipients designated for this document.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- AUDIT TIMELINE -->
            <div class="section-header">
                <h2 class="section-title">
                    <i class="bi bi-clock-history"></i> Chronological Audit Trail & Activity Log ({len(timeline_events)})
                </h2>
                <span class="text-muted small">Immutable Event Stream</span>
            </div>

            <div class="timeline-container">
                {timeline_html_items if timeline_html_items else '<div class="text-muted py-4 text-center">No audit trail records logged yet.</div>'}
            </div>
        </div>

        <!-- FOOTER -->
        <div class="report-footer">
            <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                <i class="bi bi-shield-check text-success fs-5"></i>
                <strong style="color: var(--slate-900);">Electronic Signature Audit Trail Certificate</strong>
            </div>
            <p class="mb-1">
                This document is an official cryptographic evidence log generated by the {platform_name} digital transaction platform.
            </p>
            <p class="mb-0 text-muted" style="font-size: 0.75rem;">
                Envelope ID: {envelope_id} • SHA-256 Seed: {sha256_checksum[:32]}... • All events verified with authoritative timestamps and IP telemetry.
            </p>
        </div>
    </div>
</body>
</html>"""

    # Log the HTML report generation
    await _log_event(
        document_id,
        current_user,
        "generate_html_report",
        {"format": "html", "recipients_count": len(recipients), "events_count": len(timeline_events)},
        request
    )
    
    return HTMLResponse(content=html_content)

# ======================
# ANALYTICS ENDPOINTS
# ======================

@router.get("/{document_id}/summary/analytics")
async def get_document_analytics(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Get detailed analytics for document signing process."""
    doc = await get_document_with_owner(document_id, current_user)
    data = await get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Calculate additional analytics
    analytics = {
        "performance": {
            "total_time": data['statistics']['signing_duration'],
            "avg_time_per_recipient": data['statistics']['average_time_per_recipient'],
            "fastest_recipient": get_fastest_recipient(data["recipients"]),
            "slowest_recipient": get_slowest_recipient(data["recipients"])
        },
        "compliance": {
            "otp_verification_rate": calculate_otp_rate(data["recipients"]),
            "terms_acceptance_rate": calculate_terms_rate(data["recipients"]),
            "ip_addresses": get_unique_ips(data["timeline_events"]),
            "user_agents": get_unique_user_agents(data["timeline_events"])
        },
        "patterns": {
            "busiest_hour": get_busiest_hour(data["timeline_events"]),
            "most_active_day": get_most_active_day(data["timeline_events"])
        }
    }
    
    # Log the analytics request
    await _log_event(
        document_id,
        current_user,
        "view_analytics",
        {},
        request
    )
    
    return {
        "document": {
            "id": str(doc["_id"]),
            "filename": doc.get("filename"),
            "envelope_id": doc.get("envelope_id"),
            "status": doc.get("status")
        },
        "analytics": analytics,
        "statistics": data['statistics']
    }

def get_fastest_recipient(recipients):
    """Find recipient with fastest signing time."""
    fastest = None
    fastest_time = float('inf')
    
    for recipient in recipients:
        time_str = recipient['statistics']['signing_time']
        if time_str != 'N/A':
            minutes = parse_duration_to_minutes(time_str)
            if minutes > 0 and minutes < fastest_time:
                fastest_time = minutes
                fastest = {
                    'name': recipient.get('name'),
                    'email': recipient.get('email'),
                    'signing_time': time_str,
                    'minutes': minutes
                }
    
    return fastest

def get_slowest_recipient(recipients):
    """Find recipient with slowest signing time."""
    slowest = None
    slowest_time = 0
    
    for recipient in recipients:
        time_str = recipient['statistics']['signing_time']
        if time_str != 'N/A':
            minutes = parse_duration_to_minutes(time_str)
            if minutes > slowest_time:
                slowest_time = minutes
                slowest = {
                    'name': recipient.get('name'),
                    'email': recipient.get('email'),
                    'signing_time': time_str,
                    'minutes': minutes
                }
    
    return slowest

def calculate_otp_rate(recipients):
    """Calculate OTP verification rate."""
    verified = sum(1 for r in recipients if r.get('otp_verified'))
    total = len(recipients)
    return {
        "verified": verified,
        "total": total,
        "rate": f"{(verified / total * 100):.1f}%" if total > 0 else "0%"
    }

def calculate_terms_rate(recipients):
    """Calculate terms acceptance rate."""
    accepted = sum(1 for r in recipients if r.get('terms_accepted'))
    declined = sum(1 for r in recipients if r.get('terms_declined'))
    total = len(recipients)
    pending = total - accepted - declined
    
    return {
        "accepted": accepted,
        "declined": declined,
        "pending": pending,
        "total": total,
        "acceptance_rate": f"{(accepted / total * 100):.1f}%" if total > 0 else "0%"
    }

def get_unique_ips(timeline_events):
    """Get unique IP addresses from timeline."""
    ips = set()
    for event in timeline_events:
        if event.get('metadata', {}).get('ip'):
            ips.add(event['metadata']['ip'])
    return list(ips)[:10]

def get_unique_user_agents(timeline_events):
    """Get unique user agents from timeline."""
    agents = {}
    for event in timeline_events:
        agent = event.get('metadata', {}).get('user_agent')
        if agent:
            browser = "Unknown"
            if 'Chrome' in agent:
                browser = 'Chrome'
            elif 'Firefox' in agent:
                browser = 'Firefox'
            elif 'Safari' in agent:
                browser = 'Safari'
            elif 'Edge' in agent:
                browser = 'Edge'
            
            agents[browser] = agents.get(browser, 0) + 1
    
    return agents

def get_busiest_hour(timeline_events):
    """Find busiest hour for signing activity."""
    hours = {}
    for event in timeline_events:
        if event.get('timestamp'):
            try:
                if hasattr(event['timestamp'], 'hour'):
                    hour = event['timestamp'].hour
                else:
                    # Try to parse string
                    dt = datetime.fromisoformat(str(event['timestamp']).replace('Z', '+00:00'))
                    hour = dt.hour
                hours[hour] = hours.get(hour, 0) + 1
            except:
                pass
    
    if hours:
        busiest = max(hours.items(), key=lambda x: x[1])
        return {
            "hour": f"{busiest[0]}:00",
            "activity_count": busiest[1]
        }
    return None

def get_most_active_day(timeline_events):
    """Find most active day for signing."""
    days = {}
    for event in timeline_events:
        if event.get('timestamp'):
            try:
                if hasattr(event['timestamp'], 'strftime'):
                    day = event['timestamp'].strftime('%Y-%m-%d')
                else:
                    dt = datetime.fromisoformat(str(event['timestamp']).replace('Z', '+00:00'))
                    day = dt.strftime('%Y-%m-%d')
                days[day] = days.get(day, 0) + 1
            except:
                pass
    
    if days:
        most_active = max(days.items(), key=lambda x: x[1])
        return {
            "date": most_active[0],
            "activity_count": most_active[1]
        }
    return None

# ======================
# BULK EXPORT ENDPOINT
# ======================

@router.get("/{document_id}/summary/bulk-export")
async def bulk_export_document_summary(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Bulk export all summary formats."""
    try:
        import zipfile
        
        doc = await get_document_with_owner(document_id, current_user)
        data = await get_complete_document_data(document_id)
        
        if not data:
            raise HTTPException(status_code=404, detail="Document data not found")
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add JSON
            json_content = json.dumps(data, default=str, indent=2)
            zip_file.writestr('summary.json', json_content)
            
            # Add CSV exports
            csv_content = await generate_csv_content(data)
            zip_file.writestr('recipients.csv', csv_content['recipients'])
            zip_file.writestr('timeline.csv', csv_content['timeline'])
            zip_file.writestr('fields.csv', csv_content['fields'])
            
            # Add HTML report
            html_response = await generate_html_report(document_id, current_user)
            zip_file.writestr('report.html', html_response.body.decode())
            
            # Add readme
            readme = f"""Document Summary Export
========================

Document: {data['document'].get('filename', 'Unknown')}
Envelope ID: {data['document'].get('envelope_id', 'N/A')}
Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Files included:
1. summary.json - Complete data in JSON format
2. recipients.csv - Recipients information
3. timeline.csv - Timeline events
4. fields.csv - All fields data
5. report.html - Summary report in HTML format

Total recipients: {len(data['recipients'])}
Total timeline events: {len(data['timeline_events'])}
"""
            zip_file.writestr('README.txt', readme)
        
        zip_buffer.seek(0)
        
        filename = f"complete_export_{doc.get('filename', 'document').split('.')[0]}_{doc.get('envelope_id', '') or 'no_envelope'}.zip"
        
        # Log the bulk export
        await _log_event(
            document_id,
            current_user,
            "bulk_export_summary",
            {
                "recipients_count": len(data["recipients"]),
                "timeline_events": len(data["timeline_events"])
            },
            request
        )
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
        
    except ImportError:
        raise HTTPException(status_code=500, detail="ZIP export requires zipfile module")
    except Exception as e:
        print(f"Error in bulk export: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating bulk export: {str(e)}")

async def generate_csv_content(data):
    """Generate CSV content for bulk export."""
    # Recipients CSV
    recipients_output = StringIO()
    recipients_writer = csv.writer(recipients_output)
    recipients_writer.writerow(["Name", "Email", "Role", "Status", "Signing Order", "OTP Verified", "Terms Accepted", "Signing Time"])
    for recipient in data["recipients"]:
        recipients_writer.writerow([
            recipient.get("name", ""),
            recipient.get("email", ""),
            recipient.get("role", ""),
            recipient.get("status", ""),
            recipient.get("signing_order", ""),
            "Yes" if recipient.get("otp_verified") else "No",
            "Yes" if recipient.get("terms_accepted") else "No",
            recipient["statistics"]["signing_time"]
        ])
    recipients_csv = recipients_output.getvalue()
    recipients_output.close()
    
    # Timeline CSV
    timeline_output = StringIO()
    timeline_writer = csv.writer(timeline_output)
    timeline_writer.writerow(["Timestamp", "Event", "Actor", "Description"])
    for event in data["timeline_events"]:
        timestamp = event.get("timestamp")
        if hasattr(timestamp, 'isoformat'):
            timestamp_str = timestamp.isoformat()
        else:
            timestamp_str = str(timestamp)
        
        actor_name = event.get("actor", {}).get("name") or event.get("actor", {}).get("email") or "System"
        timeline_writer.writerow([
            timestamp_str,
            event.get("title", ""),
            actor_name,
            event.get("description", "")
        ])
    timeline_csv = timeline_output.getvalue()
    timeline_output.close()
    
    # Fields CSV
    fields_output = StringIO()
    fields_writer = csv.writer(fields_output)
    fields_writer.writerow(["Recipient", "Type", "Label", "Page", "Completed", "Value"])
    for recipient in data["recipients"]:
        for field in recipient.get("fields", []):
            fields_writer.writerow([
                recipient.get("name", ""),
                field["type"],
                field["label"],
                field["page"],
                "Yes" if field["is_completed"] else "No",
                field.get("value_preview", "")[:100] if field.get("value_preview") else ""
            ])
    fields_csv = fields_output.getvalue()
    fields_output.close()
    
    return {
        "recipients": recipients_csv,
        "timeline": timeline_csv,
        "fields": fields_csv
    }

# ======================
# COMPREHENSIVE SUMMARY ENDPOINT
# ======================

@router.get("/{document_id}/summary/comprehensive")
async def get_comprehensive_summary(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    format: str = Query("html", description="Output format: html, json, csv, zip"),
    request: Request = None
):
    """
    Get comprehensive document summary in various formats.
    """
    if format == "json":
        return await get_document_summary_json(document_id, current_user, request)
    elif format == "html":
        return await generate_html_report(document_id, current_user, request)
    elif format == "csv":
        return await export_recipients_csv(document_id, current_user, request)
    elif format == "zip":
        return await bulk_export_document_summary(document_id, current_user, request)
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use: html, json, csv, or zip")

# ======================
# REGISTER ROUTER
# ======================

# This router should be included in your main FastAPI app
# Example: app.include_router(summary_router, prefix="/api")

print("Document Summary Router loaded successfully")