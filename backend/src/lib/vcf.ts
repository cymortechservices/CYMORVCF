export interface VcfContact { name: string; phone: string }

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** vCard 3.0, CRLF line endings, UTF-8. */
export function buildVcf(contacts: VcfContact[]): string {
  return contacts
    .map((c) => ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(c.name)}`, `N:${esc(c.name)};;;;`, `TEL;TYPE=CELL:${c.phone.replace(/[^+\d]/g, "")}`, "END:VCARD"].join("\r\n"))
    .join("\r\n") + (contacts.length ? "\r\n" : "");
}

/** Safe VCF parser: size and count limits, extracts FN and TEL only. */
export function parseVcf(text: string, maxContacts = 10000): VcfContact[] {
  if (text.length > 5_000_000) throw new Error("VCF too large");
  const out: VcfContact[] = [];
  for (const card of text.split(/BEGIN:VCARD/i).slice(1)) {
    if (out.length >= maxContacts) break;
    const lines = card.split(/\r?\n/);
    const fn = lines.find((l) => /^FN[:;]/i.test(l))?.split(":").slice(1).join(":") ?? "";
    const tel = lines.find((l) => /^TEL[:;]/i.test(l))?.split(":").slice(1).join(":") ?? "";
    if (tel) out.push({ name: fn.replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ").trim(), phone: tel.trim() });
  }
  return out;
}

export const safeFilename = (n: string) => (n.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.vcf$/i, "") || "contacts") + ".vcf";
