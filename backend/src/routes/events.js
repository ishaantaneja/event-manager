// src/routes/events.js
import express from "express";
import { 
  createEvent, getEvents, getEventById, updateEvent, deleteEvent,
  addComment, getComments
} from "../controllers/eventController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// ----------------- Event CRUD -----------------
// Public
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin only
router.post("/", protect, authorize("admin"), createEvent);
router.put("/:id", protect, authorize("admin"), updateEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

// ----------------- Comments -----------------
// Protected
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", getComments);

export default router;
