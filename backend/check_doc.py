
import sys
from bson import ObjectId
from database import db

doc_id = "69d744cb5bb0987b4946998d"
try:
    doc = db.documents.find_one({"_id": ObjectId(doc_id)})
    if doc:
        print(f"Document found: {doc.get('filename')} (owner: {doc.get('owner_id')})")
    else:
        print("Document NOT found")
except Exception as e:
    print(f"Error: {e}")
