"""
Credit costs and credit pack configurations for SignApp
"""

CREDIT_COSTS = {
    "document_upload": 1,
    "document_send": 5,
    "recipient_sign": 2,
    "template_use": 3,
    "ai_template": 20,
    "ai_processing": 10,
    "sms": 2,
    "email": 1
}

CREDIT_TOP_UP_PACKS = {
    "pack_500": {
        "id": "pack_500",
        "name": "500 Credits",
        "credits": 500,
        "price": 5.00,
        "description": "Standard Credit Pack",
        "badge": ""
    },
    "pack_2000": {
        "id": "pack_2000",
        "name": "2,000 Credits",
        "credits": 2000,
        "price": 15.00,
        "description": "Popular Choice - 25% Savings",
        "badge": "POPULAR"
    },
    "pack_10000": {
        "id": "pack_10000",
        "name": "10,000 Credits",
        "credits": 10000,
        "price": 50.00,
        "description": "Business Volume Pack - 50% Savings",
        "badge": "BEST VALUE"
    },
    "pack_50000": {
        "id": "pack_50000",
        "name": "50,000 Credits",
        "credits": 50000,
        "price": 200.00,
        "description": "Enterprise Scale Pack - Maximum Savings",
        "badge": "ENTERPRISE"
    }
}
