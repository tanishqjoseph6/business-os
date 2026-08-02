import "server-only";

import { formatMailError } from "./errors";
import { logSmtpEnvDiagnostics } from "./env";
import { getMailTransport, verifyMailTransport } from "./transport";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export async function sendMail(input: SendMailInput): Promise<boolean> {
  const context = `send:${input.subject}`;

  logSmtpEnvDiagnostics(context);

  const mailer = getMailTransport();
  if (!mailer) {
    return false;
  }

  const verified = await verifyMailTransport(context);
  if (!verified) {
    return false;
  }

  console.info("[mail] Sending email", {
    to: input.to,
    subject: input.subject,
    from: mailer.env.SMTP_FROM,
    replyTo: input.replyTo ?? null,
  });

  try {
    const result = await mailer.transport.sendMail({
      from: mailer.env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });

    console.info("[mail] Email sent", {
      to: input.to,
      subject: input.subject,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return true;
  } catch (error) {
    console.error("[mail] Failed to send email", {
      to: input.to,
      subject: input.subject,
      from: mailer.env.SMTP_FROM,
      error: formatMailError(error),
    });
    return false;
  }
}
