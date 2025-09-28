import SavedEvent from "../models/SavedEvent.js";
import Event from "../models/Event.js";
import { createNotification } from "./notificationController.js";

// Save event for later
export const saveEvent = async (req, res, next) => {
  try {
    const { eventId, notes, reminder } = req.body;
    const userId = req.user._id;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if already saved
    const existingSave = await SavedEvent.findOne({
      user: userId,
      event: eventId
    });
    
    if (existingSave) {
      return res.status(400).json({ message: "Event already saved" });
    }
    
    const savedEvent = await SavedEvent.create({
      user: userId,
      event: eventId,
      notes,
      reminder
    });
    
    // Create notification
    await createNotification(userId, {
      type: "event_update",
      title: "Event Saved",
      message: `You've saved "${event.name}" for later`,
      relatedEvent: eventId,
      actionUrl: `/saved-events`
    });
    
    res.status(201).json(savedEvent);
  } catch (error) {
    next(error);
  }
};

// Get user's saved events
export const getSavedEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    
    const savedEvents = await SavedEvent.find({ user: userId })
      .populate({
        path: "event",
        populate: {
          path: "organizer",
          select: "name email"
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));
    
    const total = await SavedEvent.countDocuments({ user: userId });
    
    res.json({
      savedEvents,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalSavedEvents: total
    });
  } catch (error) {
    next(error);
  }
};

// Update saved event (notes/reminder)
export const updateSavedEvent = async (req, res, next) => {
  try {
    const { savedEventId } = req.params;
    const { notes, reminder } = req.body;
    const userId = req.user._id;
    
    const savedEvent = await SavedEvent.findOneAndUpdate(
      { _id: savedEventId, user: userId },
      { notes, reminder },
      { new: true }
    ).populate("event");
    
    if (!savedEvent) {
      return res.status(404).json({ message: "Saved event not found" });
    }
    
    res.json(savedEvent);
  } catch (error) {
    next(error);
  }
};

// Remove saved event
export const removeSavedEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    
    const savedEvent = await SavedEvent.findOneAndDelete({
      user: userId,
      event: eventId
    });
    
    if (!savedEvent) {
      return res.status(404).json({ message: "Saved event not found" });
    }
    
    res.json({ message: "Event removed from saved list" });
  } catch (error) {
    next(error);
  }
};

// Check if event is saved
export const checkIfSaved = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    
    const savedEvent = await SavedEvent.findOne({
      user: userId,
      event: eventId
    });
    
    res.json({ isSaved: !!savedEvent, savedEvent });
  } catch (error) {
    next(error);
  }
};

// Get saved events count
export const getSavedCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await SavedEvent.countDocuments({ user: userId });
    
    res.json({ count });
  } catch (error) {
    next(error);
  }
};
