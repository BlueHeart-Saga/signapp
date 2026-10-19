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

pytestmark = pytest.mark.asyncio(loop_scope="session")

@pytest.fixture(scope="session")
async def async_client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ============================================================================
# BATCH 2 TESTS: BUG-009 (Contact Us Form Validation & Persistence)
# ============================================================================

async def test_contact_submission_success(async_client):
    """BUG-009: Test valid contact form submission and database persistence"""
    payload = {
        "name": "Evelyn Reed",
        "email": "evelyn.reed@example.com",
        "subject": "Enterprise E-Signature Consultation",
        "message": "Hello Esigniva team, we are interested in deploying your e-signature platform for 150 team members."
    }
    response = await async_client.post("/api/contact", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # Verify MongoDB persistence in contact_submissions
    saved = await db.contact_submissions.find_one({"email": "evelyn.reed@example.com"})
    assert saved is not None
    assert saved["name"] == "Evelyn Reed"
    assert saved["message"] == payload["message"]
    assert saved["type"] == "contact"
    assert saved["status"] == "new"

    # Cleanup
    await db.contact_submissions.delete_one({"_id": saved["_id"]})


async def test_contact_name_validation_boundaries(async_client):
    """BUG-009: Test name validation (too short, pure numbers, pure symbols, script tags)"""
    base_payload = {
        "email": "test.name@example.com",
        "subject": "Test Subject",
        "message": "Valid test message that contains more than 10 characters."
    }

    # 1. Empty / 1 character name (< 2 chars)
    res_short = await async_client.post("/api/contact", json={**base_payload, "name": "A"})
    assert res_short.status_code == 400
    assert "between 2 and 100 characters" in res_short.json()["detail"]

    # 2. Purely numeric name
    res_numeric = await async_client.post("/api/contact", json={**base_payload, "name": "12345678"})
    assert res_numeric.status_code == 400
    assert "alphabetical characters" in res_numeric.json()["detail"]

    # 3. Purely symbolic name
    res_symbols = await async_client.post("/api/contact", json={**base_payload, "name": "!@#$%^&*()"})
    assert res_symbols.status_code == 400
    assert "alphabetical characters" in res_symbols.json()["detail"]

    # 4. Script injection in name
    res_script = await async_client.post("/api/contact", json={**base_payload, "name": "<script>alert(1)</script>"})
    assert res_script.status_code == 400


async def test_contact_message_validation_boundaries(async_client):
    """BUG-009: Test message validation (< 10 chars, > 5000 chars)"""
    base_payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "subject": "Inquiry"
    }

    # 1. Message too short (< 10 characters)
    res_short = await async_client.post("/api/contact", json={**base_payload, "message": "Too short"})
    assert res_short.status_code == 400
    assert "between 10 and 5000 characters" in res_short.json()["detail"]

    # 2. Message too long (> 5000 characters)
    res_long = await async_client.post("/api/contact", json={**base_payload, "message": "X" * 5001})
    assert res_long.status_code == 400
    assert "between 10 and 5000 characters" in res_long.json()["detail"]


async def test_contact_email_validation(async_client):
    """BUG-009: Test invalid email rejection"""
    payload = {
        "name": "John Smith",
        "email": "not-an-email-address",
        "message": "This is a valid inquiry message."
    }
    response = await async_client.post("/api/contact", json=payload)
    # FastAPI/Pydantic returns 422 for invalid EmailStr schema
    assert response.status_code in [400, 422]


async def test_contact_rate_limiting(async_client):
    """BUG-009: Test contact form rate limiting (exceeding 10 per minute returns 429)"""
    test_ip = "198.51.100.99"
    inserted_ids = []
    for i in range(10):
        res = await db.contact_submissions.insert_one({
            "name": f"Spammer {i}",
            "email": f"spam{i}@example.com",
            "message": "Spam contact message with enough length",
            "type": "contact",
            "ip_address": test_ip,
            "created_at": datetime.utcnow()
        })
        inserted_ids.append(res.inserted_id)

    try:
        # 11th request from same IP should get 429
        res_limit = await async_client.post(
            "/api/contact",
            json={
                "name": "Spammer Eleven",
                "email": "eleven@example.com",
                "message": "Eleventh contact request exceeding quota."
            },
            headers={"X-Forwarded-For": test_ip}
        )
        assert res_limit.status_code == 429
        assert "Too many contact requests" in res_limit.json()["detail"]
    finally:
        await db.contact_submissions.delete_many({"_id": {"$in": inserted_ids}})


# ============================================================================
# BATCH 2 TESTS: BUG-013 (Blog Newsletter Subscription & Consent)
# ============================================================================

async def test_newsletter_subscribe_success(async_client):
    """BUG-013: Test newsletter subscription with valid email and consent"""
    sub_email = "subscriber.blog@example.com"
    payload = {
        "email": sub_email,
        "consent": True,
        "source": "blog"
    }
    response = await async_client.post("/api/newsletter/subscribe", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Thank you" in data["message"]

    # Verify MongoDB persistence in newsletter_subscribers
    saved = await db.newsletter_subscribers.find_one({"email": sub_email})
    assert saved is not None
    assert saved["consent"] is True
    assert saved["status"] == "active"
    assert saved["source"] == "blog"

    # Cleanup
    await db.newsletter_subscribers.delete_one({"_id": saved["_id"]})


async def test_newsletter_subscribe_duplicate_idempotent(async_client):
    """BUG-013: Test that re-subscribing is idempotent and returns friendly message"""
    dup_email = "duplicate.sub@example.com"
    payload = {
        "email": dup_email,
        "consent": True,
        "source": "blog"
    }

    # 1. First subscription
    res1 = await async_client.post("/api/newsletter/subscribe", json=payload)
    assert res1.status_code == 200

    # 2. Second subscription (same email)
    res2 = await async_client.post("/api/newsletter/subscribe", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2.get("already_subscribed") is True
    assert "already subscribed" in data2["message"]

    # Cleanup
    await db.newsletter_subscribers.delete_one({"email": dup_email})


async def test_newsletter_subscribe_consent_required(async_client):
    """BUG-013: Test that subscription requires explicit consent (GDPR compliance)"""
    payload = {
        "email": "noconsent@example.com",
        "consent": False,
        "source": "blog"
    }
    response = await async_client.post("/api/newsletter/subscribe", json=payload)
    assert response.status_code == 400
    assert "must consent" in response.json()["detail"]


async def test_newsletter_subscribe_invalid_email(async_client):
    """BUG-013: Test invalid email rejection for newsletter"""
    payload = {
        "email": "not-valid-email",
        "consent": True
    }
    response = await async_client.post("/api/newsletter/subscribe", json=payload)
    assert response.status_code in [400, 422]


async def test_newsletter_rate_limiting(async_client):
    """BUG-013: Test abuse protection on newsletter subscription"""
    test_ip = "198.51.100.88"
    inserted_ids = []
    for i in range(10):
        res = await db.newsletter_subscribers.insert_one({
            "email": f"news_bot_{i}@example.com",
            "source": "blog",
            "consent": True,
            "status": "active",
            "ip_address": test_ip,
            "created_at": datetime.utcnow()
        })
        inserted_ids.append(res.inserted_id)

    try:
        # 11th request from same IP should get 429
        res_limit = await async_client.post(
            "/api/newsletter/subscribe",
            json={
                "email": "news_eleven@example.com",
                "consent": True,
                "source": "blog"
            },
            headers={"X-Forwarded-For": test_ip}
        )
        assert res_limit.status_code == 429
        assert "Too many subscription attempts" in res_limit.json()["detail"]
    finally:
        await db.newsletter_subscribers.delete_many({"_id": {"$in": inserted_ids}})


# ============================================================================
# LOGIN SECURITY & PASSWORD RESET TESTS
# ============================================================================

async def test_login_incorrect_password_warning_and_lockout(async_client):
    """Test warning messages on multiple failed attempts and lockout after 5 attempts"""
    from routes.auth import pwd_ctx
    from datetime import timedelta

    test_email = "lockout_tester@example.com"
    correct_password = "CorrectPass123!"
    hashed = pwd_ctx.hash(correct_password)

    # Insert test user
    await db.users.delete_many({"email": test_email})
    await db.users.insert_one({
        "email": test_email,
        "password": hashed,
        "full_name": "Lockout Tester",
        "role": "user",
        "is_active": True,
        "failed_login_attempts": 0,
        "lockout_until": None,
        "created_at": datetime.utcnow()
    })

    try:
        # Attempts 1 and 2: Standard invalid credentials
        for i in range(1, 3):
            res = await async_client.post("/auth/login", data={
                "username": test_email,
                "password": "WrongPassword!"
            })
            assert res.status_code == 401
            assert res.json()["detail"]["code"] == "INVALID_CREDENTIALS"

        # Attempts 3 and 4: Warning message with remaining attempts
        res3 = await async_client.post("/auth/login", data={
            "username": test_email,
            "password": "WrongPassword!"
        })
        assert res3.status_code == 401
        assert "Warning" in res3.json()["detail"]["message"]
        assert res3.json()["detail"]["remaining_attempts"] == 2

        res4 = await async_client.post("/auth/login", data={
            "username": test_email,
            "password": "WrongPassword!"
        })
        assert res4.status_code == 401
        assert "Warning" in res4.json()["detail"]["message"]
        assert res4.json()["detail"]["remaining_attempts"] == 1

        # Attempt 5: Account should lock out immediately (HTTP 429)
        res5 = await async_client.post("/auth/login", data={
            "username": test_email,
            "password": "WrongPassword!"
        })
        assert res5.status_code == 429
        data5 = res5.json()["detail"]
        assert data5["code"] == "ACCOUNT_LOCKED_TEMPORARY"
        assert "temporarily locked" in data5["message"]
        assert data5["retry_after"] > 0

        # Attempt 6 while locked: Blocked even with correct password!
        res6 = await async_client.post("/auth/login", data={
            "username": test_email,
            "password": correct_password
        })
        assert res6.status_code == 429
        assert res6.json()["detail"]["code"] == "ACCOUNT_LOCKED_TEMPORARY"

    finally:
        await db.users.delete_many({"email": test_email})
        await db.login_attempts.delete_many({"email": test_email})


async def test_reset_password_rejects_current_password(async_client):
    """Test reset-password rejects if new password is identical to current password"""
    from routes.auth import pwd_ctx
    from datetime import timedelta

    test_email = "reset_check_tester@example.com"
    current_password = "SameOldPassword123!"
    hashed = pwd_ctx.hash(current_password)

    # Insert test user
    await db.users.delete_many({"email": test_email})
    await db.users.insert_one({
        "email": test_email,
        "password": hashed,
        "full_name": "Reset Tester",
        "role": "user",
        "is_active": True,
        "failed_login_attempts": 5,
        "lockout_until": datetime.utcnow() + timedelta(minutes=5),
        "created_at": datetime.utcnow()
    })

    # Insert verified OTP token
    test_otp = "852963"
    await db.password_reset_tokens.delete_many({"email": test_email})
    await db.password_reset_tokens.insert_one({
        "email": test_email,
        "otp": test_otp,
        "verified": True,
        "used": False,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "created_at": datetime.utcnow()
    })

    try:
        # 1. Attempt to reset using the EXACT SAME password
        res_same = await async_client.post("/auth/reset-password", json={
            "email": test_email,
            "otp": test_otp,
            "new_password": current_password
        })
        assert res_same.status_code == 400
        assert "must be different from your current password" in res_same.json()["detail"]

        # 2. Reset using a DIFFERENT password
        res_diff = await async_client.post("/auth/reset-password", json={
            "email": test_email,
            "otp": test_otp,
            "new_password": "BrandNewPassword789!"
        })
        assert res_diff.status_code == 200
        assert res_diff.json()["success"] is True

        # 3. Verify user lockout and failed attempts were cleared upon reset
        updated_user = await db.users.find_one({"email": test_email})
        assert updated_user["failed_login_attempts"] == 0
        assert updated_user["lockout_until"] is None

        # 4. Verify login with the new password works immediately
        login_res = await async_client.post("/auth/login", data={
            "username": test_email,
            "password": "BrandNewPassword789!"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

    finally:
        await db.users.delete_many({"email": test_email})
        await db.password_reset_tokens.delete_many({"email": test_email})

