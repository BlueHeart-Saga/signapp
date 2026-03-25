# from fastapi import APIRouter, HTTPException
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# from dotenv import load_dotenv
# import os
# import cohere

# # =====================================================
# # Setup
# # =====================================================

# load_dotenv()

# COHERE_API_KEY = os.getenv("COHERE_API_KEY")
# if not COHERE_API_KEY:
#     raise Exception("COHERE_API_KEY not found")

# client = cohere.ClientV2(api_key=COHERE_API_KEY)

# router = APIRouter(prefix="/ai", tags=["AI Documents"])

# # =====================================================
# # Request Models
# # =====================================================

# class GenerateDocumentRequest(BaseModel):
#     prompt: str
#     document_type: str
#     country: str = "India"
#     language: str = "English"

# class RewriteRequest(BaseModel):
#     text: str
#     action: str  # simplify | formal | legal

# class SaveAIDocumentRequest(BaseModel):
#     title: str
#     content_html: str

# # =====================================================
# # Prompt Builders (SINGLE SOURCE OF TRUTH)
# # =====================================================

# def build_document_prompt(data: GenerateDocumentRequest) -> str:
#     return f"""
# Create a professional {data.document_type} under the laws of {data.country}.
# Language: {data.language}

# STRICT RULES:
# - Output ONLY valid HTML
# - Use <h1>, <h2>, <p>, <ul>, <li>
# - Number clauses clearly
# - Use placeholders like [Party Name], [Date], [Amount]
# - Include termination, dispute resolution, jurisdiction
# - DO NOT explain anything

# User request:
# {data.prompt}
# """

# def build_rewrite_prompt(action: str, text: str) -> str:
#     return f"""
# Rewrite the following legal clause.

# Action: {action}

# Rules:
# - Return ONLY HTML <p>
# - Keep legal meaning intact

# Text:
# {text}
# """

# # =====================================================
# # Routes
# # =====================================================

# @router.post("/generate")
# async def generate_document(data: GenerateDocumentRequest):
#     try:
#         response = client.chat(
#             model="command-r-plus-08-2024",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a legal document drafting assistant."
#                 },
#                 {
#                     "role": "user",
#                     "content": build_document_prompt(data)
#                 }
#             ],
#             temperature=0.2,
#             max_tokens=1500
#         )

#         return {
#             "success": True,
#             "content_html": response.message.content[0].text.strip()
#         }

#     except Exception as e:
#         raise HTTPException(500, f"Cohere generate error: {str(e)}")

# =====================================================
# STREAMING GENERATION (FIXED)
# =====================================================

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import cohere

# =====================================================
# Setup
# =====================================================

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise Exception("COHERE_API_KEY not found")

client = cohere.ClientV2(api_key=COHERE_API_KEY)

router = APIRouter(prefix="/ai", tags=["AI Documents"])

# =====================================================
# Request Models
# =====================================================

class GenerateDocumentRequest(BaseModel):
    prompt: str
    document_type: str
    country: str = "India"
    language: str = "English"

class RewriteRequest(BaseModel):
    text: str
    action: str  # simplify | formal | legal

class SaveAIDocumentRequest(BaseModel):
    title: str
    content_html: str

# =====================================================
# Prompt Builders (SINGLE SOURCE OF TRUTH)
# =====================================================

def build_document_prompt(data: GenerateDocumentRequest) -> str:
    return f"""
Create a professional {data.document_type} under the laws of {data.country}.
Language: {data.language}

STRICT RULES:
- Output ONLY valid HTML
- Use <h1>, <h2>, <p>, <ul>, <li>
- Number clauses clearly
- Use placeholders like [Party Name], [Date], [Amount]
- Include termination, dispute resolution, jurisdiction
- DO NOT explain anything

User request:
{data.prompt}
"""

def build_rewrite_prompt(action: str, text: str) -> str:
    return f"""
Rewrite the following legal clause.

Action: {action}

Rules:
- Return ONLY HTML <p>
- Keep legal meaning intact

Text:
{text}
"""

# =====================================================
# Routes
# =====================================================

@router.post("/generate")
async def generate_document(data: GenerateDocumentRequest):
    try:
        response = client.chat(
            model="command-r-plus-08-2024",
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal document drafting assistant."
                },
                {
                    "role": "user",
                    "content": build_document_prompt(data)
                }
            ],
            temperature=0.2,
            max_tokens=1500
        )

        return {
            "success": True,
            "content_html": response.message.content[0].text.strip()
        }

    except Exception as e:
        raise HTTPException(500, f"Cohere generate error: {str(e)}")

# =====================================================
# STREAMING GENERATION (FIXED)
# =====================================================

@router.post("/generate-stream")
async def generate_stream(data: GenerateDocumentRequest):

    async def event_generator():
        total_chars = 0
        chunk_count = 0

        try:
            stream = client.chat_stream(
                model="command-r-plus-08-2024",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional legal document drafting assistant."
                    },
                    {
                        "role": "user",
                        "content": build_document_prompt(data)
                    }
                ],
                temperature=0.2,
                max_tokens=1500,
            )

            for event in stream:
                delta = getattr(event, "delta", None)
                if not delta:
                    continue

                content = getattr(delta, "content", None)
                if not content:
                    continue

                for block in content:
                    text = getattr(block, "text", None)
                    if text:
                        total_chars += len(text)
                        chunk_count += 1
                        yield text

        except Exception as e:
            print("❌ STREAM ERROR:", str(e))
            yield f"\n<!-- ERROR: {str(e)} -->"

        finally:
            print("=================================")
            print("📄 AI DOCUMENT STREAM RESULT")
            print(f"🧩 Chunks received : {chunk_count}")
            print(f"✍️ Characters total: {total_chars}")
            print(
                "✅ CONTENT GENERATED"
                if total_chars > 0
                else "⚠️ NO CONTENT GENERATED"
            )
            print("=================================")

    return StreamingResponse(
        event_generator(),
        media_type="text/html; charset=utf-8"
    )

@router.post("/generate-stream-temp")
async def generate_stream_temp(data: GenerateDocumentRequest):

    async def event_generator():
        # HTML shell start
        yield """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>AI Draft</title>
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; padding: 24px; }
  h1, h2 { color: #1f2937; }
  p, li { color: #374151; }
</style>
</head>
<body>
<!-- AI_STREAM_START -->
"""

        try:
            stream = client.chat_stream(
                model="command-r-plus-08-2024",
                messages=[
                    {"role": "system", "content": "You are a legal document drafting assistant."},
                    {"role": "user", "content": build_document_prompt(data)}
                ],
                temperature=0.2,
                max_tokens=1500,
            )

            for event in stream:
                delta = getattr(event, "delta", None)
                if not delta:
                    continue

                content = getattr(delta, "content", None)
                if not content:
                    continue

                for block in content:
                    text = getattr(block, "text", None)
                    if text:
                        yield text

        except Exception as e:
            yield f"<p style='color:red'>Error: {str(e)}</p>"

        finally:
            # HTML shell end
            yield """
<!-- AI_STREAM_END -->
</body>
</html>
"""

    return StreamingResponse(
        event_generator(),
        media_type="text/html; charset=utf-8"
    )


# =====================================================
# REWRITE
# =====================================================

@router.post("/rewrite")
async def rewrite_clause(data: RewriteRequest):
    try:
        response = client.chat(
            model="command-r",
            messages=[
                {
                    "role": "system",
                    "content": "You rewrite legal clauses."
                },
                {
                    "role": "user",
                    "content": build_rewrite_prompt(data.action, data.text)
                }
            ],
            temperature=0.3,
            max_tokens=400
        )

        return {
            "success": True,
            "content_html": response.message.content[0].text.strip()
        }

    except Exception as e:
        raise HTTPException(500, f"Cohere rewrite error: {str(e)}")

# =====================================================
# SAVE (MOCK → DB READY)
# =====================================================

@router.post("/save")
async def save_ai_document(data: SaveAIDocumentRequest):
    # TODO: Replace with real DB insert
    return {
        "success": True,
        "document": {
            "id": 123,
            "filename": f"{data.title}.pdf",
            "status": "draft",
            "source": "ai"
        }
    }



# =====================================================
# REWRITE
# =====================================================

@router.post("/rewrite")
async def rewrite_clause(data: RewriteRequest):
    try:
        response = client.chat(
            model="command-r",
            messages=[
                {
                    "role": "system",
                    "content": "You rewrite legal clauses."
                },
                {
                    "role": "user",
                    "content": build_rewrite_prompt(data.action, data.text)
                }
            ],
            temperature=0.3,
            max_tokens=400
        )

        return {
            "success": True,
            "content_html": response.message.content[0].text.strip()
        }

    except Exception as e:
        raise HTTPException(500, f"Cohere rewrite error: {str(e)}")

# =====================================================
# SAVE (MOCK → DB READY)
# =====================================================

@router.post("/save")
async def save_ai_document(data: SaveAIDocumentRequest):
    # TODO: Replace with real DB insert
    return {
        "success": True,
        "document": {
            "id": 123,
            "filename": f"{data.title}.pdf",
            "status": "draft",
            "source": "ai"
        }
    }
