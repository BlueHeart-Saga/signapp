<div align="center">

**Esigniva Enterprise Documentation Suite**

[Overview](README.md) • [Security](SECURITY.md) • [Architecture](ARCHITECTURE.md) • [System Docs](SYSTEM_DOCUMENTATION.md) • [API Reference](API_DOCUMENTATION.md) • [Deployment](DEPLOYMENT.md) • [Testing](TESTING.md) • [User Guide](USER_GUIDE.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md) • [License](LICENSE.md)

</div>

---

# Esigniva Enterprise Systems Documentation

<div align="center">

[![FastAPI Core](https://img.shields.io/badge/System-FastAPI_Enterprise_Core-086B70?style=for-the-badge)](SYSTEM_DOCUMENTATION.md)
[![Storage](https://img.shields.io/badge/Storage-Azure_Blob_%7C_MongoDB-0D9488?style=for-the-badge)](SYSTEM_DOCUMENTATION.md)
[![Rendering](https://img.shields.io/badge/Renderers-LibreOffice_%7C_PyMuPDF-086B70?style=for-the-badge)](SYSTEM_DOCUMENTATION.md)
[![Invoicing](https://img.shields.io/badge/Invoicing-ReportLab_Vector-0D9488?style=for-the-badge)](SYSTEM_DOCUMENTATION.md)

</div>

---

> [!NOTE]
> For deep-dive architectural diagrams, coordinate translation formulas, and database indexing schemas, consult the dedicated [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. System Overview

**Esigniva** is a high-performance, enterprise-grade electronic signature platform designed for secure, legally binding document workflows. The system integrates advanced AI capabilities with robust file management and multi-cloud interoperability.

### Technical Core
- **Backend Architecture:** FastAPI (Python 3.11) with Asynchronous I/O and connection pooling.
- **Frontend Architecture:** React 19 with Material UI (MUI) Enterprise styling and React Konva.
- **Data Persistence:** MongoDB (NoSQL) for high-scale document metadata and audit logs.
- **File Intelligence:** Headless LibreOffice for multi-format conversion and PyMuPDF (`fitz`) for granular PDF manipulation and flattening.
- **Vector Document Engine:** ReportLab for enterprise invoice and receipt PDF generation.
- **AI Engine:** Cohere/OpenAI integration for semantic document analysis, summary extraction, and template automation.

---

## 2. Module Architecture

<details>
<summary><b>Click to View Backend Routes & Service Mapping Matrix</b></summary>

<br/>

| Module Name | File Location | Key Functions |
| :--- | :--- | :--- |
| Authentication & Identity | `routes/auth.py` | JWT token issuance, password hashing, OAuth callbacks |
| Document Management | `routes/documents.py` | Envelope CRUD, multi-file merging, voiding, trashed items |
| Recipient Engine | `routes/recipients.py` | Signing order sequencing, recipient role assignment |
| Recipient Signing | `routes/recipient_signing.py` | Live signing session, ERSD gating, signature adoption |
| Recipient OTP | `routes/recipient_otp.py` | 6-digit challenge code generation and verification |
| Field Coordinates | `routes/fields.py` | Normalized coordinate placement and validation |
| Invoicing Service | `services/invoice_service.py` | Atomic sequence generator, ReportLab vector PDF builder |
| Subscription & Billing | `routes/subscription.py` | Stripe checkout session creation, webhook reconciliation |
| Credits Subsystem | `routes/credits.py` | Signing credit balance checking and purchase tracking |
| Audit & Timeline | `routes/audit.py` | SHA-256 certificate generation, IP and user-agent logging |
| Admin Controls | `routes/admin_control.py` | Dynamic logos, banners, tenant settings, complaint triage |
| Cloud Integrations | `routes/{box,dropbox,google_drive,onedrive}.py` | Native cloud storage pickers and file import handlers |

</details>

---

## 3. Storage & Infrastructure

- **Azure Blob Storage:** Secure, redundant storage for original assets and finalized signed envelopes.
- **LibreOffice Engine:** Headless document converter executing within a Debian-slim container environment.
- **Email Delivery:** High-availability SMTP service with template-based notification routing.
- **Distributed Locking:** MongoDB-backed atomic distributed locks (`automated_tasks_lock`) for automated reminder and expiration cron tasks.

---

## 4. Security & Compliance

- **Data at Rest:** All sensitive metadata is stored in MongoDB with AES-256 encryption.
- **Data in Transit:** Secured via TLS 1.3 across all endpoints.
- **E-Sign Compliance:** Adheres to the statutory requirements of the U.S. ESIGN Act, UETA, and EU eIDAS regulations.

---

<div align="center">

**Esigniva Technologies** • Enterprise Electronic Signature Platform  
[Repository](https://github.com/BlueHeart-Saga/signapp) • [Security Policy](SECURITY.md) • [Terms of Use](LICENSE.md) • [Contact Support](mailto:support@esigniva.com)

<sub>Copyright © 2026 Esigniva Technologies. All rights reserved.</sub>

</div>
