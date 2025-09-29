import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser } from "../socket/socketHandlers.js";

// Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate("relatedEvent", "name date")
      .populate("relatedBooking", "status")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
    });
  } catch (error) {
    next(error);
  }
};

// Create notification (internal use)
export const createNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...notificationData
    });
    
    // Emit real-time notification
    const io = global.io; // Assuming io is stored globally
    if (io) {
      emitToUser(io, userId, "new-notification", notification);
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Mark notifications as read
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;
    
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        user: req.user._id
      },
      { read: true }
    );
    
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get unread count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
export const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    
    const defaultPreferences = {
      emailNotifications: true,
      bookingConfirmations: true,
      eventReminders: true,
      eventUpdates: true,
      promotions: false,
      newsletter: false
    };
    
    res.json(user?.notificationPreferences || defaultPreferences);
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
export const updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences 
    });
  } catch (error) {
    next(error);
  }
};
