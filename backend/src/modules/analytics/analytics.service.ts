import { prisma } from "../../config/prisma";
import { startOfDay } from "date-fns";

export const getTodayStats = async () => {
    const today = startOfDay(new Date());

    const sentToday = await prisma.emailLog.count({
        where: {
            status: "accepted",
            createdAt: { gte: today },
        },
    });

    return {
        sentToday,
        dailyLimit: 2000,
    };
};

export const getTransportStats = async () => {
    const total = await prisma.emailLog.count();

    if (total === 0) {
        return {
            accepted: 0,
            rejected: 0,
            deferred: 0,
        };
    }

    const accepted = await prisma.emailLog.count({
        where: { status: "accepted" },
    });

    const rejected = await prisma.emailLog.count({
        where: { status: "rejected" },
    });

    const deferred = await prisma.emailLog.count({
        where: { status: "deferred" },
    });

    return {
        accepted: Math.round((accepted / total) * 100),
        rejected: Math.round((rejected / total) * 100),
        deferred: Math.round((deferred / total) * 100),
    };
};
