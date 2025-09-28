import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { format } from 'date-fns';

const MessagingPanel = ({ isAdmin = false }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { userInfo } = useSelector(state => state.auth);
  const { 
    socket, 
    sendMessage, 
    startTyping, 
    stopTyping, 
    isUserOnline, 
    isUserTyping 
  } = useSocket();

  useEffect(() => {
    fetchConversations();
    
    // Listen for new messages
    if (socket) {
      socket.on('message-sent', (message) => {
        if (message.conversationId === getConversationId()) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      socket.on('new-message', (message) => {
        if (message.sender._id === selectedConversation?.user._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        fetchConversations(); // Update last message in conversation list
      });

      socket.on('conversations-loaded', (convs) => {
        setConversations(convs);
      });

      socket.on('messages-loaded', (msgs) => {
        setMessages(msgs);
        scrollToBottom();
      });
    }

    return () => {
      if (socket) {
        socket.off('message-sent');
        socket.off('new-message');
        socket.off('conversations-loaded');
        socket.off('messages-loaded');
      }
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/conversation/${otherUserId}`);
      setMessages(data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationId = () => {
    if (!selectedConversation) return null;
    return [userInfo._id, selectedConversation.user._id].sort().join('-');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const tempMessage = {
      _id: Date.now(),
      sender: { _id: userInfo._id, name: userInfo.name },
      receiver: selectedConversation.user,
      content: messageText,
      createdAt: new Date(),
      read: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    scrollToBottom();

    try {
      await api.post('/messages/send', {
        receiverId: selectedConversation.user._id,
        content: tempMessage.content
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (selectedConversation && e.target.value) {
      startTyping(selectedConversation.user._id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedConversation.user._id);
      }, 1000);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    fetchMessages(conv.user._id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAdminBadge = () => {
    if (isAdmin) return null;
    return (
      <button
        onClick={() => startNewConversationWithAdmin()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Contact Support
      </button>
    );
  };

  const startNewConversationWithAdmin = async () => {
    try {
      // Find admin user
      const { data } = await api.get('/admin/users?role=admin&limit=1');
      if (data.users.length > 0) {
        const adminUser = data.users[0];
        selectConversation({ user: adminUser, unreadCount: 0 });
      }
    } catch (error) {
      console.error('Error finding admin:', error);
    }
  };

  return (
    <div className="flex h-96 bg-white rounded-lg shadow-lg">
      {/* Conversations List */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Messages</h3>
          {!isAdmin && getAdminBadge()}
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.user._id}
              onClick={() => selectConversation(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.user._id === conv.user._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{conv.user.name}</h4>
                    {isUserOnline(conv.user._id) && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage?.content || 'Start a conversation'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{selectedConversation.user.name}</h3>
                {isUserOnline(selectedConversation.user._id) && (
                  <span className="text-sm text-green-600">Online</span>
                )}
                {isUserTyping(selectedConversation.user._id) && (
                  <span className="text-sm text-gray-500">Typing...</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${
                      message.sender._id === userInfo._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender._id === userInfo._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender._id === userInfo._id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPanel;
