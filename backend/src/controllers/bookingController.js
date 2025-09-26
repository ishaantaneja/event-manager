import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

// @desc Create booking
// @route POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const booking = await Booking.create({ user: req.user.id, event: eventId });

    // Push user into event attendees list
    event.attendees.push(req.user.id);
    await event.save();

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc Get user bookings
// @route GET /api/bookings/my
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate("event");
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc Cancel booking
// @route DELETE /api/bookings/:id
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (error) {
    next(error);
  }
};
