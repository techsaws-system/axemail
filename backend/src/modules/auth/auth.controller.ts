import { Request, Response, NextFunction } from "express";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
} from "./auth.service";
import { successResponse } from "../../utils/response";
import { verifyToken } from "../../utils/jwt";
import { ENV } from "../../config/env";

const isProd = ENV.NODE_ENV === "production";

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await registerUser(req.body);
        successResponse(res, result, "User registered", 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await loginUser(req.body);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".axemail.cloud" : undefined,
            maxAge: 8 * 60 * 60 * 1000,
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".axemail.cloud" : undefined,
            maxAge: 8 * 60 * 60 * 1000,
        });


        successResponse(res, { user: result.user }, "Login successful");
    } catch (error) {
        next(error);
    }
};

export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw { statusCode: 401, message: "No refresh token" };
        }

        const result = await refreshAccessToken(refreshToken);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".axemail.cloud" : undefined,
            maxAge: 8 * 60 * 60 * 1000,
        });

        successResponse(res, null, "Token refreshed");
    } catch (error) {
        next(error);
    }
};

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = verifyToken(refreshToken);
            await logoutUser(decoded.userId);
        }

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".axemail.cloud" : undefined,
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            domain: isProd ? ".axemail.cloud" : undefined,
        });

        successResponse(res, null, "Logged out");
    } catch (error) {
        next(error);
    }
};

