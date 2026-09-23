import pytest

def test_credit_costs_endpoint(auth_client):
    """Test getting credit cost schedule and top up packs"""
    res = auth_client.get("/credits/costs")
    assert res.status_code == 200
    data = res.json()
    assert "costs" in data
    assert "packs" in data
    assert data["costs"]["document_upload"] == 1
    assert data["costs"]["document_send"] == 5

def test_credit_balance_endpoint(auth_client):
    """Test getting credit balance summary"""
    res = auth_client.get("/credits/balance")
    assert res.status_code == 200
    data = res.json()
    assert "balance" in data
    assert "limit" in data

def test_credit_check_endpoint(auth_client):
    """Test credit pre-flight check"""
    payload = {
        "action": "document_upload",
        "quantity": 1
    }
    res = auth_client.post("/credits/check", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "has_credits" in data
    assert "required_credits" in data

def test_credit_transactions_endpoint(auth_client):
    """Test fetching credit transaction history"""
    res = auth_client.get("/credits/transactions")
    assert res.status_code == 200
    data = res.json()
    assert "transactions" in data
    assert "total" in data
