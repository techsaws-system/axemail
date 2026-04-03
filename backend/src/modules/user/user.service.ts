import { UserRole } from "@prisma/client";
import { startOfDay } from "date-fns";

import { prisma } from "../../config/prisma";
import { ENV } from "../../config/env";
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
            role: true,
            dailySendLimit: true,
            managerId: true,
            assignedById: true,
            isActive: true,
            createdAt: true,
        },
    });
};

export const updateUserProfile = async (
    userId: string,
    role: UserRole,
    data: UpdateUserInput
) => {
    const updateData: UpdateUserInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        pseudoName: data.pseudoName,
    };

    if (
        role === UserRole.ADMIN &&
        typeof data.dailySendLimit === "number" &&
        Number.isInteger(data.dailySendLimit) &&
        data.dailySendLimit >= 0
    ) {
        updateData.dailySendLimit = data.dailySendLimit;
    }

    return prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudoName: true,
            email: true,
            role: true,
            dailySendLimit: true,
            managerId: true,
            assignedById: true,
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
            pseudoName: true,
            email: true,
            role: true,
            dailySendLimit: true,
            managerId: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: [
            { role: "asc" },
            { firstName: "asc" },
        ],
    });
};

const userUsageTodayMap = async (userIds: string[]) => {
    if (userIds.length === 0) {
        return new Map<string, number>();
    }

    const logs = await prisma.emailLog.groupBy({
        by: ["userId"],
        where: {
            userId: {
                in: userIds,
            },
            createdAt: {
                gte: startOfDay(new Date()),
            },
        },
        _count: {
            _all: true,
        },
    });

    return new Map(logs.map((log) => [log.userId, log._count._all]));
};

export const getManageableAccounts = async (actorId: string) => {
    const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: {
            id: true,
            role: true,
            dailySendLimit: true,
        },
    });

    if (!actor) {
        throw { statusCode: 404, message: "User not found" };
    }

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MANAGER) {
        throw { statusCode: 403, message: "Not allowed" };
    }

    const where =
        actor.role === UserRole.ADMIN
            ? {
                role: {
                    in: [UserRole.MANAGER, UserRole.EMPLOYEE],
                },
            }
            : {
                role: UserRole.EMPLOYEE,
                OR: [
                    { managerId: actorId },
                    { managerId: null },
                ],
            };

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudoName: true,
            email: true,
            role: true,
            dailySendLimit: true,
            isActive: true,
            managerId: true,
            manager: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: [
            { role: "asc" },
            { firstName: "asc" },
        ],
    });

    const usageMap = await userUsageTodayMap(users.map((user) => user.id));

    const allocatableLimit =
        actor.role === UserRole.ADMIN
            ? ENV.SERVER_DAILY_LIMIT
            : actor.dailySendLimit;

    const allocatedLimit =
        actor.role === UserRole.ADMIN
            ? users.reduce((sum, user) => sum + user.dailySendLimit, 0)
            : users
                .filter((user) => user.managerId === actorId)
                .reduce((sum, user) => sum + user.dailySendLimit, 0);

    return {
        allocator: {
            role: actor.role,
            allocatableLimit,
            allocatedLimit,
            remainingToAllocate: Math.max(allocatableLimit - allocatedLimit, 0),
        },
        users: users.map((user) => ({
            ...user,
            managerName: user.manager
                ? `${user.manager.firstName} ${user.manager.lastName}`
                : null,
            isAllocatedByCurrentUser:
                actor.role === UserRole.ADMIN || user.managerId === actorId,
            sentToday: usageMap.get(user.id) || 0,
            remainingToday: Math.max(
                user.dailySendLimit - (usageMap.get(user.id) || 0),
                0
            ),
        })),
    };
};

export const updateUserQuota = async (
    actorId: string,
    targetUserId: string,
    dailySendLimit: number
) => {
    if (dailySendLimit < 0) {
        throw { statusCode: 400, message: "Daily limit must be zero or greater" };
    }

    if (actorId === targetUserId) {
        throw { statusCode: 400, message: "You cannot update your own quota here" };
    }

    const [actor, target] = await Promise.all([
        prisma.user.findUnique({
            where: { id: actorId },
            select: {
                id: true,
                role: true,
                dailySendLimit: true,
            },
        }),
        prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                role: true,
                managerId: true,
                dailySendLimit: true,
            },
        }),
    ]);

    if (!actor || !target) {
        throw { statusCode: 404, message: "User not found" };
    }

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MANAGER) {
        throw { statusCode: 403, message: "Not allowed" };
    }

    if (actor.role === UserRole.MANAGER) {
        if (target.role !== UserRole.EMPLOYEE) {
            throw { statusCode: 403, message: "Managers can update employees only" };
        }

        if (target.managerId && target.managerId !== actorId) {
            throw {
                statusCode: 403,
                message: "This employee is already assigned to another manager",
            };
        }

        const alreadyAllocated = await prisma.user.aggregate({
            where: {
                role: UserRole.EMPLOYEE,
                managerId: actorId,
                NOT: {
                    id: targetUserId,
                },
            },
            _sum: {
                dailySendLimit: true,
            },
        });

        const usedLimit = alreadyAllocated._sum.dailySendLimit || 0;

        if (usedLimit + dailySendLimit > actor.dailySendLimit) {
            throw {
                statusCode: 400,
                message: `Quota exceeds your remaining allocation of ${Math.max(actor.dailySendLimit - usedLimit, 0)}`,
            };
        }

        return prisma.user.update({
            where: { id: targetUserId },
            data: {
                dailySendLimit,
                managerId: actorId,
                assignedById: actorId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                dailySendLimit: true,
                managerId: true,
                assignedById: true,
            },
        });
    }

    if (
        target.role !== UserRole.MANAGER &&
        target.role !== UserRole.EMPLOYEE
    ) {
        throw { statusCode: 403, message: "Invalid target role" };
    }

    if (target.role === UserRole.MANAGER) {
        const employeeAllocated = await prisma.user.aggregate({
            where: {
                role: UserRole.EMPLOYEE,
                managerId: targetUserId,
            },
            _sum: {
                dailySendLimit: true,
            },
        });

        const employeeAllocatedLimit = employeeAllocated._sum.dailySendLimit || 0;

        if (dailySendLimit < employeeAllocatedLimit) {
            throw {
                statusCode: 400,
                message: `Manager already allocated ${employeeAllocatedLimit} to employees`,
            };
        }
    }

    const otherAllocated = await prisma.user.aggregate({
        where: {
            role: {
                in: [UserRole.MANAGER, UserRole.EMPLOYEE],
            },
            NOT: {
                id: targetUserId,
            },
        },
        _sum: {
            dailySendLimit: true,
        },
    });

    const usedByOthers = otherAllocated._sum.dailySendLimit || 0;

    if (usedByOthers + dailySendLimit > ENV.SERVER_DAILY_LIMIT) {
        throw {
            statusCode: 400,
            message: `Quota exceeds server remaining allocation of ${Math.max(ENV.SERVER_DAILY_LIMIT - usedByOthers, 0)}`,
        };
    }

    return prisma.user.update({
        where: { id: targetUserId },
        data: {
            dailySendLimit,
            assignedById: actorId,
            ...(target.role === UserRole.EMPLOYEE
                ? { managerId: null }
                : {}),
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            dailySendLimit: true,
            managerId: true,
            assignedById: true,
        },
    });
};
