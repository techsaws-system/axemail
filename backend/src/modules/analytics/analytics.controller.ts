import { Request, Response, NextFunction } from "express";
import {
    getTodayStats,
    getTransportStats,
    getMyUsageStats,
    getUsageOverview,
} from "./analytics.service";

import { successResponse } from "../../utils/response";

export const today = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getTodayStats(req.user!.userId);
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};

export const transport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getTransportStats(req.user!.userId);
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};

export const myUsage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getMyUsageStats(req.user!.userId);
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};

export const overviewUsage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getUsageOverview(
            req.user!.userId,
            req.user!.role
        );
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};
