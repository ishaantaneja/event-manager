import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All message routes require authentication

router.get("/conversations", getConversations);
router.get("/conversation/:otherUserId", getMessages);
router.post("/send", sendMessage);
router.put("/mark-read", markAsRead);
router.delete("/:messageId", deleteMessage);
router.get("/unread-count", getUnreadCount);

export default router;
