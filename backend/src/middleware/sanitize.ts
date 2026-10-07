import { Request, Response, NextFunction } from "express";
/** Strips Mongo operator keys ($...) and dotted keys from body/params/query. */
const clean = (v: any): any => {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") {
    const o: Record<string, any> = {};
    for (const [k, x] of Object.entries(v)) if (!k.startsWith("$") && !k.includes(".")) o[k] = clean(x);
    return o;
  }
  return v;
};
export function sanitize(req: Request, _res: Response, next: NextFunction) {
  req.body = clean(req.body);
  const q = clean(req.query); for (const k of Object.keys(req.query)) delete (req.query as any)[k]; Object.assign(req.query, q);
  next();
}
