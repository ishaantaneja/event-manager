import mongoose from "mongoose";

const savedEventSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true 
  },
  notes: String,
  reminder: {
    enabled: { type: Boolean, default: false },
    date: Date
  }
}, { 
  timestamps: true 
});

// Ensure a user can't save the same event twice
savedEventSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model("SavedEvent", savedEventSchema);
