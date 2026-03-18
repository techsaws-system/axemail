import { Router } from "express";

import { protect } from "../../middleware/auth.middleware";
import { today, transport } from "./analytics.controller";

const router = Router();

router.get("/today", protect, today);
router.get("/transport", protect, transport);

export default router;
