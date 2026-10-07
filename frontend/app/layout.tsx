import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CYMOR VCF — Build Your Network. Grow Your Reach.",
  description: "Create collaborative contact campaigns, grow your WhatsApp network, manage contacts in real time and export clean VCF files.",
  openGraph: { title: "CYMOR VCF", description: "Build your network. Grow your reach.", type: "website", siteName: "CYMOR VCF" },
  twitter: { card: "summary_large_image", title: "CYMOR VCF", description: "Build your network. Grow your reach." },
};
export const viewport: Viewport = { themeColor: "#07080d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
