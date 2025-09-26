import express from "express";
import {
  createBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings
} from "../controllers/bookingController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
  .get(protect, getUserBookings)
  .post(protect, createBooking);

router.get("/all", protect, admin, getAllBookings);
router.put("/:id/cancel", protect, cancelBooking);

export default router;
