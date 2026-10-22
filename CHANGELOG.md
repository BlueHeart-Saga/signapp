<div align="center">

**Esigniva Enterprise Documentation Suite**

[Overview](README.md) • [Security](SECURITY.md) • [Architecture](ARCHITECTURE.md) • [System Docs](SYSTEM_DOCUMENTATION.md) • [API Reference](API_DOCUMENTATION.md) • [Deployment](DEPLOYMENT.md) • [Testing](TESTING.md) • [User Guide](USER_GUIDE.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md) • [License](LICENSE.md)

</div>

---

# Esigniva Platform Changelog

<div align="center">

[![Changelog Standard](https://img.shields.io/badge/Changelog-Keep_a_Changelog_v1.0-086B70?style=for-the-badge)](CHANGELOG.md)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-0D9488?style=for-the-badge)](CHANGELOG.md)
[![Current Release](https://img.shields.io/badge/Release-v1.2.0-086B70?style=for-the-badge)](CHANGELOG.md)

</div>

---

> [!NOTE]
> All notable changes to the **Esigniva** platform are documented in this file adhering to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-22

### Added
- **Enterprise Invoicing Engine:** Integrated ReportLab vector PDF generator (`InvoiceService`) providing high-resolution, branded invoice PDFs with tax/GST breakdowns, line-item pricing, and atomic numbering (`ESI-YYYY-XXXXXX`).
- **Multi-File Envelope Merging:** Enhanced PyMuPDF pipeline allowing users to combine multiple DOCX, PDF, and image assets into a single unified signing envelope.
- **Search Visibility & Filename Truncation:** Added automated `sitemap.xml`, dynamic robots policies, and metadata tagging with `FilenameDisplay` component for safe filename truncation.
- **Distributed Lock Engine:** Added atomic MongoDB distributed lock (`automated_tasks_lock`) in `main.py` ensuring single-worker cron execution in clustered environments.
- **JobQueue Worker Pool:** Added in-process background worker pool for offloading asynchronous tasks and preventing thread pool saturation.

### Changed
- **Signing Flow Auto-Healing:** Added automatic state reconciliation for envelopes when signers complete or decline out-of-order.
- **Document List Pagination:** Implemented indexed server-side pagination across `documents` and `recipients` queries.
- **Signature Pad Rendering:** Optimized canvas rendering on high-DPI displays with transparent alpha smoothing.
- **Branding Initialization:** Automated backend startup hook ensuring platform branding metadata is synchronized across databases.

### Fixed
- Fixed coordinate drift during PDF rasterization on scaled browser viewports.
- Fixed OTP verification expiry edge case where clock drift caused premature expiration.
- Fixed responsive leftbar collapsing behavior on smaller laptop screens.

---

## [1.1.0] - 2026-09-15

### Added
- **AI Document & Template Builder:** Cohere and OpenAI integration for natural language prompt-to-envelope conversion.
- **Cloud Storage Integrations:** Native import support for Google Drive, Dropbox, Microsoft OneDrive, and Box.
- **Stripe Subscription Management:** Tiered plans, credit balances, and automated quota gating.
- **Email OTP Verification:** Optional 2-factor authentication challenge for recipient signing sessions.

### Security
- Added SHA-256 cryptographic hashing for signing tokens in MongoDB.
- Implemented Electronic Record and Signature Disclosure (ERSD) acceptance gating.

---

<details>
<summary><b>Click to View Initial Launch Release Notes (v1.0.0)</b></summary>

<br/>

## [1.0.0] - 2026-08-01

### Added
- Initial enterprise launch of the Esigniva Electronic Signature platform.
- FastAPI asynchronous backend with PyMongo/Motor connection pooling.
- React 19 visual document builder with React Konva drag-and-drop fields.
- Sequential and parallel recipient workflow topologies.
- Cryptographic Certificate of Completion generation with tamper-evident audit logs.
- Dockerfile and Azure Web App deployment pipelines via GitHub Actions.

</details>

---

<div align="center">

**Esigniva Technologies** • Enterprise Electronic Signature Platform  
[Repository](https://github.com/BlueHeart-Saga/signapp) • [Security Policy](SECURITY.md) • [Terms of Use](LICENSE.md) • [Contact Support](mailto:support@esigniva.com)

<sub>Copyright © 2026 Esigniva Technologies. All rights reserved.</sub>

</div>
