import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  bookedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
