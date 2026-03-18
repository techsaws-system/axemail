import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { ENV } from "../config/env";

export interface JwtPayload {
    userId: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
    const options: SignOptions = {
        expiresIn: ENV.JWT_EXPIRES_IN as StringValue,
    };

    return jwt.sign(payload, ENV.JWT_SECRET as Secret, options);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
    const options: SignOptions = {
        expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as StringValue,
    };

    return jwt.sign(payload, ENV.JWT_SECRET as Secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, ENV.JWT_SECRET as Secret) as JwtPayload;
};
