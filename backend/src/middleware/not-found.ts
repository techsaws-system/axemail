import type { Request, Response } from "express";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    error: {
      message: `Route ${request.method} ${request.originalUrl} not found.`,
    },
  });
}
