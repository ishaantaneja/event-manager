import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo?.token) {
      // Connect to socket server - use same URL as API (Socket.io runs on same server/port)
      const SOCKET_URL = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace('/api', '') 
        : 'http://localhost:5000';
      
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Allow both transports with polling as fallback
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        // Authenticate the socket connection
        newSocket.emit('authenticate', userInfo.token);
      });

      newSocket.on('auth-error', (error) => {
        console.error('Socket authentication error:', error);
        toast.error('Authentication failed. Please login again.');
      });

      newSocket.on('user-online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user-offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on('unread-messages', ({ count }) => {
        setUnreadMessages(count);
      });

      newSocket.on('unread-notifications', ({ count }) => {
        setUnreadNotifications(count);
      });

      newSocket.on('new-message', (message) => {
        setUnreadMessages(prev => prev + 1);
        toast(
          <div>
            <strong>{message.sender.name}</strong>
            <p>{message.content.substring(0, 50)}...</p>
          </div>,
          { icon: '💬' }
        );
      });

      newSocket.on('new-notification', (notification) => {
        setUnreadNotifications(prev => prev + 1);
        toast(notification.message, { icon: '🔔' });
      });

      newSocket.on('user-typing', ({ userId }) => {
        setTypingUsers(prev => new Map(prev.set(userId, true)));
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }, 3000);
      });

      newSocket.on('user-stopped-typing', ({ userId }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      newSocket.on('event-created', (event) => {
        toast(`New event: ${event.name}`, { icon: '🎉' });
      });

      newSocket.on('event-updated', (event) => {
        toast(`Event updated: ${event.name}`, { icon: '📝' });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [userInfo]);

  const sendMessage = (receiverId, content) => {
    if (socket) {
      socket.emit('send-message', { receiverId, content });
    }
  };

  const getMessages = (otherUserId, page = 1) => {
    if (socket) {
      socket.emit('get-messages', { otherUserId, page });
    }
  };

  const getConversations = () => {
    if (socket) {
      socket.emit('get-conversations');
    }
  };

  const startTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing-start', { receiverId });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing-stop', { receiverId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    unreadMessages,
    unreadNotifications,
    typingUsers,
    sendMessage,
    getMessages,
    getConversations,
    startTyping,
    stopTyping,
    isUserOnline: (userId) => onlineUsers.has(userId),
    isUserTyping: (userId) => typingUsers.get(userId) || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
