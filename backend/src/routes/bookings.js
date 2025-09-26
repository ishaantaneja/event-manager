import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route POST /api/bookings
router.post("/", protect, createBooking);

// @route GET /api/bookings/my
router.get("/my", protect, getMyBookings);

// @route DELETE /api/bookings/:id
router.delete("/:id", protect, cancelBooking);

export default router;
