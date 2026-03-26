from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.sessions import SessionMiddleware
import os
from fastapi.middleware.cors import CORSMiddleware
from routes import email_service, recipient_documents, recipient_history, recipient_otp, subscription
from routes import logo, banner, complaint, auth, documents, templates, box, google_drive, dropbox, onedrive, template_generator, recipients, audit, signature, recipient_signing, recipient_logs, ai_template_builder, fields, contacts, admin_control, admin_template, aidoc, summary
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 eSign App Backend Starting...")
    yield
    # Shutdown
    print("eSign App Backend Shutting Down...")

app = FastAPI(
    title="SignApp API",
    lifespan=lifespan
)

app.mount("/static", StaticFiles(directory="static"), name="static")

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


app.include_router(documents.router)
app.include_router(box.router)
app.include_router(google_drive.router)
app.include_router(dropbox.router)
app.include_router(onedrive.router)

app.include_router(aidoc.router)


app.include_router(template_generator.router)
app.include_router(ai_template_builder.router)
# app.include_router(AIDocumentBuilder.router)
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