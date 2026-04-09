import pytest
import io

def test_summary_endpoints(auth_client):
    """Test various summary and reporting endpoints"""
    # 1. Create a document
    file_obj = io.BytesIO(b"Summary test content")
    upload_res = auth_client.post("/documents/upload", files={"file": ("summary_test.txt", file_obj, "text/plain")})
    doc_id = upload_res.json()["document"]["id"]
    
    # 2. Get JSON summary
    res = auth_client.get(f"/documents/{doc_id}/summary/json")
    assert res.status_code == 200
    assert "document" in res.json()
    assert "recipients" in res.json()
    
    # 3. Get minimal summary
    res = auth_client.get(f"/documents/{doc_id}/summary/minimal")
    assert res.status_code == 200
    assert "document" in res.json()
    
    # 4. Get HTML summary
    res = auth_client.get(f"/documents/{doc_id}/summary/html")
    assert res.status_code == 200
    assert "Audit Report" in res.text
    
    # 5. Export recipients CSV
    res = auth_client.get(f"/documents/{doc_id}/summary/recipients-csv")
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv"
    
    # 6. Export timeline CSV
    res = auth_client.get(f"/documents/{doc_id}/summary/timeline-csv")
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv"

def test_summary_not_authorized(client, auth_client):
    """Test that summary access is restricted"""
    # Create with user A
    file_obj = io.BytesIO(b"Secret summary")
    upload_res = auth_client.post("/documents/upload", files={"file": ("secret.txt", file_obj, "text/plain")})
    doc_id = upload_res.json()["document"]["id"]
    
    # Try access with unauthenticated client
    res = client.get(f"/documents/{doc_id}/summary/json")
    assert res.status_code == 401
