from datetime import datetime
from database import db

def expire_documents():
    now = datetime.utcnow()

    expired_docs = db.documents.find({
        "expires_at": {"$lte": now},
        "status": {"$in": ["sent", "in_progress"]}
    })

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

        print(f"[CRON] Expired document {doc_id}")
