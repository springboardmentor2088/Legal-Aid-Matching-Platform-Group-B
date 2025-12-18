import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
            The page might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            <FaHome className="mr-2 text-xl" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Looking for something specific?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Try these common pages:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/login"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/register-citizen"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Register as Citizen
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/register-lawyer"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Register as Lawyer
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/register-ngo"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Register as NGO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
