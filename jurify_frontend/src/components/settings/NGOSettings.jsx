import React, { useState } from 'react';
import { FiLock, FiBell, FiFileText, FiSettings } from 'react-icons/fi';
import { useTheme } from "../../context/ThemeContext";
import ConnectedAccounts from './ConnectedAccounts';

const NGOSettings = () => {
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [reporting, setReporting] = useState({
        weeklySummary: true,
        monthlyImpactReport: true,
        autoExport: false
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [notifications, setNotifications] = useState({
        newMatches: true,
        volunteerUpdates: true,
        donationAlerts: false
    });

    // Organization profile handler removed

    const toggleReporting = (key) => {
        setReporting(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="w-full mx-auto space-y-6 pb-10">


            {/* Reporting Preferences Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <FiFileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reporting Preferences</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Weekly Activity Summary</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly digest of cases and volunteers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={reporting.weeklySummary}
                                onChange={() => toggleReporting('weeklySummary')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Monthly Impact Report</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Detailed analytics report for stakeholders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={reporting.monthlyImpactReport}
                                onChange={() => toggleReporting('monthlyImpactReport')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Connected Accounts */}
            <ConnectedAccounts />

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                        <FiLock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                            <input
                                type="password"
                                name="current"
                                value={passwords.current}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input
                                type="password"
                                name="new"
                                value={passwords.new}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm"
                                value={passwords.confirm}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Update Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <FiBell className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">New Case Matches</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Alerts when a citizen case matches your criteria</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifications.newMatches}
                                onChange={() => toggleNotification('newMatches')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Volunteer Updates</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Updates from volunteers working on your cases</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifications.volunteerUpdates}
                                onChange={() => toggleNotification('volunteerUpdates')}
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

export default NGOSettings;
