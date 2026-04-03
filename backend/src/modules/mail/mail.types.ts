export interface SendMailInput {
    fromName: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    meta?: Record<string, unknown>;
    attachments?: {
        filename: string;
        content: string;
        contentType: string;
    }[];
}
