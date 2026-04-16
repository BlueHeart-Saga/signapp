import React from "react";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

// Home Pages
import Home from "./Home/Home";

// Public Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Subscription from "./pages/auth/Subscription";
import Unauthorized from "./pages/auth/Unauthorized";

// Admin Pages
import AdminDashboard from "./Admin/AdminDashboard";
import UserManagement from "./Admin/UserManagement";

// User Pages
import UserDashboard from "./User/UserDashboard";
import MyDocuments from "./User/MyDocuments";
import DocumentBuilder from "./User/DocumentBuilder";
import AITemplateGenerator from "./User/AITemplateGenerator";
import ESignature from "./User/ESignature";
import Templates from "./User/Templates";
import Settings from "./User/Settings";

// Recipient Pages
import Dashboard from "./Recipient/Dashboard";
import ViewDocument from "./Recipient/ViewDocument";
import RecipientSigningPage from './Recipient/RecipientSigningPage';
import RecipientDashboard from "./Recipient/RecipientDashboard";
import RecipientDocuments from "./Recipient/RecipientDocuments";
import RecipientHistory from "./Recipient/RecipientHistory";
import Access from "./Recipient/Access";
import DocumentDetails from "./Recipient/DocumentDetails";
import History from "./Recipient/History";
import DocumentManagement from './User/DocumentManagement';
import GoogleCallback from "./components/GoogleCallback";
import TemplateBuilder from "./User/TemplateBuilder";
import AIDocumentGenerator from "./User/AIDocumentGenerator";
import DocumentBuilderPage from "./User/DocumentBuilder";
import MainLayout from "./Home/MainLayout";
import ContactUs from "./Home/ContactUs";
import OwnerPreview from "./components/OwnerPreview";
import PrepareSendRecipients from "./User/PrepareSendRecipients";
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
import ScrollToTop from "./components/ScrollToTop";
import AdminRegister from "./pages/auth/AdminRegister";
import TemplateManagement from "./Admin/TemplateManagement";
import DynamicLogo from "./Admin/DynamicLogo";
import UserTemplatesList from "./User/TemplatesList";
import InitialDashboard from "./User/InitialDashboard";

import { setPageTitle } from "./utils/pageTitle";
import OTPVerificationPage from "./Recipient/OTPVerification";
import SigningPage from './Recipient/SigningPage';
import Completion from "./Recipient/Completion"
import NotFound from "./pages/auth/NotFound";
import AITemplateBuilder from "./User/AI/AITemplateBuilder";
import AIDocumentEditor from "./User/AIDocumentEditor";
import DocumentSummary from "./User/DocumentSummary";
import AdminBanner from "./Admin/AdminBanner";
import AbusePolicy from "./Home/AbusePolicy";
import ComplaintsStandards from "./Home/ComplaintsStandards";
import SafeSignFAQ from "./Home/SafeSignFAQ";
import TrademarkPolicy from "./Home/TrademarkPolicy";
import DeletedDocuments from "./components/DeletedDocuments";
import ComplaintPage from "./Home/ComplaintPage";
import AdminComplaints from "./Admin/AdminComplaints";
import VoidedDocumentView from "./Recipient/VoidedDocumentView";
import DeclinedDocumentView from "./Recipient/DeclinedDocumentView";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Contacts from "./User/Contacts";
import DocumentMainLayout from "./User/editor/DocumentMainLayout";
import PlanGuard from "./components/PlanGuard";


function AnimatedRoutes() {
  const location = useLocation();



  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");



  useEffect(() => {
    setPageTitle(
      "AI-powered e-signature Platform",
      "Secure digital signatures, document management, and workflow automation with SafeSign."
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






    <AnimatePresence mode="wait">


      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />






      <ScrollToTop />
      <Routes location={location} key={location.pathname}>

        <Route
          path="/login"
          element={
            // <motion.div
            //   initial={{ opacity: 0, x: 80 }}
            //   animate={{ opacity: 1, x: 0 }}
            //   exit={{ opacity: 0, x: -80 }}
            //   transition={{ duration: 0.45, ease: "easeInOut" }}
            // >
            <Login />
            // </motion.div>
          }
        />

        <Route
          path="/register"
          element={
            // <motion.div
            //   initial={{ opacity: 0, x: -80 }}
            //   animate={{ opacity: 1, x: 0 }}
            //   exit={{ opacity: 0, x: 80 }}
            //   transition={{ duration: 0.45, ease: "easeInOut" }}
            // >
            <Register />
            // </motion.div>
          }
        />


        {/* <Route path="/forgot-password" element={<ChangePassword />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}


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
          <Route path="/faq" element={<SafeSignFAQ />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookies" element={<Cookies />} />



          <Route path="/e-sign/complaints" element={<ComplaintPage />} />


          <Route path="/document-management" element={<DocumentManagementHome />} />
          <Route path="/workflow-automation" element={<WorkflowAutomationHome />} />
          <Route path="/templates" element={<TemplatesHome />} />
        </Route>


        {/* <Route path="/documents/:documentId/build" element={<DocumentBuilder />} />
<Route path="/documents/:documentId/preview" element={<OwnerPreview />} /> */}





        <Route path="/verify/:recipientId" element={<OTPVerificationPage />} />

        {/* <Route path="/sign/:recipientId" element={<RecipientSigningPage />} /> */}
        <Route path="/sign/:recipientId" element={<SigningPage />} />

        <Route path="/complete/:recipientId" element={<Completion />} />

        <Route path="/sign/:recipientId/voided" element={<VoidedDocumentView />} />
        <Route path="/sign/:recipientId/declined" element={<DeclinedDocumentView />} />




        {/* ---------------- Admin Routes ---------------- */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="templates" element={<TemplateManagement />} />
                  <Route path="logo" element={<DynamicLogo />} />
                  <Route path="banner" element={<AdminBanner />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- User Routes ---------------- */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Layout>
                <Routes>
                  <Route path="" element={<InitialDashboard />} />
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

                  <Route path="document-summary/:documentId" element={<DocumentSummary />}
                  />


                  <Route path="ai-document" element={<AIDocumentEditor />} />



                  <Route path="prepare-send/:documentId" element={<PrepareSendRecipients />} />



                  {/* AI Template Builder routes */}
                  {/* <Route path="/ai/templates" element={<AITemplateBuilder />} /> */}
                  {/* <Route path="/ai/templates/:id/edit" element={<AITemplateEditor />} /> */}

                  {/* Redirect from documents to AI templates */}
                  {/* <Route path="/documents/ai-templates" element={<Navigate to="/ai/templates" />} /> */}


                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- User FULLSCREEN Routes (NO Layout) ---------------- */}
        <Route
          path="/user/documentbuilder/:documentId"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              {/* <DocumentBuilder /> */}
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


        {/* ---------------- Recipient Routes ---------------- */}
        <Route
          path="/recipient/*"
          element={

            <Layout>
              <Routes>
                <Route path="home" element={<Dashboard />} />
                <Route path="view" element={<ViewDocument />} />
                <Route path="documents" element={<RecipientDocuments />} />
                <Route path="history/:documentId" element={<RecipientHistory />} />

                <Route path="*" element={<Navigate to="access" replace />} />

              </Routes>
            </Layout>

          }
        />


        <Route path="/recipient/access" element={<Access />} />
        <Route path="/recipient/dashboard" element={<RecipientDashboard />} />
        <Route path="/recipient/documents/:documentId" element={<DocumentDetails />} />
        <Route path="/recipient/history" element={<History />} />



        {/* ---------------- 404 FALLBACK ---------------- */}
        <Route path="*" element={<NotFound />} />


      </Routes>
    </AnimatePresence>

  );
}
function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
