import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import compression from "compression";
import morgan from "morgan";

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

// Memory Management & Performance Monitoring
let connectionCount = 0;
const MAX_CONNECTIONS = 1000;

// Enhanced Socket.io setup with connection management
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "x-request-id"]
  },
  pingTimeout: 60000, // Increased timeout (60 seconds)
  pingInterval: 25000, // Keep-alive ping every 25 seconds
  transports: ['websocket', 'polling'], // Fallback support
  allowEIO3: true // Backward compatibility
});

// ⚠️ CRITICAL: CORS MUST BE FIRST MIDDLEWARE
// Enhanced CORS configuration
app.use(cors({ 
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001", // Alternative port
      "http://127.0.0.1:3000"  // IP-based access
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // In development, allow all origins
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'x-request-id'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache preflight response for 24 hours
}));

// Compression middleware (reduces bandwidth costs)
app.use(compression());

// Request logging (for debugging & monitoring)
app.use(morgan('combined'));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Enhanced Rate limiting with dynamic configuration
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      success: false, 
      message: "Too many requests, please slow down" 
    });
  }
});
app.use('/api/', limiter);

// Body parser with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

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

// Enhanced Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    res.json({ 
      status: dbState === 1 ? "OK" : "DEGRADED",
      message: "Event Management API running!",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      connections: connectionCount,
      memory: memoryMB,
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "1.0.0"
    });
  } catch (error) {
    res.status(503).json({ 
      status: "ERROR", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Connection monitoring endpoint
app.get("/api/stats", (req, res) => {
  res.json({
    activeConnections: connectionCount,
    maxConnections: MAX_CONNECTIONS,
    socketClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: "API endpoint not found",
    path: req.url,
    method: req.method
  });
});

// Enhanced global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Enhanced Socket.io connection handling with monitoring
io.on("connection", (socket) => {
  connectionCount++;
  
  if (connectionCount > MAX_CONNECTIONS) {
    console.warn('Max connections reached, disconnecting new client');
    socket.emit('error', { message: 'Server at capacity, please try again later' });
    socket.disconnect(true);
    return;
  }
  
  console.log(`New socket connection: ${socket.id} (Total: ${connectionCount})`);
  
  socket.on("disconnect", (reason) => {
    connectionCount = Math.max(0, connectionCount - 1);
    console.log(`Socket disconnected: ${socket.id}, Reason: ${reason} (Total: ${connectionCount})`);
  });
  
  handleSocketConnection(io, socket);
});

// Schedule cron jobs
// Send event reminders every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily event reminders...');
  try {
    await sendEventReminders();
    console.log('Event reminders sent successfully');
  } catch (error) {
    console.error('Error sending event reminders:', error);
  }
});

// Memory cleanup cron job (runs every hour)
cron.schedule('0 * * * *', () => {
  console.log('Running hourly cleanup...');
  if (global.gc) {
    global.gc();
    console.log('Garbage collection completed');
  }
});

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Monitor database connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected, attempting reconnection...');
      setTimeout(() => connectDB(3), 5000);
    });
    
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection attempt failed: ${err.message}`);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    throw err;
  }
};

// Enhanced server startup
const startServer = async () => {
  try {
    await connectDB();
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io ready for real-time connections`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  // Close socket.io connections
  io.close(() => {
    console.log('Socket.io connections closed');
  });
  
  // Close database connection
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
  
  // Exit process
  process.exit(0);
};

// Process event handlers
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  if (process.env.NODE_ENV === 'production') {
    // Log to monitoring service
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();
