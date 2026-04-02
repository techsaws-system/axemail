import crypto from "crypto";
import { startOfDay } from "date-fns";

import { prisma } from "../../config/prisma";
import { SendMailInput } from "./mail.types";
import { EmailStatus } from "@prisma/client";
import { ENV } from "../../config/env";

const stripHtmlToText = (html: string) =>
    html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<\/p>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

type GatewayResponse = {
    success: boolean;
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
    error?: string;
};

const submitToGateway = async (payload: any) => {
    const bodyString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = crypto
        .createHmac("sha256", ENV.GATEWAY_SECRET)
        .update(timestamp + "." + bodyString)
        .digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
        const res = await fetch(ENV.GATEWAY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-axe-timestamp": timestamp,
                "x-axe-signature": signature,
            },
            body: bodyString,
            signal: controller.signal,
        });

        const data = (await res.json().catch(() => ({}))) as GatewayResponse;

        if (!res.ok || !data.success) {
            const reason = data?.error || `GATEWAY_HTTP_${res.status}`;
            throw new Error(reason);
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
};

export const sendMail = async (userId: string, payload: SendMailInput) => {
    const from = `"${payload.fromName}" <${ENV.FROM_EMAIL}>`;
    const today = startOfDay(new Date());

    const [user, sentToday, totalSentToday] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                dailySendLimit: true,
                isActive: true,
            },
        }),
        prisma.emailLog.count({
            where: {
                userId,
                createdAt: {
                    gte: today,
                },
            },
        }),
        prisma.emailLog.count({
            where: {
                createdAt: {
                    gte: today,
                },
            },
        }),
    ]);

    if (!user || !user.isActive) {
        throw { statusCode: 403, message: "Your account is not active" };
    }

    if (totalSentToday >= ENV.SERVER_DAILY_LIMIT) {
        throw {
            statusCode: 403,
            message: "Server daily sending limit reached. Sending will resume on the next day.",
        };
    }

    if (sentToday >= user.dailySendLimit) {
        throw {
            statusCode: 403,
            message: "Daily sending quota exceeded",
        };
    }

    try {
        const gatewayPayload = {
            from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: stripHtmlToText(payload.html),
            headers: {
                ...(payload.replyTo ? { "Reply-To": payload.replyTo } : {}),
            },
            attachments: payload.attachments,
            ...(payload.cc ? { cc: payload.cc } : {}),
            ...(payload.bcc ? { bcc: payload.bcc } : {}),
        };

        const gatewayResult = await submitToGateway(gatewayPayload);

        const accepted = gatewayResult.accepted || [];
        const rejected = gatewayResult.rejected || [];

        const status =
            accepted.length > 0
                ? EmailStatus.accepted
                : EmailStatus.deferred;

        await prisma.emailLog.create({
            data: {
                userId,
                recipient: payload.to,
                status,
            },
        });

        return {
            messageId: gatewayResult.messageId,
            accepted,
            rejected,
        };
    } catch (error) {
        await prisma.emailLog.create({
            data: {
                userId,
                recipient: payload.to,
                status: EmailStatus.rejected,
            },
        });

        throw error;
    }
};
