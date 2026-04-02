import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
    protect,
    authorize,
} from "../../middleware/auth.middleware";
import {
    me,
    updateProfile,
    listUsers,
    manageableAccounts,
    setQuota,
} from "./user.controller";

const router = Router();

router.get("/me", protect, me);
router.put("/me", protect, updateProfile);
router.get(
    "/manageable-accounts",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    manageableAccounts
);
router.patch(
    "/:userId/quota",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    setQuota
);
router.get(
    "/",
    protect,
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    listUsers
);

export default router;
