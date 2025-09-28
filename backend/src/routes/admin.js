import express from "express";
import { 
  getAnalytics, 
  getRealTimeStats,
  getUserActivityLogs,
  exportAnalytics,
  getUsers, 
  updateUserRole 
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, admin);

router.get("/analytics", getAnalytics);
router.get("/real-time-stats", getRealTimeStats);
router.get("/user-activity/:userId", getUserActivityLogs);
router.get("/export", exportAnalytics);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);

export default router;
