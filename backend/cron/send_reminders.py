import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to sys.path to allow importing from 'database' and 'routes'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db
from routes.email_service import send_reminder_email

async def send_reminders():
    """
    Find documents needing automatic reminders.
    A document needs a reminder if:
    1. reminder_period > 0
    2. next_reminder_at <= now
    3. status is 'sent' or 'in_progress'
    """
    now = datetime.utcnow()

    reminder_docs = list(db.documents.find({
        "reminder_period": {"$gt": 0},
        "next_reminder_at": {"$lte": now},
        "status": {"$in": ["sent", "in_progress"]}
    }))

    for doc in reminder_docs:
        doc_id = doc["_id"]
        reminder_period = doc.get("reminder_period", 0)
        
        print(f"[CRON] Found document {doc_id} needing reminders.")

        # Find ALL recipients who haven't completed their action
        pending_recipients = list(db.recipients.find({
            "document_id": doc_id,
            "status": {"$nin": ["completed", "declined", "expired"]}
        }))

        for recipient in pending_recipients:
            try:
                print(f"       -> Sending reminder to {recipient['email']}")
                await send_reminder_email(recipient, doc, doc.get("owner_email", "SafeSign"))
            except Exception as e:
                print(f"       !! Error sending reminder to {recipient['email']}: {e}")

        # Update next_reminder_at
        next_reminder = now + timedelta(days=reminder_period)
        db.documents.update_one(
            {"_id": doc_id},
            {"$set": {"next_reminder_at": next_reminder}}
        )
        
        print(f"[CRON] Updated next_reminder_at for {doc_id} to {next_reminder}")

if __name__ == "__main__":
    print(f"[CRON] Starting reminder scanner at {datetime.now()}")
    asyncio.run(send_reminders())
    print("[CRON] Reminder scanner finished.")
