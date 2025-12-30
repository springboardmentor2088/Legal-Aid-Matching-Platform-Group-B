import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaArrowLeft,
  FaSearch,
  FaBug,
  FaClock,
  FaExternalLinkAlt,
  FaLightbulb,
  FaFolderOpen,
  FaUser,
  FaSignInAlt,
  FaUserPlus
} from 'react-icons/fa';

const NotFoundPage = () => {
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Smart suggestions based on URL
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const smartSuggestions = [];

    if (path.includes('dashboard')) {
      smartSuggestions.push({ text: 'Go to Dashboard', url: '/dashboard', icon: FaHome });
    }
    if (path.includes('case')) {
      smartSuggestions.push({ text: 'View Cases', url: '/dashboard?tab=cases', icon: FaFolderOpen });
    }
    if (path.includes('profile')) {
      smartSuggestions.push({ text: 'Edit Profile', url: '/dashboard?tab=profile', icon: FaUser });
    }
    if (path.includes('login') || path.includes('auth')) {
      smartSuggestions.push({ text: 'Login Page', url: '/login', icon: FaSignInAlt });
    }
    if (path.includes('register')) {
      smartSuggestions.push({ text: 'Register', url: '/register-citizen', icon: FaUserPlus });
    }

    setSuggestions(smartSuggestions);
  }, [location.pathname]);

  useEffect(() => {
    setIsLoaded(true);
    // Log the 404 error for debugging
    console.warn('404 Error: Page not found', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search results or dashboard with search parameter
      window.location.href = `/dashboard?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      window.history.back();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      window.location.href = '/';
    } else if (e.key === '/' && e.ctrlKey) {
      e.preventDefault();
      document.querySelector('input[type="text"]')?.focus();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9fa] to-[#e6f3f5] flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-2xl w-full">
        {/* 404 Number with animation */}
        <div className={`text-center mb-8 transition-all duration-1000 transform ${isLoaded ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <div className="relative inline-block">
            <h1 className="text-9xl font-bold text-primary animate-pulse mt-4">404</h1>
            <div className="absolute top-2 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
              Lost
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            This page seems to have vanished into the digital void
          </div>
        </div>

        {/* Error Message */}
        <div className={`text-center mb-8 transition-all duration-700 delay-200 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for.
            The page might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-8 transition-all duration-700 delay-400 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <FaHome className="mr-2 text-xl" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className={`text-center mb-8 transition-all duration-700 delay-500 transform ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 mr-1">ESC</kbd>
              Go back
            </span>
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 mr-1">Ctrl+Enter</kbd>
              Home
            </span>
            <span className="flex items-center">
              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 mr-1">Ctrl+/</kbd>
              Search
            </span>
          </div>
        </div>

        {/* Additional Help */}
        <div className={`transition-all duration-700 delay-600 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Looking for something specific?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try these common pages:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 hover:underline"
              >
                Login
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/register-citizen"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 hover:underline"
              >
                Register as Citizen
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/register-lawyer"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 hover:underline"
              >
                Register as Lawyer
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/register-ngo"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 hover:underline"
              >
                Register as NGO
              </Link>
            </div>

            {/* Report Issue */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const subject = encodeURIComponent('404 Error Report');
                    const body = encodeURIComponent(`I encountered a 404 error when trying to access: ${window.location.href}\n\nTime: ${new Date().toLocaleString()}\nUser Agent: ${navigator.userAgent}`);
                    window.location.href = `mailto:support@jurify.com?subject=${subject}&body=${body}`;
                  }}
                  className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <FaBug className="mr-1" />
                  Report this issue
                </button>
                <div className="text-xs text-gray-400 flex items-center">
                  <FaClock className="mr-1" />
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
