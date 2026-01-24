import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";
import AdminRoute from "./components/AdminRoute";

import HomePage from "./components/pages/Homepage";
import LoginPage from "./components/pages/LoginPage";
import CitizenRegister from "./components/Register/CitizenRegister";
import LawyerRegister from "./components/Register/LawyerRegister";
import NgoRegister from "./components/Register/NgoRegister";
import VerificationPage from "./components/pages/VerificationPage";
import AdminDashboard from "./components/pages/AdminDashboard";
import OAuth2RedirectHandler from "./components/auth/OAuth2RedirectHandler";
import RoleSelection from "./components/auth/RoleSelection";
import VerifyEmail from "./components/pages/VerifyEmail";
import ResetPassword from "./components/auth/ResetPassword";
import ForgotPassword from "./components/auth/ForgotPassword";
import NotFoundPage from "./components/pages/NotFoundPage";
import UnauthorizedPage from "./components/pages/UnauthorizedPage";

import CitizenDashboard from "./components/pages/CitizenDashboard";
import LawyerDashboard from "./components/pages/LawyerDashboard";
import NgoDashboard from "./components/pages/NgoDashboard";
import AboutPage from "./components/pages/AboutPage";
import ServicesPage from "./components/pages/ServicePage";
import ContactUs from "./components/pages/ContactUs";
import CaseSubmissionForm from "./components/case/caseSubmissionForm";
import { ToastProvider } from "./components/common/ToastContext";
import DirectorySearch from "./components/directory/DirectorySearch";
import LawyerChat from "./components/chat/views/LawyerChat";
import CitizenChat from "./components/chat/views/CitizenChat";
import NgoChat from "./components/chat/views/NgoChat";
import ScheduleDashboard from "./components/pages/ScheduleDashboard";
import ChatbotWidget from "./components/chatbot/ChatbotWidget";
import { GlobalLoaderProvider } from "./context/GlobalLoaderContext";
import GlobalLoader from "./components/common/GlobalLoader";




function App() {
  return (
    <ToastProvider>
      <GlobalLoaderProvider>
        <ThemeProvider>
          <AuthProvider>
            <GlobalLoader />
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Public Routes (Redirect to Dashboard if logged in) */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register-citizen" element={<CitizenRegister />} />
                <Route path="/register-lawyer" element={<LawyerRegister />} />
                <Route path="/register-ngo" element={<NgoRegister />} />
                <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Unauthorized Page */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />




              <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
                <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                <Route path="/citizen/chat" element={<CitizenChat />} />
                <Route path="/citizen/submit-case" element={<CaseSubmissionForm />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['LAWYER']} />}>
                <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
                <Route path="/lawyer/chat" element={<LawyerChat />} />
              </Route>

              {/* NGO Dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['NGO']} />}>
                <Route path="/ngo/dashboard" element={<NgoDashboard />} />
                <Route path="/ngo/chat" element={<NgoChat />} />
              </Route>


              <Route element={<ProtectedRoute allowedRoles={['LAWYER', 'NGO']} />}>
                <Route path="/verification" element={<VerificationPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>



              <Route path="/directory" element={<DirectorySearch />} />

              {/* Schedule Page - Accessible to all authenticated users */}
              <Route element={<ProtectedRoute allowedRoles={['CITIZEN', 'LAWYER', 'NGO']} />}>
                <Route path="/schedule" element={<ScheduleDashboard />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />


            </Routes>
            <ChatbotWidget />
          </AuthProvider>
        </ThemeProvider>
      </GlobalLoaderProvider>
    </ToastProvider>
  );
}

export default App;