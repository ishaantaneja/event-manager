import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

// Create booking
export const createBooking = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if already booked
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      event: eventId
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: "Already booked this event" });
    }
    
    const booking = await Booking.create({
      user: req.user._id,
      event: eventId
    });
    
    // Add user to event attendees
    event.attendees.push(req.user._id);
    await event.save();
    
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// Get user bookings
export const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event")
      .sort("-bookedAt");
    
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// Cancel booking
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    booking.status = "cancelled";
    await booking.save();
    
    // Remove user from event attendees
    const event = await Event.findById(booking.event);
    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== req.user._id.toString()
    );
    await event.save();
    
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all bookings (admin)
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("event", "name date")
      .sort("-bookedAt");
    
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};
