import { Request, Response, NextFunction } from "express";
import { sendMail } from "./mail.service";
import { successResponse } from "../../utils/response";

export const send = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await sendMail(req.user!.userId, req.body);
        successResponse(res, result, "Email sent");
    } catch (error) {
        next(error);
    }
};
