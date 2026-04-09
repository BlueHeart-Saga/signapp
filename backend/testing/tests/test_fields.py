import pytest
from bson import ObjectId

def test_fields_lifecycle(auth_client):
    """Test full signature fields lifecycle: add, get, update, delete"""
    import io
    
    # 1. Create a document first
    filename = "test_fields.txt"
    content = b"Document for fields test"
    file_obj = io.BytesIO(content)
    
    upload_res = auth_client.post("/documents/upload", files={"file": (filename, file_obj, "text/plain")})
    if upload_res.status_code != 200:
        pytest.skip("Upload failed")
    
    doc_id = upload_res.json()["document"]["id"]
    
    # 2. Add a recipient first (required for fields)
    recipients_data = {
        "recipients": [
            { "name": "Field Signer", "email": "field_signer@example.com", "role": "signer" }
        ]
    }
    add_rec_res = auth_client.post(f"/recipients/{doc_id}/add", json=recipients_data)
    rec_id = add_rec_res.json()["recipients"][0]["id"]
    
    # 3. Add fields
    fields_data = [
        {
            "recipient_id": rec_id,
            "type": "signature",
            "page": 0,
            "x": 100.0,
            "y": 150.0,
            "width": 150.0,
            "height": 50.0,
            "required": True
        },
        {
            "recipient_id": rec_id,
            "type": "textbox",
            "page": 0,
            "x": 300.0,
            "y": 150.0,
            "width": 200.0,
            "height": 40.0,
            "required": False,
            "label": "Full Name",
            "placeholder": "Enter your name"
        }
    ]
    
    add_fields_res = auth_client.post(f"/documents/{doc_id}/fields", json=fields_data)
    assert add_fields_res.status_code == 200
    added = add_fields_res.json().get("fields", [])
    assert len(added) == 2
    
    field_id = added[0]["id"]
    
    # 4. Get fields
    get_res = auth_client.get(f"/documents/fields?document_id={doc_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()) == 2
    
    # 5. Update field
    update_data = {
        "x": 110.0,
        "y": 160.0
    }
    update_res = auth_client.patch(f"/documents/fields/{field_id}", json=update_data)
    assert update_res.status_code == 200
    assert update_res.json()["field"]["x"] == 110.0
    
    # 6. Delete field
    del_res = auth_client.delete(f"/documents/fields/{field_id}")
    assert del_res.status_code == 200
    
    # Verify deletion
    get_after_del = auth_client.get(f"/documents/fields?document_id={doc_id}")
    assert len(get_after_del.json()) == 1

def test_field_validation_invalid_role(auth_client):
    """Test field-recipient role validation"""
    import io
    filename = "validate_test.txt"
    file_obj = io.BytesIO(b"Validation test content")
    upload_res = auth_client.post("/documents/upload", files={"file": (filename, file_obj, "text/plain")})
    doc_id = upload_res.json()["document"]["id"]
    
    # Add a viewer recipient (viewer cannot sign)
    recipients_data = {
        "recipients": [
            { "name": "Viewer", "email": "viewer@example.com", "role": "viewer" }
        ]
    }
    add_rec_res = auth_client.post(f"/recipients/{doc_id}/add", json=recipients_data)
    rec_id = add_rec_res.json()["recipients"][0]["id"]
    
    # Try adding a signature field for a viewer
    fields_data = [{
        "recipient_id": rec_id,
        "type": "signature",
        "page": 0,
        "x": 100, "y": 100, "width": 100, "height": 50
    }]
    
    res = auth_client.post(f"/documents/{doc_id}/fields", json=fields_data)
    # Should fail with 400 Bad Request because viewer cannot have signature field
    assert res.status_code == 400
    assert "cannot have 'signature' fields" in res.json()["detail"]
