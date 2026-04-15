import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url().default("https://axemail.cloud"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("8h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("8h"),
  SESSION_RETENTION_DAYS: z.coerce.number().int().min(1).max(7).default(3),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(100),
  MASK_SENDER_API_URL: z.string().url().default("https://server.axmail.cloud/send"),
  MASK_SENDER_HEALTHCHECK_URL: z.string().url().optional(),
  MASK_SENDER_API_KEY: z.string().default(""),
  ENCRYPTION_KEY: z.string().length(64),
  GMAIL_COOLDOWN_SECONDS: z.string().default("20,35,50,70,90"),
  DOMAIN_COOLDOWN_SECONDS: z.string().default("20,35,50,70,90"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration.");
}

export const env = {
  ...parsed.data,
  MASK_SENDER_HEALTHCHECK_URL:
    parsed.data.MASK_SENDER_HEALTHCHECK_URL ??
    new URL("/health", parsed.data.MASK_SENDER_API_URL).toString(),
  GMAIL_COOLDOWN_SCHEDULE: parsed.data.GMAIL_COOLDOWN_SECONDS.split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0),
  DOMAIN_COOLDOWN_SCHEDULE: parsed.data.DOMAIN_COOLDOWN_SECONDS.split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0),
};
