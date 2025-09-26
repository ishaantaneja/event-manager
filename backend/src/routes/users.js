import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Update user preferences
router.put("/preferences", protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: req.body.preferences },
      { new: true }
    ).select("-password");
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Add bookmark
router.post("/bookmarks/:eventId", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.bookmarks.includes(req.params.eventId)) {
      user.bookmarks.push(req.params.eventId);
      await user.save();
    }
    
    res.json({ message: "Event bookmarked successfully" });
  } catch (error) {
    next(error);
  }
});

// Remove bookmark
router.delete("/bookmarks/:eventId", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.bookmarks = user.bookmarks.filter(
      bookmark => bookmark.toString() !== req.params.eventId
    );
    await user.save();
    
    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    next(error);
  }
});

// Get bookmarked events
router.get("/bookmarks", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("bookmarks");
    res.json(user.bookmarks);
  } catch (error) {
    next(error);
  }
});

export default router;
