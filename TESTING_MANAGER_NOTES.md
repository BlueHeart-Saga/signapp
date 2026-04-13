# 🧪 SafeSign: Product Testing Manager Reference Notes

This document serves as the primary reference for the Quality Assurance and Testing Management team. It outlines critical verification paths, edge-case scenarios, and compliance checks required to maintain the enterprise integrity of SafeSign.

---

## 🔝 1. Critical Business Flows (Happy Paths)
*Verification of these flows is mandatory for every production release.*

### A. The End-to-End Signing Cycle
1.  **Ingestion:** Upload a multi-page PDF and a DOCX file. Verify they merge correctly.
2.  **Tagging:** Place one of each field type (Signature, Text, Date, Checkbox) on the canvas.
3.  **Orchestration:** Configure a 3-person signing order (Sequential). 
4.  **Execution:** Complete all signatures through the "Live Document" interface.
5.  **Certification:** Verify the generated **Certificate of Completion** contains all 3 signatures and correct IP logs.

### B. Enterprise Account Management
1.  **Billing:** Trigger a Stripe checkout and verify the user's `quota` updates in MongoDB.
2.  **Admin Controls:** Update the global logo and banner from the Admin Panel; verify they reflect across all user dashboards.

---

## ⚠️ 2. High-Priority Edge Cases (Failure Testing)
*These scenarios test the resilience of the system under stress or improper usage.*

| Scenario | Expected Behavior |
| :--- | :--- |
| **Simultaneous Signing** | When two users attempt to sign a "Parallel" document at the exact same millisecond, the system must lock the asset and process both without coordinate overlap. |
| **Invalid File Type** | Attempting to upload a `.exe` or `.zip` masquerading as a `.pdf`. System should block and return a 415 Unsupported Media Type. |
| **Expired OTP** | Signer attempts to verify after the 10-minute window. System must invalidate the code and offer a "Resend" option. |
| **Partial Completion** | A signer fills 4 out of 5 mandatory fields and attempts to finish. The system must scroll to the missing field and prevent submission. |
| **Document Voiding** | Owner voids a document while a signer is currently viewing it. Signer's view should gracefully transition to a "This document is no longer active" state. |

---

## 🛡️ 3. Security & Permission Matrix
*Validate that data is isolated between users and organizations.*

- **Cross-User Leakage:** Attempt to access a `document_id` belonging to User B using User A's JWT token. (Should return 404/403).
- **Guest Access:** Verify that "Viewers" can download the document but **cannot** drag or drop fields onto the canvas.
- **Admin Isolation:** Verify that an Admin can see system-wide logs but cannot view private document content unless they are an explicit recipient.

---

## ☁️ 4. Integration Health Checks

### Cloud Providers
- **Verification:** Import a file from Google Drive and Dropbox. Verify the `source` metadata is correctly recorded.
- **Token Expiry:** Test the flow when a cloud OAuth session expires mid-upload.

### Email Delivery (SMTP)
- **Check:** Ensure all system emails (Invitations, Reminders, Completion) have a valid `List-Unsubscribe` header and professional branding.
- **Spam Filtering:** Monitor bounce rates and ensure delivery to major providers (Gmail, Outlook, Yahoo).

---

## 🤖 5. AI Accuracy & Fallbacks
- **Field Detection:** Verify that "AI Auto-Tag" identifies at least 80% of signature lines in standard business contracts.
- **Content Generation:** Ensure the AI Document Generator does not produce "Hallucinations" (illegal characters or broken layouts).
- **Fallback:** If the AI service is offline, the "AI Options" in the UI should be gracefully disabled or hidden.

---

## 📊 6. Performance Benchmarks
- **Large Files:** Test the Document Builder with a 50MB+ PDF (approx. 500 pages). Verify smooth scrolling and field placement.
- **API Latency:** The standard `GET /documents` call should return in under 200ms for a user with 100+ documents.
- **Concurrent Users:** Simulate 50 simultaneous completion events to test MongoDB write-locking efficiency.

---

## 📋 7. Release Checklist for QA
- [ ] Pytest suite returns 100% pass (Backend).
- [ ] Playwright E2E tests pass for Chrome and Safari (Frontend).
- [ ] No console errors (404/500) during the "Document Builder" session.
- [ ] Mobile view: Signature pad is fully operational and responsive.
- [ ] Audit logs reflect accurate timestamps in UTC.

---
**Lead QA Contact:** [Insert Name]
**Latest Test Environment:** `https://testing.safesign.dev/`
