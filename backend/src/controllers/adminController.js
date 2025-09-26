import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

// Get dashboard analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get events by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate("user", "name email")
      .populate("event", "name")
      .sort("-bookedAt")
      .limit(10);
    
    // Get popular events
    const popularEvents = await Event.find()
      .sort("-attendees")
      .limit(5)
      .select("name attendees date");
    
    res.json({
      totalUsers,
      totalEvents,
      totalBookings,
      bookingsByStatus,
      eventsByCategory,
      recentBookings,
      popularEvents
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};
