import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { verifyToken } from "../utils/jwt";

export const protect = (
    req: Request,
    res: Response,
    next: NextFunction 
) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        const decoded = verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export const authorize = (...allowedRoles: UserRole[]) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource",
            });
        }

        next();
    };
};

export const authorizeSelfOrRoles = (...allowedRoles: UserRole[]) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        const targetUserId = req.params.userId;

        if (targetUserId && req.user.userId === targetUserId) {
            return next();
        }

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You do not have permission to access this resource",
        });
    };
};
