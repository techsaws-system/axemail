import { Router } from "express";
import { UserRole } from "@prisma/client";

import { protect, authorize } from "../../middleware/auth.middleware";
import {
    today,
    transport,
    myUsage,
    overviewUsage,
} from "./analytics.controller";

const router = Router();

router.get(
    "/today",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
    today
);
router.get(
    "/transport",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
    transport
);
router.get(
    "/usage/me",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
    myUsage
);
router.get(
    "/usage/overview",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    overviewUsage
);

export default router;
