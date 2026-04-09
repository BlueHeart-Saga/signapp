import pytest
import io

def test_banner_lifecycle(admin_client):
    """Test full banner lifecycle (admin required for most)"""
    # 1. Upload a banner
    image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_obj = io.BytesIO(image_content)
    
    upload_data = {
        "title": "Test Banner",
        "subtitle": "Test Subtitle",
        "link": "https://example.com"
    }
    
    res = admin_client.post(
        "/banners/",
        data=upload_data,
        files={"file": ("banner.png", file_obj, "image/png")}
    )
    
    if res.status_code == 503:
        pytest.skip("Azure storage unavailable")
        
    assert res.status_code == 200
    banner_id = res.json()["id"]
    
    # 2. Get all banners (admin)
    all_res = admin_client.get("/banners/all")
    assert all_res.status_code == 200
    assert any(b["id"] == banner_id for b in all_res.json()["banners"])
    
    # 3. Get banner details
    get_res = admin_client.get(f"/banners/{banner_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Test Banner"
    
    # 4. Toggle status
    toggle_res = admin_client.post(f"/banners/{banner_id}/toggle")
    assert toggle_res.status_code == 200
    
    # 5. Get stats (admin)
    stats_res = admin_client.get("/banners/stats")
    assert stats_res.status_code == 200
    
    # 6. Delete banner
    del_res = admin_client.delete(f"/banners/{banner_id}")
    assert del_res.status_code == 200

def test_banner_unauthorized(auth_client):
    """Test that non-admin users cannot upload banners"""
    image_content = b"..."
    file_obj = io.BytesIO(image_content)
    
    res = auth_client.post(
        "/banners/",
        data={"title": "Hack"},
        files={"file": ("hack.png", file_obj, "image/png")}
    )
    # Should be 403 Forbidden or similar
    assert res.status_code in [403, 401]
