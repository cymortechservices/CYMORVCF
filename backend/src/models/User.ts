import { Schema, model } from "mongoose";
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["USER", "SUPERADMIN"], default: "USER" },
  suspended: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  verifyTokenHash: { type: String, select: false },
  resetTokenHash: { type: String, select: false },
  resetExpires: { type: Date, select: false },
  lastLoginAt: Date,
}, { timestamps: true });
export const User = model("User", userSchema);
