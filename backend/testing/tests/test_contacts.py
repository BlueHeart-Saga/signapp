import pytest

def test_contacts_lifecycle(auth_client):
    """Test full contacts lifecycle: create, get, favorite, update, delete"""
    # 1. Create a contact
    contact_data = {
        "name": "Initial Contact",
        "email": "initial@contact.com",
        "favorite": False
    }
    create_res = auth_client.post("/contacts", json=contact_data)
    assert create_res.status_code == 200
    contact_id = create_res.json()["id"]
    assert create_res.json()["name"] == "Initial Contact"
    
    # 2. Get contacts
    get_res = auth_client.get("/contacts")
    assert get_res.status_code == 200
    contacts = get_res.json()
    assert any(c["id"] == contact_id for c in contacts)
    
    # 3. Toggle favorite
    fav_res = auth_client.patch(f"/contacts/{contact_id}/favorite")
    assert fav_res.status_code == 200
    assert fav_res.json()["favorite"] is True
    
    # 4. Search contacts
    search_res = auth_client.get(f"/contacts/search?q=Initial")
    assert search_res.status_code == 200
    assert len(search_res.json()) > 0
    assert search_res.json()[0]["id"] == contact_id
    
    # 5. Update contact
    update_data = {
        "name": "Updated Contact Name"
    }
    update_res = auth_client.put(f"/contacts/{contact_id}", json=update_data)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Contact Name"
    
    # 6. Delete contact
    del_res = auth_client.delete(f"/contacts/{contact_id}")
    assert del_res.status_code == 200
    
    # Verify deletion
    get_after_del = auth_client.get("/contacts")
    assert not any(c["id"] == contact_id for c in get_after_del.json())
