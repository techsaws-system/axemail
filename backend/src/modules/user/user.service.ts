import { prisma } from "../../config/prisma";
import { UpdateUserInput } from "./user.types";

export const getCurrentUser = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudoName: true,
            email: true,
            isActive: true,
            createdAt: true,
        },
    });
};

export const updateUserProfile = async (
    userId: string,
    data: UpdateUserInput
) => {
    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudoName: true,
            email: true,
            updatedAt: true,
        },
    });
};

export const getAllUsers = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
        },
    });
};
