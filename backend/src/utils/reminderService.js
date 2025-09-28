import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import SavedEvent from "../models/SavedEvent.js";
import { createNotification } from "../controllers/notificationController.js";

// Send reminders for upcoming events
export const sendEventReminders = async () => {
  try {
    // Get events happening in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(23, 59, 59, 999);
    
    // Find confirmed bookings for events happening tomorrow
    const bookings = await Booking.find({
      status: "confirmed"
    }).populate("event").populate("user");
    
    const upcomingBookings = bookings.filter(booking => {
      const eventDate = new Date(booking.event.date);
      return eventDate >= today && eventDate <= tomorrow;
    });
    
    // Send reminders for each booking
    for (const booking of upcomingBookings) {
      await createNotification(booking.user._id, {
        type: "booking_reminder",
        title: "Event Reminder",
        message: `Your event "${booking.event.name}" is tomorrow!`,
        relatedEvent: booking.event._id,
        relatedBooking: booking._id,
        actionUrl: `/event/${booking.event._id}`
      });
    }
    
    // Also check saved events with reminders enabled
    const savedEventsWithReminders = await SavedEvent.find({
      "reminder.enabled": true
    }).populate("event").populate("user");
    
    const upcomingSavedEvents = savedEventsWithReminders.filter(savedEvent => {
      const reminderDate = new Date(savedEvent.reminder.date);
      return reminderDate >= today && reminderDate <= tomorrow;
    });
    
    // Send reminders for saved events
    for (const savedEvent of upcomingSavedEvents) {
      await createNotification(savedEvent.user._id, {
        type: "event_update",
        title: "Saved Event Reminder",
        message: `Don't forget about "${savedEvent.event.name}"!`,
        relatedEvent: savedEvent.event._id,
        actionUrl: `/event/${savedEvent.event._id}`
      });
      
      // Disable reminder after sending
      savedEvent.reminder.enabled = false;
      await savedEvent.save();
    }
    
    console.log(`✅ Sent ${upcomingBookings.length + upcomingSavedEvents.length} event reminders`);
  } catch (error) {
    console.error("❌ Error sending event reminders:", error);
  }
};

// Send booking confirmation notification
export const sendBookingConfirmation = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("event")
      .populate("user");
    
    if (!booking) return;
    
    await createNotification(booking.user._id, {
      type: "booking_confirmation",
      title: "Booking Confirmed",
      message: `Your booking for "${booking.event.name}" has been confirmed!`,
      relatedEvent: booking.event._id,
      relatedBooking: booking._id,
      actionUrl: `/dashboard`
    });
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
  }
};

// Send event update notification
export const sendEventUpdateNotification = async (eventId, updateMessage) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) return;
    
    // Find all users who booked this event
    const bookings = await Booking.find({
      event: eventId,
      status: { $ne: "cancelled" }
    });
    
    // Send notification to each user
    for (const booking of bookings) {
      await createNotification(booking.user, {
        type: "event_update",
        title: "Event Update",
        message: `"${event.name}" has been updated: ${updateMessage}`,
        relatedEvent: eventId,
        actionUrl: `/event/${eventId}`
      });
    }
  } catch (error) {
    console.error("Error sending event update notification:", error);
  }
};

// Send event cancellation notification
export const sendEventCancellationNotification = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) return;
    
    // Find all users who booked this event
    const bookings = await Booking.find({
      event: eventId,
      status: { $ne: "cancelled" }
    });
    
    // Send notification and cancel bookings
    for (const booking of bookings) {
      await createNotification(booking.user, {
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `Unfortunately, "${event.name}" has been cancelled.`,
        relatedEvent: eventId,
        relatedBooking: booking._id,
        actionUrl: `/dashboard`
      });
      
      // Cancel the booking
      booking.status = "cancelled";
      await booking.save();
    }
  } catch (error) {
    console.error("Error sending event cancellation notification:", error);
  }
};
