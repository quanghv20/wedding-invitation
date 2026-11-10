import nodemailer, { type Transporter } from "nodemailer";

/** Gửi mail qua SMTP (dùng chung tài khoản Gmail với OwlZen): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM */
export const mailConfigured = () => !!process.env.SMTP_HOST && !!process.env.SMTP_USER;

const globalMail = globalThis as unknown as { __weddingMail?: Transporter };

function transport() {
  globalMail.__weddingMail ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return globalMail.__weddingMail;
}

export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}) {
  if (!mailConfigured()) throw new Error("Chưa cấu hình SMTP (thiếu SMTP_HOST / SMTP_USER trong .env)");
  await transport().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, ...message });
}
