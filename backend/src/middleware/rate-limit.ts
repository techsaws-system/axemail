import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { env } from "@/config/env";

const windowMs = 60_000;

function resolveKey(request: Request) {
  return request.auth?.userId ?? ipKeyGenerator(request.ip ?? "");
}

export const globalRateLimiter = rateLimit({
  windowMs,
  max: env.RATE_LIMIT_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveKey,
});

export const authRateLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.toLowerCase().trim()
        : "anonymous";

    return `${ipKeyGenerator(request.ip ?? "")}:${email}`;
  },
});
