// src/controllers/eventController.js
import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

// ----------------- Helper: unified error handler -----------------
const handleNotFound = (res, entity = "Resource") =>
  res.status(404).json({ success: false, message: `${entity} not found` });

const handleUnauthorized = (res) =>
  res.status(403).json({ success: false, message: "Not authorized" });

// ----------------- Event CRUD -----------------
export const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user.id });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.maxPrice) query.price = { $lte: req.query.maxPrice };
    const events = await Event.find(query).populate("organizer", "name email");
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer attendees", "name email");
    if (!event) return handleNotFound(res, "Event");
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return handleNotFound(res, "Event");

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return handleUnauthorized(res);
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updatedEvent });
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return handleNotFound(res, "Event");

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return handleUnauthorized(res);
    }

    await event.remove();
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ----------------- Comments -----------------
export const addComment = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return handleNotFound(res, "Event");

    event.comments.push({ user: req.user.id, content: req.body.content });
    await event.save();

    res.status(201).json({ success: true, comments: event.comments });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("comments.user", "name");
    if (!event) return handleNotFound(res, "Event");

    res.json({ success: true, comments: event.comments });
  } catch (err) {
    next(err);
  }
};

// ----------------- Admin Stats -----------------
export const getStats = async (req, res, next) => {
  try {
    const [events, users, bookings] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
    ]);
    res.json({ success: true, data: { events, users, bookings } });
  } catch (err) {
    next(err);
  }
};
