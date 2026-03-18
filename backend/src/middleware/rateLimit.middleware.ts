import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Always return JSON on 429
 */
const json429 = (req: any, res: any) => {
    res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down.",
    });
};

/**
 * Use userId if authenticated
 * fallback to safe IP key generator
 */
const keyByUserOrIp = (req: any) => {
    const userId = req.user?.userId;

    if (userId) {
        return `uid:${userId}`;
    }

    return ipKeyGenerator(req);
};

/**
 * Auth limiter (login, refresh)
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});

/**
 * General API limiter
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});

/**
 * Mail sending limiter
 */
export const mailRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Mail send rate exceeded. Try again shortly.",
        });
    },
});