import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Store online users
const onlineUsers = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Authenticate socket connection
  socket.on("authenticate", async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (user) {
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        onlineUsers.set(socket.userId, socket.id);
        
        // Join user to their personal room
        socket.join(socket.userId);
        
        // If admin, join admin room
        if (user.role === "admin") {
          socket.join("admin-room");
        }
        
        // Notify about online status
        io.emit("user-online", { userId: socket.userId });
        
        // Send unread messages count
        const unreadCount = await Message.countDocuments({
          receiver: socket.userId,
          read: false
        });
        
        socket.emit("unread-messages", { count: unreadCount });
        
        // Send unread notifications count
        const unreadNotifications = await Notification.countDocuments({
          user: socket.userId,
          read: false
        });
        
        socket.emit("unread-notifications", { count: unreadNotifications });
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      socket.emit("auth-error", "Invalid token");
    }
  });

  // Handle sending messages
  socket.on("send-message", async (data) => {
    try {
      const { receiverId, content } = data;
      
      if (!socket.userId) {
        return socket.emit("error", "Not authenticated");
      }
      
      // Create conversation ID (sorted user IDs for consistency)
      const conversationId = [socket.userId, receiverId].sort().join("-");
      
      // Save message to database
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
        conversationId
      });
      
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");
      
      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new-message", populatedMessage);
        
        // Create notification
        await Notification.create({
          user: receiverId,
          type: "new_message",
          title: "New Message",
          message: `You have a new message from ${populatedMessage.sender.name}`,
          actionUrl: `/messages`
        });
        
        io.to(receiverSocketId).emit("new-notification", {
          title: "New Message",
          message: `New message from ${populatedMessage.sender.name}`
        });
      }
      
      // Send confirmation to sender
      socket.emit("message-sent", populatedMessage);
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Get conversation messages
  socket.on("get-messages", async (data) => {
    try {
      const { otherUserId, page = 1, limit = 50 } = data;
      
      if (!socket.userId) {
        return socket.emit("error", "Not authenticated");
      }
      
      const conversationId = [socket.userId, otherUserId].sort().join("-");
      
      const messages = await Message.find({ conversationId })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
      
      // Mark messages as read
      await Message.updateMany(
        {
          conversationId,
          receiver: socket.userId,
          read: false
        },
        { read: true }
      );
      
      socket.emit("messages-loaded", messages.reverse());
    } catch (error) {
      console.error("Get messages error:", error);
      socket.emit("error", "Failed to load messages");
    }
  });

  // Get conversation list (for admin)
  socket.on("get-conversations", async () => {
    try {
      if (!socket.userId || socket.userRole !== "admin") {
        return socket.emit("error", "Not authorized");
      }
      
      // Get all unique conversations with admin
      const messages = await Message.find({
        $or: [
          { sender: socket.userId },
          { receiver: socket.userId }
        ]
      }).populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 });
      
      // Group by conversation
      const conversationsMap = new Map();
      
      messages.forEach(msg => {
        const otherUser = msg.sender._id.toString() === socket.userId 
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
      for (const [userId, conv] of conversationsMap) {
        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: socket.userId,
          read: false
        });
        conv.unreadCount = unreadCount;
      }
      
      const conversations = Array.from(conversationsMap.values());
      socket.emit("conversations-loaded", conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      socket.emit("error", "Failed to load conversations");
    }
  });

  // Handle typing indicators
  socket.on("typing-start", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { userId: socket.userId });
    }
  });

  socket.on("typing-stop", (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-stopped-typing", { userId: socket.userId });
    }
  });

  // Broadcast new event to all users
  socket.on("new-event", (eventData) => {
    io.emit("event-created", eventData);
  });

  // Broadcast event update
  socket.on("update-event", (eventData) => {
    io.emit("event-updated", eventData);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("user-offline", { userId: socket.userId });
    }
  });
};

// Utility function to emit events from outside socket handlers
export const emitToUser = (io, userId, event, data) => {
  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

export const emitToAll = (io, event, data) => {
  io.emit(event, data);
};

export const emitToAdmins = (io, event, data) => {
  io.to("admin-room").emit(event, data);
};
