import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env";
import { User } from "../models/User";
import { HttpError, wrap } from "../middleware/error";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { newToken, sha256 } from "../lib/security";
import { sendMail } from "../lib/mailer";

export const authRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, message: { ok: false, error: "Too many attempts. Please wait a few minutes." } });
const login = z.object({ email: z.string().email(), password: z.string().min(8).max(100) });
const register = login.extend({ displayName: z.string().min(2).max(60) });
const prod = env.NODE_ENV === "production";
const setCookie = (res: Response, id: string) =>
  res.cookie("token", jwt.sign({ sub: id }, env.JWT_SECRET, { expiresIn: "7d" }), { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax", maxAge: 7 * 864e5 });
const view = (u: any) => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, emailVerified: u.emailVerified });

authRouter.post("/register", limiter, wrap(async (req, res) => {
  const b = register.parse(req.body);
  if (await User.exists({ email: b.email.toLowerCase() })) throw new HttpError(409, "Email already registered.");
  const token = newToken();
  const u = await User.create({ email: b.email, displayName: b.displayName, passwordHash: await bcrypt.hash(b.password, 12), verifyTokenHash: sha256(token) });
  sendMail(u.email, "Verify your CYMOR VCF email", `Verify your email: ${env.CLIENT_URL}/verify?token=${token}`);
  setCookie(res, u.id);
  res.status(201).json({ ok: true, data: view(u) });
}));
authRouter.post("/login", limiter, wrap(async (req, res) => {
  const b = login.parse(req.body);
  const u = await User.findOne({ email: b.email.toLowerCase() }).select("+passwordHash");
  if (!u || !(await bcrypt.compare(b.password, u.passwordHash)) || u.suspended) throw new HttpError(401, "Invalid email or password.");
  u.lastLoginAt = new Date(); await u.save();
  setCookie(res, u.id);
  res.json({ ok: true, data: view(u) });
}));
authRouter.post("/logout", (_req, res) => { res.clearCookie("token", { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax" }); res.json({ ok: true }); });
authRouter.get("/me", requireAuth, wrap(async (req: AuthedRequest, res) => res.json({ ok: true, data: view(await User.findById(req.user!.id)) })));

authRouter.post("/forgot", limiter, wrap(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const u = await User.findOne({ email: email.toLowerCase() });
  if (u) { // same response either way, so emails can't be enumerated
    const token = newToken(); u.resetTokenHash = sha256(token); u.resetExpires = new Date(Date.now() + 3600_000); await u.save();
    sendMail(u.email, "Reset your CYMOR VCF password", `Reset link (valid 1 hour): ${env.CLIENT_URL}/reset?token=${token}`);
  }
  res.json({ ok: true });
}));
authRouter.post("/reset", limiter, wrap(async (req, res) => {
  const b = z.object({ token: z.string().length(64), password: z.string().min(8).max(100) }).parse(req.body);
  const u = await User.findOne({ resetTokenHash: sha256(b.token), resetExpires: { $gt: new Date() } }).select("+resetTokenHash +resetExpires");
  if (!u) throw new HttpError(400, "This reset link is invalid or has expired.");
  u.passwordHash = await bcrypt.hash(b.password, 12); u.resetTokenHash = undefined; u.resetExpires = undefined; await u.save();
  res.json({ ok: true });
}));
authRouter.post("/verify-email", limiter, wrap(async (req, res) => {
  const { token } = z.object({ token: z.string().length(64) }).parse(req.body);
  const u = await User.findOne({ verifyTokenHash: sha256(token) }).select("+verifyTokenHash");
  if (!u) throw new HttpError(400, "This verification link is invalid.");
  u.emailVerified = true; u.verifyTokenHash = undefined; await u.save();
  res.json({ ok: true });
}));
