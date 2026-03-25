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
from io import StringIO, BytesIO
from typing import List, Dict, Any, Optional
import traceback

from database import db
from .auth import get_current_user
from .documents import serialize_document, _log_event
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

def get_document_with_owner(document_id: str, current_user: dict):
    """Get document with owner verification."""
    try:
        doc = db.documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": ObjectId(current_user["id"])
        })
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid document ID")

def get_complete_document_data(document_id: str) -> Dict[str, Any]:
    
    from routes.email_service import send_completed_document_to_recipients
    """Get all data related to a document."""
    try:
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            return None
        
        # Get all recipients
        recipients = list(db.recipients.find(
            {"document_id": ObjectId(document_id)}
        ).sort("signing_order", 1))
        
        # Get all signature fields
        signature_fields = list(db.signature_fields.find(
            {"document_id": ObjectId(document_id)}
        ))
        
        # Get timeline events (from document_timeline collection)
        timeline_events = list(db.document_timeline.find(
            {"document_id": ObjectId(document_id)}
        ).sort("timestamp", 1))
        
        # Get audit logs (from audit_logs collection)
        audit_logs = list(db.audit_logs.find(
            {"document_id": ObjectId(document_id)}
        ).sort("timestamp", 1))
        
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
            users = list(db.users.find({"_id": {"$in": list(user_ids)}}))
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
                if event.get("actor") and str(event["actor"].get("id")) == str(recipient["_id"]):
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
            "document": serialize_document(doc),
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
                "report_generated": datetime.utcnow().isoformat(),
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
    doc = get_document_with_owner(document_id, current_user)
    data = get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Log the request
    _log_event(
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
    doc = get_document_with_owner(document_id, current_user)
    
    # Get basic counts
    total_recipients = db.recipients.count_documents({"document_id": ObjectId(document_id)})
    completed_recipients = db.recipients.count_documents({
        "document_id": ObjectId(document_id),
        "status": "completed"
    })
    
    total_fields = db.signature_fields.count_documents({"document_id": ObjectId(document_id)})
    completed_fields = db.signature_fields.count_documents({
        "document_id": ObjectId(document_id),
        "completed_at": {"$exists": True}
    })
    
    # Get recent activity
    recent_activity = list(db.document_timeline.find(
        {"document_id": ObjectId(document_id)}
    ).sort("timestamp", -1).limit(5))
    
    return {
        "document": {
            "id": str(doc["_id"]),
            "filename": doc.get("filename"),
            "envelope_id": doc.get("envelope_id"),
            "status": doc.get("status"),
            "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
            "completed_at": doc.get("completed_at").isoformat() if doc.get("completed_at") else None
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
                "timestamp": event.get("timestamp").isoformat() if hasattr(event.get("timestamp"), 'isoformat') else str(event.get("timestamp")),
                "title": event.get("title"),
                "actor": event.get("actor", {}).get("name") or event.get("actor", {}).get("email")
            }
            for event in recent_activity
        ]
    }

# ======================
# CSV EXPORT ENDPOINTS
# ======================

@router.get("/{document_id}/summary/recipients-csv")
async def export_recipients_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export recipients data as CSV."""
    doc = get_document_with_owner(document_id, current_user)
    data = get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Name", "Email", "Role", "Status", "Signing Order",
        "OTP Verified", "Terms Accepted", "Fields Completed",
        "Total Fields", "Completion Rate", "Signing Time",
        "Added At", "Viewed At", "Completed At"
    ])
    
    # Write recipient rows
    for recipient in data["recipients"]:
        writer.writerow([
            recipient.get("name", ""),
            recipient.get("email", ""),
            recipient.get("role", ""),
            recipient.get("status", ""),
            recipient.get("signing_order", ""),
            "Yes" if recipient.get("otp_verified") else "No",
            "Yes" if recipient.get("terms_accepted") else "No",
            recipient["statistics"]["completed_fields"],
            recipient["statistics"]["total_fields"],
            recipient["statistics"]["completion_rate"],
            recipient["statistics"]["signing_time"],
            recipient.get("added_at", ""),
            recipient.get("viewed_at", "") if recipient.get("viewed_at") else "",
            recipient.get("signed_at", "") if recipient.get("signed_at") else ""
        ])
    
    content = output.getvalue()
    output.close()
    
    filename = f"recipients_{doc.get('filename', 'document').split('.')[0]}_{doc.get('envelope_id', '') or 'no_envelope'}.csv"
    
    # Log the export
    _log_event(
        document_id,
        current_user,
        "export_recipients_csv",
        {"recipients_count": len(data["recipients"])},
        request
    )
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{document_id}/summary/timeline-csv")
async def export_timeline_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export timeline events as CSV."""
    doc = get_document_with_owner(document_id, current_user)
    data = get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Timestamp", "Event Type", "Title", "Description",
        "Actor Name", "Actor Email", "Actor Role",
        "IP Address", "User Agent"
    ])
    
    # Write timeline rows
    for event in data["timeline_events"]:
        timestamp = event.get("timestamp")
        if hasattr(timestamp, 'isoformat'):
            timestamp_str = timestamp.isoformat()
        else:
            timestamp_str = str(timestamp)
        
        writer.writerow([
            timestamp_str,
            event.get("type", ""),
            event.get("title", ""),
            event.get("description", ""),
            event.get("actor", {}).get("name", ""),
            event.get("actor", {}).get("email", ""),
            event.get("actor", {}).get("role", ""),
            event.get("metadata", {}).get("ip", ""),
            event.get("metadata", {}).get("user_agent", "")
        ])
    
    content = output.getvalue()
    output.close()
    
    filename = f"timeline_{doc.get('filename', 'document').split('.')[0]}_{doc.get('envelope_id', '') or 'no_envelope'}.csv"
    
    # Log the export
    _log_event(
        document_id,
        current_user,
        "export_timeline_csv",
        {"events_count": len(data["timeline_events"])},
        request
    )
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{document_id}/summary/fields-csv")
async def export_fields_csv(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    request: Request = None
):
    """Export all fields data as CSV."""
    doc = get_document_with_owner(document_id, current_user)
    
    # Get all fields with recipient info
    fields = list(db.signature_fields.find({"document_id": ObjectId(document_id)}))
    
    if not fields:
        raise HTTPException(status_code=404, detail="No fields found for document")
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Field ID", "Type", "Label", "Page", "Recipient Name",
        "Recipient Email", "Required", "Completed", "Completed At",
        "Value Preview", "X", "Y", "Width", "Height"
    ])
    
    # Write field rows
    for field in fields:
        # Get recipient info
        recipient = db.recipients.find_one({"_id": field.get("recipient_id")})
        
        completed_at = field.get("completed_at")
        if completed_at and hasattr(completed_at, 'isoformat'):
            completed_at_str = completed_at.isoformat()
        else:
            completed_at_str = str(completed_at) if completed_at else ""
        
        writer.writerow([
            str(field["_id"]),
            field.get("type", ""),
            field.get("label", ""),
            field.get("page", 1),
            recipient.get("name", "") if recipient else "",
            recipient.get("email", "") if recipient else "",
            "Yes" if field.get("required", True) else "No",
            "Yes" if field.get("completed_at") else "No",
            completed_at_str,
            str(field.get("value", ""))[:100] if field.get("value") else "",
            field.get("x", ""),
            field.get("y", ""),
            field.get("width", ""),
            field.get("height", "")
        ])
    
    content = output.getvalue()
    output.close()
    
    filename = f"fields_{doc.get('filename', 'document').split('.')[0]}_{doc.get('envelope_id', '') or 'no_envelope'}.csv"
    
    # Log the export
    _log_event(
        document_id,
        current_user,
        "export_fields_csv",
        {"fields_count": len(fields)},
        request
    )
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
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
    """Generate HTML report for document."""
    doc = get_document_with_owner(document_id, current_user)
    data = get_complete_document_data(document_id)
    
    if not data:
        raise HTTPException(status_code=404, detail="Document data not found")
    
    # Build HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Signing Report - {data['document'].get('filename', 'Document')}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8f9fa;
            }}
            
            .report-header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 2rem 0;
                margin-bottom: 2rem;
            }}
            
            .stat-card {{
                background: white;
                border-radius: 0.5rem;
                padding: 1rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            
            .status-badge {{
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 600;
            }}
            
            .status-draft {{ background-color: #e9ecef; color: #495057; }}
            .status-sent {{ background-color: #cfe2ff; color: #084298; }}
            .status-in_progress {{ background-color: #fff3cd; color: #664d03; }}
            .status-completed {{ background-color: #d1e7dd; color: #0a3622; }}
            .status-declined {{ background-color: #f8d7da; color: #58151c; }}
            .status-voided {{ background-color: #212529; color: white; }}
            
            .timeline-item {{
                border-left: 2px solid #dee2e6;
                padding-left: 1rem;
                margin-bottom: 1rem;
            }}
        </style>
    </head>
    <body>
        <div class="report-header">
            <div class="container">
                <h1 class="display-5 fw-bold">
                    Electronic Signing Report
                </h1>
                <p class="lead">{data['document'].get('filename', 'Document')}</p>
                <p class="mb-0">Envelope ID: {data['document'].get('envelope_id', 'N/A')}</p>
            </div>
        </div>
        
        <div class="container">
            <!-- Document Information -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="stat-card">
                        <h5>Document Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Filename:</strong> {data['document'].get('filename', 'Unknown')}</p>
                                <p><strong>Envelope ID:</strong> {data['document'].get('envelope_id', 'N/A')}</p>
                                <p><strong>Status:</strong> 
                                    <span class="status-badge status-{data['document'].get('status', '').replace(' ', '_')}">
                                        {data['document'].get('status', '').upper()}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Owner:</strong> {data['document'].get('owner_email', 'Unknown')}</p>
                                <p><strong>Created:</strong> {data['document'].get('uploaded_at', 'N/A')}</p>
                                <p><strong>Completed:</strong> {data['document'].get('completed_at', 'N/A')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Recipients</h6>
                        <h3>{data['statistics']['total_recipients']}</h3>
                        <p class="text-muted">{data['statistics']['completed_recipients']} completed</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Fields</h6>
                        <h3>{data['statistics']['total_fields']}</h3>
                        <p class="text-muted">{data['statistics']['completed_fields']} completed</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Completion Rate</h6>
                        <h3>{data['statistics']['completion_rate']}</h3>
                        <p class="text-muted">Recipients</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h6>Signing Duration</h6>
                        <h3>{data['statistics']['signing_duration'].split()[0]}</h3>
                        <p class="text-muted">{data['statistics']['signing_duration'].split()[1] if len(data['statistics']['signing_duration'].split()) > 1 else ''}</p>
                    </div>
                </div>
            </div>
            
            <!-- Recipients -->
            <div class="row mb-4">
                <div class="col-12">
                    <h3>Recipients ({len(data['recipients'])})</h3>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Fields</th>
                                    <th>Signing Time</th>
                                </tr>
                            </thead>
                            <tbody>
    """
    
    for recipient in data["recipients"]:
        html_content += f"""
                                <tr>
                                    <td>{recipient.get('name', '')}</td>
                                    <td>{recipient.get('email', '')}</td>
                                    <td>{recipient.get('role', '').title()}</td>
                                    <td>
                                        <span class="status-badge status-{recipient.get('status', '').replace(' ', '_')}">
                                            {recipient.get('status', '').upper()}
                                        </span>
                                    </td>
                                    <td>{recipient['statistics']['completed_fields']}/{recipient['statistics']['total_fields']}</td>
                                    <td>{recipient['statistics']['signing_time']}</td>
                                </tr>
        """
    
    html_content += """
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Timeline -->
            <div class="row mb-4">
                <div class="col-12">
                    <h3>Timeline ({len(data['timeline_events'])})</h3>
    """
    
    for event in data["timeline_events"][-10:]:  # Show last 10 events
        timestamp = event.get("timestamp")
        if hasattr(timestamp, 'strftime'):
            timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M")
        else:
            timestamp_str = str(timestamp)[:16]
        
        actor_name = event.get("actor", {}).get("name") or event.get("actor", {}).get("email") or "System"
        
        html_content += f"""
                    <div class="timeline-item">
                        <div class="d-flex justify-content-between">
                            <strong>{event.get('title', '')}</strong>
                            <small class="text-muted">{timestamp_str}</small>
                        </div>
                        <p class="mb-1">{event.get('description', '')}</p>
                        <small class="text-muted">
                            <i class="bi bi-person"></i> {actor_name}
                            {f' • <i class="bi bi-laptop"></i> {event.get("metadata", {}).get("ip", "")}' if event.get("metadata", {}).get("ip") else ''}
                        </small>
                    </div>
        """
    
    html_content += """
                </div>
            </div>
            
            <!-- Footer -->
            <div class="row mt-5">
                <div class="col-12 text-center text-muted">
                    <p>Electronic Signing System • Report generated on {data['metadata']['report_generated']}</p>
                    <p>This is an official record of electronic signing activities</p>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    
    # Log the HTML report generation
    _log_event(
        document_id,
        current_user,
        "generate_html_report",
        {"format": "html", "recipients_count": len(data["recipients"])},
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
    doc = get_document_with_owner(document_id, current_user)
    data = get_complete_document_data(document_id)
    
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
    _log_event(
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
        
        doc = get_document_with_owner(document_id, current_user)
        data = get_complete_document_data(document_id)
        
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
        _log_event(
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

print("✅ Document Summary Router loaded successfully")