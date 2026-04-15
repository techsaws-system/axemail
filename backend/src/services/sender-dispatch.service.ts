import axios from "axios";
import nodemailer from "nodemailer";
import { SenderType } from "@prisma/client";

import { env } from "@/config/env";
import { decryptJson } from "@/utils/crypto";
import type { ProviderDispatchPayload } from "@/types/sender.types";

export async function dispatchMessage(
  senderType: SenderType,
  account: {
    email: string;
    provider: string;
    credentialsEncrypted?: string | null;
    metadata?: unknown;
  },
  payload: ProviderDispatchPayload,
) {
  if (senderType === SenderType.MASK) {
    const response = await axios.post(
      env.MASK_SENDER_API_URL,
      {
        senderAccountId: payload.senderAccountId,
        fromName: payload.senderName,
        fromEmail: payload.senderEmail,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        previewText: payload.previewText,
        html: payload.html,
        attachments: payload.attachments,
        headers: payload.headers,
        envelope: payload.envelope,
        metadata: payload.metadata,
      },
      {
        headers: env.MASK_SENDER_API_KEY
          ? { Authorization: `Bearer ${env.MASK_SENDER_API_KEY}` }
          : undefined,
        timeout: 30000,
      },
    );

    return {
      providerMessageId:
        String(response.data?.messageId ?? response.data?.id ?? payload.headers["Message-ID"]),
      response: response.data,
    };
  }

  const credentials = decryptJson<{ appPassword?: string; password?: string }>(
    account.credentialsEncrypted,
  );

  const transporter = nodemailer.createTransport(
    senderType === SenderType.GMAIL
      ? {
          service: "gmail",
          auth: {
            user: account.email,
            pass: credentials?.appPassword ?? credentials?.password ?? "",
          },
        }
      : {
          host: "smtp.zoho.com",
          port: 465,
          secure: true,
          auth: {
            user: account.email,
            pass: credentials?.password ?? credentials?.appPassword ?? "",
          },
        },
  );

  const result = await transporter.sendMail({
    from: `"${payload.senderName}" <${payload.senderEmail}>`,
    to: payload.to,
    cc: payload.cc.length ? payload.cc.join(", ") : undefined,
    bcc: payload.bcc.length ? payload.bcc.join(", ") : undefined,
    replyTo: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
    envelope: payload.envelope,
    headers: payload.headers,
    attachments: payload.attachments.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.contentBase64, "base64"),
      contentType: attachment.mimeType,
    })),
    date: new Date(),
    messageId: payload.headers["Message-ID"],
  });

  return {
    providerMessageId: result.messageId,
    response: result.response,
  };
}
