import { Router } from "express";

import { loginHandler, logoutHandler, refreshHandler } from "@/modules/auth/auth.controller";
import { authRateLimiter } from "@/middleware/rate-limit";

export const authRouter = Router();

authRouter.post("/auth/login", authRateLimiter, loginHandler);
authRouter.post("/auth/refresh", authRateLimiter, refreshHandler);
authRouter.post("/auth/logout", authRateLimiter, logoutHandler);
