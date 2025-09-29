import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread
  const { socket, unreadNotifications } = useSocket();

  useEffect(() => {
    fetchNotifications();
    
    if (socket) {
      socket.on('new-notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('new-notification');
      }
    };
  }, [socket, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = filter === 'unread' ? '?unreadOnly=true' : '';
      const { data } = await api.get(`/notifications${params}`);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await api.put('/notifications/mark-read', { notificationIds });
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif._id) 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking_confirmation: '✅',
      booking_reminder: '⏰',
      event_update: '📝',
      event_cancelled: '❌',
      new_message: '💬',
      admin_message: '👨‍💼'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      booking_confirmation: 'bg-green-100 border-green-500',
      booking_reminder: 'bg-yellow-100 border-yellow-500',
      event_update: 'bg-blue-100 border-blue-500',
      event_cancelled: 'bg-red-100 border-red-500',
      new_message: 'bg-purple-100 border-purple-500',
      admin_message: 'bg-indigo-100 border-indigo-500'
    };
    return colors[type] || 'bg-gray-100 border-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadNotifications > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadNotifications} new
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-l-4 rounded-lg ${getNotificationColor(notification.type)} ${
                !notification.read ? 'font-semibold' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      {notification.actionUrl && (
                        <Link
                          to={notification.actionUrl}
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          View Details →
                        </Link>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead([notification._id])}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
