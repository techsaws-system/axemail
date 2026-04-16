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
    const formData = new FormData();
    formData.append("from", payload.senderEmail);
    formData.append("fromName", payload.senderName);
    formData.append("to", payload.to);
    formData.append("subject", payload.subject);
    formData.append("html", payload.html);
    formData.append("replyTo", payload.replyTo);

    for (const ccAddress of payload.cc) {
      formData.append("cc[]", ccAddress);
    }

    for (const bccAddress of payload.bcc) {
      formData.append("bcc[]", bccAddress);
    }

    for (const attachment of payload.attachments) {
      formData.append(
        "attachments",
        new Blob([Buffer.from(attachment.contentBase64, "base64")], {
          type: attachment.mimeType,
        }),
        attachment.filename,
      );
    }

    const response = await axios.post(
      env.MASK_SENDER_API_URL,
      formData,
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
