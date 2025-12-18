import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";

import HomePage from "./components/pages/Homepage";
import LoginPage from "./components/pages/LoginPage";
import CitizenRegister from "./components/Register/CitizenRegister";
import LawyerRegister from "./components/Register/LawyerRegister";
import NgoRegister from "./components/Register/NgoRegister";
import VerificationPage from "./components/pages/VerificationPage";
import AdminDashboard from "./components/pages/AdminDashboard";
import OAuth2RedirectHandler from "./components/auth/OAuth2RedirectHandler";
import VerifyEmail from "./components/pages/VerifyEmail";
import NotFoundPage from "./components/pages/NotFoundPage";

import CitizenDashboard from "./components/pages/CitizenDashboard";
import LawyerDashboard from "./components/pages/LawyerDashboard";
import NgoDashboard from "./components/pages/NgoDashboard";
import AboutPage from "./components/pages/AboutPage";
import ServicesPage from "./components/pages/ServicePage";
import ContactUs from "./components/pages/ContactUs";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Public Routes (Redirect to Dashboard if logged in) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-citizen" element={<CitizenRegister />} />
            <Route path="/register-lawyer" element={<LawyerRegister />} />
            <Route path="/register-ngo" element={<NgoRegister />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact-us" element={<ContactUs />} />
          </Route>

          <Route path="/verify-email" element={<VerifyEmail />} />


          <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
            <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['LAWYER']} />}>
            <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
          </Route>

          {/* NGO Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['NGO']} />}>
            <Route path="/ngo/dashboard" element={<NgoDashboard />} />
          </Route>


          <Route element={<ProtectedRoute allowedRoles={['LAWYER', 'NGO']} />}>
            <Route path="/verification" element={<VerificationPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
