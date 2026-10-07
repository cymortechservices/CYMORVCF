import { Schema, model, Types } from "mongoose";
const s = new Schema({
  adminId: { type: Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  targetType: String,
  targetId: String,
  meta: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });
s.index({ createdAt: -1 });
export const AdminLog = model("AdminLog", s);
