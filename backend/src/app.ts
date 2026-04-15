import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "@/config/env";
import { authRouter } from "@/modules/auth/auth.routes";
import { healthRouter } from "@/modules/health/health.routes";
import { senderAccountsRouter } from "@/modules/sender-accounts/sender-accounts.routes";
import { sendersRouter } from "@/modules/senders/senders.routes";
import { usageRouter } from "@/modules/usage/usage.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { attachAuth } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found";
import { globalRateLimiter } from "@/middleware/rate-limit";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use((request, response, next) => {
    const startedAt = Date.now();
    response.on("finish", () => {
      console.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });
  app.use(attachAuth);
  app.use(globalRateLimiter);

  app.use("/api", healthRouter);
  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", usageRouter);
  app.use("/api", senderAccountsRouter);
  app.use("/api", sendersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
