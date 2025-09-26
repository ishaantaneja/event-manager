import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  location: String,
  date: String,
  price: Number,
  description: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);
