<div align="center">

**Esigniva Enterprise Documentation Suite**

[Overview](README.md) • [Security](SECURITY.md) • [Architecture](ARCHITECTURE.md) • [System Docs](SYSTEM_DOCUMENTATION.md) • [API Reference](API_DOCUMENTATION.md) • [Deployment](DEPLOYMENT.md) • [Testing](TESTING.md) • [User Guide](USER_GUIDE.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md) • [License](LICENSE.md)

</div>

---

# Quality Assurance & Testing Engineering Handbook

<div align="center">

[![Pytest Backend](https://img.shields.io/badge/Test_Framework-Pytest_AsyncIO-086B70?style=for-the-badge&logo=pytest&logoColor=white)](TESTING.md)
[![Playwright E2E](https://img.shields.io/badge/E2E_Testing-Playwright_Cross--Browser-0D9488?style=for-the-badge&logoColor=white)](TESTING.md)
[![Jest Testing](https://img.shields.io/badge/Frontend_Test-Jest_%7C_React_Testing_Lib-086B70?style=for-the-badge&logo=jest&logoColor=white)](TESTING.md)
[![Edge Cases](https://img.shields.io/badge/Quality_Gates-High_Concurrency_Resilience-0D9488?style=for-the-badge)](TESTING.md)

</div>

---

> [!NOTE]
> Esigniva enforces automated quality gates across every layer of the platform. Pull requests require green status on both backend Pytest suites and frontend Jest/Playwright suites before merge approval.

---

## 1. Test Execution Quickstart

### 1.1 Backend Test Automation (Pytest)
```bash
cd backend

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Execute all backend tests with verbose output
pytest -v

# Execute with statement coverage reporting
pytest --cov=. --cov-report=term-missing
```

### 1.2 Frontend Unit & Integration Tests (Jest)
```bash
cd frontend

# Run interactive test watcher
npm test

# Run CI test runner with coverage
CI=true npm test -- --coverage
```

### 1.3 End-to-End Browser Automation (Playwright)
```bash
cd frontend
npx playwright test
```

---

## 2. Critical Business Journeys (Happy Paths)

Verification of these core flows is mandatory prior to tagging production releases:

### Journey A: The End-to-End Signing Cycle
1. **Multi-File Ingestion:** Upload both a PDF and a DOCX file. Verify LibreOffice converts the DOCX and PyMuPDF merges them into a continuous multi-page envelope.
2. **Interactive Field Tagging:** Drag a Signature, Initial, Date, and Textbox field onto the canvas. Verify coordinate normalization in `signature_fields`.
3. **Sequential Recipient Routing:** Configure a 2-signer sequence (Signer 1 followed by Signer 2).
4. **Signer 1 Execution:** Open token URL, accept ERSD disclosure, fill mandatory fields, draw signature, and submit.
5. **Signer 2 Notification & Execution:** Verify automated email arrives only after Signer 1 completes. Signer 2 finishes signing.
6. **Certificate of Completion:** Verify the generated Certificate PDF contains both signatures, correct IP logs, UTC timestamps, and the SHA-256 document digest.

### Journey B: Enterprise Billing & Invoicing
1. **Subscription Checkout:** Trigger Stripe checkout session. Simulate successful payment webhook.
2. **Quota & Ledger Update:** Verify user `quota` increments in MongoDB `users` and a corresponding ledger entry appears in `credit_transactions`.
3. **Invoice Generation:** Verify an invoice is generated via `InvoiceService` with format `ESI-YYYY-XXXXXX` and can be downloaded as a valid ReportLab PDF.

---

## 3. High-Priority Edge Cases & Failure Resilience Matrix

<details>
<summary><b>Click to View High-Priority Edge Case and Resilience Matrix</b></summary>

<br/>

| Edge Case Scenario | Test Mechanism | Expected Behavior |
| :--- | :--- | :--- |
| **Simultaneous Parallel Signing** | Two test agents sign the same envelope at the exact same millisecond via `asyncio.gather`. | Backend applies atomic updates. Both signatures are burned into the PDF with zero coordinate drift or document corruption. |
| **MIME-Type Masquerading** | Rename an executable (`malware.exe`) to `contract.pdf` and attempt upload. | Backend magic-byte inspector rejects the file with `415 Unsupported Media Type`. |
| **Expired OTP Window** | Request an email OTP and attempt verification after 10 minutes. | Token rejected with `400 Bad Request`. System displays "OTP Expired" with a "Resend Code" option. |
| **Partial Field Submission** | Complete 3 of 4 mandatory fields and click "Finish Signing". | Submission blocked. Viewport smoothly scrolls to the missing field and highlights it in red. |
| **Real-time Document Voiding** | Owner voids an envelope while a recipient is actively drawing a signature. | Recipient submission is rejected with `409 Conflict`. UI transitions to "Envelope has been voided by the sender". |
| **Cross-Tenant Data Leakage** | Signer A replaces the `document_id` in an API call with an envelope belonging to Organization B. | Request rejected with `404 Not Found` or `403 Forbidden`. No metadata is leaked in response bodies. |
| **Large File Memory Pressure** | Upload a 150-page PDF containing vector graphics. | Processing completes within memory boundaries without worker OOM crash. |

</details>

---

## 4. Pre-Release QA Verification Checklist

- [ ] All Pytest unit and integration suites pass with 0 failures (`pytest`).
- [ ] No ESLint or build compilation warnings in React (`npm run build`).
- [ ] ReportLab invoice PDF generator produces valid PDF streams across all currency codes (USD, EUR, GBP, INR).
- [ ] Email notifications render correctly on major desktop and mobile mail clients (Gmail, Outlook, Apple Mail).
- [ ] Database migration check: Verify missing `updated_at` timestamps are backfilled gracefully by backend startup routines.

---

<div align="center">

**Esigniva Technologies** • Enterprise Electronic Signature Platform  
[Repository](https://github.com/BlueHeart-Saga/signapp) • [Security Policy](SECURITY.md) • [Terms of Use](LICENSE.md) • [Contact Support](mailto:support@esigniva.com)

<sub>Copyright © 2026 Esigniva Technologies. All rights reserved.</sub>

</div>
