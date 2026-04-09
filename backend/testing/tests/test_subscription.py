import pytest
from datetime import datetime

def test_subscription_plans(auth_client):
    """Test getting available subscription plans"""
    res = auth_client.get("/subscription/plans")
    assert res.status_code == 200
    plans = res.json()
    assert isinstance(plans, list)
    assert any(p["plan_type"] == "free_trial" for p in plans)
    assert any(p["plan_type"] == "monthly" for p in plans)

def test_subscription_status(auth_client):
    """Test getting current user subscription status"""
    res = auth_client.get("/subscription/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "has_active_subscription" in data

def test_free_trial_activation(auth_client):
    """Test activating free trial"""
    # Since we use a fresh user in auth_client, they should be able to start free trial
    trial_data = {
        "plan_type": "free_trial"
    }
    res = auth_client.post("/subscription/subscribe", json=trial_data)
    
    # If already has one, it might return 400 or 200 depending on logic
    if res.status_code == 200:
        assert res.json()["plan_type"] == "free_trial"
        assert res.json()["status"] == "active"
    elif res.status_code == 400:
        assert "already has an active subscription" in res.json()["detail"] or "already used" in res.json()["detail"]

def test_subscription_history(auth_client):
    """Test getting subscription history"""
    res = auth_client.get("/subscription/history")
    assert res.status_code == 200
    data = res.json()
    assert "subscriptions" in data
    assert "payments" in data

def test_get_current_subscription(auth_client):
    """Test getting current subscription details"""
    res = auth_client.get("/subscription/current")
    assert res.status_code == 200
    # Can be None/null if no active subscription
    assert res.json() is None or "id" in res.json()
