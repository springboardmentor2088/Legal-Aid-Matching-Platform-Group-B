import { useState, useCallback, useEffect } from 'react';
import { chatEvents } from '../../utils/chatEvents';
import { playNotificationSound } from '../../utils/notificationSound';
import { stompService } from '../../services/stompService';

// Mock notification data - replace with API calls
const mockNotifications = [
  {
    id: 1,
    type: 'message',
    title: 'New message from Advocate Sharma',
    message: 'I have reviewed your property documents. Let\'s schedule a meeting to discuss the next steps.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    caseId: 1,
    caseNumber: 'CN-2024-0001'
  },
  {
    id: 2,
    type: 'case',
    title: 'Case assigned to lawyer',
    message: 'Your property dispute case has been assigned to Advocate Sharma.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    caseId: 1,
    caseNumber: 'CN-2024-0001'
  },
  {
    id: 3,
    type: 'file',
    title: 'Document uploaded',
    message: 'New document uploaded to your case: Property_Deed_2024.pdf',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: false,
    caseId: 2,
    caseNumber: 'CN-2024-0002'
  },
  {
    id: 4,
    type: 'message',
    title: 'Message from Legal Aid Foundation',
    message: 'We have received your case and will begin processing shortly.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    read: true,
    caseId: 2,
    caseNumber: 'CN-2024-0002'
  },
  {
    id: 5,
    type: 'case',
    title: 'Case status updated',
    message: 'Your employment contract review case status has been updated to "Active".',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    read: false,
    caseId: 2,
    caseNumber: 'CN-2024-0002'
  }
];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await fetch(
        `${baseUrl}/notifications?filter=${filter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Check for new notifications to play sound
        setNotifications(prev => {
          // If this is the first load, don't play sound
          if (prev.length === 0 && loading) return data;

          const newUnread = data.filter(n => !n.read);
          const oldUnreadCount = prev.filter(n => !n.read).length;

          // Simple check: if unread count increased, play sound
          // More robust: check if any new ID exists that wasn't there before
          const newIds = new Set(data.map(n => n.id));
          const hasNewItems = data.some(n => !n.read && !prev.some(p => p.id === n.id));

          if (hasNewItems) {
            const soundEnabled = localStorage.getItem('notificationSound') !== 'off';
            if (soundEnabled && !document.hasFocus()) {
              playNotificationSound();
            }
          }

          return data;
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      await fetch(`${baseUrl}/notifications/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: notificationIds })
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      await fetch(`${baseUrl}/notifications/read/all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notifications
  const deleteNotifications = useCallback(async (notificationIds) => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      await fetch(`${baseUrl}/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: notificationIds })
      });

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id))
      );
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get filtered notifications (client-side filtering)
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  // Add notification from chat events
  const addNotification = useCallback((notification) => {
    setNotifications(prev =>
      prev.some(n => n.id === notification.id)
        ? prev
        : [notification, ...prev]
    );
  }, []);

  // Listen to chat events for real-time notifications
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const unsubscribe = chatEvents.subscribe(event => {
      if (event.type !== 'NEW_MESSAGE') return;

      const message = event.payload;

      // Ignore own messages
      if (message.isOwnMessage) return;

      // Suppress notifications when chat is already open
      if (window.location.pathname.includes(`/cases/${message.caseId}`)) {
        return;
      }

      // Add notification
      addNotification({
        id: `message-${message.id}`,
        type: 'message',
        title: `New message from ${message.senderName || 'Someone'}`,
        message: message.content || 'You received a new message',
        caseId: message.caseId,
        caseNumber: message.caseNumber,
        timestamp: new Date(message.createdAt || Date.now()),
        read: false,
      });

      // Respect tab focus - don't play sound if tab is focused
      if (document.hasFocus()) {
        return;
      }

      // Check user mute preference (default = enabled)
      const soundEnabled = localStorage.getItem('notificationSound') !== 'off';

      if (soundEnabled) {
        playNotificationSound();
      }
    });

    return unsubscribe;
  }, [addNotification]);

  // Listen to STOMP notifications
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    stompService.connect(token);

    stompService.subscribe('/user/queue/notifications', (notification) => {
      console.log('Received real-time notification:', notification);

      // Add to local state
      addNotification(notification);

      // Play sound if not focused
      if (!document.hasFocus()) {
        const soundEnabled = localStorage.getItem('notificationSound') !== 'off';
        if (soundEnabled) playNotificationSound();
      }

      // DISPATCH REFRESH EVENT
      // This is the key: tell any listener to reload their data
      const refreshEvent = new CustomEvent('JURIFY_REFRESH_DATA', {
        detail: { type: notification.type, original: notification }
      });
      window.dispatchEvent(refreshEvent);
    });

    return () => {
      stompService.unsubscribe('/user/queue/notifications');
      // We don't necessarily want to disconnect global stompService here
      // as other hooks might be using it.
    };
  }, [addNotification]);

  return {
    notifications,
    filteredNotifications,
    loading,
    filter,
    setFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    fetchNotifications
  };
};
