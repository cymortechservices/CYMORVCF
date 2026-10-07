import crypto from "crypto";
import { env } from "../config/env";
import { HttpError } from "../middleware/error";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const hashIp = (ip = "") => sha256(ip + env.JWT_SECRET).slice(0, 32);
export const newToken = () => crypto.randomBytes(32).toString("hex");
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const isObjectId = (s: unknown): s is string => typeof s === "string" && /^[a-f\d]{24}$/i.test(s);

/** Cloudflare Turnstile. Enforced only when CAPTCHA_SECRET is set. */
export async function verifyCaptcha(token: string | undefined, ip?: string) {
  if (!env.CAPTCHA_SECRET) return;
  if (!token) throw new HttpError(400, "Please complete the verification.");
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: env.CAPTCHA_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    if (!((await r.json()) as { success?: boolean }).success) throw new Error("fail");
  } catch { throw new HttpError(400, "Verification failed. Please try again."); }
}
