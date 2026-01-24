import React from 'react';
import { Link } from 'react-router-dom';
import { FiLock, FiHome, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const UnauthorizedPage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                {/* Lock Icon */}
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiLock className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Access Denied
                </h1>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {user ? (
                        <>
                            You don't have permission to access this page.
                            <br />
                            Your current role: <span className="font-semibold">{user.role}</span>
                        </>
                    ) : (
                        'Please log in to access this page.'
                    )}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition"
                    >
                        <FiHome className="w-4 h-4" />
                        Go to Homepage
                    </Link>

                    {user && (
                        <Link
                            to={`/${user.role.toLowerCase()}/dashboard`}
                            className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    )}
                </div>

                {/* Help Text */}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
                    If you believe this is an error, please contact your system administrator.
                </p>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
