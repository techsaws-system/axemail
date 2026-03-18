import { Request, Response, NextFunction } from "express";

import { ENV } from "../config/env";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message =
        ENV.NODE_ENV === "development" 
            ? err.message
            : "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
    });
};
