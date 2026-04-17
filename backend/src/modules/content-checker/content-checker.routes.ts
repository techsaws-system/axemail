import { Router } from "express";

import { checkContentHandler } from "@/modules/content-checker/content-checker.controller";
import { requireAuthenticatedUser } from "@/middleware/auth";

export const contentCheckerRouter = Router();

contentCheckerRouter.post("/content-checker/check", requireAuthenticatedUser, checkContentHandler);
