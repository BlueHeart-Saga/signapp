from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import random
import smtplib
from bson import ObjectId
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from database import db
from routes.auth import create_recipient_token

router = APIRouter(prefix="/api/recipient", tags=["Recipient Access"])

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@esign.com")

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

def generate_otp(length=6):
    """Generate a numeric OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

async def send_otp_email(to_email: str, otp: str, documents_count: int):
    """Send OTP email to recipient"""
    try:
        current_year = datetime.utcnow().year
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your Document Access Code - SafeSign"
        
        # Create email body
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
                .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
                .header {{ background: #00A3A3; color: white; padding: 40px 30px; text-align: center; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .otp-box {{ background: #f0fdf9; border: 2px dashed #00A3A3; border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                    <span class="brand-name">SafeSign</span>
                                </td>
                            </tr>
                            
                            <!-- Banner Area -->
                            <tr>
                                <td class="header">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Security Verification</h1>
                                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure access to your documents</p>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td class="content">
                                    <h2 style="margin-top: 0; color: #111827;">Hello there,</h2>
                                    <p>You have <strong>{documents_count} document(s)</strong> waiting for your review. Use the secure code below to access them:</p>
                                    
                                    <div class="otp-box">
                                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #0d9488; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Access Code</p>
                                        <div style="font-size: 36px; font-weight: 700; color: #008a8a; letter-spacing: 8px;">{otp}</div>
                                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">🔒 Valid for 10 minutes</p>
                                    </div>

                                    <p style="margin-bottom: 0;">If you did not request this code, please ignore this email.</p>
                                </td>
                            </tr>

                            <!-- Simple Footer -->
                            <tr>
                                <td style="padding: 30px; text-align: center; background: #f8fafc; border-top: 1px solid #f1f5f9;">
                                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                        &copy; {current_year} SafeSign. All rights reserved.<br>
                                        Secure electronic signatures powered by AI
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Create server connection
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send email
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        
        print(f"OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

@router.post("/request-otp")
async def request_otp(
    request: OTPRequest,
    background_tasks: BackgroundTasks
):
    """
    Request OTP for recipient access.
    Finds all documents associated with the email and sends OTP.
    """
    try:
        email = request.email.lower()
        
        # Find all recipients with this email
        recipients = list(db.recipients.find({"email": email}))
        
        if not recipients:
            # Don't reveal that email doesn't exist - for security
            # Still return success but don't send email
            return {
                "message": "If the email exists in our system, an OTP will be sent",
                "email": email
            }
        
        # Generate OTP
        otp = generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=10)
        
        # Store OTP for all recipients with this email
        # (they share the same OTP for simplicity)
        for recipient in recipients:
            db.recipients.update_one(
                {"_id": recipient["_id"]},
                {
                    "$set": {
                        "otp": otp,
                        "otp_expires": otp_expiry,
                        "otp_verified": False,
                        "otp_requested_at": datetime.utcnow()
                    }
                }
            )
        
        # Get unique document count
        document_ids = set(str(r["document_id"]) for r in recipients)
        documents_count = len(document_ids)
        
        # Send OTP email in background
        background_tasks.add_task(
            send_otp_email,
            email,
            otp,
            documents_count
        )
        
        return {
            "message": "OTP sent successfully",
            "email": email,
            "documents_count": documents_count
        }
        
    except Exception as e:
        print(f"Error requesting OTP: {e}")
        # Don't expose internal errors
        raise HTTPException(status_code=500, detail="Error processing request")

@router.post("/verify-otp")
async def verify_otp(request: OTPVerify):
    """
    Verify OTP and return access tokens for all documents.
    """
    try:
        email = request.email.lower()
        otp = request.otp
        
        # Find all recipients with this email and valid OTP
        recipients = list(db.recipients.find({
            "email": email,
            "otp": otp,
            "otp_expires": {"$gt": datetime.utcnow()}
        }))
        
        if not recipients:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Mark all as verified
        for recipient in recipients:
            db.recipients.update_one(
                {"_id": recipient["_id"]},
                {"$set": {"otp_verified": True}}
            )
        
        # Get unique documents
        document_ids = set(str(r["document_id"]) for r in recipients)
        documents = []
        
        for doc_id in document_ids:
            doc = db.documents.find_one({"_id": ObjectId(doc_id)})
            if doc:
                # Get the specific recipient for this document
                doc_recipient = next(
                    (r for r in recipients if str(r["document_id"]) == doc_id),
                    None
                )
                
                if doc_recipient:
                    # Get sender info
                    sender_name = None
                    if doc.get("owner_id"):
                        owner = db.users.find_one({"_id": doc["owner_id"]})
                        if owner:
                            sender_name = owner.get("full_name") or owner.get("name")
                    
                    # Generate token for this document
                    token = create_recipient_token(
                        recipient_id=str(doc_recipient["_id"]),
                        email=email,
                        document_id=doc_id
                    )
                    
                    documents.append({
                        "document": {
                            "id": str(doc["_id"]),
                            "name": doc.get("filename", "Untitled Document"),
                            "status": doc.get("status", "unknown"),
                            "created_at": doc.get("uploaded_at"),
                            "sender_name": sender_name,
                            "sender_email": doc.get("owner_email"),
                            "envelope_id": doc.get("envelope_id")
                        },
                        "recipient": {
                            "id": str(doc_recipient["_id"]),
                            "name": doc_recipient.get("name", ""),
                            "email": doc_recipient["email"],
                            "role": doc_recipient.get("role", "signer"),
                            "status": doc_recipient.get("status", "pending")
                        },
                        "access_token": token
                    })
        
        return {
            "success": True,
            "email": email,
            "documents": documents,
            "total_documents": len(documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying OTP: {e}")
        raise HTTPException(status_code=500, detail="Error verifying OTP")