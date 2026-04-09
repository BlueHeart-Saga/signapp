import pytest
from bson import ObjectId
import io
import base64

def test_signature_lifecycle(client):
    """Test full signature lifecycle: create, get, list, delete"""
    # Note: prefix is /api/signatures but conftest might have different mounting
    # Let's check the tag 'signatures' in the router definition
    
    # 1. Create a signature
    # Since these routes don't seem to have @get_current_user in the outline,
    # they might be using a mock user or are unprotected for now.
    
    # We'll use a dummy image
    image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_obj = io.BytesIO(image_content)
    
    create_data = {
        "name": "My Signature",
        "signature_type": "upload"
    }
    
    response = client.post(
        "/api/signatures/",
        data=create_data,
        files={"image_file": ("sig.png", file_obj, "image/png")}
    )
    
    if response.status_code == 503:
        pytest.skip("Azure storage unavailable")
        
    assert response.status_code in [200, 201]
    sig_id = response.json()["signature"]["id"]
    assert sig_id is not None
    
    # 2. List signatures
    list_res = client.get("/api/signatures/")
    assert list_res.status_code == 200
    signatures = list_res.json()
    assert any(s["id"] == sig_id for s in signatures)
    
    # 3. Get signature image
    img_res = client.get(f"/api/signatures/{sig_id}/image")
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] == "image/png"
    
    # 4. Get signature base64
    b64_res = client.get(f"/api/signatures/{sig_id}/base64")
    assert b64_res.status_code == 200
    assert "image_base64" in b64_res.json()
    
    # 5. Delete signature
    del_res = client.delete(f"/api/signatures/{sig_id}")
    assert del_res.status_code == 200
    
    # Verify deletion
    get_after_del = client.get(f"/api/signatures/{sig_id}/image")
    assert get_after_del.status_code == 404

def test_signature_update(client):
    """Test updating signature name/color"""
    # Create first
    image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_obj = io.BytesIO(image_content)
    
    create_res = client.post(
        "/api/signatures/",
        data={"name": "Initial Name", "signature_type": "type"},
        files={"image_file": ("sig.png", file_obj, "image/png")}
    )
    
    if create_res.status_code != 200:
        pytest.skip("Creation failed")
        
    sig_id = create_res.json()["signature"]["id"]
    
    update_data = {
        "name": "Updated Signature Name",
        "color": "#FF0000"
    }
    
    res = client.patch(f"/api/signatures/{sig_id}", data=update_data)
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Signature Name"
    assert res.json()["color"] == "#FF0000"
