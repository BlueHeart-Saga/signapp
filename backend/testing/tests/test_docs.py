import pytest

def test_list_documents_authenticated(auth_client):
    """Test getting documents list for an authenticated user"""
    response = auth_client.get("/documents/")
    
    # Check if successful
    assert response.status_code == 200
    
    data = response.json()
    # It should be a list (even if empty)
    assert isinstance(data, list)

def test_get_document_status_not_found(auth_client):
    """Test getting status for a nonexistent document"""
    from bson import ObjectId
    fake_id = str(ObjectId())
    
    response = auth_client.get(f"/documents/{fake_id}/status")
    
    # Should be 404
    assert response.status_code == 404

def test_list_documents_unauthenticated(client):
    """Test that unauthenticated requests are rejected"""
    from fastapi.testclient import TestClient
    from main import app  # Fixed path based on conftest behavior
    
    with TestClient(app) as guest:
        response = guest.get("/documents/")
        assert response.status_code == 401

def test_document_upload_and_delete(auth_client):
    """Test full document upload and deletion flow"""
    import io
    
    # 1. Create a dummy file
    filename = "test_document.txt"
    content = b"This is some test document content."
    file_obj = io.BytesIO(content)
    
    # 2. Upload
    upload_response = auth_client.post(
        "/documents/upload",
        files={"file": (filename, file_obj, "text/plain")},
        data={"auto_generate_envelope": "true"}
    )
    
    # If DB is not available for storage locally
    if upload_response.status_code == 503:
        pytest.skip("Azure storage or DB unavailable - skipping upload test")
        
    assert upload_response.status_code == 200
    doc_id = upload_response.json()["document"]["id"]
    assert doc_id is not None
    
    # 3. Check status
    status_response = auth_client.get(f"/documents/{doc_id}/status")
    assert status_response.status_code == 200
    assert status_response.json().get("id") == doc_id
    
    # 4. Delete
    delete_response = auth_client.delete(f"/documents/{doc_id}")
    assert delete_response.status_code == 200
    assert "moved to trash" in delete_response.json().get("message", "").lower()
    
    # 5. Verify deleted (presents as "deleted" status for soft delete)
    verify_response = auth_client.get(f"/documents/{doc_id}/status")
    assert verify_response.status_code == 200
    assert verify_response.json().get("status") == "deleted"
