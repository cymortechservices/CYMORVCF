import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { HttpError } from "./error";

export interface AuthedRequest extends Request { user?: { id: string; role: "USER" | "SUPERADMIN" } }

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) throw new HttpError(401, "Please log in.");
    const { sub } = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const u = await User.findById(sub); // role always read from DB, never from the client
    if (!u || u.suspended) throw new HttpError(403, "Account unavailable.");
    req.user = { id: u.id, role: u.role as "USER" | "SUPERADMIN" };
    next();
  } catch (e) { next(e instanceof HttpError ? e : new HttpError(401, "Please log in.")); }
}
export const requireSuperadmin = (req: AuthedRequest, _res: Response, next: NextFunction) =>
  req.user?.role === "SUPERADMIN" ? next() : next(new HttpError(403, "Forbidden."));
