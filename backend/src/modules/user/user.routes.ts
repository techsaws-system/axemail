import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import {
    me,
    updateProfile,
    listUsers,
} from "./user.controller";

const router = Router();

router.get("/me", protect, me);
router.put("/me", protect, updateProfile);
router.get("/", protect, listUsers);

export default router;
