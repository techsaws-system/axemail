import { prisma } from "../../config/prisma";
import { UserRole } from "@prisma/client";
import { hashPassword, comparePassword } from "../../utils/hash";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
} from "../../utils/jwt";

const authUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    pseudoName: true,
    email: true,
    role: true,
    dailySendLimit: true,
    managerId: true,
    assignedById: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
} as const;

interface RegisterInput {
    firstName: string;
    lastName: string;
    pseudoName?: string;
    email: string;
    password: string;
    role?: UserRole;
}

interface LoginInput {
    email: string;
    password: string;
}

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw { statusCode: 400, message: "Email already exists" };
    }

    const hashed = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            pseudoName: data.pseudoName,
            email: data.email,
            password: hashed,
            role: data.role ?? UserRole.EMPLOYEE,
        },
        select: authUserSelect,
    });

    const tokenPayload = {
        userId: user.id,
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return { user, accessToken, refreshToken };
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw { statusCode: 401, message: "Invalid credentials" };
    }

    const isMatch = await comparePassword(data.password, user.password);

    if (!isMatch) {
        throw { statusCode: 401, message: "Invalid credentials" };
    }

    const tokenPayload = {
        userId: user.id,
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    const safeUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: authUserSelect,
    });

    return { user: safeUser, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
    const decoded = verifyToken(refreshToken);

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
        throw { statusCode: 403, message: "Invalid refresh token" };
    }

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
    });

    return { accessToken };
};

export const logoutUser = async (userId: string) => {
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
};
