import { env } from "../config/env";
/** Sends via Resend when RESEND_API_KEY is set; otherwise logs (development). Swap this file for any provider. */
export async function sendMail(to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY) { console.log(`[mail:dev] to=${to} subject=${subject}\n${text}`); return; }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }),
    });
  } catch (e) { console.error("mail failed", e); }
}
