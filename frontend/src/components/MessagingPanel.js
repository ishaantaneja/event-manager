import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MessagingPanel = ({ isAdmin = false }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [supportStarted, setSupportStarted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userInfo) {
      fetchConversations();
    }
  }, [userInfo]);

  useEffect(() => {
    if (socket && selectedConversation) {
      socket.on('new-message', handleNewMessage);
      socket.emit('join-conversation', selectedConversation._id);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.emit('leave-conversation', selectedConversation._id);
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const endpoint = isAdmin ? '/messages/admin/conversations' : '/messages/conversations';
      const { data } = await api.get(endpoint);
      setConversations(data);
      
      // Check if user has started support
      const hasSupport = data.some(conv => 
        conv.participants?.some(p => p.role === 'admin')
      );
      setSupportStarted(hasSupport || isAdmin);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === selectedConversation?._id) {
      setMessages(prev => [...prev, message]);
      // Mark as read if it's from the other person
      if (message.sender._id !== userInfo._id) {
        markAsRead(message._id);
      }
    }
    // Update conversation list
    fetchConversations();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data } = await api.post('/messages/send', {
        conversationId: selectedConversation._id,
        content: newMessage
      });
      
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Emit socket event
      if (socket) {
        socket.emit('send-message', data);
      }
      
      // Update conversation list
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  const startSupportChat = async () => {
    try {
      const { data } = await api.post('/messages/support/start');
      setSupportStarted(true);
      setConversations([data, ...conversations]);
      selectConversation(data);
      toast.success('Support chat started! An admin will respond soon.');
    } catch (error) {
      console.error('Error starting support chat:', error);
      toast.error('Failed to start support chat');
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Conversations List */}
        <div className="md:col-span-1 border-r border-purple-500/30 overflow-y-auto">
          <div className="p-4 border-b border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-300">
              {isAdmin ? '📨 Support Tickets' : '💬 Messages'}
            </h3>
            
            {/* Contact Support Button */}
            {!isAdmin && !supportStarted && (
              <button
                onClick={startSupportChat}
                className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center space-x-2"
              >
                <span>🎧</span>
                <span>Contact Support</span>
              </button>
            )}
            
            {conversations.length === 0 && supportStarted && (
              <p className="text-purple-400 text-sm mt-3">
                No conversations yet
              </p>
            )}
          </div>
          
          <div className="divide-y divide-purple-500/20">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants?.find(p => p._id !== userInfo._id);
              const isSelected = selectedConversation?._id === conversation._id;
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => selectConversation(conversation)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-purple-800/30 border-l-4 border-purple-500' 
                      : 'hover:bg-purple-800/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {otherParticipant?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-purple-200 truncate">
                        {otherParticipant?.name || 'Support Team'}
                        {otherParticipant?.role === 'admin' && (
                          <span className="ml-2 text-xs px-2 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full text-white">
                            ADMIN
                          </span>
                        )}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-sm text-purple-400 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="w-6 h-6 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages Area */}
        <div className="md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-purple-500/30 bg-gray-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedConversation.participants?.find(p => p._id !== userInfo._id)?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="font-semibold text-purple-200">
                      {selectedConversation.participants?.find(p => p._id !== userInfo._id)?.name || 'Support Team'}
                    </p>
                    <p className="text-xs text-purple-400">
                      {selectedConversation.participants?.find(p => p._id !== userInfo._id)?.role === 'admin' ? 'Admin Support' : 'Event Organizer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-purple-400">
                    <span className="text-4xl mb-3">💬</span>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isOwnMessage = message.sender._id === userInfo._id || message.sender === userInfo._id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div className={`px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-gray-800/50 text-purple-100 border border-purple-500/30'
                            }`}>
                              <p className="break-words">{message.content}</p>
                            </div>
                            <p className={`text-xs text-purple-500 mt-1 ${
                              isOwnMessage ? 'text-right' : 'text-left'
                            }`}>
                              {format(new Date(message.createdAt), 'MMM dd, hh:mm a')}
                              {isOwnMessage && message.read && ' • Read'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-purple-500/30 bg-gray-800/50">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-purple-400">
              <span className="text-6xl mb-4">💌</span>
              <p className="text-xl font-semibold mb-2">Select a conversation</p>
              <p className="text-sm">Choose a chat from the left to start messaging</p>
              
              {!isAdmin && !supportStarted && (
                <button
                  onClick={startSupportChat}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all shadow-lg shadow-green-500/30"
                >
                  🎧 Start Support Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPanel;
