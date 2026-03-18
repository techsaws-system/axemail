import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { ENV } from "./config/env";
import {
    authRateLimiter,
    apiRateLimiter,
} from "./middleware/rateLimit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import mailRoutes from "./modules/mail/mail.routes";

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());

app.use(
    cors({
        origin: ENV.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Axemail backend running",
    });
});

app.use("/api", apiRateLimiter);
app.use("/api/auth", authRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/mail", mailRoutes);

app.use(errorMiddleware);
