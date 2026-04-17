# SafeSign - Enterprise Electronic Signature Solution

![SignApp Logo](https://raw.githubusercontent.com/BlueHeart-Saga/signapp/main/frontend/public/logo192.png) 

SafeSign is a modern, enterprise-grade electronic signature platform designed to streamline document workflows, enhance security, and provide AI-driven document intelligence. Built with a robust FastAPI backend and a high-performance React frontend, SafeSign offers a seamless experience for sending, signing, and managing documents at scale.

## 🚀 Key Features

### 🖋️ Electronic Signatures & Workflows
*   **Intuitive Document Builder:** Drag-and-drop interface for placing signature fields, initials, dates, and custom text fields.
*   **Recipient Management:** Support for multiple signers with customizable signing orders, roles, and status tracking.
*   **Real-time Notifications:** Automated email notifications via SMTP for signing requests, completion, and reminders.
*   **Audit Trails:** Comprehensive logging of all document activities, including timestamps and IP addresses for compliance.

### 🤖 AI-Powered Intelligence
*   **AI Document Builder:** Automatically detect and place fields using advanced AI models.
*   **AI Workflow Builder:** Streamline complex signing processes with intelligent workflow suggestions.
*   **Smart Summaries:** Get instant AI-generated summaries of long documents before signing.
*   **Template Generation:** Generate document templates using AI to save time on repetitive tasks.

### ☁️ Cloud & Third-Party Integrations
*   **Cloud Storage:** Seamlessly import and export documents from **Google Drive, Dropbox, OneDrive, and Box**.
*   **Payment Integration:** Built-in subscription management and billing powered by **Stripe**.
*   **Identity Verification:** Optional **OTP verification** for signers to ensure identity security.

###  Enterprise Security & Compliance
- **JWT-based Authentication:** Secure, stateless authentication for all users.
- **Role-Based Access Control (RBAC):** Granular permissions for Admins and Team members.
- **Tamper-Evident Signatures:** Ensures document integrity after completion.
- **Secure File Storage:** encrypted storage for all uploaded and signed files.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://reactjs.org/)
- **Styling:** [Material UI (MUI) v6+](https://mui.com/), Framer Motion, Bootstrap 5
- **Interactive Layers:** React Konva, dnd-kit (Drag and Drop)
- **Data Visualization:** Chart.js, Recharts

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11)
- **Database:** [MongoDB](https://www.mongodb.com/) (Motor driver)
- **Async Execution:** Comprehensive use of `asyncio` for high-concurrency tasks.
- **Document Engine:** LibreOffice & Custom PDF Renderers.
- **AI Models:** Integration with Cohere/OpenAI for document analysis.

### DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Web Server:** Gunicorn with Uvicorn workers
- **Cloud Deployment:** Optimized for Azure Web Apps / AWS EC2
- **Testing:** Playwright (Frontend E2E), Pytest (Backend)

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.11 or later
- **MongoDB**: Access to a MongoDB instance (local or Atlas)
- **LibreOffice**: Required for `.docx` to `.pdf` conversions

### 1. Repository Setup
```bash
git clone https://github.com/BlueHeart-Saga/signapp.git
cd signapp
```

### 2. Backend Installation
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Installation
```bash
cd ../frontend
npm install
```

### 4. Running Locally
SafeSign supports concurrent development for both services:
```bash
# In the frontend directory
npm run dev
```
- **Web App**: `http://localhost:3000`
- **Interactive API Docs**: `http://localhost:9000/docs`

---

## 📁 Project Architecture

```text
SignApp/
├── backend/                # FastAPI Application
│   ├── routes/             # Feature-specific API endpoints
│   ├── models/             # Database schemas
│   ├── services/           # Reusable business logic
│   ├── testing/            # Backend test suite
│   ├── storage/            # Local file storage (if prioritized)
│   └── main.py             # Server entry point
├── frontend/               # React Application
│   ├── src/                
│   │   ├── User/           # Workflow & Dashboard components
│   │   ├── Admin/          # System management dashboards
│   │   └── context/        # Global state (Auth, Branding)
│   └── public/             # Static assets & manifest files
└── README.md               # Documentation
```

---

## 🤝 Contributing

We welcome contributions to SafeSign! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-new-ui`
3. Commit your changes: `git commit -m 'Add new UI features'`
4. Push to the branch: `git push origin feature-new-ui`
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---

Developed with ❤️ by the **BlueHeart Saga** development team.
