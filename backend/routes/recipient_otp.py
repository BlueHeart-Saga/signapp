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
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Your Document Access Code - SafeSign"
        
        # Create email body
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0d9488; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">SafeSign</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2 style="color: #333; margin-top: 0;">Your Document Access Code</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    You have {documents_count} document(s) waiting for your review. 
                    Use the following One-Time Password (OTP) to access them:
                </p>
                
                <div style="background-color: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #0d9488;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #0d9488;">{otp}</span>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    This code will expire in 10 minutes for security reasons.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't request this code, please ignore this email.<br>
                    &copy; 2024 SafeSign. All rights reserved.
                </p>
            </div>
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