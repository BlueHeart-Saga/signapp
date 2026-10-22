<div align="center">

**Esigniva Enterprise Documentation Suite**

[Overview](README.md) • [Security](SECURITY.md) • [Architecture](ARCHITECTURE.md) • [System Docs](SYSTEM_DOCUMENTATION.md) • [API Reference](API_DOCUMENTATION.md) • [Deployment](DEPLOYMENT.md) • [Testing](TESTING.md) • [User Guide](USER_GUIDE.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md) • [License](LICENSE.md)

</div>

---

# Enterprise Deployment & Infrastructure Guide

<div align="center">

[![Docker Ready](https://img.shields.io/badge/Container-Docker_Linux_Container-086B70?style=for-the-badge&logoColor=white)](DEPLOYMENT.md)
[![Azure App Services](https://img.shields.io/badge/Cloud-Azure_App_Services-0D9488?style=for-the-badge&logoColor=white)](DEPLOYMENT.md)
[![CI/CD Pipelines](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_Automated-086B70?style=for-the-badge&logoColor=white)](DEPLOYMENT.md)
[![Database Infrastructure](https://img.shields.io/badge/Database-MongoDB_Atlas_Cluster-0D9488?style=for-the-badge&logoColor=white)](DEPLOYMENT.md)

</div>

---

> [!NOTE]
> Esigniva is deployed across decoupled Azure Web Apps. The backend runs as a Linux container with headless LibreOffice and PyMuPDF, while the frontend runs as an Express-backed Node 20 SPA.

---

## 1. Deployment Topology & Architecture

```mermaid
flowchart TD
    subgraph GitHub CI/CD Runners
        GH_Push[Git Push to 'main'] --> Filter{dorny/paths-filter}
        Filter -->|backend/**| BuildDocker[Docker Buildx: Python 3.11 + LibreOffice]
        Filter -->|frontend/**| BuildNode[Node 20: React 19 Build + server.js]
    end

    subgraph Registries & Artifacts
        BuildDocker -->|Push| DockerHub[(Docker Hub: blueheartsaga/signapp-backend)]
        BuildNode -->|Package| FrontendZip[Zip Artifact: frontend/build]
    end

    subgraph Azure Cloud Production & QA
        DockerHub -->|Pull Image & Webhook| AzureBackend[Azure Web App for Containers<br/>'signapp-backend-docker']
        FrontendZip -->|Azure Webapps Deploy| AzureFrontend[Azure App Service: Node/Express<br/>'signapp-qa' / 'esigniva']
        AzureBackend --> Atlas[(MongoDB Atlas Cluster)]
        AzureBackend --> AzureBlob[(Azure Blob Storage)]
    end
```

---

## 2. Environment Variables Configuration

<details>
<summary><b>Click to View Backend Environment Variables Matrix (backend/.env)</b></summary>

<br/>

| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `MONGO_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/SignApp` | MongoDB Atlas replica set URI |
| `DB_NAME` | No | `SignApp` | MongoDB database identifier |
| `PORT` | No | `8000` | Port for FastAPI / Uvicorn server |
| `JWT_SECRET` | Yes | `d4e5f6...` (64-char hex) | Secret key for JWT token signing |
| `SESSION_SECRET` | Yes | `a1b2c3...` | Key for Starlette OAuth session cookies |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` | Stripe payment gateway secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` | Stripe webhook signature validator |
| `SMTP_HOST` | Yes | `smtp.sendgrid.net` | Transactional email relay host |
| `SMTP_PORT` | Yes | `587` | Transactional email relay port (TLS) |
| `SMTP_USER` | Yes | `apikey` | SMTP username |
| `SMTP_PASSWORD` | Yes | `SG.xxxxx...` | SMTP password |
| `SMTP_FROM_EMAIL` | Yes | `noreply@esigniva.com` | Verified sender address |
| `ESIGNIVA_LEGAL_ENTITY` | No | `ESigniva Technologies` | Legal business entity name for invoices |
| `ESIGNIVA_TAX_ID` | No | `GSTIN33AAACE1234F1Z5` | Tax registration number for invoices |

</details>

<details>
<summary><b>Click to View Frontend Environment Variables Matrix (frontend/.env)</b></summary>

<br/>

| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `REACT_APP_API_BASE_URL` | Yes | `https://api.esigniva.com` | Backend FastAPI base URL |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_live_...` | Stripe Elements public key |
| `REACT_APP_GOOGLE_CLIENT_ID` | Optional | `xxxx.apps.googleusercontent.com` | Google Drive Picker Client ID |
| `REACT_APP_DROPBOX_APP_KEY` | Optional | `dbx_app_key` | Dropbox Chooser App Key |
| `REACT_APP_ONEDRIVE_CLIENT_ID` | Optional | `ms_graph_client_id` | Microsoft OneDrive Client ID |
| `REACT_APP_BOX_CLIENT_ID` | Optional | `box_client_id` | Box Cloud integration Client ID |
| `GENERATE_SOURCEMAP` | CI/CD | `false` | Security flag to strip source maps |

</details>

---

## 3. Docker Containerization Architecture

<details>
<summary><b>Click to View Backend Production Dockerfile</b></summary>

<br/>

```dockerfile
FROM python:3.11-slim

# Install system dependencies: Headless LibreOffice and TrueType fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-calc \
    fonts-dejavu \
    fonts-liberation \
    fontconfig \
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

</details>

---

## 4. GitHub Actions CI/CD Automation

The platform automates builds and deployments across three workflow pipelines:

1. **Backend QA Pipeline (`.github/workflows/backend.yml`):**
   - Triggers on push to `main` with changes under `backend/**`.
   - Builds multi-platform Docker container and pushes to Docker Hub (`blueheartsaga/signapp-backend:latest`).
   - Deploys container to Azure Web App `signapp-backend-docker`.
2. **Frontend QA Pipeline (`.github/workflows/frontend.yml`):**
   - Triggers on push to `main` with changes under `frontend/**`.
   - Builds React 19 production bundle with injected secrets.
   - Deploys Express static server and bundle to Azure Web App `signapp-qa`.
3. **Production Deployment Pipeline (`.github/workflows/main_esigniva.yml`):**
   - Employs path-filtering to conditionally build and update the production instance `esigniva`.

---

## 5. Operational Verification & Troubleshooting

> [!TIP]
> When configuring Azure Web App for Containers, ensure that `WEBSITES_PORT=8000` is explicitly set in Application Settings to ensure proper port routing.

### Diagnostic Profiling Headers
Every request returned by the backend includes performance diagnostics:
- `X-Request-ID`: Distributed tracing correlation UUID.
- `X-Process-Time-MS`: Request execution time. Requests exceeding `1000ms` automatically output `[SLOW-REQUEST]` warnings in container logs.

---

<div align="center">

**Esigniva Technologies** • Enterprise Electronic Signature Platform  
[Repository](https://github.com/BlueHeart-Saga/signapp) • [Security Policy](SECURITY.md) • [Terms of Use](LICENSE.md) • [Contact Support](mailto:support@esigniva.com)

<sub>Copyright © 2026 Esigniva Technologies. All rights reserved.</sub>

</div>
