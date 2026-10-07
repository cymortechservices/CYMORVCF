import { describe, it, expect } from "vitest";
import { normalizePhone } from "../src/lib/phone";
import { buildVcf, parseVcf, safeFilename } from "../src/lib/vcf";

describe("phone normalization", () => {
  it("treats local and international Kenyan formats as the same number", () => {
    const a = normalizePhone("0712345678")!, b = normalizePhone("+254712345678")!, c = normalizePhone("254712345678")!;
    expect(a.normalizedNumber).toBe("+254712345678");
    expect(b.normalizedNumber).toBe(a.normalizedNumber);
    expect(c.normalizedNumber).toBe(a.normalizedNumber);
    expect(a.countryCode).toBe("KE");
  });
  it("rejects invalid numbers", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});

describe("vcf", () => {
  it("builds valid cards and round-trips", () => {
    const out = buildVcf([{ name: "CYMOR 001", phone: "+254712345678" }]);
    expect(out).toContain("BEGIN:VCARD\r\nVERSION:3.0");
    expect(out.trim().endsWith("END:VCARD")).toBe(true);
    expect(parseVcf(out)).toEqual([{ name: "CYMOR 001", phone: "+254712345678" }]);
  });
  it("escapes special characters", () => {
    expect(buildVcf([{ name: "A;B,C\nD", phone: "+1" }])).toContain("FN:A\\;B\\,C\\nD");
  });
  it("handles empty and malformed input", () => {
    expect(buildVcf([])).toBe("");
    expect(parseVcf("garbage")).toEqual([]);
  });
  it("sanitizes filenames", () => { expect(safeFilename("x y.vcf")).toBe("x-y.vcf"); });
});
