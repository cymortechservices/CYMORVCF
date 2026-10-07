import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return ["", "/explore", "/create", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
}
