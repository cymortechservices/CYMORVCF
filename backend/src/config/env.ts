import { z } from "zod";
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CLIENT_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default(""),
  NODE_ENV: z.string().default("development"),
  JOIN_PER_IP_HOUR: z.coerce.number().default(5),
  CAPTCHA_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("CYMOR VCF <no-reply@example.com>"),
});
export const env = schema.parse(process.env);
export const allowedOrigins = [env.CLIENT_URL, ...env.ALLOWED_ORIGINS.split(",").filter(Boolean)];
