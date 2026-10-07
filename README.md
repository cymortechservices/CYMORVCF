# CYMOR VCF

Build your network. Grow your reach. A collaborative contact-campaign platform by CYMOR TECH SERVICES.
Independent service, not affiliated with WhatsApp or Meta. Saving contacts never guarantees Status views.

## Features
- **Public:** animated homepage (floating masked numbers, demo dashboard, features, FAQ), Explore (search, popular / recent / almost complete, country filters, pagination), 5-step Create wizard with QR + share, mobile-first Join page, privacy/terms/help, error pages (401/403/404/429/500), SEO (metadata, robots, sitemap, manifest, icon).
- **Creator:** dashboard overview, sessions (open/share/edit/pause/resume/export/delete), live session dashboard (Socket.IO, growth chart, countries, activity feed, target-reached modal), contacts (search, country/date filters, sort, bulk select + delete, mobile cards), analytics (7/30/90/all), export history, settings, password reset, email verification.
- **Super admin:** control center (stats, growth charts, countries, health), users (search, suspend/restore/delete with confirmations, view sessions), sessions (filters, edit, suspend, delete, export), VCF import (drag and drop, preview, new/existing session, never overwrites), activity and audit log. All enforced server-side.
- **Backend:** Express + TypeScript, Mongoose, JWT httpOnly cookie, roles read from DB, Helmet, CORS, rate limits, Zod, Mongo-operator sanitizer, per-source join limits, optional Turnstile CAPTCHA, E.164 normalisation (libphonenumber-js), unique `(sessionId, normalizedNumber)` index, VCF/CSV/TXT export, safe VCF parser, activity log (180-day TTL), export records (90-day TTL), admin audit log.

## Duplicate handling (design decision)
Duplicates are blocked at the door (normalised number + unique index), counted in `duplicateCount`, and logged as "Duplicate detected". They are not stored, so there is no duplicate list to clean and no risk of deleting the wrong contact. Bulk deletes are session-scoped and confirmed.

## Run locally
```
cd backend && cp ../.env.example .env   # fill MONGODB_URI, JWT_SECRET, CLIENT_URL
npm install && npm run dev               # http://localhost:4000
npm run seed                             # optional: synthetic data. demo@cymor.example / demo-password-123
npm test                                 # unit + API tests (downloads an in-memory MongoDB on first run)

cd ../frontend && cp .env.local.example .env.local
npm install && npm run dev               # http://localhost:3000
```
Superadmin: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before `npm run seed`, or set `role: "SUPERADMIN"` on a user in Atlas.

## Deploy
1. **MongoDB Atlas:** create a cluster, a database user, allow Render's IPs (or 0.0.0.0/0), copy the connection string into `MONGODB_URI`.
2. **Render:** new Web Service from this repo (or use `render.yaml`). Root `backend`, build `npm install --include=dev && npm run build`, start `npm start`. Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `ALLOWED_ORIGINS`, `NODE_ENV=production`. Cookies use `SameSite=None; Secure` in production, so frontend and API must both be HTTPS. Socket.IO works on Render web services over WebSocket; CORS uses the same origins.
3. **Vercel:** import the repo, root `frontend`, set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` (your Render URL), `NEXT_PUBLIC_SITE_URL`.
4. Optional: Turnstile (`CAPTCHA_SECRET` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`), Resend (`RESEND_API_KEY`, `MAIL_FROM`).

## Security notes
Phone numbers are personal data: never in public APIs or socket events; only owners and super admins can list or export them. Replace the draft privacy and terms text with reviewed legal copy before launch. Third-party cookies can be blocked by some browsers when API and site are on different domains; using a shared parent domain (e.g. `app.example.com` and `api.example.com`) avoids this.

## API overview
`/api/auth` register, login, logout, me, forgot, reset, verify-email · `/api/sessions` CRUD, explore/list, :id/join, :id/manage, :id/contacts (+bulk-delete), :id/analytics, :id/activity, :id/export?format= · `/api/exports` list, :id/download · `/api/analytics` · `/api/admin` stats, health, activity, users, sessions, import/preview, import.

## Layout
`backend/src` (config, models, lib, middleware, routes), `backend/tests`, `backend/scripts/seed.ts`, `frontend/app` (pages), `frontend/components`, `frontend/lib`.
