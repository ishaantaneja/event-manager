// src/routes/users.js
import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { getProfile } from "../controllers/authController.js";

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, getProfile);

// @desc    Add or remove bookmark for an event
// @route   PUT /api/users/bookmark/:eventId
// @access  Private
router.put("/bookmark/:eventId", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const eventId = req.params.eventId;

    if (user.bookmarks.includes(eventId)) {
      user.bookmarks = user.bookmarks.filter((id) => id.toString() !== eventId);
    } else {
      user.bookmarks.push(eventId);
    }

    await user.save();
    res.json({ success: true, bookmarks: user.bookmarks });
  } catch (err) {
    next(err);
  }
});

// @desc    Update user preferences (categories & locations)
// @route   PUT /api/users/preferences
// @access  Private
router.put("/preferences", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { categories, locations } = req.body;

    if (categories) user.preferences.categories = categories;
    if (locations) user.preferences.locations = locations;

    await user.save();
    res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    next(err);
  }
});

// @desc    Get user bookmarks and preferences
// @route   GET /api/users/me
// @access  Private
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("bookmarks");
    res.json({ success: true, bookmarks: user.bookmarks, preferences: user.preferences });
  } catch (err) {
    next(err);
  }
});

export default router;
