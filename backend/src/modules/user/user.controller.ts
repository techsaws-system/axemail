import { Request, Response, NextFunction } from "express";
import {
    getCurrentUser,
    updateUserProfile,
    getAllUsers,
} from "./user.service";
import { successResponse } from "../../utils/response";

export const me = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await getCurrentUser(req.user!.userId);
        successResponse(res, user);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updated = await updateUserProfile(
            req.user!.userId,
            req.body
        );
        successResponse(res, updated, "Profile updated");
    } catch (error) {
        next(error);
    }
};

export const listUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users = await getAllUsers();
        successResponse(res, users);
    } catch (error) {
        next(error);
    }
};
