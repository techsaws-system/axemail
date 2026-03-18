export interface SendMailInput {
    fromName: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    cc?: string;
    bcc?: string;
    attachments?: {
        filename: string;
        content: string;
        contentType: string;
    }[];
}
