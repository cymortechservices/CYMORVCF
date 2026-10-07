import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { allowedOrigins } from "./config/env";
import { authRouter } from "./routes/auth";
import { sessionsRouter } from "./routes/sessions";
import { exportsRouter } from "./routes/exports";
import { analyticsRouter } from "./routes/analytics";
import { adminRouter } from "./routes/admin";
import { requireAuth, requireSuperadmin } from "./middleware/auth";
import { sanitize } from "./middleware/sanitize";
import { errorHandler } from "./middleware/error";

export const app = express();
app.set("trust proxy", 1); // Render sits behind a proxy
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
// Large VCF uploads: only super admins, and only after authentication.
app.use("/api/admin/import", requireAuth, requireSuperadmin, express.json({ limit: "8mb" }));
app.use(express.json({ limit: "100kb" }));
app.use(sanitize);
app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true, message: { ok: false, error: "Too many requests. Please slow down." } }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/exports", exportsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);
app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found." }));
app.use(errorHandler);
