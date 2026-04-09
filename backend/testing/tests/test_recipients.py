import pytest
from bson import ObjectId

def test_get_recipient_roles(auth_client):
    """Test getting available recipient roles"""
    response = auth_client.get("/recipients/roles/all")
    assert response.status_code == 200
    roles = response.json()
    assert "signer" in roles
    assert "viewer" in roles
    assert "approver" in roles

def test_recipient_lifecycle(auth_client):
    """Test full lifecycle: add, get, edit, delete recipients"""
    import io
    
    # 1. Create a document first to add recipients to
    filename = "test_recipients.txt"
    content = b"Document for recipients test"
    file_obj = io.BytesIO(content)
    
    upload_res = auth_client.post(
        "/documents/upload",
        files={"file": (filename, file_obj, "text/plain")}
    )
    if upload_res.status_code != 200:
        pytest.skip(f"Upload failed: {upload_res.text}")
    
    doc_id = upload_res.json()["document"]["id"]
    
    # 2. Add recipients
    recipients_data = {
        "recipients": [
            {
                "name": "John Doe",
                "email": "john@example.com",
                "signing_order": 1,
                "role": "signer"
            },
            {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "signing_order": 2,
                "role": "approver"
            }
        ]
    }
    
    add_res = auth_client.post(f"/recipients/{doc_id}/add", json=recipients_data)
    assert add_res.status_code == 200
    added = add_res.json().get("recipients", [])
    assert len(added) == 2
    
    recipient_id = added[0]["id"]
    
    # 3. Get document recipients
    get_res = auth_client.get(f"/recipients/{doc_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()) == 2
    
    # 4. Edit recipient
    edit_data = {
        "name": "John Updated",
        "email": "john@example.com",
        "role": "signer",
        "signing_order": 1
    }
    edit_res = auth_client.put(f"/recipients/{recipient_id}", json=edit_data)
    assert edit_res.status_code == 200
    assert edit_res.json()["recipient"]["name"] == "John Updated"
    
    # 5. Delete recipient
    del_res = auth_client.delete(f"/recipients/{recipient_id}")
    assert del_res.status_code == 200
    
    # Verify deletion
    get_after_del = auth_client.get(f"/recipients/{doc_id}")
    assert len(get_after_del.json()) == 1

def test_bulk_template_recipients(auth_client):
    """Test adding recipients using template"""
    import io
    filename = "bulk_test.txt"
    file_obj = io.BytesIO(b"Bulk test content")
    upload_res = auth_client.post("/documents/upload", files={"file": (filename, file_obj, "text/plain")})
    doc_id = upload_res.json()["document"]["id"]
    
    template_data = {
        "name_template": "Test User {number}",
        "email_domain": "test-bulk.com",
        "count": 5,
        "role": "signer"
    }
    
    res = auth_client.post(f"/recipients/{doc_id}/add-bulk-template", json=template_data)
    assert res.status_code == 200
    assert len(res.json()["recipients"]) == 5
    assert res.json()["recipients"][0]["email"].endswith("@test-bulk.com")
