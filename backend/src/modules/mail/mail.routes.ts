import { Router } from "express";
import { UserRole } from "@prisma/client";
import { send } from "./mail.controller";

import { protect, authorize } from "../../middleware/auth.middleware";
import { mailRateLimiter } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post(
    "/send",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
    mailRateLimiter,
    send
);

export default router;
