import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# JWT Settings
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# Admin Secret
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "admin@123")

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "signapp")

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@esignapp.com")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:9000")