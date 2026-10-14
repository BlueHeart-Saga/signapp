import pytest
import os
import sys
from datetime import datetime
from bson import ObjectId
import httpx

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app
from database import db
from routes.auth import create_access_token

pytestmark = pytest.mark.asyncio(loop_scope="session")

@pytest.fixture(scope="session")
async def async_client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="session")
async def auth_tokens():
    """Create three test users: Owner, Stranger, and Admin with genuine signed JWT tokens"""
    import random
    import string

    def rand_str():
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

    # User 1: Owner
    owner_email = f"owner_{rand_str()}@test.com"
    owner_res = await db.users.insert_one({
        "email": owner_email,
        "full_name": "Test Owner",
        "role": "user",
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    owner_id = str(owner_res.inserted_id)
    owner_token, _ = create_access_token(data={"sub": owner_email, "id": owner_id, "email": owner_email, "role": "user"})

    # User 2: Stranger (Unrelated User)
    stranger_email = f"stranger_{rand_str()}@test.com"
    stranger_res = await db.users.insert_one({
        "email": stranger_email,
        "full_name": "Test Stranger",
        "role": "user",
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    stranger_id = str(stranger_res.inserted_id)
    stranger_token, _ = create_access_token(data={"sub": stranger_email, "id": stranger_id, "email": stranger_email, "role": "user"})

    # User 3: Admin
    admin_email = f"admin_{rand_str()}@test.com"
    admin_res = await db.users.insert_one({
        "email": admin_email,
        "full_name": "Test Admin",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.utcnow()
    })
    admin_id = str(admin_res.inserted_id)
    admin_token, _ = create_access_token(data={"sub": admin_email, "id": admin_id, "email": admin_email, "role": "admin"})

    yield {
        "owner_token": owner_token,
        "owner_id": owner_id,
        "owner_email": owner_email,
        "stranger_token": stranger_token,
        "stranger_email": stranger_email,
        "admin_token": admin_token,
    }

    # Teardown
    await db.users.delete_many({"email": {"$in": [owner_email, stranger_email, admin_email]}})


# ============================================================================
# BATCH 1 TESTS: BUG-002, BUG-003, BUG-004 (Feedback Endpoint)
# ============================================================================

async def test_feedback_submission_success(async_client):
    """BUG-002: Test successful feedback submission"""
    payload = {
        "message": "Esigniva platform is fast and responsive!",
        "email": "user.feedback@example.com",
        "type": "general",
        "page_url": "/dashboard"
    }
    response = await async_client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "id" in data

    # Verify persistence in MongoDB
    sub_id = ObjectId(data["id"])
    saved = await db.contact_submissions.find_one({"_id": sub_id})
    assert saved is not None
    assert saved["email"] == "user.feedback@example.com"
    assert saved["message"] == payload["message"]
    assert saved["status"] == "new"

    # Cleanup
    await db.contact_submissions.delete_one({"_id": sub_id})


async def test_feedback_ask_and_suggest_tabs(async_client):
    """BUG-003 & BUG-004: Test 'ask' and 'suggest' categories"""
    # Tab 1: Ask (help)
    res_ask = await async_client.post("/api/feedback", json={
        "message": "How do I invite multiple signers?",
        "email": "inquiry@example.com",
        "type": "ask",
        "page_url": "/helpcenter"
    })
    assert res_ask.status_code == 200
    assert res_ask.json()["success"] is True

    # Tab 2: Suggest (feature)
    res_suggest = await async_client.post("/api/feedback", json={
        "message": "Please add support for biometric signature verification.",
        "email": "feature.request@example.com",
        "type": "suggest",
        "page_url": "/features"
    })
    assert res_suggest.status_code == 200
    assert res_suggest.json()["success"] is True

    # Cleanup
    await db.contact_submissions.delete_one({"_id": ObjectId(res_ask.json()["id"])})
    await db.contact_submissions.delete_one({"_id": ObjectId(res_suggest.json()["id"])})


async def test_feedback_validation_errors(async_client):
    """Validation test: empty message, short message, invalid email format"""
    # 1. Empty message
    res_empty = await async_client.post("/api/feedback", json={"message": "   "})
    assert res_empty.status_code == 400
    assert "between 3 and 5000 characters" in res_empty.json()["detail"]

    # 2. Too short (< 3 chars)
    res_short = await async_client.post("/api/feedback", json={"message": "hi"})
    assert res_short.status_code == 400

    # 3. Invalid email format
    res_bad_email = await async_client.post("/api/feedback", json={
        "message": "Valid feedback message",
        "email": "not-an-email"
    })
    assert res_bad_email.status_code == 400
    assert "valid email" in res_bad_email.json()["detail"]


async def test_feedback_abuse_rate_limit(async_client):
    """Abuse protection: test that exceeding rate limit returns 429 Too Many Requests"""
    test_ip = "198.51.100.42"
    inserted_ids = []
    for i in range(10):
        res = await db.contact_submissions.insert_one({
            "name": "Spammer",
            "email": "spam@example.com",
            "message": f"Spam message {i}",
            "type": "feedback",
            "ip_address": test_ip,
            "created_at": datetime.utcnow()
        })
        inserted_ids.append(res.inserted_id)

    try:
        # 11th request from same IP should get 429
        res_limit = await async_client.post(
            "/api/feedback",
            json={
                "message": "Eleventh message exceeding quota",
                "email": "spam@example.com"
            },
            headers={"X-Forwarded-For": test_ip}
        )
        assert res_limit.status_code == 429
        assert "Too many feedback submissions" in res_limit.json()["detail"]
    finally:
        # Cleanup
        await db.contact_submissions.delete_many({"_id": {"$in": inserted_ids}})


async def test_rate_limiter_spoofing_prevented():
    """Verify that get_client_ip rejects spoofed proxy headers from untrusted direct connections"""
    from routes.contact import get_client_ip
    from unittest.mock import MagicMock

    # 1. Direct untrusted public client attempts to spoof X-Forwarded-For
    req_untrusted = MagicMock()
    req_untrusted.client.host = "8.8.8.8"  # Public routable untrusted client IP
    req_untrusted.headers = {"x-forwarded-for": "198.51.100.1", "x-client-ip": "198.51.100.2"}
    # Must reject spoofed headers and return actual peer IP
    assert get_client_ip(req_untrusted) == "8.8.8.8"

    # 2. Approved trusted proxy (e.g. Azure gateway / loopback / private IP)
    req_trusted = MagicMock()
    req_trusted.client.host = "127.0.0.1"  # Approved trusted proxy (loopback)
    req_trusted.headers = {"x-forwarded-for": "198.51.100.42, 10.0.0.1"}
    # Must trust proxy header
    assert get_client_ip(req_trusted) == "198.51.100.42"


async def test_feedback_admin_compatibility(async_client, auth_tokens):
    """Verify submitted feedback is compatible with admin portal listing"""
    payload = {
        "message": "Admin compatibility verification message",
        "email": "admin.test@example.com",
        "type": "general",
        "page_url": "/pricing"
    }
    submit_res = await async_client.post("/api/feedback", json=payload)
    assert submit_res.status_code == 200
    item_id = submit_res.json()["id"]

    # Retrieve via admin endpoint
    admin_headers = {"Authorization": f"Bearer {auth_tokens['admin_token']}"}
    admin_res = await async_client.get("/e-sign/contact/admin", headers=admin_headers)
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    items = admin_data.get("items", [])
    matched = any(i["id"] == item_id for i in items)
    assert matched is True

    # Cleanup
    await db.contact_submissions.delete_one({"_id": ObjectId(item_id)})


# ============================================================================
# BATCH 1 TESTS: BUG-038 (Document Timeline & Permissions)
# ============================================================================

async def test_timeline_invalid_id_format(async_client, auth_tokens):
    """BUG-038: 400 on malformed document ID"""
    headers = {"Authorization": f"Bearer {auth_tokens['owner_token']}"}
    res = await async_client.get("/documents/invalid_hex_123/timeline", headers=headers)
    assert res.status_code == 400
    assert "Invalid document ID format" in res.json()["detail"]


async def test_timeline_nonexistent_document(async_client, auth_tokens):
    """BUG-038: 404 when document does not exist"""
    headers = {"Authorization": f"Bearer {auth_tokens['owner_token']}"}
    fake_id = str(ObjectId())
    res = await async_client.get(f"/documents/{fake_id}/timeline", headers=headers)
    assert res.status_code == 404
    assert "Document not found" in res.json()["detail"]


async def test_timeline_permission_boundary_denied(async_client, auth_tokens):
    """BUG-038: 403 Access Denied when unauthorized user accesses timeline"""
    # Create document owned by Owner
    doc_res = await db.documents.insert_one({
        "title": "Confidential NDA",
        "owner_id": ObjectId(auth_tokens["owner_id"]),
        "status": "draft",
        "created_at": datetime.utcnow()
    })
    doc_id = str(doc_res.inserted_id)

    try:
        # Stranger attempts access -> Expect 403 Forbidden
        stranger_headers = {"Authorization": f"Bearer {auth_tokens['stranger_token']}"}
        res = await async_client.get(f"/documents/{doc_id}/timeline", headers=stranger_headers)
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]
    finally:
        await db.documents.delete_one({"_id": ObjectId(doc_id)})


async def test_timeline_async_cursor_success_with_events(async_client, auth_tokens):
    """
    BUG-038: Test that existing timeline events are properly retrieved by owner
    via async cursor (reproducing & proving resolution of the empty results bug).
    """
    # 1. Create test document
    doc_res = await db.documents.insert_one({
        "title": "Partnership Agreement",
        "owner_id": ObjectId(auth_tokens["owner_id"]),
        "status": "in_progress",
        "created_at": datetime.utcnow()
    })
    doc_id = str(doc_res.inserted_id)
    doc_oid = ObjectId(doc_id)

    # 2. Insert mock timeline records into document_timeline
    t1 = datetime(2026, 1, 10, 10, 0, 0)
    t2 = datetime(2026, 1, 10, 11, 30, 0)
    await db.document_timeline.insert_many([
        {
            "document_id": doc_oid,
            "type": "upload_document",
            "title": "Document Uploaded",
            "description": "Document was uploaded",
            "timestamp": t1,
            "metadata": {"filename": "Partnership Agreement.pdf"}
        },
        {
            "document_id": doc_oid,
            "type": "recipients_added",
            "title": "Recipients Added",
            "description": "Added 2 recipients",
            "timestamp": t2,
            "metadata": {"count": 2}
        }
    ])

    # 3. Insert mock audit log into audit_logs
    t3 = datetime(2026, 1, 10, 12, 15, 0)
    await db.audit_logs.insert_one({
        "document_id": doc_oid,
        "action": "view_document",
        "timestamp": t3,
        "details": {"actor_name": "Signer A", "actor_email": "signer@example.com"},
        "ip_address": "192.168.1.100"
    })

    try:
        # Request timeline as Owner
        headers = {"Authorization": f"Bearer {auth_tokens['owner_token']}"}
        res = await async_client.get(f"/documents/{doc_id}/timeline", headers=headers)
        assert res.status_code == 200
        events = res.json()

        # Verify events are NOT empty (proves BUG-038 fix!)
        assert len(events) == 3
        # Chronological order verified
        assert events[0]["action"] == "upload_document"
        assert events[1]["action"] == "recipients_added"
        assert events[2]["action"] == "view_document"
        # User & metadata verified
        assert "timestamp" in events[0]
        assert events[0]["title"] == "Document Uploaded"
    finally:
        await db.documents.delete_one({"_id": doc_oid})
        await db.document_timeline.delete_many({"document_id": doc_oid})
        await db.audit_logs.delete_many({"document_id": doc_oid})


async def test_timeline_empty_events_returns_empty_list(async_client, auth_tokens):
    """BUG-038: Document with no events returns 200 with [] (not an error)"""
    doc_res = await db.documents.insert_one({
        "title": "Blank Document",
        "owner_id": ObjectId(auth_tokens["owner_id"]),
        "status": "draft",
        "created_at": datetime.utcnow()
    })
    doc_id = str(doc_res.inserted_id)

    try:
        headers = {"Authorization": f"Bearer {auth_tokens['owner_token']}"}
        res = await async_client.get(f"/documents/{doc_id}/timeline", headers=headers)
        assert res.status_code == 200
        assert res.json() == []
    finally:
        await db.documents.delete_one({"_id": ObjectId(doc_id)})


async def test_timeline_recipient_and_admin_authorized(async_client, auth_tokens):
    """BUG-038: Recipient and Admin are authorized to access the timeline"""
    doc_res = await db.documents.insert_one({
        "title": "Multi-party Contract",
        "owner_id": ObjectId(auth_tokens["owner_id"]),
        "status": "in_progress",
        "recipients": [{"email": auth_tokens["stranger_email"], "name": "Stranger As Recipient"}],
        "created_at": datetime.utcnow()
    })
    doc_id = str(doc_res.inserted_id)

    try:
        # 1. As recipient (Stranger is in recipients list)
        recipient_headers = {"Authorization": f"Bearer {auth_tokens['stranger_token']}"}
        recip_res = await async_client.get(f"/documents/{doc_id}/timeline", headers=recipient_headers)
        assert recip_res.status_code == 200

        # 2. As Admin
        admin_headers = {"Authorization": f"Bearer {auth_tokens['admin_token']}"}
        admin_res = await async_client.get(f"/documents/{doc_id}/timeline", headers=admin_headers)
        assert admin_res.status_code == 200
    finally:
        await db.documents.delete_one({"_id": ObjectId(doc_id)})
