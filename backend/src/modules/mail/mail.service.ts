import crypto from "crypto";
import { startOfDay } from "date-fns";

import { prisma } from "../../config/prisma";
import { SendMailInput } from "./mail.types";
import { EmailStatus } from "@prisma/client";
import { ENV } from "../../config/env";

const cleanHeaderValue = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

const parseRecipients = (value?: string | string[]) => {
    if (!value) {
        return [];
    }

    const items = Array.isArray(value) ? value : value.split(/[,;]+/);

    return [...new Set(
        items
            .map((item) => item.trim())
            .filter(Boolean)
    )];
};

const normalizeAttachments = (
    attachments?: SendMailInput["attachments"]
) => {
    if (!attachments?.length) {
        return undefined;
    }

    return attachments.map((attachment) => ({
        filename: cleanHeaderValue(attachment.filename),
        content: attachment.content,
        contentType: attachment.contentType || "application/octet-stream",
        contentTransferEncoding: "base64",
        disposition: "attachment",
    }));
};

const generateMessageId = () => {
    const domain = ENV.FROM_EMAIL.split("@")[1] || "axemail.local";
    return `<${crypto.randomUUID()}@${domain}>`;
};

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
    const fromName = cleanHeaderValue(payload.fromName);
    const from = `"${fromName}" <${ENV.FROM_EMAIL}>`;
    const today = startOfDay(new Date());
    const to = parseRecipients(payload.to);
    const cc = parseRecipients(payload.cc);
    const bcc = parseRecipients(payload.bcc);
    const replyTo = payload.replyTo ? cleanHeaderValue(payload.replyTo) : undefined;
    const messageId = generateMessageId();
    const sentAt = new Date().toUTCString();

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

    if (to.length === 0) {
        throw {
            statusCode: 400,
            message: "At least one recipient is required",
        };
    }

    try {
        const textBody = payload.text?.trim() || stripHtmlToText(payload.html);
        const envelopeRecipients = [...to, ...cc, ...bcc];

        const gatewayPayload = {
            from,
            sender: ENV.FROM_EMAIL,
            to,
            cc: cc.length > 0 ? cc : undefined,
            bcc: bcc.length > 0 ? bcc : undefined,
            envelope: {
                from: ENV.FROM_EMAIL,
                to: envelopeRecipients,
            },
            subject: cleanHeaderValue(payload.subject),
            html: payload.html,
            text: textBody,
            messageId,
            date: sentAt,
            replyTo,
            meta: {
                source: "axemail-api",
                userId,
                generatedAt: new Date().toISOString(),
                ...payload.meta,
            },
            headers: {
                Date: sentAt,
                "Message-ID": messageId,
                "MIME-Version": "1.0",
                "X-Mailer": "Axemail API",
                "X-Axemail-User-Id": userId,
                ...(replyTo ? { "Reply-To": replyTo } : {}),
            },
            attachments: normalizeAttachments(payload.attachments),
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
                recipient: to.join(", "),
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
                recipient: to.join(", "),
                status: EmailStatus.rejected,
            },
        });

        throw error;
    }
};
