import { Router } from "express";

import {
  changePasswordHandler,
  createUserHandler,
  deleteUserHandler,
  getProfileHandler,
  getUsersHandler,
  terminateSessionHandler,
  updateProfileHandler,
  updateUserHandler,
} from "@/modules/users/users.controller";
import { requireAuthenticatedUser, requireRoles } from "@/middleware/auth";

export const usersRouter = Router();

usersRouter.get("/users", requireAuthenticatedUser, requireRoles("ADMIN", "MANAGER"), getUsersHandler);
usersRouter.post("/users", requireAuthenticatedUser, requireRoles("ADMIN"), createUserHandler);
usersRouter.patch("/users/:userId", requireAuthenticatedUser, requireRoles("ADMIN"), updateUserHandler);
usersRouter.delete("/users/:userId", requireAuthenticatedUser, requireRoles("ADMIN"), deleteUserHandler);
usersRouter.get("/profile", requireAuthenticatedUser, getProfileHandler);
usersRouter.patch("/profile", requireAuthenticatedUser, updateProfileHandler);
usersRouter.patch("/profile/password", requireAuthenticatedUser, changePasswordHandler);
usersRouter.post("/users/terminate-session", requireAuthenticatedUser, requireRoles("ADMIN", "MANAGER"), terminateSessionHandler);
