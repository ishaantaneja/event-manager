import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  preferences: {
    categories: [{ type: String }],
    locations: [{ type: String }],
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    bookingConfirmations: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: false }
  },
  profileImage: String,
  bio: String,
  phoneNumber: String,
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Encrypt password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
