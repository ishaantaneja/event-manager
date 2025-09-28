import express from "express";
import {
  searchExternalEvents,
  getTrendingEvents,
  getEventsByLocation,
  getAvailableLocations,
  getEventCategories,
  importExternalEvent
} from "../controllers/externalEventController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/search", searchExternalEvents);
router.get("/trending", getTrendingEvents);
router.get("/locations", getAvailableLocations);
router.get("/categories", getEventCategories);
router.get("/location/:location", getEventsByLocation);

// Protected routes
router.post("/import", protect, admin, importExternalEvent);

export default router;
