import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let app: any, mongod: MongoMemoryServer, User: any;
const creds = (e: string) => ({ email: e, password: "password123", displayName: "Tester" });
let owner: any, other: any, sid: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGODB_URI: mongod.getUri(), JWT_SECRET: "test-secret-test-secret-123", CLIENT_URL: "http://localhost:3000", NODE_ENV: "test", JOIN_PER_IP_HOUR: "50" });
  await mongoose.connect(mongod.getUri());
  app = (await import("../src/app")).app; User = (await import("../src/models/User")).User;
  await (await import("../src/models/Contact")).Contact.syncIndexes();
  owner = request.agent(app); other = request.agent(app);
});
afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe("auth", () => {
  it("registers, logs in, and rejects bad credentials", async () => {
    expect((await owner.post("/api/auth/register").send(creds("a@test.dev"))).status).toBe(201);
    expect((await other.post("/api/auth/register").send(creds("b@test.dev"))).status).toBe(201);
    expect((await request(app).post("/api/auth/login").send({ email: "a@test.dev", password: "wrongpass1" })).status).toBe(401);
    expect((await owner.get("/api/auth/me")).body.data.role).toBe("USER");
  });
  it("blocks unauthenticated and non-admin access", async () => {
    expect((await request(app).get("/api/sessions")).status).toBe(401);
    expect((await owner.get("/api/admin/users")).status).toBe(403);
    expect((await request(app).get("/api/admin/stats")).status).toBe(401);
  });
});

describe("sessions and joining", () => {
  it("creates a session", async () => {
    const r = await owner.post("/api/sessions").send({ name: "Test Net", target: 2, prefix: "VIP" });
    expect(r.status).toBe(201); sid = r.body.data.sessionId;
  });
  it("joins, normalizes, and blocks duplicates across formats", async () => {
    const a = await request(app).post(`/api/sessions/${sid}/join`).send({ phone: "0712345678" });
    expect(a.status).toBe(201); expect(a.body.data.whatsappUrl).toBeNull();
    for (const p of ["+254712345678", "254712345678"]) expect((await request(app).post(`/api/sessions/${sid}/join`).send({ phone: p })).status).toBe(409);
    expect((await request(app).post(`/api/sessions/${sid}/join`).send({ phone: "123" })).status).toBe(422);
  });
  it("never exposes phone numbers publicly", async () => {
    const r = await request(app).get(`/api/sessions/${sid}`); expect(JSON.stringify(r.body)).not.toMatch(/\+254|712345678/);
    expect(JSON.stringify((await request(app).get("/api/sessions/explore/list")).body)).not.toMatch(/712345678/);
  });
  it("enforces ownership", async () => {
    expect((await other.get(`/api/sessions/${sid}/contacts`)).status).toBe(404);
    expect((await other.get(`/api/sessions/${sid}/export`)).status).toBe(404);
    expect((await other.delete(`/api/sessions/${sid}`)).status).toBe(404);
  });
  it("lists, exports a valid VCF, and tracks duplicates and activity", async () => {
    const c = await owner.get(`/api/sessions/${sid}/contacts`); expect(c.body.data[0].name).toBe("VIP 001");
    const e = await owner.get(`/api/sessions/${sid}/export`); expect(e.text).toContain("BEGIN:VCARD"); expect(e.text).toContain("TEL;TYPE=CELL:+254712345678");
    expect((await owner.get(`/api/sessions/${sid}/manage`)).body.data.duplicates).toBe(2);
    expect((await owner.get("/api/exports")).body.data).toHaveLength(1);
    expect((await owner.get(`/api/sessions/${sid}/analytics?range=7`)).body.data.total).toBe(1);
  });
  it("bulk deletes only within the session", async () => {
    const id = (await owner.get(`/api/sessions/${sid}/contacts`)).body.data[0]._id;
    expect((await owner.post(`/api/sessions/${sid}/contacts/bulk-delete`).send({ ids: [id] })).body.data.deleted).toBe(1);
    expect((await owner.get(`/api/sessions/${sid}/analytics`)).body.data.total).toBe(0);
  });
  it("handles paused and missing sessions", async () => {
    await owner.patch(`/api/sessions/${sid}`).send({ status: "PAUSED" });
    expect((await request(app).post(`/api/sessions/${sid}/join`).send({ phone: "0722000111" })).status).toBe(409);
    expect((await request(app).get("/api/sessions/nope")).status).toBe(404);
    await owner.delete(`/api/sessions/${sid}`); expect((await request(app).get(`/api/sessions/${sid}`)).status).toBe(404);
  });
  it("requires an access code for private sessions", async () => {
    const r = await owner.post("/api/sessions").send({ name: "Secret", target: 5, visibility: "PRIVATE", accessCode: "letmein" });
    const id = r.body.data.sessionId;
    expect((await request(app).post(`/api/sessions/${id}/join`).send({ phone: "0733000111" })).status).toBe(403);
    expect((await request(app).post(`/api/sessions/${id}/join`).send({ phone: "0733000111", accessCode: "letmein" })).status).toBe(201);
  });
});

describe("superadmin", () => {
  it("allows a real superadmin and logs actions", async () => {
    await User.updateOne({ email: "a@test.dev" }, { role: "SUPERADMIN" });
    expect((await owner.get("/api/admin/stats")).status).toBe(200);
    const users = (await owner.get("/api/admin/users")).body.data; const b = users.find((u: any) => u.email === "b@test.dev");
    expect((await owner.patch(`/api/admin/users/${b.id}`).send({ suspended: true })).status).toBe(200);
    expect((await other.get("/api/sessions")).status).toBe(403);
    expect((await owner.get("/api/admin/activity")).body.data.admin.length).toBeGreaterThan(0);
  });
  it("previews and imports a VCF without duplicates", async () => {
    const vcf = ["BEGIN:VCARD\nFN:A\nTEL:0711000001\nEND:VCARD", "BEGIN:VCARD\nFN:B\nTEL:+254711000001\nEND:VCARD", "BEGIN:VCARD\nFN:C\nTEL:bad\nEND:VCARD", "BEGIN:VCARD\nFN:D\nTEL:0711000002\nEND:VCARD"].join("\n");
    const p = await owner.post("/api/admin/import/preview").send({ vcf }); expect(p.body.data).toMatchObject({ detected: 4, unique: 2, duplicates: 1, invalid: 1 });
    const i = await owner.post("/api/admin/import").send({ vcf, newSession: { name: "Imported", target: 10 } }); expect(i.body.data.inserted).toBe(2);
    expect((await other.post("/api/admin/import").send({ vcf })).status).toBe(403);
  });
  it("rejects malformed import bodies", async () => { expect((await owner.post("/api/admin/import").send({ vcf: "x" })).status).toBe(400); });
});

describe("rate limiting", () => {
  it("returns 429 after repeated join attempts", async () => {
    const r = await owner.post("/api/sessions").send({ name: "Limit", target: 5 }); let hit = 0;
    for (let i = 0; i < 30 && !hit; i++) if ((await request(app).post(`/api/sessions/${r.body.data.sessionId}/join`).send({ phone: "1" })).status === 429) hit = 1;
    expect(hit).toBe(1);
  });
});
