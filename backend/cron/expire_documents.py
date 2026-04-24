import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to sys.path to allow importing from 'database' and 'routes'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db
from routes.email_service import send_expiration_email_to_owner, send_expiration_email_to_recipient

async def expire_documents():
    now = datetime.utcnow()

    expired_docs = list(db.documents.find({
        "expires_at": {"$lte": now},
        "status": {"$in": ["sent", "in_progress"]}
    }))

    for doc in expired_docs:
        doc_id = doc["_id"]

        # 1️⃣ Expire document
        db.documents.update_one(
            {"_id": doc_id},
            {"$set": {
                "status": "expired",
                "expired_at": now
            }}
        )

        # 2️⃣ Expire recipients who didn’t finish
        db.recipients.update_many(
            {
                "document_id": doc_id,
                "status": {"$nin": ["completed", "declined"]}
            },
            {"$set": {
                "status": "expired",
                "expired_at": now
            }}
        )
        
        # 3️⃣ Send Emails
        try:
            # Notify owner
            await send_expiration_email_to_owner(doc)
            
            # Notify recipients who were pending
            pending_recipients = db.recipients.find({
                "document_id": doc_id,
                "status": "expired"
            })
            for recipient in pending_recipients:
                await send_expiration_email_to_recipient(recipient, doc)
        except Exception as e:
            print(f"[CRON] Error sending expiration emails for {doc_id}: {e}")

        print(f"[CRON] Expired document {doc_id}")

if __name__ == "__main__":
    asyncio.run(expire_documents())
