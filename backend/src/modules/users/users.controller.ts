import type { Request, Response } from "express";

import { changePassword, createUser, deleteUser, getProfile, listUsers, terminateUserSessions, updateProfile, updateUser } from "@/services/user.service";
import { asyncHandler } from "@/utils/async-handler";
import { changePasswordSchema, createUserSchema, terminateSessionSchema, updateProfileSchema, updateUserSchema, userIdSchema } from "@/modules/users/users.schemas";

export const getUsersHandler = asyncHandler(async (_request: Request, response: Response) => {
  response.json({ data: await listUsers(_request.auth!.role) });
});

export const createUserHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = createUserSchema.parse(request.body);
  response.status(201).json({ data: await createUser(payload) });
});

export const updateUserHandler = asyncHandler(async (request: Request, response: Response) => {
  const { userId } = userIdSchema.parse(request.params);
  const payload = updateUserSchema.parse(request.body);
  response.json({ data: await updateUser(userId, payload) });
});

export const deleteUserHandler = asyncHandler(async (request: Request, response: Response) => {
  const { userId } = userIdSchema.parse(request.params);
  response.json({ data: await deleteUser(userId) });
});

export const getProfileHandler = asyncHandler(async (request: Request, response: Response) => {
  response.json({ data: await getProfile(request.auth!.userId) });
});

export const updateProfileHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = updateProfileSchema.parse(request.body);
  response.json({ data: await updateProfile(request.auth!.userId, request.auth!.role, payload) });
});

export const changePasswordHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = changePasswordSchema.parse(request.body);
  response.json({
    data: await changePassword(request.auth!.userId, request.auth!.sessionId, payload),
  });
});

export const terminateSessionHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = terminateSessionSchema.parse(request.body);
  response.json({
    data: await terminateUserSessions(payload.userId, request.auth!.userId, request.auth!.role),
  });
});
