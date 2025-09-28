import Message from "../models/Message.js";
import User from "../models/User.js";
import { emitToUser } from "../socket/socketHandlers.js";

// Get all conversations for a user
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get all messages for the user
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });
    
    // Group messages by conversation
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === userId.toString() 
        ? msg.receiver 
        : msg.sender;
      
      const key = otherUser._id.toString();
      
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }
    });
    
    // Count unread messages for each conversation
    for (const [otherUserId, conv] of conversationsMap) {
      const unreadCount = await Message.countDocuments({
        sender: otherUserId,
        receiver: userId,
        read: false
      });
      conv.unreadCount = unreadCount;
    }
    
    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const conversationId = [userId.toString(), otherUserId].sort().join("-");
    
    const messages = await Message.find({ conversationId })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));
    
    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        read: false
      },
      { read: true }
    );
    
    const totalMessages = await Message.countDocuments({ conversationId });
    
    res.json({
      messages: messages.reverse(),
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    });
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content } = req.body;
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    
    const conversationId = [senderId.toString(), receiverId].sort().join("-");
    
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      conversationId
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");
    
    // Emit real-time notification through Socket.io
    const io = req.app.get('io');
    if (io) {
      emitToUser(io, receiverId, "new-message", populatedMessage);
    }
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { messageIds } = req.body;
    
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId
      },
      { read: true }
    );
    
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Only sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get unread message count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const count = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};
