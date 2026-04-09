
from bson import ObjectId
from database import db

doc_id = "69d744cb5bb0987b4946998d"
doc = db.documents.find_one({"_id": ObjectId(doc_id)})
if doc:
    print(f"Doc Owner ID: {doc.get('owner_id')}")
    print(f"Doc Owner ID Type: {type(doc.get('owner_id'))}")
    
    # Check if there are any users
    first_user = db.users.find_one()
    if first_user:
        print(f"First User ID: {first_user.get('_id')}")
        print(f"First User ID Type: {type(first_user.get('_id'))}")
else:
    print("Doc not found")
