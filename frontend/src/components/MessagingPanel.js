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
  const [adminUser, setAdminUser] = useState(null);
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
    if (!isAdmin) {
      fetchAdminUser();
    }
    
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
  }, [socket, selectedConversation, isAdmin]);

  const fetchAdminUser = async () => {
    try {
      const { data } = await api.get('/admin/users?role=admin&limit=1');
      if (data.users && data.users.length > 0) {
        setAdminUser(data.users[0]);
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

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

  const startNewConversationWithAdmin = () => {
    if (adminUser) {
      const adminConv = {
        user: adminUser,
        lastMessage: null,
        unreadCount: 0
      };
      selectConversation(adminConv);
      // Add admin to conversations if not already there
      const existingAdminConv = conversations.find(c => c.user._id === adminUser._id);
      if (!existingAdminConv) {
        setConversations(prev => [adminConv, ...prev]);
      }
    }
  };

  return (
    <div className="flex h-96 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-lg shadow-2xl border border-purple-500/30 overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 bg-black/40 backdrop-blur-sm border-r border-purple-500/30 overflow-y-auto">
        <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
          <h3 className="font-bold text-purple-300 text-lg">Messages</h3>
          {!isAdmin && adminUser && (
            <button
              onClick={startNewConversationWithAdmin}
              className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/50"
            >
              <span className="flex items-center justify-center">
                <span className="mr-2">💬</span> Contact Support
              </span>
            </button>
          )}
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-4 text-purple-300 text-center">
            <p className="text-sm opacity-75">No conversations yet</p>
            {!isAdmin && (
              <p className="text-xs mt-2 opacity-50">Click "Contact Support" to start</p>
            )}
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.user._id}
              onClick={() => selectConversation(conv)}
              className={`p-4 border-b border-purple-500/20 cursor-pointer transition-all duration-200 ${
                selectedConversation?.user._id === conv.user._id 
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30' 
                  : 'hover:bg-purple-800/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-purple-200">{conv.user.name}</h4>
                    {isUserOnline(conv.user._id) && (
                      <span className="ml-2 w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-sm text-purple-400 truncate mt-1 opacity-75">
                    {conv.lastMessage?.content || 'Start a conversation'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-purple-200">{selectedConversation.user.name}</h3>
                {isUserOnline(selectedConversation.user._id) && (
                  <span className="text-sm text-green-400">● Online</span>
                )}
                {isUserTyping(selectedConversation.user._id) && (
                  <span className="text-sm text-purple-400 animate-pulse">Typing...</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-purple-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-2 text-sm">Loading messages...</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${
                      message.sender._id === userInfo._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg shadow-lg ${
                        message.sender._id === userInfo._id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gradient-to-r from-gray-700 to-gray-800 text-purple-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender._id === userInfo._id ? 'text-purple-200' : 'text-purple-400'
                      } opacity-75`}>
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-500/30 bg-black/40">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-100 placeholder-purple-400"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-purple-400">
            <div className="text-center">
              <p className="text-lg mb-2">Select a conversation to start messaging</p>
              {!isAdmin && adminUser && (
                <button
                  onClick={startNewConversationWithAdmin}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/50"
                >
                  Start Chat with Support
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPanel;
