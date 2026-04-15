import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "@/utils/app-error";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: {
        message: "Validation failed.",
        details: error.flatten(),
      },
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  console.error("Unhandled request error.", error);

  return response.status(500).json({
    error: {
      message: "Internal server error.",
    },
  });
}
