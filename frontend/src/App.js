// Esigniva Production & QA Frontend Application
import React, { lazy, Suspense } from "react";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import AppSplashLoader from "./components/AppSplashLoader";

// Home & Core Pages
import Home from "./Home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Lazy Loaded Heavy Routes (Code Splitting)
const Subscription = lazy(() => import("./pages/auth/Subscription"));
const Unauthorized = lazy(() => import("./pages/auth/Unauthorized"));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import("./Admin/AdminDashboard"));
const UserManagement = lazy(() => import("./Admin/UserManagement"));
const TemplateManagement = lazy(() => import("./Admin/TemplateManagement"));
const DynamicLogo = lazy(() => import("./Admin/DynamicLogo"));
const AdminBanner = lazy(() => import("./Admin/AdminBanner"));
const AdminComplaints = lazy(() => import("./Admin/AdminComplaints"));
const AdminFeedback = lazy(() => import("./Admin/AdminFeedback"));
const AdminEnvelopeManagement = lazy(() => import("./Admin/AdminEnvelopeManagement"));

// User Heavy Pages (Lazy Loaded)
const UserDashboard = lazy(() => import("./User/UserDashboard"));
const MyDocuments = lazy(() => import("./User/MyDocuments"));
const DocumentBuilderPage = lazy(() => import("./User/DocumentBuilder"));
const AITemplateGenerator = lazy(() => import("./User/AITemplateGenerator"));
const ESignature = lazy(() => import("./User/ESignature"));
const Templates = lazy(() => import("./User/Templates"));
const Settings = lazy(() => import("./User/Settings"));
const DocumentManagement = lazy(() => import("./User/DocumentManagement"));
const TemplateBuilder = lazy(() => import("./User/TemplateBuilder"));
const AIDocumentGenerator = lazy(() => import("./User/AIDocumentGenerator"));
const PrepareSendRecipients = lazy(() => import("./User/PrepareSendRecipients"));
const UserTemplatesList = lazy(() => import("./User/TemplatesList"));
const InitialDashboard = lazy(() => import("./User/InitialDashboard"));
const AIDocumentEditor = lazy(() => import("./User/AIDocumentEditor"));
const DocumentSummary = lazy(() => import("./User/DocumentSummary"));
const DeletedDocuments = lazy(() => import("./components/DeletedDocuments"));
const Contacts = lazy(() => import("./User/Contacts"));
const DocumentMainLayout = lazy(() => import("./User/editor/DocumentMainLayout"));
const OwnerPreview = lazy(() => import("./components/OwnerPreview"));

// Recipient Pages (Lazy Loaded)
const Dashboard = lazy(() => import("./Recipient/Dashboard"));
const ViewDocument = lazy(() => import("./Recipient/ViewDocument"));
const SigningPage = lazy(() => import("./Recipient/SigningPage"));
const Completion = lazy(() => import("./Recipient/Completion"));
const VoidedDocumentView = lazy(() => import("./Recipient/VoidedDocumentView"));
const DeclinedDocumentView = lazy(() => import("./Recipient/DeclinedDocumentView"));
const ExpiredDocumentView = lazy(() => import("./Recipient/ExpiredDocumentView"));
const RecipientDashboard = lazy(() => import("./Recipient/RecipientDashboard"));
const RecipientDocuments = lazy(() => import("./Recipient/RecipientDocuments"));
const RecipientHistory = lazy(() => import("./Recipient/RecipientHistory"));
const Access = lazy(() => import("./Recipient/Access"));
const DocumentDetails = lazy(() => import("./Recipient/DocumentDetails"));
const History = lazy(() => import("./Recipient/History"));
const OTPVerificationPage = lazy(() => import("./Recipient/OTPVerification"));

// Public Informational Pages
import MainLayout from "./Home/MainLayout";
import ContactUs from "./Home/ContactUs";
import About from "./Home/AboutUs";
import ESignatureHome from "./Home/ESignatureHome";
import DocumentManagementHome from "./Home/documentManagementHome";
import WorkflowAutomationHome from "./Home/WorkflowAutomationHome";
import TemplatesHome from "./Home/TemplatesHome";
import PricingSection from "./Home/PricingSection";
import Blog from "./Home/Blog";
import HelpCenter from "./Home/HelpCenter";
import CaseStudies from "./Home/CaseStudies";
import Documentations from "./Home/Documentations";
import Community from "./Home/Community";
import Support from "./Home/Support";
import PrivacyPolicy from "./Home/PrivacyPolicy";
import TermsOfService from "./Home/TermsofService";
import Cookies from "./Home/Cookies";
import SecurityHome from "./Home/SecurityHome";
import AdminRegister from "./pages/auth/AdminRegister";
import GoogleCallback from "./components/GoogleCallback";
import NotFound from "./pages/auth/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AbusePolicy from "./Home/AbusePolicy";
import ComplaintsStandards from "./Home/ComplaintsStandards";
import EsignivaFAQ from "./Home/EsignivaFAQ";
import TrademarkPolicy from "./Home/TrademarkPolicy";
import ComplaintPage from "./Home/ComplaintPage";
import PlanGuard from "./components/PlanGuard";
import { setPageTitle } from "./utils/pageTitle";


function AnimatedRoutes() {
  const location = useLocation();



  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");



  useEffect(() => {
    setPageTitle(
      "Home",
      "Esigniva is the premier AI-powered e-signature platform. Securely sign, automate, and manage your documents with enterprise-grade tools."
    );
  }, []);

  // // Maintenance Check
  // // Auto-update maintenance status every 5 sec
  // useEffect(() => {
  //   const checkStatus = () => {
  //     fetch("http://localhost:7000/maintenance/status/")
  //       .then((res) => res.json())
  //       .then((data) => {
  //         setMaintenance(data.maintenance);
  //         setMaintenanceMessage(data.message);
  //       })
  //       .catch(() => {});
  //   };
  //         setMaintenanceMessage(data.message);
  //       })
  //       .catch(() => {});
  //   };

  //   checkStatus(); // initial check
  //   const interval = setInterval(checkStatus, 5000); // check every 5 sec

  //   return () => clearInterval(interval);
  // }, []);


  // // STOP ENTIRE APP IF MAINTENANCE = TRUE
  // if (maintenance) {
  //   return (
  //     <div style={{ padding: 50, textAlign: "center" }}>
  //       <h1>🚧 System Under Maintenance</h1>
  //       <p>{maintenanceMessage}</p>
  //       <p>Please check back later.</p>
  //     </div>
  //   );
  // }





  return (
    <>
      <ScrollToTop />
      <Routes>

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />

        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/auth/success" element={<GoogleCallback />} />

        <Route element={<MainLayout />}>
          {/* ---------------- Public Routes ---------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/aboutus" element={<About />} />
          <Route path="/e-signature" element={<ESignatureHome />} />
          <Route path="/pricing" element={<PricingSection />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/helpcenter" element={<HelpCenter />} />
          <Route path="/case-studies" element={< CaseStudies />} />
          <Route path="/docs" element={<Documentations />} />
          <Route path="/community" element={<Community />} />
          <Route path="/support" element={<Support />} />
          <Route path="/security" element={<SecurityHome />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/abusepolicy" element={<AbusePolicy />} />
          <Route path="/complaints" element={<ComplaintsStandards />} />
          <Route path="/trademarkpolicy" element={<TrademarkPolicy />} />
          <Route path="/faq" element={<EsignivaFAQ />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/cookie-policy" element={<Cookies />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/api-docs" element={<Navigate to="/docs" replace />} />
          <Route path="/enterprise-support" element={<Navigate to="/contactus?subject=Sales%20%26%20Enterprise" replace />} />

          <Route path="/e-sign/complaints" element={<ComplaintPage />} />

          <Route path="/document-management" element={<DocumentManagementHome />} />
          <Route path="/workflow-automation" element={<WorkflowAutomationHome />} />
          <Route path="/templates" element={<TemplatesHome />} />
        </Route>

        <Route path="/verify/:recipientId" element={<OTPVerificationPage />} />
        <Route path="/sign/:recipientId" element={<SigningPage />} />
        <Route path="/complete/:recipientId" element={<Completion />} />

        <Route path="/sign/:recipientId/voided" element={<VoidedDocumentView />} />
        <Route path="/sign/:recipientId/declined" element={<DeclinedDocumentView />} />
        <Route path="/sign/:recipientId/expired" element={<ExpiredDocumentView />} />

        {/* ---------------- Admin Persistent Layout Routes ---------------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="templates" element={<TemplateManagement />} />
          <Route path="logo" element={<DynamicLogo />} />
          <Route path="banner" element={<AdminBanner />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="envelopes" element={<AdminEnvelopeManagement />} />
        </Route>

        {/* ---------------- User Persistent Layout Routes ---------------- */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InitialDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="documents/manage" element={<DocumentManagement />} />
          <Route path="documents/trash" element={<DeletedDocuments />} />

          <Route path="subscription" element={<Subscription />} />

          <Route path="documents" element={<MyDocuments />} />
          <Route path="document-builder" element={<DocumentBuilderPage />} />
          <Route path="ai-templates" element={<AITemplateGenerator />} />
          <Route path="ai-template" element={<PlanGuard><TemplateBuilder /></PlanGuard>} />
          <Route path="ai-template2" element={<AIDocumentGenerator />} />
          <Route path="templates" element={<PlanGuard><Templates /></PlanGuard>} />
          <Route path="templateslist" element={<UserTemplatesList />} />
          <Route path="contacts" element={<PlanGuard><Contacts /></PlanGuard>} />
          <Route path="d-sign" element={<ESignature />} />

          <Route path="settings" element={<Settings />} />

          <Route path="document-summary/:documentId" element={<DocumentSummary />} />
          <Route path="ai-document" element={<AIDocumentEditor />} />
          <Route path="prepare-send/:documentId" element={<PrepareSendRecipients />} />
        </Route>

        {/* ---------------- User FULLSCREEN Routes (NO Layout) ---------------- */}
        <Route
          path="/user/documentbuilder/:documentId"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <DocumentMainLayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/documentbuilder/:documentId/preview"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <OwnerPreview />
            </ProtectedRoute>
          }
        />

        {/* ---------------- Recipient Persistent Layout Routes ---------------- */}
        <Route
          path="/recipient"
          element={
            <Layout />
          }
        >
          <Route path="home" element={<Dashboard />} />
          <Route path="view" element={<ViewDocument />} />
          <Route path="documents" element={<RecipientDocuments />} />
          <Route path="history/:documentId" element={<RecipientHistory />} />
          <Route path="*" element={<Navigate to="access" replace />} />
        </Route>

        <Route path="/recipient/access" element={<Access />} />
        <Route path="/recipient/dashboard" element={<RecipientDashboard />} />
        <Route path="/recipient/documents/:documentId" element={<DocumentDetails />} />
        <Route path="/recipient/history" element={<History />} />

        {/* ---------------- 404 FALLBACK ---------------- */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}
function App() {
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<AppSplashLoader message="Welcome to eSigniva..." />}>
              <AnimatedRoutes />
            </Suspense>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
