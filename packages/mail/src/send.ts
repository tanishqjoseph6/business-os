import "server-only";

import { getMailTransport } from "./transport";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export async function sendMail(input: SendMailInput): Promise<boolean> {
  const mailer = getMailTransport();
  if (!mailer) {
    console.warn("[mail] SMTP is not configured; skipping email delivery.");
    return false;
  }

  try {
    await mailer.transport.sendMail({
      from: mailer.env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return true;
  } catch (error) {
    console.error("[mail] Failed to send email:", {
      to: input.to,
      subject: input.subject,
      error,
    });
    return false;
  }
}
