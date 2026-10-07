import { Types } from "mongoose";
import { ActivityLog } from "../models/ActivityLog";
export const logActivity = (sessionId: Types.ObjectId | string, type: string, message = "") =>
  ActivityLog.create({ sessionId, type, message }).catch((e) => console.error("activity log failed", e));
