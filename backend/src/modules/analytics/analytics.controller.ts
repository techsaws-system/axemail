import { Request, Response, NextFunction } from "express";
import {
    getTodayStats,
    getTransportStats,
} from "./analytics.service";

import { successResponse } from "../../utils/response";

export const today = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await getTodayStats();
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
        const data = await getTransportStats();
        successResponse(res, data);
    } catch (error) {
        next(error);
    }
};
