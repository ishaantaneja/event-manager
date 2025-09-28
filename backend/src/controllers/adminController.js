import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Message from "../models/Message.js";
import SavedEvent from "../models/SavedEvent.js";

// Get comprehensive dashboard analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const { dateRange = "month" } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Basic counts
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ date: { $gte: now } });
    const totalBookings = await Booking.countDocuments();
    const newBookings = await Booking.countDocuments({ createdAt: { $gte: startDate } });
    
    // Revenue calculation
    const bookingsWithRevenue = await Booking.find({ status: "confirmed" })
      .populate("event", "price");
    const totalRevenue = bookingsWithRevenue.reduce((sum, booking) => 
      sum + (booking.event?.price || 0), 0);
    
    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Events by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Popular events (by attendee count)
    const popularEvents = await Event.find()
      .sort({ "attendees": -1 })
      .limit(5)
      .select("name attendees date location category");
    
    // Recent bookings
    const recentBookings = await Booking.find()
      .populate("user", "name email")
      .populate("event", "name date")
      .sort("-createdAt")
      .limit(10);
    
    // Top users (by booking count)
    const topUsers = await Booking.aggregate([
      {
        $group: {
          _id: "$user",
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          name: "$userDetails.name",
          email: "$userDetails.email",
          bookingCount: 1
        }
      }
    ]);
    
    // Location-based statistics
    const eventsByLocation = await Event.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Saved events statistics
    const totalSavedEvents = await SavedEvent.countDocuments();
    const mostSavedEvents = await SavedEvent.aggregate([
      {
        $group: {
          _id: "$event",
          saveCount: { $sum: 1 }
        }
      },
      { $sort: { saveCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventDetails"
        }
      },
      {
        $unwind: "$eventDetails"
      },
      {
        $project: {
          name: "$eventDetails.name",
          category: "$eventDetails.category",
          saveCount: 1
        }
      }
    ]);
    
    // Message statistics
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });
    
    // Conversion rate (users who made at least one booking)
    const usersWithBookings = await Booking.distinct("user");
    const conversionRate = totalUsers > 0 
      ? ((usersWithBookings.length / totalUsers) * 100).toFixed(2) 
      : 0;
    
    // Average bookings per user
    const avgBookingsPerUser = totalUsers > 0 
      ? (totalBookings / totalUsers).toFixed(2) 
      : 0;
    
    // Category performance (bookings per category)
    const categoryPerformance = await Booking.aggregate([
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventDetails"
        }
      },
      {
        $unwind: "$eventDetails"
      },
      {
        $group: {
          _id: "$eventDetails.category",
          bookings: { $sum: 1 },
          revenue: { $sum: "$eventDetails.price" }
        }
      },
      { $sort: { bookings: -1 } }
    ]);
    
    res.json({
      overview: {
        totalUsers,
        newUsers,
        totalEvents,
        upcomingEvents,
        totalBookings,
        newBookings,
        totalRevenue,
        totalSavedEvents,
        totalMessages,
        unreadMessages,
        conversionRate: parseFloat(conversionRate),
        avgBookingsPerUser: parseFloat(avgBookingsPerUser)
      },
      charts: {
        userGrowth,
        bookingTrends,
        bookingsByStatus,
        eventsByCategory,
        eventsByLocation,
        categoryPerformance
      },
      lists: {
        popularEvents,
        recentBookings,
        topUsers,
        mostSavedEvents
      },
      dateRange,
      generatedAt: new Date()
    });
  } catch (error) {
    next(error);
  }
};

// Get real-time statistics
export const getRealTimeStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      todaysBookings: await Booking.countDocuments({ 
        createdAt: { $gte: today } 
      }),
      todaysRevenue: 0,
      todaysNewUsers: await User.countDocuments({ 
        createdAt: { $gte: today } 
      }),
      todaysMessages: await Message.countDocuments({ 
        createdAt: { $gte: today } 
      }),
      activeEvents: await Event.countDocuments({ 
        date: { $gte: new Date() } 
      }),
      onlineUsers: 0 // This would be updated via Socket.io
    };
    
    // Calculate today's revenue
    const todaysBookings = await Booking.find({
      createdAt: { $gte: today },
      status: "confirmed"
    }).populate("event", "price");
    
    stats.todaysRevenue = todaysBookings.reduce((sum, booking) => 
      sum + (booking.event?.price || 0), 0);
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// Get user activity logs
export const getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's bookings
    const bookings = await Booking.find({ user: userId })
      .populate("event", "name date")
      .sort("-createdAt")
      .limit(10);
    
    // Get user's saved events
    const savedEvents = await SavedEvent.find({ user: userId })
      .populate("event", "name")
      .sort("-createdAt")
      .limit(10);
    
    // Get user's messages
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort("-createdAt")
      .limit(10);
    
    res.json({
      user,
      activities: {
        bookings,
        savedEvents,
        messagesCount: messages.length,
        lastActive: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export analytics data
export const exportAnalytics = async (req, res, next) => {
  try {
    const { format = "json", dateRange = "month" } = req.query;
    
    // Get analytics data
    const analyticsData = await getAnalytics(req, res, next);
    
    if (format === "csv") {
      // Convert to CSV format (simplified example)
      const csvData = "metric,value\n" +
        `Total Users,${analyticsData.overview.totalUsers}\n` +
        `Total Events,${analyticsData.overview.totalEvents}\n` +
        `Total Bookings,${analyticsData.overview.totalBookings}\n` +
        `Total Revenue,${analyticsData.overview.totalRevenue}\n`;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=analytics.csv");
      res.send(csvData);
    } else {
      res.json(analyticsData);
    }
  } catch (error) {
    next(error);
  }
};

// Get all users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", role = "all" } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }
    
    if (role !== "all") {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select("-password")
      .sort("-createdAt")
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
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
