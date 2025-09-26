import express from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addComment,
  getRecommendedEvents
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
  .get(getEvents)
  .post(protect, admin, createEvent);

router.get("/recommendations", protect, getRecommendedEvents);

router.route("/:id")
  .get(getEventById)
  .put(protect, admin, updateEvent)
  .delete(protect, admin, deleteEvent);

router.post("/:id/comments", protect, addComment);

export default router;
