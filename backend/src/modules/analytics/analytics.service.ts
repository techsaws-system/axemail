import { UserRole } from "@prisma/client";
import { startOfDay } from "date-fns";

import { prisma } from "../../config/prisma";
import { ENV } from "../../config/env";

const getTodayStart = () => startOfDay(new Date());

const getTodayUsageCounts = async (userId: string) => {
    const today = getTodayStart();

    const [sentToday, accepted, rejected, deferred] = await Promise.all([
        prisma.emailLog.count({
            where: {
                userId,
                createdAt: { gte: today },
            },
        }),
        prisma.emailLog.count({
            where: {
                userId,
                status: "accepted",
                createdAt: { gte: today },
            },
        }),
        prisma.emailLog.count({
            where: {
                userId,
                status: "rejected",
                createdAt: { gte: today },
            },
        }),
        prisma.emailLog.count({
            where: {
                userId,
                status: "deferred",
                createdAt: { gte: today },
            },
        }),
    ]);

    return {
        sentToday,
        accepted,
        rejected,
        deferred,
    };
};

export const getTodayStats = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            dailySendLimit: true,
        },
    });

    if (!user) {
        throw { statusCode: 404, message: "User not found" };
    }

    const usage = await getTodayUsageCounts(userId);

    return {
        sentToday: usage.sentToday,
        dailyLimit: user.dailySendLimit,
        remainingToday: Math.max(user.dailySendLimit - usage.sentToday, 0),
    };
};

export const getTransportStats = async (userId: string) => {
    const usage = await getTodayUsageCounts(userId);
    const total = usage.sentToday;

    if (total === 0) {
        return {
            accepted: 0,
            rejected: 0,
            deferred: 0,
        };
    }

    return {
        accepted: Math.round((usage.accepted / total) * 100),
        rejected: Math.round((usage.rejected / total) * 100),
        deferred: Math.round((usage.deferred / total) * 100),
    };
};

export const getMyUsageStats = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudoName: true,
            email: true,
            role: true,
            dailySendLimit: true,
        },
    });

    if (!user) {
        throw { statusCode: 404, message: "User not found" };
    }

    const usage = await getTodayUsageCounts(userId);

    return {
        user,
        sentToday: usage.sentToday,
        acceptedToday: usage.accepted,
        rejectedToday: usage.rejected,
        deferredToday: usage.deferred,
        remainingToday: Math.max(user.dailySendLimit - usage.sentToday, 0),
        limitUtilizationPercent:
            user.dailySendLimit > 0
                ? Math.min(
                    Math.round((usage.sentToday / user.dailySendLimit) * 100),
                    100
                )
                : 0,
    };
};

export const getUsageOverview = async (
    viewerId: string,
    viewerRole: UserRole
) => {
    const viewer = await prisma.user.findUnique({
        where: { id: viewerId },
        select: {
            id: true,
            role: true,
            dailySendLimit: true,
        },
    });

    if (!viewer) {
        throw { statusCode: 404, message: "User not found" };
    }

    const where =
        viewerRole === UserRole.ADMIN
            ? {
                role: {
                    in: [UserRole.MANAGER, UserRole.EMPLOYEE],
                },
            }
            : {
                OR: [
                    { id: viewerId },
                    {
                        role: UserRole.EMPLOYEE,
                        managerId: viewerId,
                    },
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
            managerId: true,
            isActive: true,
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

    const logs = await prisma.emailLog.groupBy({
        by: ["userId", "status"],
        where: {
            userId: {
                in: users.map((user) => user.id),
            },
            createdAt: {
                gte: getTodayStart(),
            },
        },
        _count: {
            _all: true,
        },
    });

    const usageMap = new Map<
        string,
        {
            sentToday: number;
            acceptedToday: number;
            rejectedToday: number;
            deferredToday: number;
        }
    >();

    for (const log of logs) {
        const entry = usageMap.get(log.userId) || {
            sentToday: 0,
            acceptedToday: 0,
            rejectedToday: 0,
            deferredToday: 0,
        };

        entry.sentToday += log._count._all;

        if (log.status === "accepted") {
            entry.acceptedToday += log._count._all;
        }

        if (log.status === "rejected") {
            entry.rejectedToday += log._count._all;
        }

        if (log.status === "deferred") {
            entry.deferredToday += log._count._all;
        }

        usageMap.set(log.userId, entry);
    }

    const usersWithUsage = users.map((user) => {
        const usage = usageMap.get(user.id) || {
            sentToday: 0,
            acceptedToday: 0,
            rejectedToday: 0,
            deferredToday: 0,
        };

        return {
            ...user,
            managerName: user.manager
                ? `${user.manager.firstName} ${user.manager.lastName}`
                : null,
            sentToday: usage.sentToday,
            acceptedToday: usage.acceptedToday,
            rejectedToday: usage.rejectedToday,
            deferredToday: usage.deferredToday,
            remainingToday: Math.max(user.dailySendLimit - usage.sentToday, 0),
        };
    });

    const allocatableLimit =
        viewerRole === UserRole.ADMIN
            ? ENV.SERVER_DAILY_LIMIT
            : viewer.dailySendLimit;

    const allocatedLimit =
        viewerRole === UserRole.ADMIN
            ? usersWithUsage.reduce((sum, user) => sum + user.dailySendLimit, 0)
            : usersWithUsage
                .filter((user) => user.role === UserRole.EMPLOYEE)
                .reduce((sum, user) => sum + user.dailySendLimit, 0);

    return {
        summary: {
            allocatableLimit,
            allocatedLimit,
            remainingToAllocate: Math.max(allocatableLimit - allocatedLimit, 0),
            activeToday: usersWithUsage.filter((user) => user.sentToday > 0).length,
            idleToday: usersWithUsage.filter((user) => user.sentToday === 0).length,
            totalTrackedUsers: usersWithUsage.length,
            totalSentToday: usersWithUsage.reduce(
                (sum, user) => sum + user.sentToday,
                0
            ),
        },
        users: usersWithUsage,
    };
};
