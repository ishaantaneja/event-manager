import express from "express";
import { getAnalytics, getUsers, updateUserRole } from "../controllers/adminController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, admin);

router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);

export default router;
