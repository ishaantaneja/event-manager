import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["booking_confirmation", "booking_reminder", "event_update", "event_cancelled", "new_message", "admin_message"],
    required: true 
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  actionUrl: String
}, { 
  timestamps: true 
});

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
