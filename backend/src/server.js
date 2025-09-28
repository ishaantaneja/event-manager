import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import bookingRoutes from "./routes/bookings.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import savedEventRoutes from "./routes/savedEvents.js";
import externalEventsRoutes from "./routes/externalEvents.js";
import errorHandler from "./middleware/errorHandler.js";
import { handleSocketConnection } from "./socket/socketHandlers.js";
import { sendEventReminders } from "./utils/reminderService.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
});

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests, try again later" 
});
app.use(limiter);

// CORS
app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:3000", 
  credentials: true 
}));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/saved-events", savedEventRoutes);
app.use("/api/external-events", externalEventsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Event Management API running!", 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "API endpoint not found" }));

// Global error handler
app.use(errorHandler);

// Socket.io connection handling
io.on("connection", (socket) => {
  handleSocketConnection(io, socket);
});

// Schedule cron jobs
// Send event reminders every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily event reminders...');
  await sendEventReminders();
});

// Start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log("✅ MongoDB connected");
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io ready for real-time connections`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => { 
  console.error("❌ Unhandled Rejection:", err.message); 
  process.exit(1); 
});

startServer();
