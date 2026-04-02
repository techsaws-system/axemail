import { Request, Response, NextFunction } from "express";
import {
    getCurrentUser,
    updateUserProfile,
    getAllUsers,
    getManageableAccounts,
    updateUserQuota,
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

export const manageableAccounts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getManageableAccounts(req.user!.userId);
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};

export const setQuota = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dailySendLimit = Number(req.body.dailySendLimit);

        if (!Number.isInteger(dailySendLimit) || dailySendLimit < 0) {
            throw {
                statusCode: 400,
                message: "dailySendLimit must be a non-negative integer",
            };
        }

        const updated = await updateUserQuota(
            req.user!.userId,
            String(req.params.userId),
            dailySendLimit
        );

        successResponse(res, updated, "Quota updated");
    } catch (error) {
        next(error);
    }
};
