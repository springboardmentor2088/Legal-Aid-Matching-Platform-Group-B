import React, { useState } from 'react';
import { FiShield, FiSliders, FiArchive, FiBell, FiAlertCircle, FiDownload, FiSettings } from 'react-icons/fi';
import { useTheme } from "../../context/ThemeContext";

const AdminSettings = () => {
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [security, setSecurity] = useState({
        sessionTimeout: '30', // minutes
        mfaEnabled: true,
        passwordPolicy: 'strong'
    });

    const [platform, setPlatform] = useState({
        autoCaseMatching: true,
        verificationStrictness: 'high',
        maintenanceMode: false
    });

    const [notifications, setNotifications] = useState({
        verificationAlerts: true,
        systemErrors: true,
        userReports: true
    });

    const handleSecurityChange = (e) => {
        setSecurity({ ...security, [e.target.name]: e.target.value });
    };

    const togglePlatform = (key) => {
        setPlatform(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleForceLogout = () => {
        alert("This would force logout all users. UI simulation only.");
    };

    const handleExportLogs = () => {
        alert("Exporting system logs...");
    };

    return (
        <div className="max-w-full mx-auto space-y-6 pb-10">


            {/* Security Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                        <FiShield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Controls</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Timeout (minutes)</label>
                            <select
                                name="sessionTimeout"
                                value={security.sessionTimeout}
                                onChange={handleSecurityChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Policy</label>
                            <select
                                name="passwordPolicy"
                                value={security.passwordPolicy}
                                onChange={handleSecurityChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            >
                                <option value="standard">Standard (8 chars)</option>
                                <option value="strong">Strong (Symbol + Number)</option>
                                <option value="strict">Strict (Recurring changes)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                <FiAlertCircle />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Force Logout All Users</p>
                                <p className="text-xs text-gray-500">Emergency action only</p>
                            </div>
                        </div>
                        <button
                            onClick={handleForceLogout}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <FiSliders className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Settings</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Automatic Case Matching</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Match citizens to lawyers based on expertise</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={platform.autoCaseMatching}
                                onChange={() => togglePlatform('autoCaseMatching')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Disable login and show maintenance page</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={platform.maintenanceMode}
                                onChange={() => togglePlatform('maintenanceMode')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Audit & Logs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-400">
                        <FiArchive className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit & Logs</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">Export system activity logs for compliance review.</p>
                    <button
                        onClick={handleExportLogs}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <FiDownload />
                        <span>Export System Logs (CSV)</span>
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <FiBell className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Alerts</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Verification Alerts</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Notify admins when new users submit documents</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifications.verificationAlerts}
                                onChange={() => toggleNotification('verificationAlerts')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <FiSettings className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDarkMode}
                                onChange={toggleTheme}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
