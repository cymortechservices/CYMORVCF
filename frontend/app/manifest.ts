import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "CYMOR VCF", short_name: "CYMOR VCF", description: "Build your network. Grow your reach.", start_url: "/", display: "standalone", background_color: "#07080d", theme_color: "#7c5cff", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
