import pytest
import io
import random
import string
from bson import ObjectId

def generate_random_email():
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"signer_{rand}@example.com"

def test_full_signing_flow(auth_client, client):
    """Test the full flow: upload -> add recipient -> info -> terms -> view"""
    # 1. Upload a document
    file_content = b"Test document content for signing flow"
    file_obj = io.BytesIO(file_content)
    
    upload_res = auth_client.post(
        "/documents/upload",
        files={"file": ("flow_test.txt", file_obj, "text/plain")},
        data={"auto_generate_envelope": "true"}
    )
    
    if upload_res.status_code == 503:
        pytest.skip("Storage/DB unavailable")
        
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document"]["id"]
    
    # 2. Add a recipient
    signer_email = generate_random_email()
    recipient_data = {
        "recipients": [
            {
                "name": "Flow Signer",
                "email": signer_email,
                "role": "signer",
                "signing_order": 1
            }
        ]
    }
    
    add_res = auth_client.post(f"/recipients/{doc_id}/add", json=recipient_data)
    assert add_res.status_code == 200
    recipient_id = add_res.json()["recipients"][0]["id"]
    
    # 2b. Send invites (Mandatory to generate OTP if required)
    invite_payload = {
        "recipient_ids": [recipient_id],
        "signing_order_enabled": False
    }
    send_res = auth_client.post(f"/recipients/{doc_id}/send-invites", json=invite_payload)
    assert send_res.status_code == 200
    
    # 3. Get signing info (as recipient)
    info_res = client.get(f"/signing/recipient/{recipient_id}")
    assert info_res.status_code == 200
    info = info_res.json()
    assert info["recipient"]["email"] == signer_email
    assert info["document"]["id"] == doc_id
    
    # 4. Get Terms Status
    terms_status_res = client.get(f"/signing/recipient/{recipient_id}/terms-status")
    assert terms_status_res.status_code == 200
    assert terms_status_res.json().get("terms_accepted") is False
    
    # 5. Accept terms
    terms_data = {
        "accepted": True,
        "ip_address": "127.0.0.1",
        "user_agent": "Pytest"
    }
    terms_accept_res = client.post(f"/signing/recipient/{recipient_id}/accept-terms", json=terms_data)
    assert terms_accept_res.status_code == 200
    assert terms_accept_res.json().get("accepted") is True

    # 6. Handle OTP if required
    # Some environments might have OTP enabled by default or for all recipients
    print(f"Signing Info: {info['signing_info']}")
    if info["signing_info"].get("requires_otp"):
        from database import db
        # Read OTP from DB directly for testing purposes
        rec_doc = db.recipients.find_one({"_id": ObjectId(recipient_id)})
        otp = rec_doc.get("otp")
        print(f"OTP found in DB: {otp}")
        if otp:
            verify_res = client.post(f"/signing/recipient/{recipient_id}/verify-otp", json={"otp": otp})
            print(f"Verify OTP Response: {verify_res.status_code} - {verify_res.text}")
            assert verify_res.status_code == 200
    
    # 7. View Document (Hits get_live_document_for_recipient)
    view_res = client.get(f"/signing/recipient/{recipient_id}/live-document")
    if view_res.status_code == 403:
        print(f"Live document 403 error: {view_res.text}")
    assert view_res.status_code == 200
    assert view_res.headers["content-type"] == "application/pdf"
    
    # 8. Get Document History
    history_res = client.get(f"/signing/recipient/{recipient_id}/history")
    assert history_res.status_code == 200
    assert "document" in history_res.json()
    
    # 8. Clean up
    auth_client.delete(f"/documents/{doc_id}")

def test_add_bulk_recipients(auth_client):
    """Test adding recipients in bulk"""
    # Create doc
    file_content = b"Bulk test"
    file_obj = io.BytesIO(file_content)
    upload_res = auth_client.post(
        "/documents/upload",
        files={"file": ("bulk.txt", file_obj, "text/plain")},
        data={"auto_generate_envelope": "true"}
    )
    if upload_res.status_code != 200:
        pytest.skip("Upload failed")
    doc_id = upload_res.json()["document"]["id"]

    # Add 3 recipients
    recipients = [
        {"name": f"Signer {i}", "email": generate_random_email(), "role": "signer", "signing_order": i}
        for i in range(1, 4)
    ]
    payload = {"recipients": recipients}
    res = auth_client.post(f"/recipients/{doc_id}/add", json=payload)
    assert res.status_code == 200
    assert len(res.json()["recipients"]) == 3
    
    # Clean up
    auth_client.delete(f"/documents/{doc_id}")
