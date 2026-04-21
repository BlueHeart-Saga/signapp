from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi import UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator, ValidationError
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional, List, Union
import re
import traceback
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
import secrets
import asyncio
from storage import storage
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from database import db
from config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, ADMIN_SECRET_KEY, RECIPIENT_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security setup
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "sagasri143@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "jalzxmkgmmnolksa")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@influencerplatform.com")

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://signapp-backend-docker-gva0g0a9f9g9cmax.southindia-01.azurewebsites.net/auth/google/callback")

# Initialize OAuth
oauth = OAuth()

# Configure Google OAuth
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
        client_kwargs={
            'scope': 'openid email profile',
            'prompt': 'select_account',
        },
    )

# ============================================
# ASYNC DATABASE HELPER FUNCTIONS
# ============================================

async def db_find_one(collection, filter):
    """Run find_one in thread pool"""
    return await asyncio.to_thread(collection.find_one, filter)

async def db_find(collection, filter=None, sort=None, limit=None):
    """Run find in thread pool and return list"""
    if filter is None:
        filter = {}
    
    def _find():
        cursor = collection.find(filter)
        if sort:
            cursor = cursor.sort(sort)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    return await asyncio.to_thread(_find)

async def db_insert_one(collection, document):
    """Run insert_one in thread pool"""
    return await asyncio.to_thread(collection.insert_one, document)

async def db_insert_many(collection, documents):
    """Run insert_many in thread pool"""
    return await asyncio.to_thread(collection.insert_many, documents)

async def db_update_one(collection, filter, update, upsert=False):
    """Run update_one in thread pool"""
    return await asyncio.to_thread(collection.update_one, filter, update, upsert=upsert)

async def db_update_many(collection, filter, update):
    """Run update_many in thread pool"""
    return await asyncio.to_thread(collection.update_many, filter, update)

async def db_delete_many(collection, filter):
    """Run delete_many in thread pool"""
    return await asyncio.to_thread(collection.delete_many, filter)

async def db_command(command):
    """Run database command in thread pool"""
    return await asyncio.to_thread(db.command, command)

# ============================================
# HELPER FUNCTIONS
# ============================================

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, ObjectId):
        return str(doc)
    
    if isinstance(doc, datetime):
        return doc.isoformat()
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if not isinstance(doc, dict):
        return doc
    
    serialized = {}
    for key, value in doc.items():
        if key == "_id":
            serialized["id"] = str(value)
        elif key == "password":
            continue  # Skip password field
        else:
            serialized[key] = serialize_doc(value)
    
    return serialized

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt, expire

def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def create_recipient_token(recipient_id: str, email: str, document_id: str) -> str:
    """Create JWT token for recipient access"""
    expire = datetime.utcnow() + timedelta(minutes=RECIPIENT_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "type": "recipient",
        "recipient_id": recipient_id,
        "email": email,
        "document_id": document_id,
        "exp": expire
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_otp(length=6):
    """Generate a numeric OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

# ============================================
# EMAIL SERVICE
# ============================================

async def send_email(to_email: str, subject: str, body: str, images: Optional[dict] = None):
    """Send email using SMTP with support for embedded images (CIDs)"""
    try:
        # Create message - 'related' is required for embedding images (CID)
        msg = MIMEMultipart('related')
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body as the first part (alternative)
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
        msg_alternative.attach(MIMEText(body, 'html'))
        
        # Attach images as related parts
        if images:
            for cid, img_data in images.items():
                if img_data:
                    # Determine image subtype
                    subtype = 'png'
                    if cid.endswith('jpg') or cid.endswith('jpeg'):
                        subtype = 'jpeg'
                        
                    msg_image = MIMEImage(img_data, _subtype=subtype)
                    msg_image.add_header('Content-ID', f'<{cid}>')
                    msg_image.add_header('Content-Disposition', 'inline', filename=f"{cid}.{subtype}")
                    msg.attach(msg_image)
        
        # Create server connection
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Enable security
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, to_email, text)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

async def send_otp_email(email: str, otp: str):
    """Send high-fidelity OTP email for password reset with embedded assets"""
    subject = f"{otp} is your verification code"
    
    # 1. Fetch Branding Info
    branding = await db_find_one(db.branding, {})
    platform_name = "SafeSign"
    if branding:
        platform_name = branding.get("platform_name", platform_name)
    
    images = {}
    
    # Base directory for static assets
    # __file__ is in backend/routes/, so we go up once to get to backend/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, "static")
    
    # 2. Handle Logo (CID: logo)
    logo_bytes = None
    if branding and branding.get("logo_file_path"):
        try:
            logo_bytes = storage.download(branding["logo_file_path"])
        except Exception as e:
            print(f"Error fetching logo from storage: {e}")
            
    if not logo_bytes:
        # Fallback to local logo if storage logo is missing
        local_logo_path = os.path.join(static_dir, "branding", "platform_logo.png")
        if os.path.exists(local_logo_path):
            with open(local_logo_path, "rb") as f:
                logo_bytes = f.read()
    
    if logo_bytes:
        images["logo"] = logo_bytes
        
    # 3. Handle Banner (CID: banner)
    banner_path = os.path.join(static_dir, "email", "forgot-password.png")
    if os.path.exists(banner_path):
        try:
            with open(banner_path, "rb") as f:
                images["banner"] = f.read()
        except Exception as e:
            print(f"Error reading banner file: {e}")

    # Generate OTP boxes HTML (Compact for single row)
    otp_boxes = "".join([
        f'<div style="display:inline-block; width:40px; height:50px; line-height:50px; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; font-size:24px; font-weight:700; color:#1e293b; margin:0 3px; text-align:center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">{digit}</div>'
        for digit in otp
    ])

    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header: Logo next to Brand Name (Zero top padding) -->
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            <img src="cid:logo" alt="Logo" style="height: 32px; width: auto; display: block;">
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 10px;">
                                            <span style="font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px;">SafeSign</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Full-Width Banner (No side padding) -->
                        <tr>
                            <td style="padding: 0;">
                                <img src="cid:banner" alt="Verification" style="width: 100%; height: auto; display: block; border: 0;">
                            </td>
                        </tr>
                        
                        <!-- Content Body -->
                        <tr>
                            <td style="padding: 40px 20px 30px;">
                                <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b; font-weight: 700;">Hello,</h2>
                                <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #475569;">
                                    A login attempt was detected on your <strong>SafeSign</strong> account. Use the one-time passcode below to complete your authentication.
                                </p>
                                
                                <!-- OTP Section (Strict Single Row) -->
                                <div style="background-color: #f8fafc; border-radius: 12px; padding: 35px 5px; text-align: center; border: 1px solid #f1f5f9;">
                                    <p style="margin: 0 0 20px; font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">Your One-Time Passcode</p>
                                    <div style="margin-bottom: 25px; white-space: nowrap;">
                                        {otp_boxes}
                                    </div>
                                    <p style="margin: 0; font-size: 13px; color: #64748b;">
                                        Expires In <span style="color: #00A3A3; font-weight: 700;">10 Minutes</span> &bull; Single Use Only
                                    </p>
                                </div>
                                
                                <!-- Alert Section -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 35px; background-color: #f8fafc; border: 1px solid #fef08a; border-radius: 10px; padding: 15px;">
                                    <tr>
                                        <td style="vertical-align: top; width: 20px; padding-top: 2px;">
                                            <span style="font-size: 18px;">⚠️</span>
                                        </td>
                                        <td style="padding-left: 12px; font-size: 13px; line-height: 1.5; color: #854d0e; font-style: italic;">
                                            If you did not attempt to log in, please secure your account immediately. Never share this code.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Redesigned Footer Section Exactly as Image -->
                        <tr>
                            <td style="padding: 40px 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                                <!-- Policy Links (Exactly as image) -->
                                <div style="margin-bottom: 12px;">
                                    <a href="https://safesign.devopstrio.co.uk/privacy-policy" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Privacy Policy</a>
                                    <a href="https://safesign.devopstrio.co.uk/terms-of-service" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Terms of Service</a>
                                    <a href="https://safesign.devopstrio.co.uk/cookies" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Cookie Policy</a>
                                </div>
                                <div style="margin-bottom: 30px;">
                                    <a href="https://safesign.devopstrio.co.uk/complaints" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">GDPR Compliance</a>
                                    <a href="#" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Disclaimer</a>
                                </div>

                                <!-- Social Icons in Rounded Boxes -->
                                <div style="margin-bottom: 35px;">
                                    <table border="0" cellspacing="0" cellpadding="0" align="center">
                                        <tr>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.linkedin.com/company/devopstrioglobal/posts/?feedView=all" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/linkedin--v1.png" alt="in" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.facebook.com/profile.php?id=61579126233218" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/facebook-new.png" alt="f" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.instagram.com/devopstrio_offcl/" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/instagram-new.png" alt="ig" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="#" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/youtube-play--v1.png" alt="yt" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Copyright and Address (Exactly as image) -->
                                <div style="color: #475569; font-size: 13px; line-height: 1.5; font-weight: 500;">
                                    <p style="margin: 0;">Copyright 2026 Devopstrio Ltd. All rights reserved.</p>
                                    <p style="margin: 0;">We are located at 128, City Road, London, EC1V 2NX</p>
                                    <p style="margin: 0;">United Kingdom</p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Bottom Teal Bar -->
                        <tr>
                            <td align="center" style="background-color: #00A3A3; padding: 15px 20px;">
                                <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.2px;">
                                    © 2026 Devopstrio. All rights reserved.
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
    return await send_email(email, subject, body, images=images)

async def send_welcome_email(email: str, full_name: str = ""):
    """Send high-fidelity Welcome email for new users with embedded assets"""
    subject = "Welcome to SafeSign"
    
    # 1. Fetch Branding Info
    branding = await db_find_one(db.branding, {})
    platform_name = "SafeSign"
    if branding:
        platform_name = branding.get("platform_name", platform_name)
    
    images = {}
    
    # Base directory for static assets
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, "static")
    
    # 2. Handle Logo (CID: logo)
    logo_bytes = None
    if branding and branding.get("logo_file_path"):
        try:
            logo_bytes = storage.download(branding["logo_file_path"])
        except Exception as e:
            print(f"Error fetching logo from storage: {e}")
            
    if not logo_bytes:
        # Fallback to local logo if storage logo is missing
        local_logo_path = os.path.join(static_dir, "branding", "platform_logo.png")
        if os.path.exists(local_logo_path):
            with open(local_logo_path, "rb") as f:
                logo_bytes = f.read()
    
    if logo_bytes:
        images["logo"] = logo_bytes
        
    # 3. Handle Welcome Banner (CID: banner)
    banner_path = os.path.join(static_dir, "email", "welcome-benner.png")
    if os.path.exists(banner_path):
        try:
            with open(banner_path, "rb") as f:
                images["banner"] = f.read()
        except Exception as e:
            print(f"Error reading welcome banner file: {e}")

    # Build greeting
    greeting = f"Hello {full_name}," if full_name else "Hello there,"

    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header: Logo next to Brand Name (Zero top padding) -->
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            <img src="cid:logo" alt="Logo" style="height: 32px; width: auto; display: block;">
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 10px;">
                                            <span style="font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px;">SafeSign</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Full-Width Banner (No side padding) -->
                        <tr>
                            <td style="padding: 0;">
                                <img src="cid:banner" alt="Welcome to SafeSign" style="width: 100%; height: auto; display: block; border: 0;">
                            </td>
                        </tr>
                        
                        <!-- Content Body -->
                        <tr>
                            <td style="padding: 40px 20px 30px;">
                                <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b; font-weight: 700;">{greeting}</h2>
                                
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #475569;">
                                    Thank you for showing interest in <strong>SafeSign</strong>.
                                </p>
                                
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #475569;">
                                    We'd like to let you know that your account has been created successfully. We will keep you posted regarding the next steps.
                                </p>
                                
                                <p style="margin: 0 0 35px; font-size: 16px; line-height: 1.6; color: #475569;">
                                    Meanwhile, we invite you to explore your dashboard and set up your signing preferences. To get started, click the button below.
                                </p>
                                
                                <!-- CTA Button -->
                                <div style="text-align: left; margin-bottom: 35px;">
                                    <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" bgcolor="#00A3A3" style="border-radius: 8px;">
                                                <a href="https://safesign.devopstrio.co.uk/login" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; padding: 12px 30px; display: inline-block; font-weight: 700;">
                                                    Click to proceed
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <p style="margin: 0; font-size: 15px; color: #475569;">Best,</p>
                                <p style="margin: 5px 0 0; font-size: 15px; font-weight: 700; color: #1e293b;">SafeSign Team.</p>
                            </td>
                        </tr>
                        
                        <!-- Redesigned Footer Section Exactly as Image -->
                        <tr>
                            <td style="padding: 40px 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                                <!-- Policy Links (Exactly as image) -->
                                <div style="margin-bottom: 12px;">
                                    <a href="https://safesign.devopstrio.co.uk/privacy-policy" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Privacy Policy</a>
                                    <a href="https://safesign.devopstrio.co.uk/terms-of-service" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Terms of Service</a>
                                    <a href="https://safesign.devopstrio.co.uk/cookies" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Cookie Policy</a>
                                </div>
                                <div style="margin-bottom: 30px;">
                                    <a href="https://safesign.devopstrio.co.uk/complaints" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">GDPR Compliance</a>
                                    <a href="#" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Disclaimer</a>
                                </div>

                                <!-- Social Icons in Rounded Boxes -->
                                <div style="margin-bottom: 35px;">
                                    <table border="0" cellspacing="0" cellpadding="0" align="center">
                                        <tr>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.linkedin.com/company/devopstrioglobal/posts/?feedView=all" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/linkedin--v1.png" alt="in" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.facebook.com/profile.php?id=61579126233218" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/facebook-new.png" alt="f" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.instagram.com/devopstrio_offcl/" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/instagram-new.png" alt="ig" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="#" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/youtube-play--v1.png" alt="yt" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Copyright and Address (Exactly as image) -->
                                <div style="color: #475569; font-size: 13px; line-height: 1.5; font-weight: 500;">
                                    <p style="margin: 0;">Copyright 2026 Devopstrio Ltd. All rights reserved.</p>
                                    <p style="margin: 0;">We are located at 128, City Road, London, EC1V 2NX</p>
                                    <p style="margin: 0;">United Kingdom</p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Bottom Teal Bar -->
                        <tr>
                            <td align="center" style="background-color: #00A3A3; padding: 15px 20px;">
                                <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.2px;">
                                    © 2026 Devopstrio. All rights reserved.
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
    return await send_email(email, subject, body, images=images)

# ============================================
# DEPENDENCIES
# ============================================

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from token"""
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    email = payload.get("email") or payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = await db_find_one(db.users, {"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is suspended. Please contact support."
        )

    return serialize_doc(user)

def role_required(required_roles: list):
    """Dependency to check user roles"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# ============================================
# PYDANTIC MODELS
# ============================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"
    organization_name: str = ""
    secret_key: str = ""
    full_name: str = ""

    @field_validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

    @field_validator('role')
    def validate_role(cls, v):
        if v.lower() not in ['admin', 'user', 'recipient']:
            raise ValueError('Role must be admin, user, or recipient')
        return v.lower()

class RecipientSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class OnboardingUpdate(BaseModel):
    has_completed_editor_tour: Optional[bool] = None
    onboarding_data: Optional[dict] = None

class GoogleTokenRequest(BaseModel):
    credential: str

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None
    status_code: int

# ============================================
# DOCUMENT SERVICE FUNCTIONS
# ============================================

async def get_documents_for_recipient(recipient_email: str):
    """Get all documents where user is a recipient"""
    try:
        documents = await db_find(
            db.documents,
            {"recipients.email": recipient_email},
            sort=[("created_at", -1)]
        )
        
        result_docs = []
        for doc in documents:
            # Find recipient info
            recipient_info = None
            for recipient in doc.get("recipients", []):
                if recipient["email"].lower() == recipient_email.lower():
                    recipient_info = recipient
                    break
            
            if recipient_info:
                doc_data = {
                    "id": str(doc["_id"]),
                    "name": doc.get("name", "Untitled Document"),
                    "description": doc.get("description", ""),
                    "status": doc.get("status", "draft"),
                    "created_by": doc.get("created_by"),
                    "created_at": doc.get("created_at"),
                    "completed_at": doc.get("completed_at"),
                    "signed_at": recipient_info.get("signed_at"),
                    "signature_status": recipient_info.get("status", "pending"),
                    "signature_method": recipient_info.get("signature_method"),
                    "ip_address": recipient_info.get("ip_address")
                }
                result_docs.append(serialize_doc(doc_data))
        
        return result_docs
    except Exception as e:
        print(f"Error getting documents for recipient: {e}")
        return []

async def link_recipient_to_documents(recipient_email: str, user_id: str):
    """Link existing signed documents to new recipient account"""
    try:
        result = await db_update_many(
            db.documents,
            {"recipients.email": recipient_email},
            {
                "$set": {
                    "recipients.$[elem].user_id": user_id,
                    "recipients.$[elem].is_registered": True
                }
            },
            array_filters=[{"elem.email": recipient_email}]
        )
        return result.modified_count
    except Exception as e:
        print(f"Error linking documents: {e}")
        return 0

async def create_recipient_document_access(user_id: str, email: str):
    """Create document access records for recipient"""
    try:
        documents = await get_documents_for_recipient(email)
        
        if not documents:
            return 0
        
        access_records = []
        for doc in documents:
            access_record = {
                "user_id": user_id,
                "document_id": doc["id"],
                "document_name": doc["name"],
                "signed_at": doc.get("signed_at", datetime.utcnow()),
                "access_granted_at": datetime.utcnow(),
                "can_download": True,
                "can_view_history": True,
                "status": doc.get("signature_status", "completed")
            }
            access_records.append(access_record)
        
        await db_insert_many(db.document_access, access_records)
        return len(access_records)
    except Exception as e:
        print(f"Error creating document access: {e}")
        return 0

async def can_recipient_register(email: str):
    """Check if recipient can register (has signed documents)"""
    try:
        documents = await db_find(
            db.documents,
            {
                "recipients.email": email,
                "recipients.signed_at": {"$exists": True}
            }
        )
        return len(documents) > 0
    except Exception as e:
        print(f"Error checking recipient registration: {e}")
        return False

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@router.post("/register")
async def register_user(user_data: UserRegister):
    """Register a new user with comprehensive error handling"""
    try:
        # Check database connection first
        try:
            await db_command('ping')
        except Exception as db_error:
            print(f"Database connection error: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Database Connection Failed",
                    "message": "Unable to connect to the database. Please try again later.",
                    "code": "DB_CONNECTION_ERROR"
                }
            )
        
        # Check if user already exists
        try:
            existing_user = await db_find_one(db.users, {"email": user_data.email.lower()})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": "Email Already Registered",
                        "message": "This email address is already registered. Please use a different email or try logging in.",
                        "code": "EMAIL_EXISTS",
                        "field": "email"
                    }
                )
        except Exception as e:
            print(f"Error checking existing user: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Database Query Failed",
                    "message": "Unable to verify email availability. Please try again.",
                    "code": "DB_QUERY_ERROR"
                }
            )
        
        # Validate password length
        password_bytes = user_data.password.encode('utf-8')
        if len(password_bytes) > 72:
            user_data.password = user_data.password[:72]
            print(f"Warning: Password truncated to 72 bytes for user {user_data.email}")
        
        # Validate admin registration
        if user_data.role == "admin":
            if not user_data.secret_key:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "Admin Secret Key Required",
                        "message": "Admin registration requires a valid secret key.",
                        "code": "ADMIN_SECRET_REQUIRED",
                        "field": "secret_key"
                    }
                )
            if user_data.secret_key != ADMIN_SECRET_KEY:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "Invalid Admin Secret Key",
                        "message": "The provided admin secret key is invalid.",
                        "code": "INVALID_ADMIN_SECRET",
                        "field": "secret_key"
                    }
                )
        
        # For recipient registration, full name is required
        if user_data.role == "recipient" and not user_data.full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Full Name Required",
                    "message": "Full name is required for recipient accounts.",
                    "code": "FULL_NAME_REQUIRED",
                    "field": "full_name"
                }
            )
        
        # Create user document
        user_doc = {
            "email": user_data.email.lower(),
            "password": pwd_ctx.hash(user_data.password),
            "role": user_data.role,
            "organization_name": user_data.organization_name,
            "full_name": user_data.full_name,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "email_verified": False,
            "auth_provider": "email"
        }
        
        # For recipients, add additional fields
        if user_data.role == "recipient":
            user_doc.update({
                "recipient_since": datetime.utcnow(),
                "signature_count": 0,
                "last_signed_at": None,
                "linked_documents_count": 0,
                "document_access_count": 0
            })
        
        # Insert user into database
        try:
            result = await db_insert_one(db.users, user_doc)
            user_id = str(result.inserted_id)
        except Exception as e:
            print(f"Error inserting user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "User Creation Failed",
                    "message": "Unable to create user account. Please try again.",
                    "code": "USER_CREATION_FAILED"
                }
            )
        
        # Trigger Welcome Email
        try:
            await send_welcome_email(user_data.email.lower(), user_data.full_name)
        except Exception as email_err:
            print(f"Warning: Failed to send welcome email to {user_data.email}: {email_err}")

        # If recipient, link any existing signed documents
        linked_count = 0
        signature_count = 0
        if user_data.role == "recipient":
            try:
                linked_count = await link_recipient_to_documents(user_data.email, user_id)
                access_count = await create_recipient_document_access(user_id, user_data.email)
                
                # Update user with document access info and signature count
                signed_docs = await get_documents_for_recipient(user_data.email)
                signature_count = len([doc for doc in signed_docs if doc.get("signed_at")])
                
                # Get last signed date safely
                last_signed = None
                signed_dates = [doc.get("signed_at") for doc in signed_docs if doc.get("signed_at")]
                if signed_dates:
                    try:
                        last_signed = max(signed_dates)
                    except:
                        last_signed = signed_dates[0] if signed_dates else None
                
                update_data = {
                    "linked_documents_count": linked_count,
                    "document_access_count": access_count,
                    "signature_count": signature_count
                }
                if last_signed:
                    update_data["last_signed_at"] = last_signed
                    
                await db_update_one(
                    db.users,
                    {"_id": result.inserted_id},
                    {"$set": update_data}
                )
            except Exception as e:
                # Log but don't fail registration if linking documents fails
                print(f"Warning: Failed to link documents for recipient {user_data.email}: {e}")
        
        # Get the created user and serialize it
        try:
            created_user = await db_find_one(db.users, {"_id": result.inserted_id})
            if not created_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "error": "User Not Found",
                        "message": "User was created but could not be retrieved.",
                        "code": "USER_RETRIEVAL_FAILED"
                    }
                )
            user_response = serialize_doc(created_user)
        except Exception as e:
            print(f"Error retrieving created user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "User Retrieval Failed",
                    "message": "User was created but profile retrieval failed. Please try logging in.",
                    "code": "USER_RETRIEVAL_ERROR",
                    "user_id": user_id
                }
            )
        
        # Success response
        response_data = {
            "message": f"{user_data.role.capitalize()} registered successfully",
            "user": user_response,
            "success": True
        }
        
        if user_data.role == "recipient":
            response_data["linked_documents"] = linked_count
            response_data["signature_count"] = signature_count
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected registration error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Registration Failed",
                "message": "An unexpected error occurred during registration. Please try again later.",
                "code": "UNEXPECTED_ERROR",
                "details": str(e) if os.getenv("DEBUG", "false").lower() == "true" else None
            }
        )

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint with comprehensive error handling"""
    try:
        # Check database connection
        try:
            await db_command('ping')
        except Exception as db_error:
            print(f"Database connection error during login: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Service Unavailable",
                    "message": "Unable to connect to authentication service. Please try again later.",
                    "code": "DB_CONNECTION_ERROR"
                }
            )
        
        # Validate input
        if not form_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Email Required",
                    "message": "Please provide your email address.",
                    "code": "EMAIL_REQUIRED",
                    "field": "username"
                }
            )
        
        if not form_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Password Required",
                    "message": "Please provide your password.",
                    "code": "PASSWORD_REQUIRED",
                    "field": "password"
                }
            )
        
        # Find user
        try:
            user = await db_find_one(db.users, {"email": form_data.username.lower()})
        except Exception as e:
            print(f"Error finding user: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "Database Error",
                    "message": "Unable to verify credentials. Please try again.",
                    "code": "DB_QUERY_ERROR"
                }
            )

        # User not found
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "Invalid Credentials",
                    "message": "The email or password you entered is incorrect.",
                    "code": "INVALID_CREDENTIALS"
                }
            )

        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Account Suspended",
                    "message": "Your account has been suspended. Please contact support for assistance.",
                    "code": "ACCOUNT_SUSPENDED"
                }
            )

        # Handle Google OAuth users
        if user.get("auth_provider") == "google" and "password" not in user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "Google Account",
                    "message": "This account uses Google Sign-In. Please login with Google.",
                    "code": "USE_GOOGLE_LOGIN",
                    "auth_provider": "google"
                }
            )

        # Check if password exists
        if "password" not in user or not user["password"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "Invalid Credentials",
                    "message": "The email or password you entered is incorrect.",
                    "code": "INVALID_CREDENTIALS"
                }
            )

        # Verify password
        try:
            password = form_data.password

            password_bytes = password.encode("utf-8")
            if len(password_bytes) > 72:
                password = password[:72]

            password_valid = pwd_ctx.verify(password, user["password"])
            
        except Exception as e:
            print(f"Password verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Authentication Error",
                    "message": "Unable to verify password. Please try again.",
                    "code": "PASSWORD_VERIFICATION_ERROR"
                }
            )

        if not password_valid:
            # Log failed attempt
            try:
                await db_insert_one(db.login_attempts, {
                    "email": form_data.username.lower(),
                    "success": False,
                    "reason": "invalid_password",
                    "timestamp": datetime.utcnow()
                })
            except:
                pass  # Don't fail login if logging fails
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "Invalid Credentials",
                    "message": "The email or password you entered is incorrect.",
                    "code": "INVALID_CREDENTIALS"
                }
            )

        # Create access token
        try:
            access_token, expires_at = create_access_token(
                data={
                    "sub": user["email"],
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "role": user["role"]
                }
            )
        except Exception as e:
            print(f"Token creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Token Generation Failed",
                    "message": "Unable to create access token. Please try again.",
                    "code": "TOKEN_CREATION_ERROR"
                }
            )

        # Log successful login
        try:
            await db_insert_one(db.login_attempts, {
                "email": form_data.username.lower(),
                "success": True,
                "timestamp": datetime.utcnow()
            })
        except:
            pass  # Don't fail login if logging fails

        # Return success response
        return TokenResponse(
            access_token=access_token,
            expires_at=expires_at,
            user=serialize_doc(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected login error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Login Failed",
                "message": "An unexpected error occurred during login. Please try again later.",
                "code": "UNEXPECTED_ERROR"
            }
        )

@router.post("/register/recipient")
async def register_recipient(recipient_data: RecipientSignup):
    """Special endpoint for recipient registration"""
    try:
        # Check if recipient already has an account
        existing_user = await db_find_one(db.users, {"email": recipient_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create recipient account
        user_doc = {
            "email": recipient_data.email.lower(),
            "password": pwd_ctx.hash(recipient_data.password),
            "role": "recipient",
            "full_name": recipient_data.full_name,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "email_verified": False,
            "recipient_since": datetime.utcnow(),
            "linked_documents_count": 0,
            "document_access_count": 0,
            "signature_count": 0,
            "auth_provider": "email"
        }
        
        result = await db_insert_one(db.users, user_doc)
        user_id = str(result.inserted_id)
        
        # Link any existing documents to recipient account
        linked_count = await link_recipient_to_documents(recipient_data.email, user_id)
        access_count = await create_recipient_document_access(user_id, recipient_data.email)
        
        # Get signature count and last signed date
        signed_docs = await get_documents_for_recipient(recipient_data.email)
        signature_count = len([doc for doc in signed_docs if doc.get("signed_at")])
        
        # Get last signed date safely
        last_signed = None
        signed_dates = [doc.get("signed_at") for doc in signed_docs if doc.get("signed_at")]
        if signed_dates:
            try:
                last_signed = max(signed_dates)
            except:
                last_signed = signed_dates[0] if signed_dates else None
        
        # Update user with counts
        update_data = {
            "linked_documents_count": linked_count,
            "document_access_count": access_count,
            "signature_count": signature_count
        }
        if last_signed:
            update_data["last_signed_at"] = last_signed
            
        await db_update_one(
            db.users,
            {"_id": result.inserted_id},
            {"$set": update_data}
        )
        
        # Trigger Welcome Email
        try:
            await send_welcome_email(recipient_data.email.lower(), recipient_data.full_name)
        except Exception as email_err:
            print(f"Warning: Failed to send welcome email to {recipient_data.email}: {email_err}")

        # Get the created user and serialize it
        created_user = await db_find_one(db.users, {"_id": result.inserted_id})
        user_response = serialize_doc(created_user)
        
        return {
            "message": "Recipient account created successfully",
            "user": user_response,
            "linked_documents": linked_count,
            "signature_count": signature_count,
            "document_access": access_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Recipient registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Recipient registration failed due to server error"
        )

@router.get("/check-recipient/{email}")
async def check_recipient_status(email: str):
    """Check if an email has signed documents and can register as recipient"""
    try:
        can_register = await can_recipient_register(email)
        signed_documents = await get_documents_for_recipient(email)
        signature_count = len([doc for doc in signed_documents if doc.get("signed_at")])
        
        existing_user = await db_find_one(db.users, {"email": email.lower()})
        
        return {
            "email": email,
            "can_register": can_register,
            "signed_documents_count": signature_count,
            "total_documents": len(signed_documents),
            "has_account": existing_user is not None
        }
    except Exception as e:
        print(f"Error checking recipient status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking recipient status"
        )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks
):
    """Request password reset OTP"""
    try:
        email = request.email.lower()

        user = await db_find_one(db.users, {"email": email})

        # Security: do NOT reveal user existence
        if not user:
            return {
                "message": "If the email exists, a password reset OTP has been sent"
            }

        if not user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is suspended. Please contact support."
            )

        # Generate OTP
        otp = generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=10)

        await db_update_one(
            db.password_reset_tokens,
            {"email": email},
            {
                "$set": {
                    "otp": otp,
                    "expires_at": otp_expiry,
                    "used": False,
                    "verified": False,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        background_tasks.add_task(send_otp_email, email, otp)

        return {
            "message": "If the email exists, a password reset OTP has been sent"
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Forgot password error:", e)
        raise HTTPException(
            status_code=500,
            detail="Error processing password reset request"
        )

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP for password reset"""
    try:
        # Find OTP record
        otp_record = await db_find_one(db.password_reset_tokens, {
            "email": request.email.lower(),
            "otp": request.otp,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Mark OTP as verified (but not used yet)
        await db_update_one(
            db.password_reset_tokens,
            {"_id": otp_record["_id"]},
            {"$set": {"verified": True}}
        )
        
        return {
            "message": "OTP verified successfully",
            "verified": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Verify OTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying OTP"
        )

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using verified OTP"""
    try:
        # Find verified OTP record
        otp_record = await db_find_one(db.password_reset_tokens, {
            "email": request.email.lower(),
            "otp": request.otp,
            "verified": True,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Validate new password
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        
        # Update user password
        password_bytes = request.new_password.encode("utf-8")
        if len(password_bytes) > 72:
            request.new_password = request.new_password[:72]

        hashed_password = pwd_ctx.hash(request.new_password)
        
        await db_update_one(
            db.users,
            {"email": request.email.lower()},
            {"$set": {"password": hashed_password, "updated_at": datetime.utcnow()}}
        )
        
        # Mark OTP as used
        await db_update_one(
            db.password_reset_tokens,
            {"_id": otp_record["_id"]},
            {"$set": {"used": True, "used_at": datetime.utcnow()}}
        )
        
        # Delete all OTPs for this email
        await db_delete_many(db.password_reset_tokens, {"email": request.email.lower()})
        
        return {
            "message": "Password reset successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password"
        )

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Change password for authenticated user"""
    try:
        # Get current user from database
        user = await db_find_one(db.users, {"email": current_user["email"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not pwd_ctx.verify(request.current_password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters"
            )
        
        # Update password
        hashed_password = pwd_ctx.hash(request.new_password)
        await db_update_one(
            db.users,
            {"email": current_user["email"]},
            {"$set": {"password": hashed_password, "updated_at": datetime.utcnow()}}
        )
        
        return {
            "message": "Password changed successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Change password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password"
        )

# ============================================
# GOOGLE OAUTH ROUTES
# ============================================

@router.get("/google/login")
async def google_login(request: Request):
    """Redirect to Google OAuth"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured"
        )
    
    state_payload = {
        "nonce": secrets.token_urlsafe(8),
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }

    state = jwt.encode(state_payload, JWT_SECRET, algorithm="HS256")
    
    # Create authorization URL
    authorization_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20email%20profile"
        f"&state={state}"
        f"&prompt=select_account"
    )
    
    return RedirectResponse(url=authorization_url)

@router.get("/google/callback")
async def google_callback(
    request: Request, 
    code: str = None, 
    state: str = None, 
    error: str = None
):
    """Handle Google OAuth callback"""
    try:
        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google OAuth error: {error}"
            )
        
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code not provided"
            )
        
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth is not configured"
            )
        
        # Verify state to prevent CSRF
        try:
            jwt.decode(state, JWT_SECRET, algorithms=["HS256"])
        except JWTError:
            raise HTTPException(
                status_code=400,
                detail="Invalid state parameter"
            )
        
        # Clear the state from session
        if 'oauth_state' in request.session:
            del request.session['oauth_state']
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': GOOGLE_REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(token_url, data=token_data) as response:
                token_response = await response.json()
                
                if 'error' in token_response:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"OAuth error: {token_response['error']}"
                    )
                
                access_token = token_response.get('access_token')
                
                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token received from Google"
                    )
                
                # Get user info from Google
                userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
                headers = {'Authorization': f'Bearer {access_token}'}
                
                async with session.get(userinfo_url, headers=headers) as userinfo_response:
                    user_info = await userinfo_response.json()
                    
                    if 'error' in user_info:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Failed to get user information: {user_info['error']}"
                        )
        
        email = user_info.get('email')
        name = user_info.get('name', '')
        google_id = user_info.get('sub')
        picture = user_info.get('picture', '')
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # Check if user exists
        user = await db_find_one(db.users, {"email": email.lower()})
        
        if not user:
            # Create new user with Google OAuth
            user_doc = {
                "email": email.lower(),
                "full_name": name,
                "role": "user",
                "created_at": datetime.utcnow(),
                "is_active": True,
                "email_verified": True,
                "auth_provider": "google",
                "google_id": google_id,
                "profile_picture": picture,
                "organization_name": ""
            }
            
            result = await db_insert_one(db.users, user_doc)
            
            # Trigger Welcome Email
            try:
                await send_welcome_email(email.lower(), name)
            except Exception as email_err:
                print(f"Warning: Failed to send welcome email to {email}: {email_err}")

            # Get the created user
            user = await db_find_one(db.users, {"_id": result.inserted_id})
        else:
            # Update existing user with Google info
            update_data = {
                "auth_provider": "google",
                "google_id": google_id,
                "email_verified": True,
                "updated_at": datetime.utcnow()
            }
            
            # Update profile picture if not set
            if picture and not user.get('profile_picture'):
                update_data["profile_picture"] = picture
            
            # Update name if not set or empty
            if name and not user.get('full_name'):
                update_data["full_name"] = name
                
            await db_update_one(
                db.users,
                {"email": email.lower()},
                {"$set": update_data}
            )
        
        # Create access token
        access_token, expires_at = create_access_token(
            data={
                "id": str(user["_id"]),
                "email": email,
                "role": user.get("role", "user")
            }
        )
        
        # Redirect to frontend with token
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
        redirect_url = f"{frontend_url}/auth/success?token={access_token}"
        
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google OAuth error: {e}")
        # Redirect to frontend with error
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3001')
        error_redirect = f"{frontend_url}/login?error=Google+authentication+failed"
        return RedirectResponse(url=error_redirect)

@router.post("/google/verify-token")
async def google_verify_token(request: GoogleTokenRequest):
    """Verify Google ID token (GSI)"""
    try:
        # Verify the ID token
        id_info = id_token.verify_oauth2_token(
            request.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        email = id_info.get('email')
        name = id_info.get('name', '')
        google_id = id_info.get('sub')
        picture = id_info.get('picture', '')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        # Re-use the same logic as callback for finding/creating user
        user = await db_find_one(db.users, {"email": email.lower()})
        
        if not user:
            # Create new user
            user_doc = {
                "email": email.lower(),
                "full_name": name,
                "role": "user",
                "created_at": datetime.utcnow(),
                "is_active": True,
                "email_verified": True,
                "auth_provider": "google",
                "google_id": google_id,
                "profile_picture": picture,
                "organization_name": ""
            }
            
            result = await db_insert_one(db.users, user_doc)
            user = await db_find_one(db.users, {"_id": result.inserted_id})
            
            # Welcome email
            try:
                await send_welcome_email(email.lower(), name)
            except:
                pass
        else:
            # Update existing user
            update_data = {
                "auth_provider": "google",
                "google_id": google_id,
                "email_verified": True,
                "updated_at": datetime.utcnow()
            }
            if picture and not user.get('profile_picture'):
                update_data["profile_picture"] = picture
            if name and not user.get('full_name'):
                update_data["full_name"] = name
                
            await db_update_one(db.users, {"email": email.lower()}, {"$set": update_data})
            user = await db_find_one(db.users, {"email": email.lower()})

        # Create access token
        access_token, expires_at = create_access_token(
            data={
                "id": str(user["_id"]),
                "email": email,
                "role": user.get("role", "user")
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": serialize_doc(user)
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        print(f"Google verify error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify Google account"
        )

# ============================================
# USER PROFILE & HEALTH ROUTES
# ============================================

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

import base64

@router.post("/update-profile")
async def update_profile(
    full_name: str = Form(...),
    first_name: str = Form(None),
    last_name: str = Form(None),
    company: str = Form(None),
    job_title: str = Form(None),
    date_format: str = Form(None),
    time_zone: str = Form(None),
    reminder_days: Optional[int] = Form(None),
    expiry_days: Optional[int] = Form(None),
    profile_picture: UploadFile = File(None),
    stamp_image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        print(f"Updating profile for user: {current_user.get('email')}")
        
        update_data = {
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "company": company,
            "job_title": job_title,
            "date_format": date_format,
            "time_zone": time_zone,
            "reminder_days": reminder_days,
            "expiry_days": expiry_days,
            "updated_at": datetime.utcnow()
        }

        # Remove None values to avoid overwriting existing data with nulls
        update_data = {k: v for k, v in update_data.items() if v is not None}

        # Process profile picture if uploaded
        if profile_picture and profile_picture.filename:
            try:
                image_bytes = await profile_picture.read()
                if len(image_bytes) > 0:
                    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                    update_data["profile_picture"] = {
                        "data": image_base64,
                        "content_type": profile_picture.content_type or "image/jpeg"
                    }
                    print("Profile picture updated")
            except Exception as e:
                print(f"Error processing profile picture: {e}")

        # Process stamp image if uploaded
        if stamp_image and stamp_image.filename:
            try:
                stamp_bytes = await stamp_image.read()
                if len(stamp_bytes) > 0:
                    stamp_base64 = base64.b64encode(stamp_bytes).decode("utf-8")
                    update_data["stamp_image"] = {
                        "data": stamp_base64,
                        "content_type": stamp_image.content_type or "image/png"
                    }
                    print("Stamp image updated")
            except Exception as e:
                print(f"Error processing stamp image: {e}")

        # Use email from current_user to perform update
        user_email = current_user.get("email")
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found in token")

        # Update user in database
        result = await db_update_one(
            db.users,
            {"email": user_email},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            print(f"No user found with email: {user_email}")
            raise HTTPException(status_code=404, detail="User not found")

        # Get updated user data
        updated_user = await db_find_one(db.users, {"email": user_email})

        return {
            "status": "success",
            "message": "Profile updated successfully",
            "user": serialize_doc(updated_user)
        }

    except Exception as e:
        print(f"Profile update error: {e}")
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/update-onboarding")
async def update_onboarding(
    data: OnboardingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Securely update user onboarding and walkthrough status"""
    try:
        update_doc = {}
        if data.has_completed_editor_tour is not None:
            update_doc["has_completed_editor_tour"] = data.has_completed_editor_tour
        if data.onboarding_data is not None:
            update_doc["onboarding_data"] = data.onboarding_data
        
        if not update_doc:
            return {"status": "skipped", "message": "No update data provided"}

        await db_update_one(
            db.users,
            {"email": current_user["email"]},
            {"$set": update_doc}
        )
        return {"status": "success", "message": "Onboarding status updated"}
    except Exception as e:
        print(f"Onboarding update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update onboarding status")

@router.get("/health")
async def health_check():
    """Health check endpoint for frontend to verify backend connectivity"""
    try:
        # Check database connection
        db_status = "connected"
        try:
            await db_command('ping')
        except Exception as e:
            db_status = f"disconnected: {str(e)}"
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "message": "Backend is operational"
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "message": "Backend is experiencing issues"
            }
        )