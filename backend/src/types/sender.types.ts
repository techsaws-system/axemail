import type { SenderType } from "@/constants/enums";

export type SenderComposerPayload = {
  userId?: string;
  role?: string;
  senderType: SenderType;
  fromName: string;
  fromEmail?: string;
  to: string;
  replyTo: string;
  cc?: string;
  bcc?: string;
  subject: string;
  previewText?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    contentBase64: string;
  }>;
  content: string;
  metadata?: Record<string, unknown>;
};

export type ProviderDispatchPayload = {
  provider: string;
  senderAccountId: string;
  senderEmail: string;
  senderName: string;
  to: string;
  cc: string[];
  bcc: string[];
  replyTo: string;
  subject: string;
  previewText?: string;
  html: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    contentBase64: string;
  }>;
  headers: Record<string, string>;
  envelope: {
    from: string;
    to: string[];
  };
  metadata: Record<string, unknown>;
};
