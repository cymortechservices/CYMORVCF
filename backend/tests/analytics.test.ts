import { describe, it, expect } from "vitest";
import { computeAnalytics } from "../src/lib/analytics";
import { buildVcf, parseVcf } from "../src/lib/vcf";
import { normalizePhone } from "../src/lib/phone";

const now = new Date("2026-10-06T12:00:00Z");
describe("analytics", () => {
  it("handles zero contacts", () => {
    const a = computeAnalytics([], { now, target: 100 });
    expect(a.total).toBe(0); expect(a.peakHour).toBeNull(); expect(a.growthRate).toBeNull(); expect(a.completion).toBe(0);
  });
  it("handles a single contact", () => {
    const a = computeAnalytics([{ createdAt: "2026-10-06T09:30:00Z", country: "Kenya", countryCode: "KE" }], { now, target: 10 });
    expect(a.total).toBe(1); expect(a.peakHour).toBe(9); expect(a.countries[0]).toMatchObject({ code: "KE", pct: 100 }); expect(a.completion).toBe(10);
  });
  it("buckets by day with cumulative totals and respects the range", () => {
    const rows = [{ createdAt: "2026-10-05T10:00:00Z" }, { createdAt: "2026-10-05T11:00:00Z" }, { createdAt: "2026-10-06T08:00:00Z" }, { createdAt: "2026-06-01T08:00:00Z" }];
    const a = computeAnalytics(rows, { now, days: 7 });
    expect(a.total).toBe(3); expect(a.perDay.at(-1)).toMatchObject({ date: "2026-10-06", count: 1, cumulative: 3 });
    expect(computeAnalytics(rows, { now }).total).toBe(4);
  });
  it("computes growth rate against the previous week", () => {
    const rows = [{ createdAt: "2026-10-05T10:00:00Z" }, { createdAt: "2026-10-04T10:00:00Z" }, { createdAt: "2026-09-27T10:00:00Z" }];
    expect(computeAnalytics(rows, { now }).growthRate).toBe(100);
  });
});

describe("scale and edge cases", () => {
  it("builds and parses 1,000 contacts", () => {
    const list = Array.from({ length: 1000 }, (_, i) => ({ name: `CYMOR ${i + 1}`, phone: `+2547000${String(i).padStart(5, "0")}` }));
    expect(parseVcf(buildVcf(list))).toHaveLength(1000);
  });
  it("respects the parser contact cap and rejects oversized input", () => {
    const list = Array.from({ length: 50 }, (_, i) => ({ name: `N${i}`, phone: `+1${i}` }));
    expect(parseVcf(buildVcf(list), 10)).toHaveLength(10);
    expect(() => parseVcf("x".repeat(5_000_001))).toThrow();
  });
  it("ignores malformed cards", () => { expect(parseVcf("BEGIN:VCARD\r\nFN:No phone\r\nEND:VCARD")).toEqual([]); });
  it("detects invalid numbers", () => { expect(normalizePhone("+254 12")).toBeNull(); });
});
