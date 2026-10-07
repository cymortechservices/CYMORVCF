import { Schema, model, Types } from "mongoose";
// Metadata only. Files are regenerated on demand, so nothing large is stored.
const s = new Schema({
  ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: Types.ObjectId, required: true },
  sessionName: String,
  filename: String,
  format: { type: String, enum: ["vcf", "csv", "txt"], default: "vcf" },
  count: Number,
  status: { type: String, default: "READY" },
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90-day retention
export const Export = model("Export", s);
