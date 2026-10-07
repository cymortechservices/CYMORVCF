import { Router } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { z } from "zod";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { Contact } from "../models/Contact";
import { Export } from "../models/Export";
import { ActivityLog } from "../models/ActivityLog";
import { AdminLog } from "../models/AdminLog";
import { requireAuth, requireSuperadmin, AuthedRequest } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/error";
import { ownerView } from "./sessions";
import { buildExport, parseFormat } from "../lib/exporter";
import { normalizePhone } from "../lib/phone";
import { parseVcf, safeFilename } from "../lib/vcf";
import { escapeRegex, isObjectId } from "../lib/security";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireSuperadmin); // every admin route is enforced server-side

const audit = (req: AuthedRequest, action: string, targetType: string, targetId: string, meta?: unknown) =>
  AdminLog.create({ adminId: req.user!.id, action, targetType, targetId, meta }).catch((e) => console.error(e));
const page = (req: any) => Math.max(1, Number(req.query.page) || 1);
const daily = (M: mongoose.Model<any>, days = 30) => M.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - days * 864e5) } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } },
]).then((r) => r.map((x: any) => ({ date: x._id, count: x.count })));

adminRouter.get("/stats", wrap(async (_req, res) => {
  const [users, sessions, contacts, active, ug, sg, cg, countries] = await Promise.all([
    User.countDocuments(), Session.countDocuments(), Contact.countDocuments(), Session.countDocuments({ status: "ACTIVE" }),
    daily(User), daily(Session), daily(Contact),
    Contact.aggregate([{ $group: { _id: "$country", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
  ]);
  res.json({ ok: true, data: { users, sessions, contacts, activeSessions: active, userGrowth: ug, sessionGrowth: sg, contactGrowth: cg, countries: countries.map((c: any) => ({ country: c._id ?? "Unknown", count: c.count })) } });
}));

adminRouter.get("/health", wrap(async (_req, res) => res.json({ ok: true, data: {
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected", uptimeSeconds: Math.round(process.uptime()),
  memoryMb: Math.round(process.memoryUsage().rss / 1048576), node: process.version } })));

adminRouter.get("/activity", wrap(async (_req, res) => {
  const [admin, platform] = await Promise.all([
    AdminLog.find().sort({ createdAt: -1 }).limit(50).populate("adminId", "email").lean(),
    ActivityLog.find().sort({ createdAt: -1 }).limit(50).populate("sessionId", "name").lean()]);
  res.json({ ok: true, data: { admin, platform } });
}));

adminRouter.get("/users", wrap(async (req, res) => {
  const f: any = {}; const q = String(req.query.q ?? "").slice(0, 60);
  if (q) f.$or = [{ email: { $regex: escapeRegex(q), $options: "i" } }, { displayName: { $regex: escapeRegex(q), $options: "i" } }];
  if (req.query.status === "suspended") f.suspended = true; if (req.query.status === "active") f.suspended = false;
  const p = page(req);
  const [users, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip((p - 1) * 20).limit(20).lean(), User.countDocuments(f)]);
  const counts = await Session.aggregate([{ $match: { ownerId: { $in: users.map((u) => u._id) } } }, { $group: { _id: "$ownerId", n: { $sum: 1 } } }]);
  const m = new Map(counts.map((c: any) => [String(c._id), c.n]));
  res.json({ ok: true, data: users.map((u) => ({ id: String(u._id), email: u.email, displayName: u.displayName, role: u.role, suspended: u.suspended, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, sessions: m.get(String(u._id)) ?? 0 })), meta: { page: p, total } });
}));

async function targetUser(req: AuthedRequest) {
  if (!isObjectId(req.params.id)) throw new HttpError(404, "User not found.");
  const u = await User.findById(req.params.id);
  if (!u) throw new HttpError(404, "User not found.");
  if (u.role === "SUPERADMIN" || u.id === req.user!.id) throw new HttpError(403, "You can't change a super admin account.");
  return u;
}
adminRouter.patch("/users/:id", wrap(async (req: AuthedRequest, res) => {
  const u = await targetUser(req); const { suspended } = z.object({ suspended: z.boolean() }).parse(req.body);
  u.suspended = suspended; await u.save(); audit(req, suspended ? "USER_SUSPENDED" : "USER_RESTORED", "user", u.id);
  res.json({ ok: true });
}));
adminRouter.delete("/users/:id", wrap(async (req: AuthedRequest, res) => {
  const u = await targetUser(req);
  const ids = (await Session.find({ ownerId: u._id }).select("_id").lean()).map((s) => s._id);
  await Promise.all([Contact.deleteMany({ sessionId: { $in: ids } }), ActivityLog.deleteMany({ sessionId: { $in: ids } }), Export.deleteMany({ ownerId: u._id })]);
  await Session.deleteMany({ ownerId: u._id }); await u.deleteOne(); audit(req, "USER_DELETED", "user", u.id, { email: u.email });
  res.json({ ok: true });
}));
adminRouter.get("/users/:id/sessions", wrap(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new HttpError(404, "User not found.");
  res.json({ ok: true, data: (await Session.find({ ownerId: req.params.id }).sort({ createdAt: -1 }).limit(100)).map(ownerView) });
}));

adminRouter.get("/sessions", wrap(async (req, res) => {
  const f: any = {}; const q = String(req.query.q ?? "").slice(0, 60);
  if (q) f.name = { $regex: escapeRegex(q), $options: "i" };
  for (const k of ["status", "visibility", "region"]) if (req.query[k]) f[k] = String(req.query[k]);
  const ownerQ = String(req.query.owner ?? "").slice(0, 60);
  if (ownerQ) f.ownerId = { $in: (await User.find({ email: { $regex: escapeRegex(ownerQ), $options: "i" } }).select("_id").lean()).map((u) => u._id) };
  const from = new Date(String(req.query.from ?? "")), to = new Date(String(req.query.to ?? ""));
  if (!isNaN(+from) || !isNaN(+to)) f.createdAt = { ...(!isNaN(+from) && { $gte: from }), ...(!isNaN(+to) && { $lte: new Date(+to + 864e5 - 1) }) };
  const p = page(req);
  const [items, total] = await Promise.all([Session.find(f).sort({ createdAt: -1 }).skip((p - 1) * 20).limit(20).populate("ownerId", "email displayName"), Session.countDocuments(f)]);
  res.json({ ok: true, data: items.map((s: any) => ({ ...ownerView(s), owner: s.ownerId?.email })), meta: { page: p, total } });
}));
const adminPatch = z.object({ status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "SUSPENDED"]), name: z.string().min(2).max(80), target: z.number().int().min(1).max(100000), visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]) }).partial();
adminRouter.patch("/sessions/:id", wrap(async (req: AuthedRequest, res) => {
  const s = await Session.findOne({ sessionId: req.params.id }); if (!s) throw new HttpError(404, "Session not found.");
  const b = adminPatch.parse(req.body); Object.assign(s, b); await s.save(); audit(req, "SESSION_EDITED", "session", s.sessionId, b);
  res.json({ ok: true, data: ownerView(s) });
}));
adminRouter.delete("/sessions/:id", wrap(async (req: AuthedRequest, res) => {
  const s = await Session.findOne({ sessionId: req.params.id }); if (!s) throw new HttpError(404, "Session not found.");
  await Promise.all([Contact.deleteMany({ sessionId: s._id }), ActivityLog.deleteMany({ sessionId: s._id })]); await s.deleteOne(); audit(req, "SESSION_DELETED", "session", s.sessionId, { name: s.name });
  res.json({ ok: true });
}));
adminRouter.get("/sessions/:id/export", wrap(async (req: AuthedRequest, res) => {
  const s = await Session.findOne({ sessionId: req.params.id }); if (!s) throw new HttpError(404, "Session not found.");
  const out = await buildExport(s, parseFormat(req.query.format)); audit(req, "SESSION_EXPORTED", "session", s.sessionId);
  res.setHeader("Content-Type", out.contentType); res.setHeader("Content-Disposition", `attachment; filename="${out.filename}"`); res.send(out.body);
}));

// ---- VCF import (body parsed with an 8 MB limit in app.ts, after auth) ----
const importSchema = z.object({
  vcf: z.string().min(1).max(6_000_000), defaultCountry: z.enum(["KE", "NG", "UG", "TZ", "GH"]).default("KE"),
  sessionId: z.string().max(20).optional(),
  newSession: z.object({ name: z.string().min(2).max(80), target: z.number().int().min(1).max(100000), prefix: z.string().min(1).max(20).regex(/^[\w -]+$/).default("CYMOR"),
    vcfFilename: z.string().max(60).default("imported.vcf"), region: z.enum(["KE", "NG", "UG", "TZ", "GH", "OTHER"]).default("OTHER") }).optional(),
});
function analyse(vcf: string, cc: any, existing: Set<string> = new Set()) {
  const seen = new Set<string>(); const fresh: any[] = []; let duplicates = 0, invalid = 0;
  for (const c of parseVcf(vcf)) {
    const n = normalizePhone(c.phone, cc);
    if (!n) { invalid++; continue; }
    if (seen.has(n.normalizedNumber) || existing.has(n.normalizedNumber)) { duplicates++; continue; }
    seen.add(n.normalizedNumber); fresh.push({ ...n, name: c.name });
  }
  return { fresh, duplicates, invalid };
}
adminRouter.post("/import/preview", wrap(async (req, res) => {
  const b = importSchema.parse(req.body); let existing = new Set<string>();
  if (b.sessionId) { const s = await Session.findOne({ sessionId: b.sessionId }); if (!s) throw new HttpError(404, "Session not found."); existing = new Set((await Contact.find({ sessionId: s._id }).select("normalizedNumber").lean()).map((c) => c.normalizedNumber)); }
  const total = parseVcf(b.vcf).length; const a = analyse(b.vcf, b.defaultCountry, existing);
  const cm = new Map<string, number>(); a.fresh.forEach((c) => cm.set(c.country, (cm.get(c.country) ?? 0) + 1));
  res.json({ ok: true, data: { detected: total, unique: a.fresh.length, duplicates: a.duplicates, invalid: a.invalid, countries: [...cm].map(([country, count]) => ({ country, count })).sort((x, y) => y.count - x.count),
    sample: a.fresh.slice(0, 5).map((c) => ({ name: c.name || "(no name)", phone: c.normalizedNumber.slice(0, -4).replace(/\d/g, "•") + c.normalizedNumber.slice(-4) })) } });
}));
adminRouter.post("/import", wrap(async (req: AuthedRequest, res) => {
  const b = importSchema.parse(req.body);
  if (!b.sessionId === !b.newSession) throw new HttpError(400, "Choose either an existing session or a new one.");
  let s = b.sessionId ? await Session.findOne({ sessionId: b.sessionId }) : null;
  if (b.sessionId && !s) throw new HttpError(404, "Session not found.");
  const existing = s ? new Set((await Contact.find({ sessionId: s._id }).select("normalizedNumber").lean()).map((c) => c.normalizedNumber)) : new Set<string>();
  const a = analyse(b.vcf, b.defaultCountry, existing);
  if (!s) s = await Session.create({ ...b.newSession, vcfFilename: safeFilename(b.newSession!.vcfFilename), sessionId: nanoid(10), ownerId: req.user!.id, visibility: "UNLISTED" });
  const base = s.contactCounter; let inserted = 0;
  try { // existing contacts are never overwritten: new rows only, duplicates skipped by the unique index
    const docs = a.fresh.map((c, i) => ({ sessionId: s!._id, name: c.name || `${s!.prefix} ${String(base + i + 1).padStart(3, "0")}`, originalNumber: c.originalNumber, normalizedNumber: c.normalizedNumber, countryCode: c.countryCode, country: c.country }));
    inserted = (await Contact.insertMany(docs, { ordered: false })).length;
  } catch (e: any) { inserted = e.insertedDocs?.length ?? e.result?.insertedCount ?? 0; if (e.code !== 11000 && !e.writeErrors) throw e; }
  await Session.updateOne({ _id: s._id }, { $inc: { contactCount: inserted, contactCounter: a.fresh.length } });
  ActivityLog.create({ sessionId: s._id, type: "IMPORTED", message: `${inserted} contacts imported` }).catch(() => {});
  audit(req, "VCF_IMPORTED", "session", s.sessionId, { inserted, duplicates: a.duplicates, invalid: a.invalid });
  res.status(201).json({ ok: true, data: { sessionId: s.sessionId, inserted, duplicates: a.duplicates, invalid: a.invalid } });
}));
