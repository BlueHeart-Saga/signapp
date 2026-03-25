from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# Priority order:
# 1. MONGODB_URI  (Azure/Production)
# 2. MONGO_URL    (Local fallback)
# 3. localhost    (development default)
MONGO_URL = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URL")
    or "mongodb://localhost:27017"
)

DB_NAME = os.getenv("DB_NAME", "SignApp")

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=20000)

    # verify connection
    client.admin.command("ping")

    db = client[DB_NAME]
    print(f"✅ Connected to MongoDB database: {DB_NAME}")

except Exception as e:
    print("❌ MongoDB connection failed:", e)
    db = None


# === Collections (safe even if DB fails) ===
def get_collection(name):
    if db is None:
        return None
    return db[name]


templates_collection = get_collection("templates")
template_fields_collection = get_collection("template_fields")
ai_generation_logs_collection = get_collection("ai_generation_logs")
users_collection = get_collection("users")
template_versions_collection = get_collection("template_versions")
user_actions_collection = get_collection("user_actions")
documents_collection = get_collection("documents")
ai_logs_collection = get_collection("ai_logs")
document_versions_collection = get_collection("document_versions")
complaints_collection = get_collection("complaint")

if db.auth_logs is not None:
    collection_exists = "auth_logs" in db.list_collection_names()
if collection_exists:
    auth_logs_collection = get_collection("auth_logs")