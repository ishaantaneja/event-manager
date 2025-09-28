import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getPreferences,
  updatePreferences
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get("/", getNotifications);
router.put("/mark-read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:notificationId", deleteNotification);
router.get("/unread-count", getUnreadCount);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

export default router;
