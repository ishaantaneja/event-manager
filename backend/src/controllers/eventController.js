import Event from "../models/Event.js";
import User from "../models/User.js";

// Get all events with filters
export const getEvents = async (req, res, next) => {
  try {
    const { category, location, search, sortBy = "date", page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (location) query.location = new RegExp(location, "i");
    if (search) query.name = new RegExp(search, "i");
    
    const skip = (page - 1) * limit;
    
    const events = await Event.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("organizer", "name email");
    
    const total = await Event.countDocuments(query);
    
    res.json({
      events,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalEvents: total
    });
  } catch (error) {
    next(error);
  }
};

// Get single event
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("attendees", "name email")
      .populate("comments.user", "name");
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    next(error);
  }
};

// Create event (admin only)
export const createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };
    
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// Update event
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    next(error);
  }
};

// Delete event
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Add comment to event
export const addComment = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    const comment = {
      user: req.user._id,
      content: req.body.content
    };
    
    event.comments.push(comment);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// Get recommended events
export const getRecommendedEvents = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { categories, locations } = user.preferences;
    
    const query = {};
    if (categories?.length) query.category = { $in: categories };
    if (locations?.length) query.location = { $in: locations };
    
    const events = await Event.find(query)
      .limit(10)
      .populate("organizer", "name email");
    
    res.json(events);
  } catch (error) {
    next(error);
  }
};
