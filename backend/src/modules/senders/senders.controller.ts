import type { Request, Response } from "express";

import { SENDER_TYPE } from "@/constants/enums";
import { sendComposerCampaign } from "@/services/sender.service";
import { asyncHandler } from "@/utils/async-handler";
import { domainSenderSchema, gmailSenderSchema, maskSenderSchema } from "@/modules/senders/senders.schemas";

export const sendGmailHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = gmailSenderSchema.parse(request.body);
  response.status(201).json({
    data: await sendComposerCampaign({
      ...payload,
      userId: request.auth!.userId,
      role: request.auth!.role,
      senderType: SENDER_TYPE.GMAIL,
    }),
  });
});

export const sendDomainHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = domainSenderSchema.parse(request.body);
  response.status(201).json({
    data: await sendComposerCampaign({
      ...payload,
      userId: request.auth!.userId,
      role: request.auth!.role,
      senderType: SENDER_TYPE.DOMAIN,
    }),
  });
});

export const sendMaskHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = maskSenderSchema.parse(request.body);
  response.status(201).json({
    data: await sendComposerCampaign({
      ...payload,
      userId: request.auth!.userId,
      role: request.auth!.role,
      senderType: SENDER_TYPE.MASK,
    }),
  });
});
