# SafeSign Project Notes & Technical Reference

## 📝 Developer Quick Reference

### Core Database Collections
| Collection Name | Description |
| :--- | :--- |
| `users` | User accounts, profiles, and organization metadata. |
| `documents` | Envelope-level metadata (status, owner, paths). |
| `recipients` | Individual signer status, OTPs, and field progress. |
| `document_files` | Maps original files to their merged envelope counterparts. |
| `document_timeline` | UI-facing event logs for document progress. |
| `audit_logs` | Deep system-level logs for legal compliance. |
| `document_templates` | Reusable document structures and field mappings. |

---

## 🏗️ Architectural Decisions

### 1. Document Merging Strategy
We use `fitz` (PyMuPDF) for merging. When a user uploads multiple files, they are converted to PDF and merged into a single "Live Document". This ensures a consistent signing experience regardless of the input format.

### 2. Coordinate System
The Document Builder uses a **Top-Left (0,0)** coordinate system. Coordinates are normalized to the page dimensions to ensure signatures appear correctly during PDF generation, regardless of the browser's zoom level.

### 3. Asynchronous Task Handling
All non-blocking tasks (Email notifications, PDF generation, AI analysis) are handled via **FastAPI BackgroundTasks** to keep the API responsive for the end-user.

---

## 🚀 Future Roadmap & Technical Debt

### Pending Enhancements
- [ ] **Webhooks:** Allow enterprise integration with external CRM systems (Salesforce, HubSpot).
- [ ] **Mobile App:** Native React Native wrappers for iOS and Android.
- [ ] **Blockchain Verification:** Optional hash anchoring on public ledgers for extreme immutability.

### Identified Technical Debt
- **Large PDF Processing:** Optimize memory footprint of `fitz` when handling documents over 100 pages.
- **Icon Dependency:** Consolidate Lucide, Material Icons, and FontAwesome into a unified SVG library to reduce bundle size.

---

## 📂 Environment & Config Hub

### Backend (.env requirements)
- `MONGODB_URI`: Connection string for the NoSQL database.
- `JWT_SECRET`: Security key for token signing.
- `COHERE_API_KEY` / `OPENAI_API_KEY`: For AI features.
- `STORAGE_CONNECTION_STRING`: For Azure Blob Storage access.

### Frontend (.env requirements)
- `REACT_APP_API_BASE_URL`: Pointer to the backend FastAPI instance.
- `REACT_APP_STRIPE_KEY`: For subscription management.

---

## 🤝 Team Workflow
- **Branching Strategy:** Use `feature/` branches for new modules and `fix/` for bug resolution.
- **Code Standards:** Adhere to PEP 8 for Python and ESLint/Prettier for React.
- **Docs Update:** Ensure `SYSTEM_DOCUMENTATION.md` is updated whenever a new route or module is added.
