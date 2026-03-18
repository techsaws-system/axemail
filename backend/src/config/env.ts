import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const ENV = {
    PORT: Number(process.env.PORT) || 8080,
    NODE_ENV: process.env.NODE_ENV || "development",

    FRONTEND_URL: requiredEnv("FRONTEND_URL"),
    DATABASE_URL: requiredEnv("DATABASE_URL"),

    JWT_SECRET: requiredEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || "8h") as string,
    JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || "8h") as string,

    RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW) || 15,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,

    GATEWAY_URL: requiredEnv("GATEWAY_URL"),
    GATEWAY_SECRET: requiredEnv("GATEWAY_SECRET"),

    FROM_EMAIL: process.env.FROM_EMAIL || "no-reply@tsdruspto.us",
};
