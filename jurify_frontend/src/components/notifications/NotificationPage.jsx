import React, { useState } from 'react';
import { FiArrowLeft, FiSettings, FiDownload } from 'react-icons/fi';
import NotificationList from './NotificationList';
import { useNotifications } from './useNotifications';

const NotificationPage = ({ onBack, className = "", onClose }) => {
  const {
    notifications,
    filteredNotifications,
    loading,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotifications
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={` h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-b-0 p-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(onClose || onBack) && (
              <button
                onClick={onClose || onBack}
                className="p-2 text-primary hover:text-primary-dark transition"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All notifications read'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export */}
            <button
              onClick={() => {
                // Export functionality can be added here
                const dataStr = JSON.stringify(filteredNotifications, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `notifications_${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              className="p-2 text-primary hover:text-primary-dark transition"
              title="Export notifications"
            >
              <FiDownload className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-primary hover:text-primary-dark transition"
              title="Notification settings"
            >
              <FiSettings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto ">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4 transition-colors duration-300">
            <div className="max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Notification Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Notifications</h4>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
                    <span>Receive email notifications</span>
                  </label>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Push Notifications</h4>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
                    <span>Browser push notifications</span>
                  </label>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Auto-delete Read</h4>
                  <select className="w-full text-sm border border-gray-300 rounded px-2 py-1">
                    <option value="never">Never</option>
                    <option value="7">After 7 days</option>
                    <option value="30">After 30 days</option>
                    <option value="90">After 90 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification List */}
        <NotificationList
          notifications={filteredNotifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotifications}
          onFilterChange={setFilter}
          className="rounded-t-none"
        />

        {/* Empty State for no notifications */}
        {notifications.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 p-8 text-center transition-colors duration-300">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538.214 1.055.595 1.436L5 17h5m6 0v3m6 0h3m-3-9a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-400 mb-4">
              When you receive notifications about your cases, they'll appear here.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              <p>Notifications you may receive:</p>
              <ul className="mt-2 space-y-1 text-left max-w-xs mx-auto">
                <li>• New messages from lawyers or NGOs</li>
                <li>• Case status updates</li>
                <li>• Document uploads</li>
                <li>• Assignment notifications</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
