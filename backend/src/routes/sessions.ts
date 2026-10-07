import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { env } from "../config/env";
import { Session } from "../models/Session";
import { Contact } from "../models/Contact";
import { Export } from "../models/Export";
import { ActivityLog } from "../models/ActivityLog";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/error";
import { normalizePhone } from "../lib/phone";
import { safeFilename } from "../lib/vcf";
import { buildExport, parseFormat } from "../lib/exporter";
import { logActivity } from "../lib/activity";
import { computeAnalytics, rangeToDays, Row } from "../lib/analytics";
import { hashIp, verifyCaptcha, escapeRegex, isObjectId } from "../lib/security";

export const sessionsRouter = Router();
const REGIONS = ["KE", "NG", "UG", "TZ", "GH", "OTHER"] as const;
const waUrl = z.string().url().refine((u) => /^https:\/\/(chat\.whatsapp\.com|wa\.me|whatsapp\.com)\//.test(u), "Must be a WhatsApp link");
const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).default(""),
  target: z.number().int().min(1).max(100000),
  prefix: z.string().min(1).max(20).regex(/^[\w -]+$/).default("CYMOR"),
  vcfFilename: z.string().max(60).default("contacts.vcf"),
  whatsappUrl: waUrl.or(z.literal("")).default(""),
  region: z.enum(REGIONS).default("OTHER"),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
  accessCode: z.string().min(4).max(32).optional(),
});

// Public shape: never includes phone numbers or the access code.
export const publicView = (s: any) => ({
  sessionId: s.sessionId, name: s.name, description: s.description, target: s.target, contacts: s.contactCount,
  progress: Math.min(100, Math.round((s.contactCount / s.target) * 1000) / 10), status: s.status, visibility: s.visibility,
  region: s.region, createdAt: s.createdAt, creator: s.ownerId?.displayName,
});
export const ownerView = (s: any) => ({ ...publicView(s), duplicates: s.duplicateCount ?? 0, whatsappUrl: s.whatsappUrl, prefix: s.prefix, vcfFilename: s.vcfFilename });

sessionsRouter.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const { accessCode, ...b } = createSchema.parse(req.body);
  if (b.visibility === "PRIVATE" && !accessCode) throw new HttpError(400, "Private sessions need an access code.");
  const s = await Session.create({ ...b, sessionId: nanoid(10), ownerId: req.user!.id, vcfFilename: safeFilename(b.vcfFilename), accessCodeHash: accessCode ? await bcrypt.hash(accessCode, 10) : undefined });
  logActivity(s._id, "SESSION_CREATED", "Session created");
  res.status(201).json({ ok: true, data: ownerView(s) });
}));

sessionsRouter.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const list = await Session.find({ ownerId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ ok: true, data: list.map(ownerView) });
}));

// Explore: public + active only. sort = popular | recent | almost
sessionsRouter.get("/explore/list", wrap(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const q = String(req.query.q ?? "").slice(0, 60);
  const filter: any = { visibility: "PUBLIC", status: "ACTIVE" };
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };
  const region = String(req.query.region ?? ""); if ((REGIONS as readonly string[]).includes(region)) filter.region = region;
  const sortKey = String(req.query.sort ?? "popular");
  if (sortKey === "almost") filter.$expr = { $and: [{ $gte: [{ $divide: ["$contactCount", "$target"] }, 0.8] }, { $lt: ["$contactCount", "$target"] }] };
  const sort: any = sortKey === "recent" ? { createdAt: -1 } : { contactCount: -1 };
  const [items, total] = await Promise.all([
    Session.find(filter).sort(sort).skip((page - 1) * 12).limit(12).populate("ownerId", "displayName"), Session.countDocuments(filter)]);
  res.json({ ok: true, data: items.map(publicView), meta: { page, total } });
}));

sessionsRouter.get("/:id", wrap(async (req, res) => {
  const s = await Session.findOne({ sessionId: req.params.id }).populate("ownerId", "displayName");
  if (!s || s.status === "SUSPENDED") throw new HttpError(404, "Session not found.");
  res.json({ ok: true, data: { ...publicView(s), requiresCode: s.visibility === "PRIVATE" } });
}));

const joinLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 10, standardHeaders: true, message: { ok: false, error: "Too many attempts. Please wait a few minutes." } });
const joinSchema = z.object({ phone: z.string().min(6).max(25), accessCode: z.string().max(32).optional(), captchaToken: z.string().max(2000).optional() });

sessionsRouter.post("/:id/join", joinLimiter, wrap(async (req, res) => {
  const b = joinSchema.parse(req.body);
  await verifyCaptcha(b.captchaToken, req.ip);
  const s = await Session.findOne({ sessionId: req.params.id }).select("+accessCodeHash");
  if (!s || s.status === "SUSPENDED") throw new HttpError(404, "Session not found.");
  if (s.status !== "ACTIVE") throw new HttpError(409, "This session is not accepting contacts right now.");
  if (s.visibility === "PRIVATE" && !(b.accessCode && s.accessCodeHash && await bcrypt.compare(b.accessCode, s.accessCodeHash)))
    throw new HttpError(403, "Invalid access code.");
  const ipHash = hashIp(req.ip);
  if (await Contact.countDocuments({ sessionId: s._id, ipHash, createdAt: { $gt: new Date(Date.now() - 3600_000) } }) >= env.JOIN_PER_IP_HOUR) {
    logActivity(s._id, "SUSPICIOUS", "Repeated joins from one connection were blocked");
    throw new HttpError(429, "Too many contacts from this connection. Please try again later.");
  }
  const n = normalizePhone(b.phone);
  if (!n) throw new HttpError(422, "Please enter a valid phone number with country code.");
  const dup = async () => { await Session.updateOne({ _id: s._id }, { $inc: { duplicateCount: 1 } }); logActivity(s._id, "DUPLICATE_DETECTED", "Duplicate number blocked"); throw new HttpError(409, "This number is already in the session."); };
  if (await Contact.exists({ sessionId: s._id, normalizedNumber: n.normalizedNumber })) await dup();
  const upd = await Session.findOneAndUpdate({ _id: s._id }, { $inc: { contactCounter: 1, contactCount: 1 } }, { new: true });
  const name = `${s.prefix} ${String(upd!.contactCounter).padStart(3, "0")}`;
  try { await Contact.create({ sessionId: s._id, name, ipHash, ...n }); }
  catch (e: any) {
    await Session.updateOne({ _id: s._id }, { $inc: { contactCount: -1 } });
    if (e.code === 11000) await dup();
    throw e;
  }
  logActivity(s._id, "CONTACT_ADDED", "+1 contact added");
  const io = req.app.get("io"); const room = `session:${s.sessionId}`;
  io?.to(room).emit("contact:added", { contacts: upd!.contactCount, target: s.target, country: n.countryCode });
  if (upd!.contactCount === s.target) { logActivity(s._id, "TARGET_REACHED", "Target reached"); io?.to(room).emit("target:reached", { contacts: upd!.contactCount }); }
  res.status(201).json({ ok: true, data: { contacts: upd!.contactCount, whatsappUrl: s.whatsappUrl || null } });
}));

export async function ownSession(req: AuthedRequest) {
  const s = await Session.findOne({ sessionId: req.params.id });
  if (!s || (String(s.ownerId) !== req.user!.id && req.user!.role !== "SUPERADMIN")) throw new HttpError(404, "Session not found.");
  return s;
}

sessionsRouter.get("/:id/manage", requireAuth, wrap(async (req: AuthedRequest, res) => res.json({ ok: true, data: ownerView(await ownSession(req)) })));

sessionsRouter.get("/:id/contacts", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  const page = Math.max(1, Number(req.query.page) || 1), limit = 50;
  const f: any = { sessionId: s._id };
  const q = String(req.query.q ?? "").slice(0, 40); if (q) f.$or = [{ name: { $regex: escapeRegex(q), $options: "i" } }, { normalizedNumber: { $regex: escapeRegex(q.replace(/\s/g, "")) } }];
  const cc = String(req.query.country ?? ""); if (/^[A-Z]{2}$/.test(cc)) f.countryCode = cc;
  const from = new Date(String(req.query.from ?? "")), to = new Date(String(req.query.to ?? ""));
  if (!isNaN(+from) || !isNaN(+to)) f.createdAt = { ...(!isNaN(+from) && { $gte: from }), ...(!isNaN(+to) && { $lte: new Date(+to + 864e5 - 1) }) };
  const sort: any = req.query.sort === "old" ? { createdAt: 1 } : req.query.sort === "name" ? { name: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([Contact.find(f).sort(sort).skip((page - 1) * limit).limit(limit), Contact.countDocuments(f)]);
  res.json({ ok: true, data: items, meta: { page, total } });
}));

sessionsRouter.post("/:id/contacts/bulk-delete", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  const { ids } = z.object({ ids: z.array(z.string()).min(1).max(500) }).parse(req.body);
  if (!ids.every(isObjectId)) throw new HttpError(400, "Invalid selection.");
  const r = await Contact.deleteMany({ _id: { $in: ids }, sessionId: s._id }); // scoped to this session only
  if (r.deletedCount) { await Session.updateOne({ _id: s._id }, { $inc: { contactCount: -r.deletedCount } }); logActivity(s._id, "CONTACT_DELETED", `${r.deletedCount} contacts deleted`); }
  res.json({ ok: true, data: { deleted: r.deletedCount } });
}));

sessionsRouter.delete("/:id/contacts/:contactId", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  if (!isObjectId(req.params.contactId)) throw new HttpError(400, "Invalid contact.");
  const r = await Contact.deleteOne({ _id: req.params.contactId, sessionId: s._id });
  if (r.deletedCount) { await Session.updateOne({ _id: s._id }, { $inc: { contactCount: -1 } }); logActivity(s._id, "CONTACT_DELETED", "Contact deleted"); }
  res.json({ ok: true });
}));

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]), target: z.number().int().min(1).max(100000), name: z.string().min(2).max(80),
  description: z.string().max(500), prefix: z.string().min(1).max(20).regex(/^[\w -]+$/), vcfFilename: z.string().max(60), whatsappUrl: waUrl.or(z.literal("")),
}).partial();
sessionsRouter.patch("/:id", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  if (s.status === "SUSPENDED" && req.user!.role !== "SUPERADMIN") throw new HttpError(403, "This session has been suspended.");
  const b = patchSchema.parse(req.body);
  if (b.target && b.target !== s.target) logActivity(s._id, "TARGET_UPDATED", `Target set to ${b.target}`);
  if (b.status && b.status !== s.status) logActivity(s._id, "STATUS_CHANGED", `Session ${b.status.toLowerCase()}`);
  if (b.vcfFilename) b.vcfFilename = safeFilename(b.vcfFilename); // prefix changes only affect future contacts
  Object.assign(s, b); await s.save();
  res.json({ ok: true, data: ownerView(s) });
}));

sessionsRouter.delete("/:id", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  await Promise.all([Contact.deleteMany({ sessionId: s._id }), ActivityLog.deleteMany({ sessionId: s._id })]); await s.deleteOne();
  res.json({ ok: true });
}));

sessionsRouter.get("/:id/activity", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  res.json({ ok: true, data: await ActivityLog.find({ sessionId: s._id }).sort({ createdAt: -1 }).limit(30).lean() });
}));

sessionsRouter.get("/:id/analytics", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  const rows = await Contact.find({ sessionId: s._id }).select("createdAt country countryCode").limit(100000).lean();
  res.json({ ok: true, data: { ...computeAnalytics(rows as unknown as Row[], { days: rangeToDays(req.query.range), target: s.target }), duplicates: s.duplicateCount ?? 0, unique: s.contactCount, exports: await Export.countDocuments({ sessionId: s._id }) } });
}));

sessionsRouter.get("/:id/export", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const s = await ownSession(req);
  const format = parseFormat(req.query.format);
  const out = await buildExport(s, format);
  await Export.create({ ownerId: req.user!.id, sessionId: s._id, sessionName: s.name, filename: out.filename, format, count: out.count });
  logActivity(s._id, "EXPORTED", `${format.toUpperCase()} exported`);
  res.setHeader("Content-Type", out.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${out.filename}"`);
  res.send(out.body);
}));
