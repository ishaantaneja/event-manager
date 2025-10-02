import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.use(protect); // All message routes require authentication

// Start support chat endpoint
router.post('/support/start', async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId).select('name email');
    
    // Find an available admin
    const admin = await User.findOne({ role: 'admin' }).select('_id name email');
    
    if (!admin) {
      return res.status(503).json({ 
        success: false, 
        message: 'No support agents available at the moment' 
      });
    }
    
    // Create a unique conversation ID
    const conversationId = `support_${userId}_${admin._id}_${Date.now()}`;
    
    // Check if there's an existing support conversation
    const existingMessage = await Message.findOne({
      $or: [
        { sender: userId, receiver: admin._id },
        { sender: admin._id, receiver: userId }
      ],
      conversationId: { $regex: /^support_/ }
    }).sort('-createdAt');
    
    let conversation;
    
    if (existingMessage && existingMessage.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      // Use existing conversation if less than 24 hours old
      conversation = {
        _id: existingMessage.conversationId,
        participants: [
          { _id: userId, name: currentUser.name, email: currentUser.email, role: 'user' },
          { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
        ],
        lastMessage: null,
        unreadCount: 0
      };
    } else {
      // Create new conversation
      conversation = {
        _id: conversationId,
        participants: [
          { _id: userId, name: currentUser.name, email: currentUser.email, role: 'user' },
          { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
        ],
        lastMessage: null,
        unreadCount: 0
      };
      
      // Send notification to admin
      const notification = await Notification.create({
        user: admin._id,
        type: 'new_message',
        title: 'New Support Request',
        message: `New support chat from ${currentUser.name}`,
        relatedId: conversationId,
        relatedModel: 'Message'
      });
      
      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${admin._id}`).emit('new-notification', notification);
      }
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error starting support chat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start support chat' 
    });
  }
});

// Admin endpoint to get all support conversations
router.get('/admin/conversations', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    // Get all support conversations
    const messages = await Message.find({
      conversationId: { $regex: /^support_/ }
    }).populate('sender receiver', 'name email role')
      .sort('-createdAt');
    
    // Group by conversation
    const conversationsMap = {};
    messages.forEach(msg => {
      if (!conversationsMap[msg.conversationId]) {
        // Build participants list from sender/receiver
        const participants = [];
        if (msg.sender && !participants.find(p => p._id.toString() === msg.sender._id.toString())) {
          participants.push({
            _id: msg.sender._id,
            name: msg.sender.name,
            email: msg.sender.email,
            role: msg.sender.role
          });
        }
        if (msg.receiver && !participants.find(p => p._id.toString() === msg.receiver._id.toString())) {
          participants.push({
            _id: msg.receiver._id,
            name: msg.receiver.name,
            email: msg.receiver.email,
            role: msg.receiver.role
          });
        }
        
        conversationsMap[msg.conversationId] = {
          _id: msg.conversationId,
          participants: participants,
          lastMessage: msg,
          messages: [],
          unreadCount: 0
        };
      }
      conversationsMap[msg.conversationId].messages.push(msg);
      
      // Update participants if new ones found
      const conv = conversationsMap[msg.conversationId];
      if (msg.sender && !conv.participants.find(p => p._id.toString() === msg.sender._id.toString())) {
        conv.participants.push({
          _id: msg.sender._id,
          name: msg.sender.name,
          email: msg.sender.email,
          role: msg.sender.role
        });
      }
      if (msg.receiver && !conv.participants.find(p => p._id.toString() === msg.receiver._id.toString())) {
        conv.participants.push({
          _id: msg.receiver._id,
          name: msg.receiver.name,
          email: msg.receiver.email,
          role: msg.receiver.role
        });
      }
    });
    
    // Count unread messages for each conversation
    for (const convId in conversationsMap) {
      const conv = conversationsMap[convId];
      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        receiver: req.user._id,
        read: false
      });
      conv.unreadCount = unreadCount;
    }
    
    const conversations = Object.values(conversationsMap);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations' 
    });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email role')
      .sort('createdAt');
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch messages' 
    });
  }
});

// Send message in a conversation (support chat compatible)
router.post('/send', async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    
    if (!conversationId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId and content are required' 
      });
    }
    
    // Determine receiver from conversationId
    // Support chat format: support_userId_adminId_timestamp
    // Regular chat format: userId1-userId2 (sorted)
    let receiverId;
    
    if (conversationId.startsWith('support_')) {
      // Support chat - extract the other participant's ID
      const parts = conversationId.split('_');
      const userId = parts[1];
      const adminId = parts[2];
      
      // If sender is user, receiver is admin, and vice versa
      receiverId = senderId.toString() === userId ? adminId : userId;
    } else {
      // Regular chat - extract other user ID from conversationId
      const [id1, id2] = conversationId.split('-');
      receiverId = senderId.toString() === id1 ? id2 : id1;
    }
    
    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      conversationId
    });
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role');
    
    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new-message', populatedMessage);
    }
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message' 
    });
  }
});

// Original routes (excluding send - handled above)
router.get("/conversations", getConversations);
router.get("/messages/:otherUserId", getMessages);
router.put("/mark-read", markAsRead);
router.delete("/:messageId", deleteMessage);
router.get("/unread-count", getUnreadCount);

export default router;
