import crypto from "node:crypto";

import type { ProviderDispatchPayload } from "@/types/sender.types";

export function buildEmailHeaders(input: {
  campaignId: string;
  recipientId: string;
  senderType: string;
  previewText?: string;
}) {
  const timestamp = new Date().toUTCString();
  const messageId = `<${crypto.randomUUID()}.${input.recipientId}@axemail.local>`;

  return {
    Date: timestamp,
    "Message-ID": messageId,
    "X-Mailer": "Axemail Mail Engine",
    "X-Axemail-Campaign-Id": input.campaignId,
    "X-Axemail-Recipient-Id": input.recipientId,
    "X-Axemail-Sender-Type": input.senderType,
    "MIME-Version": "1.0",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Priority": "3",
    ...(input.previewText ? { "X-Axemail-Preview-Text": input.previewText } : {}),
  };
}

export function buildEnvelope(payload: ProviderDispatchPayload) {
  return {
    from: payload.senderEmail,
    to: [payload.to, ...payload.cc, ...payload.bcc],
  };
}
