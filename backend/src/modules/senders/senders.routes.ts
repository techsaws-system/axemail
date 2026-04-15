import { Router } from "express";

import {
  sendDomainHandler,
  sendGmailHandler,
  sendMaskHandler,
} from "@/modules/senders/senders.controller";
import { requireAuthenticatedUser } from "@/middleware/auth";

export const sendersRouter = Router();

sendersRouter.post("/gmail-sender/send", requireAuthenticatedUser, sendGmailHandler);
sendersRouter.post("/domain-sender/send", requireAuthenticatedUser, sendDomainHandler);
sendersRouter.post("/mask-sender/send", requireAuthenticatedUser, sendMaskHandler);
