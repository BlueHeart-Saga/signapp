<div align="center">

**Esigniva Enterprise Documentation Suite**

[Overview](README.md) • [Security](SECURITY.md) • [Architecture](ARCHITECTURE.md) • [System Docs](SYSTEM_DOCUMENTATION.md) • [API Reference](API_DOCUMENTATION.md) • [Deployment](DEPLOYMENT.md) • [Testing](TESTING.md) • [User Guide](USER_GUIDE.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md) • [License](LICENSE.md)

</div>

---

# Esigniva REST API Specification

<div align="center">

[![FastAPI Engine](https://img.shields.io/badge/API-FastAPI_v0.110+-086B70?style=for-the-badge&logoColor=white)](API_DOCUMENTATION.md)
[![Auth](https://img.shields.io/badge/Authentication-Bearer_JWT-0D9488?style=for-the-badge&logoColor=white)](API_DOCUMENTATION.md)
[![Format](https://img.shields.io/badge/Payload_Format-JSON_%7C_Multipart-086B70?style=for-the-badge&logoColor=white)](API_DOCUMENTATION.md)
[![Profiling](https://img.shields.io/badge/Profiling-X--Request--ID_%7C_X--Process--Time-0D9488?style=for-the-badge&logoColor=white)](API_DOCUMENTATION.md)

</div>

---

> [!NOTE]
> Every API response returned by the backend includes performance profiling headers:
> - `X-Request-ID`: Trace UUID for correlating logs across distributed microservices.
> - `X-Process-Time-MS`: Server processing duration in milliseconds.

---

## 1. Environments & Base URLs

| Environment | Base URL | Interactive Docs (Swagger / ReDoc) | Access Level |
| :--- | :--- | :--- | :--- |
| **Local Development** | `http://localhost:8000` | `http://localhost:8000/docs` | Public / Local |
| **QA Staging** | `https://signapp-qa-*.azurewebsites.net` | `/docs` | Internal QA |
| **Production** | `https://esigniva.com/api` | Restricted / Gateway Managed | Commercial Production |

---

## 2. Global Headers & Authentication

### Required Request Headers
- `Content-Type: application/json` (or `multipart/form-data` for file uploads)
- `Authorization: Bearer <JWT_ACCESS_TOKEN>` (for authenticated endpoints)

---

## 3. Authentication Endpoints (`/auth`)

### 3.1 Register User
- **Method / Path:** `POST /auth/register`

<details>
<summary><b>View Registration Request and Response Payload</b></summary>

<br/>

**Request:**
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@enterprise.com",
  "password": "StrongPassword!2026",
  "company": "Mercer Holdings"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user_id": "664fa1e2b512c9e472a10123"
}
```

</details>

### 3.2 Login (JWT Token Issuance)
- **Method / Path:** `POST /auth/login`

<details>
<summary><b>View Login Request and Response Payload</b></summary>

<br/>

**Request:**
```json
{
  "email": "alex.mercer@enterprise.com",
  "password": "StrongPassword!2026"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "664fa1e2b512c9e472a10123",
    "email": "alex.mercer@enterprise.com",
    "name": "Alex Mercer",
    "role": "user"
  }
}
```

</details>

---

## 4. Document & Envelope Management (`/documents`)

### 4.1 Upload & Merge Envelope
- **Method / Path:** `POST /documents/upload`
- **Content-Type:** `multipart/form-data`

<details>
<summary><b>View Upload Parameters and Response</b></summary>

<br/>

**Form Data:**
- `file`: Binary file (`.pdf`, `.docx`, `.png`, `.jpg`). Word files are converted automatically via headless LibreOffice.
- `title`: String title for the envelope.

**Response (200 OK):**
```json
{
  "document_id": "664fa29ab512c9e472a10456",
  "title": "Master Services Agreement.pdf",
  "total_pages": 4,
  "status": "draft",
  "created_at": "2026-10-22T10:00:00Z"
}
```

</details>

### 4.2 Query User Envelopes
- **Method / Path:** `GET /documents?status=all&page=1&limit=20`

<details>
<summary><b>View List Documents Response Payload</b></summary>

<br/>

```json
{
  "items": [
    {
      "id": "664fa29ab512c9e472a10456",
      "title": "Master Services Agreement.pdf",
      "status": "in_progress",
      "recipients_count": 2,
      "completed_count": 1,
      "updated_at": "2026-10-22T10:15:30Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

</details>

---

## 5. Recipient Workflow Configuration (`/recipients`)

### 5.1 Configure Envelopes & Signing Order
- **Method / Path:** `POST /recipients/{document_id}`

<details>
<summary><b>View Recipient Configuration Payload</b></summary>

<br/>

```json
{
  "signing_topology": "sequential",
  "recipients": [
    {
      "name": "Jane Doe",
      "email": "jane.doe@client.com",
      "role": "signer",
      "signing_order": 1,
      "require_otp": true
    },
    {
      "name": "David Sterling",
      "email": "david.sterling@client.com",
      "role": "signer",
      "signing_order": 2,
      "require_otp": false
    }
  ]
}
```

</details>

---

## 6. Live Recipient Signing Flow (`/recipient-signing`)

### 6.1 Validate Signing Session
- **Method / Path:** `GET /recipient-signing/session/{signing_token}`

<details>
<summary><b>View Signing Session Payload</b></summary>

<br/>

```json
{
  "document_id": "664fa29ab512c9e472a10456",
  "document_title": "Master Services Agreement.pdf",
  "recipient": {
    "name": "Jane Doe",
    "email": "jane.doe@client.com",
    "role": "signer",
    "status": "pending"
  },
  "requires_otp": true,
  "ersd_accepted": false,
  "pages_count": 4,
  "fields": [
    {
      "id": "f_sig_01",
      "type": "signature",
      "page": 1,
      "x": 120.5,
      "y": 450.0,
      "width": 180,
      "height": 50,
      "required": true
    }
  ]
}
```

</details>

### 6.2 Submit Final Signatures
- **Method / Path:** `POST /recipient-signing/submit/{signing_token}`

<details>
<summary><b>View Final Signature Submission Payload</b></summary>

<br/>

```json
{
  "fields_data": [
    {
      "field_id": "f_sig_01",
      "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "signature_type": "drawn"
    },
    {
      "field_id": "f_date_02",
      "value": "2026-10-22"
    }
  ],
  "ersd_consent": true
}
```

**Response (200 OK):**
```json
{
  "message": "Signature recorded successfully",
  "envelope_status": "in_progress",
  "all_completed": false
}
```

</details>

---

## 7. Invoicing & Billing (`/subscription`, `/invoices`)

### 7.1 Download Vector Invoice PDF
- **Method / Path:** `GET /invoices/{invoice_number}/pdf`
- **Response:** Binary PDF stream (`Content-Type: application/pdf`) rendered via ReportLab Vector Engine.
- **Invoice Number Format:** `ESI-YYYY-XXXXXX` (e.g. `ESI-2026-000125`).

---

## 8. HTTP Status Codes & Error Formatting

All error responses adhere to a standardized RFC-compliant error schema:

```json
{
  "status_code": 403,
  "detail": "You do not have permission to modify this envelope.",
  "error_code": "FORBIDDEN_RESOURCE",
  "timestamp": "2026-10-22T10:45:00Z"
}
```

| HTTP Status | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| `200 OK` | Success | Query, update, or download succeeded |
| `201 Created` | Created | User registration or envelope initialization succeeded |
| `400 Bad Request` | Client Error | Malformed parameters or expired OTP code |
| `401 Unauthorized` | Auth Required | Missing or expired JWT token |
| `403 Forbidden` | Access Denied | Accessing an envelope belonging to another tenant |
| `404 Not Found` | Not Found | Envelope ID or signing token does not exist |
| `415 Unsupported Media` | Media Mismatch | Uploading non-supported files (only PDF, DOCX, images) |
| `429 Too Many Requests` | Rate Limited | Exceeded OTP or signing challenge attempts |

---

<div align="center">

**Esigniva Technologies** • Enterprise Electronic Signature Platform  
[Repository](https://github.com/BlueHeart-Saga/signapp) • [Security Policy](SECURITY.md) • [Terms of Use](LICENSE.md) • [Contact Support](mailto:support@esigniva.com)

<sub>Copyright © 2026 Esigniva Technologies. All rights reserved.</sub>

</div>
