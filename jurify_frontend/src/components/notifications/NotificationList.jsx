import React, { useState, useMemo } from "react";
import { formatRelativeTime } from '../../utils/timeUtils';
import {
  FiBell,
  FiCheck,
  FiX,
  FiFilter,
  FiClock,
  FiMessageSquare,
  FiFile,
  FiUser,
  FiCheckCircle,
} from "react-icons/fi";

const NotificationList = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onFilterChange,
  className = "",
}) => {
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "read":
        return notifications.filter((n) => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Get notification counts
  const counts = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      read: notifications.filter((n) => n.read).length,
    }),
    [notifications]
  );

  // Handle notification selection
  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  // Handle bulk actions
  const handleMarkSelectedAsRead = () => {
    const unreadSelected = Array.from(selectedNotifications).filter(
      (id) => !notifications.find((n) => n.id === id)?.read
    );
    if (unreadSelected.length > 0 && onMarkAsRead) {
      onMarkAsRead(unreadSelected);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.size > 0 && onDelete) {
      onDelete(Array.from(selectedNotifications));
    }
    setSelectedNotifications(new Set());
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <FiMessageSquare className="w-4 h-4 text-blue-500" />;
      case "file":
        return <FiFile className="w-4 h-4 text-green-500" />;
      case "case":
        return <FiUser className="w-4 h-4 text-purple-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };



  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Notifications
            </h2>
            {counts.unread > 0 && (
              <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                {counts.unread}
              </span>
            )}
          </div>

          {selectedNotifications.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNotifications.size} selected
              </span>
              <button
                onClick={handleMarkSelectedAsRead}
                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition"
              >
                Mark as Read
              </button>
              <button
                onClick={handleDeleteSelected}
                className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-400" />

          {["all", "unread", "read"].map((type) => {
            const isActive = filter === type;

            const showBadge =
              !isActive &&
              ((type === "unread" && counts.unread > 0) ||
                (type === "read" && counts.read > 0));

            const badgeCount = type === "unread" ? counts.unread : counts.read;

            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 text-xs font-medium rounded transition ${isActive
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}

                {showBadge && (
                  <span className="ml-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="text-xs text-primary hover:text-primary-dark transition"
            >
              {selectedNotifications.size === filteredNotifications.length
                ? "Deselect All"
                : "Select All"}
            </button>

            {counts.unread > 0 && (
              <button
                onClick={() => onMarkAllAsRead && onMarkAllAsRead()}
                className="text-xs bg-primary-light text-primary px-2 py-1 rounded hover:bg-green-100 transition"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                  ? "No read notifications"
                  : "No notifications"}
            </h3>
            <p className="text-sm text-gray-400">
              {filter === "unread"
                ? "All caught up!"
                : filter === "read"
                  ? "No read notifications yet"
                  : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!notification.read
                  ? "bg-primary-light/30 dark:bg-teal-900/10 border-l-4 border-l-primary"
                  : "border-l-4 border-l-transparent"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />

                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-medium truncate ${!notification.read
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-700 dark:text-gray-400"
                            }`}
                        >
                          {notification.title || "Notification"}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-500 mt-1 line-clamp-2">
                          {notification.message || notification.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <FiClock className="w-3 h-3 text-primary" />
                          <span className="text-xs text-primary">
                            {formatRelativeTime(notification.createdAt || notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <span className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && onMarkAsRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead([notification.id]);
                            }}
                            className="p-1 text-primary hover:text-primary-dark transition"
                            title="Mark as read"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete([notification.id]);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 transition"
                            title="Delete"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="sticky bottom-0 px-4 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/90 text-sm">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredNotifications.length} of {counts.total}{" "}
              notifications
            </span>
            {counts.unread > 0 && (
              <span className="font-medium text-primary text-xs">
                {counts.unread} unread
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
