import { Schema, model, Types } from "mongoose";
const contactSchema = new Schema({
  sessionId: { type: Types.ObjectId, ref: "Session", required: true },
  name: { type: String, required: true },
  originalNumber: String,
  normalizedNumber: { type: String, required: true },
  countryCode: String,
  country: String,
  status: { type: String, enum: ["UNIQUE", "DUPLICATE", "INVALID"], default: "UNIQUE" },
  ipHash: { type: String, select: false },
}, { timestamps: true });
// One normalized number per session: blocks repeat submissions at the DB level.
contactSchema.index({ sessionId: 1, normalizedNumber: 1 }, { unique: true });
contactSchema.index({ sessionId: 1, createdAt: -1 });
export const Contact = model("Contact", contactSchema);
