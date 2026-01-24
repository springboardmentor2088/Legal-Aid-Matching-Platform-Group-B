/* eslint-disable react-hooks/static-components */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContext';
import Logo from '../common/Logo';
import loginBg from '../../assets/login_bg.jpg';
import { useTheme } from '../../context/ThemeContext';
import AuthDarkModeToggle from '../common/AuthDarkModeToggle';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';

function LoginPage() {
  const { isDarkMode } = useTheme();
  const { startLoading, stopLoading } = useGlobalLoader();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const primaryBg = "bg-[#11676a] hover:bg-[#0f5a5d] transition duration-200";
  const primaryText = "text-[#11676a] hover:text-[#0f5a5d]";
  const focusRing = "focus:outline-none focus:ring-2 focus:ring-[#11676a]/50 focus:border-[#11676a]";
  const inputStyles = `w-full h-12 px-4 pl-12 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 rounded-lg ${focusRing} text-sm transition-all duration-200 ease-in-out`;
  const labelTextStyles = "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block";

  const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined text-xl ${className}`}>{name}</span>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    startLoading("Signing in...");

    const result = await login(email, password);
    if (result.success) {
      stopLoading(true, "Login successful!");
      // showToast is redundant with stopLoading success message but keeping it for safety if stopLoading auto-hides quickly
      // showToast({ message: "Login successful!", type: "success" }); 

      const role = result.role?.toUpperCase() || '';
      switch (role) {
        case 'CITIZEN': navigate('/citizen/dashboard'); break;
        case 'LAWYER': navigate('/lawyer/dashboard'); break;
        case 'NGO': navigate('/ngo/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        default: navigate('/');
      }
    } else {
      stopLoading(false, result.error || 'Login failed');
      setError(result.error || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    // Remove '/api' from the end if it exists, as the oauth endpoint is usually at root
    const rootUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
    window.location.href = `${rootUrl}/oauth2/authorization/google`;
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-end p-4 relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(17, 103, 106, 0.4), rgba(44, 62, 80, 0.5)), url(${loginBg})`,
      }}
    >
      <AuthDarkModeToggle />
      {/* Left Side Text */}
      <div className="hidden md:block absolute top-24 left-12 max-w-xl z-10 space-y-4">
        <h1 className="text-4xl font-bold text-white leading-snug">
          Login to connect, collaborate, and simplify justice
        </h1>
        <p className="text-lg text-white">Justice simplifies. Connected.</p>
      </div>

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Login box floated to the right */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl space-y-8 border border-slate-100 dark:border-gray-800 mr-12 transition-colors duration-300">

        {/* Home Link */}
        <Link to="/" className="absolute top-6 right-6 text-gray-400 hover:text-[#11676a] transition">
          <MaterialIcon name="home" />
        </Link>

        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <Logo className="mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-base">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className={labelTextStyles}>Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MaterialIcon name="mail" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className={inputStyles}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelTextStyles}>Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                <MaterialIcon name="lock" />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter your password"
                className={`${inputStyles} pr-12`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-0 top-0 h-full px-4 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                <MaterialIcon name={passwordVisible ? "visibility" : "visibility_off"} />
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link to="/forgot-password" className={`text-sm font-medium ${primaryText} underline-offset-2 hover:underline`}>
              Forgot Password?
            </Link>
          </div>

          {/* Main Login Button */}
          <button
            type="submit"
            className={`w-full h-12 text-lg font-bold text-white rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 ${primaryBg}`}
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-4 text-sm text-gray-400 uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-12 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition duration-200 shadow-sm"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png"
              alt="Google logo"
              className="w-5 h-5 mr-3"
            />
            Continue with Google
          </button>
        </form>

        {/* Registration Links */}
        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold text-center text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Don't have an account?
          </p>

          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/register-citizen"
              className="group flex items-center justify-center gap-2 h-12 rounded-lg border border-[#11676a]/30 dark:border-[#11676a]/50 bg-[#11676a]/5 dark:bg-[#11676a]/10 hover:bg-[#11676a]/10 dark:hover:bg-[#11676a]/20 transition"
            >
              <span className="material-symbols-outlined text-[#11676a] dark:text-[#198f93]">person</span>
              <span className="text-sm font-semibold text-[#11676a] dark:text-[#198f93] group-hover:underline">
                Register as Citizen
              </span>
            </Link>

            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/register-lawyer"
                className="group flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-[#11676a] hover:bg-[#11676a]/10 dark:hover:bg-[#11676a]/20 transition"
              >
                <span className="material-symbols-outlined text-[#11676a] dark:text-[#198f93]">gavel</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#11676a] dark:group-hover:text-[#198f93]">
                  Lawyer
                </span>
              </Link>

              <Link
                to="/register-ngo"
                className="group flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-[#11676a] hover:bg-[#11676a]/10 dark:hover:bg-[#11676a]/20 transition"
              >
                <span className="material-symbols-outlined text-[#11676a] dark:text-[#198f93]">volunteer_activism</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#11676a] dark:group-hover:text-[#198f93]">
                  NGO
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;