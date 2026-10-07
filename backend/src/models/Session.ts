import { Schema, model, Types } from "mongoose";
const sessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: "", maxlength: 500 },
  target: { type: Number, required: true, min: 1, max: 100000 },
  prefix: { type: String, default: "CYMOR", maxlength: 20 },
  vcfFilename: { type: String, default: "contacts.vcf" },
  whatsappUrl: { type: String, default: "" },
  region: { type: String, enum: ["KE", "NG", "UG", "TZ", "GH", "OTHER"], default: "OTHER" },
  visibility: { type: String, enum: ["PUBLIC", "UNLISTED", "PRIVATE"], default: "PUBLIC" },
  accessCodeHash: { type: String, select: false },
  status: { type: String, enum: ["ACTIVE", "PAUSED", "CLOSED", "SUSPENDED"], default: "ACTIVE" },
  contactCount: { type: Number, default: 0 },
  contactCounter: { type: Number, default: 0 },
  duplicateCount: { type: Number, default: 0 },
}, { timestamps: true });
sessionSchema.index({ visibility: 1, status: 1 });
export const Session = model("Session", sessionSchema);
