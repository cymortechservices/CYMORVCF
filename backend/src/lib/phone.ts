import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export interface NormalizedPhone {
  originalNumber: string;
  normalizedNumber: string; // E.164
  countryCode: string; // e.g. KE
  country: string;
}

const names = new Intl.DisplayNames(["en"], { type: "region" });

/** Normalizes a phone number to E.164. Returns null when invalid. */
export function normalizePhone(input: string, defaultCountry: CountryCode = "KE"): NormalizedPhone | null {
  const raw = input.trim();
  if (!raw || raw.length > 25) return null;
  const digits = raw.replace(/[\s-]/g, "");
  const candidate = /^\d{9,15}$/.test(digits) && !digits.startsWith("0") ? `+${digits}` : raw;
  const p = parsePhoneNumberFromString(candidate, defaultCountry);
  if (!p || !p.isValid() || !p.country) return null;
  return { originalNumber: raw, normalizedNumber: p.number, countryCode: p.country, country: names.of(p.country) ?? p.country };
}
