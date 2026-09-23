import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Optional, Literal
from bson import ObjectId
from fastapi import APIRouter, Request, HTTPException, Query, Depends
from pydantic import BaseModel, EmailStr

from database import db
from config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM
from .auth import role_required

router = APIRouter(tags=["Contact / Feedback Management"])

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str

class StatusUpdate(BaseModel):
    status: Literal["new", "in_progress", "replied", "archived"]

class AdminReply(BaseModel):
    reply_message: str

def serialize_submission(sub):
    sub["id"] = str(sub["_id"])
    del sub["_id"]
    if "created_at" in sub and isinstance(sub["created_at"], datetime):
        sub["created_at"] = sub["created_at"].isoformat()
    if "replied_at" in sub and isinstance(sub["replied_at"], datetime):
        sub["replied_at"] = sub["replied_at"].isoformat()
    return sub

def send_smtp_email(to_email: str, subject: str, html_content: str) -> bool:
    """Utility to send HTML emails using system SMTP credentials"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Esigniva Team <{EMAIL_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"✅ SMTP Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send SMTP email to {to_email}: {e}")
        return False

# ──────────────────────────────────────────────
# PUBLIC: SUBMIT CONTACT / LETS TALK FORM
# ──────────────────────────────────────────────
@router.post("/api/contact")
@router.post("/contact")
async def submit_contact_form(data: ContactCreate, request: Request):
    """
    Public pre-login contact form submission endpoint.
    - Saves submission in MongoDB (`contact_submissions`)
    - Sends notification email to admin/support
    - Sends automatic Thank You response email to submitter
    """
    if not data.name.strip() or not data.email.strip() or not data.message.strip():
        raise HTTPException(status_code=400, detail="Name, email, and message are required.")

    submission = {
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "subject": data.subject.strip() if data.subject else "General Inquiry",
        "message": data.message.strip(),
        "status": "new",
        "created_at": datetime.utcnow(),
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "admin_reply": None,
        "replied_at": None
    }

    res = db.contact_submissions.insert_one(submission)
    submission_id = str(res.inserted_id)

    # 1. Automatic "Thank You" email to submitter
    user_thankyou_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #ffffff; padding: 30px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
        .content {{ padding: 32px 24px; color: #334155; line-height: 1.6; }}
        .msg-box {{ background: #f8fafc; border-left: 4px solid #0f766e; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #475569; }}
        .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Esigniva</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Secure E-Signatures & Document Management</p>
        </div>
        <div class="content">
          <h2 style="color: #0f766e; margin-top: 0;">Thank You for Contacting Us!</h2>
          <p>Hello <strong>{submission['name']}</strong>,</p>
          <p>We have received your message regarding <strong>"{submission['subject']}"</strong>. Our customer support team is reviewing your inquiry and will respond to you within 24 hours.</p>

          <div class="msg-box">
            <strong>Your Submitted Message:</strong><br/>
            <em>"{submission['message']}"</em>
          </div>

          <p>If you have additional details or context to share, simply reply directly to this email.</p>
          <p>Best regards,<br/><strong>The Esigniva Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Esigniva. All rights reserved.<br/>Need urgent assistance? Contact us at support@devopstrioglobal.com</p>
        </div>
      </div>
    </body>
    </html>
    """

    send_smtp_email(
        to_email=submission["email"],
        subject=f"Thank you for contacting Esigniva - Inquiry Received",
        html_content=user_thankyou_html
    )

    # 2. Notification email to Admin/Support
    admin_notify_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; color: #333; padding: 20px;">
      <h2 style="color: #0f766e;">New Contact Inquiry Received</h2>
      <p><strong>Name:</strong> {submission['name']}</p>
      <p><strong>Email:</strong> <a href="mailto:{submission['email']}">{submission['email']}</a></p>
      <p><strong>Subject:</strong> {submission['subject']}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">{submission['message']}</div>
      <p style="font-size: 12px; color: #888;">Submission ID: {submission_id} | Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
    </body>
    </html>
    """

    send_smtp_email(
        to_email="support@devopstrioglobal.com",
        subject=f"[NEW CONTACT INQUIRY] {submission['subject']} - from {submission['name']}",
        html_content=admin_notify_html
    )

    return {
        "success": True,
        "message": "✅ Thank you! Your message has been sent successfully. A confirmation email has been sent to your inbox.",
        "id": submission_id
    }

# ──────────────────────────────────────────────
# ADMIN: LIST CONTACT SUBMISSIONS & FEEDBACK
# ──────────────────────────────────────────────
@router.get("/e-sign/contact/admin")
async def list_contact_submissions(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, le=100),
    current_user: dict = Depends(role_required(["admin"]))
):
    """
    Admin endpoint to retrieve paginated contact submissions / feedback.
    """
    query = {}
    if status and status != "all":
        query["status"] = status

    skip = (page - 1) * page_size
    cursor = db.contact_submissions.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    items = [serialize_submission(c) for c in cursor]
    total = db.contact_submissions.count_documents(query)

    counts = {
        "all": db.contact_submissions.count_documents({}),
        "new": db.contact_submissions.count_documents({"status": "new"}),
        "in_progress": db.contact_submissions.count_documents({"status": "in_progress"}),
        "replied": db.contact_submissions.count_documents({"status": "replied"}),
        "archived": db.contact_submissions.count_documents({"status": "archived"}),
    }

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "counts": counts
    }

# ──────────────────────────────────────────────
# ADMIN: UPDATE STATUS
# ──────────────────────────────────────────────
@router.put("/e-sign/contact/admin/{submission_id}/status")
async def update_contact_status(
    submission_id: str,
    data: StatusUpdate,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Update status of contact submission"""
    res = db.contact_submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": data.status, "updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"success": True, "message": "Status updated successfully"}

# ──────────────────────────────────────────────
# ADMIN: SEND EMAIL REPLY
# ──────────────────────────────────────────────
@router.post("/e-sign/contact/admin/{submission_id}/reply")
async def send_admin_reply(
    submission_id: str,
    data: AdminReply,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Send SMTP email reply from admin directly to the submitter"""
    submission = db.contact_submissions.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    reply_text = data.reply_message.strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply message cannot be empty")

    reply_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #ffffff; padding: 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 32px 24px; color: #334155; line-height: 1.6; }}
        .reply-box {{ background: #f0fdf4; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 15px; color: #065f46; white-space: pre-line; }}
        .original-box {{ background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; font-size: 13px; color: #64748b; margin-top: 24px; }}
        .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Esigniva Support Response</h1>
        </div>
        <div class="content">
          <p>Hello <strong>{submission['name']}</strong>,</p>
          <p>Thank you for reaching out to Esigniva. Here is the response from our support team regarding your inquiry on <strong>"{submission.get('subject', 'General Inquiry')}"</strong>:</p>

          <div class="reply-box">
            {reply_text}
          </div>

          <div class="original-box">
            <strong>Original Inquiry:</strong><br/>
            "{submission['message']}"
          </div>

          <p style="margin-top: 24px;">If you have any further questions, feel free to reply to this email.</p>
          <p>Best regards,<br/><strong>Esigniva Customer Support</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Esigniva. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    sent = send_smtp_email(
        to_email=submission["email"],
        subject=f"Re: {submission.get('subject', 'Esigniva Inquiry')}",
        html_content=reply_html
    )

    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send reply email via SMTP. Please check server logs.")

    db.contact_submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "status": "replied",
            "admin_reply": reply_text,
            "replied_at": datetime.utcnow()
        }}
    )

    return {"success": True, "message": "Email reply sent successfully!"}

# ──────────────────────────────────────────────
# ADMIN: DELETE SUBMISSION
# ──────────────────────────────────────────────
@router.delete("/e-sign/contact/admin/{submission_id}")
async def delete_contact_submission(
    submission_id: str,
    current_user: dict = Depends(role_required(["admin"]))
):
    """Delete a contact submission"""
    res = db.contact_submissions.delete_one({"_id": ObjectId(submission_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"success": True, "message": "Submission deleted successfully"}
