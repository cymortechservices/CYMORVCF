import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const wrap = (fn: (req: any, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message });
  if (err instanceof ZodError) return res.status(400).json({ ok: false, error: "Invalid input.", details: err.flatten().fieldErrors });
  if (err?.type === "entity.too.large") return res.status(413).json({ ok: false, error: "That file is too large." });
  if (err instanceof SyntaxError) return res.status(400).json({ ok: false, error: "Invalid request." });
  console.error(err); // real error stays server-side
  res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
}
