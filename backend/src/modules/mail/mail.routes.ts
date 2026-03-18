import { Router } from "express";
import { send } from "./mail.controller";

import { protect } from "../../middleware/auth.middleware";
import { mailRateLimiter } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post(
    "/send",
    protect,
    mailRateLimiter,
    send
);

export default router;
