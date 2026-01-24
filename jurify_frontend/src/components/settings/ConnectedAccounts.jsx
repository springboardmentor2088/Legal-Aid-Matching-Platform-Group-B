import React, { useState, useEffect } from 'react';
import { FiLink, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { api } from '../../services/api';
import { useToast } from '../common/ToastContext';

const ConnectedAccounts = () => {
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await api.get('/calendar/status');
            setGoogleConnected(response.connected);
        } catch (error) {
            console.error("Failed to fetch calendar status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get('/calendar/connect'); // Backend returns auth URL
            if (response && response.url) {
                window.location.href = response.url; // Redirect to Google OAuth
            } else {
                showToast({ type: 'error', message: "Failed to initiate connection" });
            }
        } catch (error) {
            showToast({ type: 'error', message: "Connection failed" });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <FiLink className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h3>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Connect your external accounts to enable advanced features like automatic scheduling and meeting generation.
                </p>

                {/* Google Calendar Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-red-500">
                            <FaGoogle className="text-xl" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Google Calendar</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {googleConnected
                                    ? "Connected for automatic meeting scheduling"
                                    : "Connect to sync availability & meetings"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {loading ? (
                            <span className="text-xs text-gray-400">Loading...</span>
                        ) : googleConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                <FiCheck /> Connected
                            </div>
                        ) : (
                            <button
                                onClick={handleConnect}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                            >
                                <FiExternalLink /> Connect
                            </button>
                        )}
                    </div>
                </div>

                {/* Google Account Card */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-blue-500">
                            <FaGoogle className="text-xl" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Google Account</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {googleConnected
                                    ? "Linked to your profile"
                                    : "Link your Google account for easier sign-in"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {loading ? (
                            <span className="text-xs text-gray-400">Loading...</span>
                        ) : googleConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                <FiCheck /> Linked
                            </div>
                        ) : (
                            <button
                                onClick={handleConnect}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                            >
                                <FiExternalLink /> Link Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectedAccounts;
