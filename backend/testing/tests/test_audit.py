import pytest
from datetime import datetime

def test_audit_lifecycle(auth_client):
    """Test getting and creating audit events"""
    # 1. Create a document to have something to audit
    import io
    file_obj = io.BytesIO(b"Audit test content")
    upload_res = auth_client.post("/documents/upload", files={"file": ("audit_test.txt", file_obj, "text/plain")})
    doc_id = upload_res.json()["document"]["id"]
    
    # 2. Create a custom audit event
    event_data = {
        "document_id": doc_id,
        "action": "TEST_ACTION",
        "details": {"reason": "Testing the audit system"},
        "ip_address": "127.0.0.1"
    }
    create_res = auth_client.post("/audit/log", json=event_data)
    assert create_res.status_code == 200
    assert "message" in create_res.json()
    
    # 3. Get audit for document
    # Note: Audit logging might be async, so we might need a small wait if it was real DB
    # but for tests we'll just check.
    get_res = auth_client.get(f"/audit/document/{doc_id}")
    assert get_res.status_code == 200
    events = get_res.json()
    # Check for document_uploaded or TEST_ACTION
    assert any(e["action"] in ["document_uploaded", "DOC_UPLOAD", "TEST_ACTION"] for e in events)
    
    # 4. Get my audit events
    my_res = auth_client.get("/audit/me")
    assert my_res.status_code == 200
    assert "events" in my_res.json()
    
    # 5. Get audit statistics
    stats_res = auth_client.get(f"/audit/statistics?document_id={doc_id}")
    assert stats_res.status_code == 200
    assert "total_events" in stats_res.json()

def test_audit_actions_list(auth_client):
    """Test list of available audit actions"""
    res = auth_client.get("/audit/actions")
    assert res.status_code == 200
    # Even if it's dynamic, it should be a dict or list
    assert isinstance(res.json(), (dict, list))
