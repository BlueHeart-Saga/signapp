from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.sessions import SessionMiddleware
import os
from fastapi.middleware.cors import CORSMiddleware
from routes import email_service, recipient_documents, recipient_history, recipient_otp, subscription, envelope_management
from routes import logo, banner, complaint, auth, documents, templates, box, google_drive, dropbox, onedrive, recipients, audit, signature, recipient_signing, recipient_logs, ai_template_builder, fields, contacts, admin_control, admin_template, summary
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
            # Atomic lock check/set using MongoDB
            # We use a lock that expires every 50 minutes (slightly less than the 1h sleep)
            lock_name = "automated_tasks_lock"
            now = datetime.utcnow()
            
            # Find the lock or create it
            lock = db.locks.find_one({"name": lock_name})
            
            should_run = False
            if not lock:
                # Create lock
                try:
                    db.locks.insert_one({
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
                    result = db.locks.update_one(
                        {"name": lock_name, "last_run": last_run}, # Atomic check
                        {"$set": {"last_run": now, "locked_by": os.getpid()}}
                    )
                    if result.modified_count > 0:
                        should_run = True

            if should_run:
                print(f"🕒 [AUTO-TASKS] Lock acquired by PID {os.getpid()}. Starting tasks...")
                
                print("🕒 [AUTO-TASKS] Running expiration check...")
                await expire_documents()
                
                print("🕒 [AUTO-TASKS] Running reminder scanner...")
                await send_reminders()
                
                print("🕒 [AUTO-TASKS] Tasks finished. Lock maintained.")
            else:
                # print(f"🕒 [AUTO-TASKS] Worker {os.getpid()} skipped (lock held by another worker).")
                pass
                
        except Exception as e:
            print(f"❌ [AUTO-TASKS] Error in background loop: {e}")
            
        # Check every 5 minutes if we can acquire the lock
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 eSign App Backend Starting...")
    
    # Ensure distributed lock collection has unique index
    try:
        db.locks.create_index("name", unique=True)
    except:
        pass
    
    # Start the background task loop
    task = asyncio.create_task(run_automated_tasks())
    
    yield
    
    # Shutdown
    print("eSign App Backend Shutting Down...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="SignApp API",
    lifespan=lifespan
)

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
    "https://safesign.devopstrio.co.uk",  # Production frontend
    "https://signapp-dtg2a4a8dca0evb8.southindia-01.azurewebsites.net",  # Azure frontend,
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

app.include_router(auth.router)
app.include_router(subscription.router)
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

port = int(os.environ.get("PORT", 8000))