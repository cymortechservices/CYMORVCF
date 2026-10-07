import { Contact } from "../models/Contact";
import { buildVcf, safeFilename } from "./vcf";

export type Format = "vcf" | "csv" | "txt";
export const parseFormat = (f: unknown): Format => (f === "csv" || f === "txt" ? f : "vcf");
const csvCell = (v: string) => `"${(/^[=+\-@]/.test(v) && !/^\+\d+$/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;

export async function buildExport(session: { _id: unknown; vcfFilename: string }, format: Format) {
  const rows = await Contact.find({ sessionId: session._id }).sort({ createdAt: 1 }).limit(100000).lean();
  const base = safeFilename(session.vcfFilename).replace(/\.vcf$/, "");
  if (format === "csv") return { count: rows.length, filename: `${base}.csv`, contentType: "text/csv; charset=utf-8",
    body: "Name,Phone,Country\r\n" + rows.map((c) => [c.name, c.normalizedNumber, c.country ?? ""].map(csvCell).join(",")).join("\r\n") };
  if (format === "txt") return { count: rows.length, filename: `${base}.txt`, contentType: "text/plain; charset=utf-8", body: rows.map((c) => c.normalizedNumber).join("\n") };
  return { count: rows.length, filename: `${base}.vcf`, contentType: "text/vcard; charset=utf-8", body: buildVcf(rows.map((c) => ({ name: c.name, phone: c.normalizedNumber }))) };
}
