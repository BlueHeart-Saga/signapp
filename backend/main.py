from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.sessions import SessionMiddleware
import os
from fastapi.middleware.cors import CORSMiddleware
from routes import email_service, recipient_documents, recipient_history, recipient_otp, subscription, envelope_management, credits
from routes import logo, banner, complaint, auth, documents, templates, box, google_drive, dropbox, onedrive, recipients, audit, signature, recipient_signing, recipient_logs, ai_template_builder, fields, contacts, admin_control, admin_template, summary, contact
from fastapi.staticfiles import StaticFiles

import asyncio
from datetime import datetime
from database import db
# Import cron tasks
from cron.send_reminders import send_reminders
from cron.expire_documents import expire_documents

async def run_automated_tasks():
    """
    Background loop to run reminders and expiration checks.
    Uses a distributed lock in MongoDB to ensure only one worker 
    runs these tasks in multi-worker production environments.
    """
    while True:
        try:
            # Atomic lock check/set using MongoDB AsyncMongoClient
            lock_name = "automated_tasks_lock"
            now = datetime.utcnow()
            
            # Find the lock or create it
            lock = await db.locks.find_one({"name": lock_name})
            
            should_run = False
            if not lock:
                # Create lock
                try:
                    await db.locks.insert_one({
                        "name": lock_name,
                        "last_run": now,
                        "locked_by": os.getpid()
                    })
                    should_run = True
                except: # Duplicate key error
                    should_run = False
            else:
                # Check if lock is old enough (at least 55 mins since last run)
                last_run = lock.get("last_run")
                if last_run and (now - last_run).total_seconds() > 3300:
                    result = await db.locks.update_one(
                        {"name": lock_name, "last_run": last_run}, # Atomic check
                        {"$set": {"last_run": now, "locked_by": os.getpid()}}
                    )
                    if result.modified_count > 0:
                        should_run = True

            if should_run:
                print(f"[AUTO-TASKS] Lock acquired by PID {os.getpid()}. Starting tasks...")
                
                print("[AUTO-TASKS] Running expiration check...")
                await expire_documents()
                
                print("[AUTO-TASKS] Running reminder scanner...")
                await send_reminders()
                
                print("[AUTO-TASKS] Tasks finished. Lock maintained.")
            else:
                pass
                
        except Exception as e:
            print(f"[AUTO-TASKS] Error in background loop: {e}")
            
        # Check every 5 minutes if we can acquire the lock
        await asyncio.sleep(300)

from services.job_queue import JobQueue
import time
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[SERVER] Esigniva Backend Starting...")
    
    # Start JobQueue Background Worker Pool
    try:
        await JobQueue.start_worker(poll_interval_seconds=2.0)
        print("[SERVER] JobQueue background worker initialized.")
    except Exception as jq_err:
        print(f"[SERVER] JobQueue worker startup notice: {jq_err}")

    # Ensure distributed lock collection has unique index
    try:
        await db.locks.create_index("name", unique=True)
    except Exception:
        pass

    # Ensure application DB indexes exist for high-performance query execution
    try:
        await db.documents.create_index([("owner_id", 1), ("status", 1), ("created_at", -1)])
        await db.documents.create_index([("owner_id", 1), ("updated_at", -1)])
        await db.recipients.create_index([("document_id", 1), ("signing_order", 1)])
        await db.recipients.create_index([("email", 1), ("status", 1)])
        await db.recipients.create_index([("signing_token_hash", 1)], unique=True)
        await db.audit_logs.create_index([("document_id", 1), ("created_at", 1)])
        await db.notifications.create_index([("user_id", 1), ("read", 1), ("created_at", -1)])
        await db.jobs.create_index([("status", 1), ("scheduled_at", 1)])
        await db.jobs.create_index("idempotency_key", unique=True, sparse=True)
        print("[SERVER] Database indexes initialized successfully.")
    except Exception as index_err:
        print(f"[SERVER] Database index initialization notice: {index_err}")

    # Ensure branding collection in MongoDB has platform_name set to Esigniva
    try:
        existing_branding = await db.branding.find_one({})
        if not existing_branding:
            await db.branding.insert_one({
                "platform_name": "Esigniva",
                "tagline": "Secure Digital Document Signing",
                "updated_at": datetime.utcnow()
            })
            print("[SERVER] Initialized DB branding with platform_name: Esigniva")
        elif existing_branding.get("platform_name") != "Esigniva":
            await db.branding.update_one(
                {"_id": existing_branding["_id"]},
                {"$set": {"platform_name": "Esigniva", "updated_at": datetime.utcnow()}}
            )
            print("[SERVER] Updated DB branding platform_name to Esigniva")
    except Exception as branding_err:
        print(f"[SERVER] Branding initialization notice: {branding_err}")
    
    # Start the background task loop
    task = asyncio.create_task(run_automated_tasks())
    
    yield
    
    # Shutdown
    print("[SERVER] Esigniva Backend Shutting Down...")
    await JobQueue.stop_worker()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Esigniva API",
    lifespan=lifespan
)

# Structured Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.perf_counter()
    
    response = await call_next(request)
    
    process_time_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-MS"] = f"{process_time_ms:.2f}"
    
    if process_time_ms > 1000:
        print(f"[SLOW-REQUEST] {request.method} {request.url.path} took {process_time_ms:.2f}ms (Status: {response.status_code}, ID: {request_id})")
        
    return response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(BASE_DIR, "static")

# Ensure static directory exists
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Add SessionMiddleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "your-secret-key-change-in-production"),
    session_cookie="session",
    max_age=3600,
    same_site="none",   # 🔥 REQUIRED for OAuth
    https_only=True     # 🔥 REQUIRED for Azure HTTPS
)



origins = [
    "http://localhost:3001",  # Local frontend
    "https://esigniva.devopstrio.co.uk",  # Production custom domain
    "https://esigniva.com",  # Production custom domain (esigniva.com)
    "https://www.esigniva.com",  # Production custom domain (www.esigniva.com)
    "https://esigniva-a9ecdcb9h2h8dwe7.southindia-01.azurewebsites.net",  # New Azure Web App
    "https://signapp-dtg2a4a8dca0evb8.southindia-01.azurewebsites.net",  # QA Azure Web App
    "https://safesign.devopstrio.co.uk"
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Include all routers
app.include_router(logo.router)
app.include_router(banner.router)
app.include_router(complaint.router)
app.include_router(contact.router)

app.include_router(auth.router)
app.include_router(subscription.router)
app.include_router(credits.router)
app.include_router(admin_control.router)
app.include_router(admin_template.router)
app.include_router(templates.router)
app.include_router(summary.router)
app.include_router(envelope_management.router)


app.include_router(documents.router)
app.include_router(box.router)
app.include_router(google_drive.router)
app.include_router(dropbox.router)
app.include_router(onedrive.router)

# app.include_router(aidoc.router)
# app.include_router(template_generator.router)

app.include_router(ai_template_builder.router)
app.include_router(ai_template_builder.workflow_router)
app.include_router(recipients.router)
app.include_router(email_service.router)
app.include_router(audit.router)
app.include_router(signature.router)

app.include_router(recipient_signing.router)
app.include_router(recipient_logs.router)
app.include_router(fields.router)
app.include_router(contacts.router)

app.include_router(recipient_history.router)
app.include_router(recipient_documents.router)
app.include_router(recipient_otp.router)


@app.get("/")
def home():
    return {"message": "SignApp Backend Running 🚀"}

# Reload trigger
port = int(os.environ.get("PORT", 8000))