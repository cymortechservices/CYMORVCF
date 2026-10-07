import { Schema, model, Types } from "mongoose";
const s = new Schema({
  sessionId: { type: Types.ObjectId, ref: "Session", required: true },
  type: { type: String, required: true, enum: ["SESSION_CREATED", "CONTACT_ADDED", "DUPLICATE_DETECTED", "CONTACT_DELETED", "EXPORTED", "TARGET_UPDATED", "STATUS_CHANGED", "TARGET_REACHED", "SUSPICIOUS", "IMPORTED"] },
  message: { type: String, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ sessionId: 1, createdAt: -1 });
s.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }); // 180-day retention
export const ActivityLog = model("ActivityLog", s);
