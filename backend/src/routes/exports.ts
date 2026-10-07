import { Router } from "express";
import { Export } from "../models/Export";
import { Session } from "../models/Session";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/error";
import { buildExport } from "../lib/exporter";
import { isObjectId } from "../lib/security";

export const exportsRouter = Router();
exportsRouter.use(requireAuth);
exportsRouter.get("/", wrap(async (req: AuthedRequest, res) =>
  res.json({ ok: true, data: await Export.find({ ownerId: req.user!.id }).sort({ createdAt: -1 }).limit(100).lean() })));

// Re-download: regenerated from current data (no files are stored).
exportsRouter.get("/:id/download", wrap(async (req: AuthedRequest, res) => {
  if (!isObjectId(req.params.id)) throw new HttpError(404, "Export not found.");
  const e = await Export.findOne({ _id: req.params.id, ownerId: req.user!.id });
  const s = e && await Session.findById(e.sessionId);
  if (!e || !s) throw new HttpError(404, "This session no longer exists.");
  const out = await buildExport(s, e.format as any);
  res.setHeader("Content-Type", out.contentType); res.setHeader("Content-Disposition", `attachment; filename="${out.filename}"`); res.send(out.body);
}));
