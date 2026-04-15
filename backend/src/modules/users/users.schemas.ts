import { Role } from "@prisma/client";
import { z } from "zod";

export const userIdSchema = z.object({
  userId: z.string().min(1),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  pseudoName: z.string().min(1),
  email: z.email(),
  role: z.nativeEnum(Role),
  password: z.string().min(8).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  pseudoName: z.string().min(1).optional(),
  email: z.email().optional(),
  role: z.nativeEnum(Role).optional(),
  password: z.string().min(8).optional(),
});

export const terminateSessionSchema = z.object({
  userId: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  pseudoName: z.string().min(1),
  email: z.email().optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirm password must match.",
    path: ["confirmPassword"],
  });
