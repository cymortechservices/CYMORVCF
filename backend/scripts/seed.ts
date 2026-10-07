/* Dev seed: synthetic data only. Usage: MONGODB_URI=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { User } from "../src/models/User";
import { Session } from "../src/models/Session";
import { Contact } from "../src/models/Contact";
import { ActivityLog } from "../src/models/ActivityLog";

const DEMO = "demo@cymor.example";
const PLAN: [string, string, string, number, number, string, string][] = [
  ["Nairobi Creators Network", "KE", "CYMOR", 500, 347, "254", "Kenya"], ["Kenya Entrepreneurs", "KE", "KE", 1000, 612, "254", "Kenya"],
  ["African Developers", "NG", "DEV", 800, 215, "234", "Nigeria"], ["Campus Connect 2026", "UG", "CAMPUS", 300, 289, "256", "Uganda"],
  ["Business Growth Network", "TZ", "BIZ", 600, 74, "255", "Tanzania"],
];
(async () => {
  const uri = process.env.MONGODB_URI; if (!uri) throw new Error("MONGODB_URI required");
  await mongoose.connect(uri);
  const old = await User.findOne({ email: DEMO });
  if (old) { const ids = (await Session.find({ ownerId: old._id }).select("_id")).map((s) => s._id); await Contact.deleteMany({ sessionId: { $in: ids } }); await ActivityLog.deleteMany({ sessionId: { $in: ids } }); await Session.deleteMany({ ownerId: old._id }); await old.deleteOne(); }
  const demo = await User.create({ email: DEMO, displayName: "Demo Creator", passwordHash: await bcrypt.hash("demo-password-123", 12), emailVerified: true });
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD && !(await User.exists({ email: process.env.SEED_ADMIN_EMAIL.toLowerCase() })))
    await User.create({ email: process.env.SEED_ADMIN_EMAIL, displayName: "Super Admin", role: "SUPERADMIN", emailVerified: true, passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12) });
  for (const [name, region, prefix, target, count, cc, country] of PLAN) {
    const s = await Session.create({ sessionId: nanoid(10), ownerId: demo._id, name, region, prefix, target, vcfFilename: `${prefix.toLowerCase()}.vcf`, description: "Synthetic demo session.", contactCount: count, contactCounter: count, duplicateCount: Math.round(count * 0.05) });
    // Obviously synthetic numbers (+<cc>7000xxxxx); never real people.
    await Contact.insertMany(Array.from({ length: count }, (_, i) => ({
      sessionId: s._id, name: `${prefix} ${String(i + 1).padStart(3, "0")}`, originalNumber: `0700${String(i).padStart(5, "0")}`, normalizedNumber: `+${cc}7000${String(i).padStart(5, "0")}`,
      countryCode: region, country, createdAt: new Date(Date.now() - Math.random() * 30 * 864e5),
    })));
    await ActivityLog.create({ sessionId: s._id, type: "SESSION_CREATED", message: "Session created" });
  }
  console.log(`Seeded. Demo login: ${DEMO} / demo-password-123`); await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
