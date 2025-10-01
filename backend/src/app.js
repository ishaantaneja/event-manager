import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// ✅ CORS must come before helmet and routes
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  credentials: true,
}));

// ✅ Explicitly respond to OPTIONS requests
app.options("*", cors());

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);

// Error handler
app.use(errorHandler);

export default app;
