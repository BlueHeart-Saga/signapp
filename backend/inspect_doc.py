from database import db
from bson import ObjectId

doc_id = "69e34e573808d7182aef28ad"
doc = db.documents.find_one({"_id": ObjectId(doc_id)})

if doc:
    print(f"Document found: {doc.get('filename')}")
    print(f"Owner ID: {doc.get('owner_id')} (Type: {type(doc.get('owner_id'))})")
    print(f"Owner Email: {doc.get('owner_email')}")
    
    owner = db.users.find_one({"_id": doc.get("owner_id")})
    if owner:
         print(f"Owner Name: {owner.get('full_name')}")
         print(f"Owner Email from user doc: {owner.get('email')}")
    else:
         print("Owner user document NOT FOUND")
else:
    print(f"Document {doc_id} NOT FOUND in database")
