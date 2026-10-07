import { Router } from "express";
import { Session } from "../models/Session";
import { Contact } from "../models/Contact";
import { Export } from "../models/Export";
import { ActivityLog } from "../models/ActivityLog";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { wrap } from "../middleware/error";
import { computeAnalytics, rangeToDays, Row } from "../lib/analytics";

export const analyticsRouter = Router();
analyticsRouter.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const sessions = await Session.find({ ownerId: req.user!.id }).select("contactCount duplicateCount target status").lean();
  const ids = sessions.map((s) => s._id);
  const rows = await Contact.find({ sessionId: { $in: ids } }).select("createdAt country countryCode").limit(200000).lean();
  const days = rangeToDays(req.query.range);
  res.json({ ok: true, data: {
    ...computeAnalytics(rows as unknown as Row[], { days }),
    totalContacts: sessions.reduce((a, s) => a + s.contactCount, 0), duplicates: sessions.reduce((a, s) => a + (s.duplicateCount ?? 0), 0),
    sessions: sessions.length, activeSessions: sessions.filter((s) => s.status === "ACTIVE").length,
    completionRate: sessions.length ? Math.round((sessions.filter((s) => s.contactCount >= s.target).length / sessions.length) * 1000) / 10 : 0,
    exports: await Export.countDocuments({ ownerId: req.user!.id }),
    recentActivity: await ActivityLog.find({ sessionId: { $in: ids } }).sort({ createdAt: -1 }).limit(15).lean(),
  } });
}));
