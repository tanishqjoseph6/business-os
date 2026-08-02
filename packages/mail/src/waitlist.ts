import "server-only";

import { sendMail } from "./send";

const INTERNAL_NOTIFICATION_TO = "hello@vanderbase.com";

export type WaitlistSignupEmailInput = {
  name: string;
  email: string;
  timestamp: string;
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  });
}

function buildWelcomeEmailContent() {
  const text = `Hi,

Thanks for joining the VanderBase waitlist.

You're now on the list and will be among the first to get access to VanderBase.

We'll keep you updated as we get closer to launch.

Stay tuned.

Best regards,

Adarsh
Co-Founder & Chief Growth Officer

Praveen
Co-Founder & Chief Technology Officer

VanderBase
The AI-Native Business OS

hello@vanderbase.com
https://vanderbase.com`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to the VanderBase Waitlist</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
            <tr>
              <td style="font-size:16px;line-height:1.7;">
                <p style="margin:0 0 16px;">Hi,</p>
                <p style="margin:0 0 16px;">Thanks for joining the VanderBase waitlist.</p>
                <p style="margin:0 0 16px;">You're now on the list and will be among the first to get access to VanderBase.</p>
                <p style="margin:0 0 16px;">We'll keep you updated as we get closer to launch.</p>
                <p style="margin:0 0 24px;">Stay tuned.</p>
                <p style="margin:0 0 24px;">Best regards,</p>
                <p style="margin:0 0 8px;"><strong>Adarsh</strong><br />Co-Founder &amp; Chief Growth Officer</p>
                <p style="margin:0 0 24px;"><strong>Praveen</strong><br />Co-Founder &amp; Chief Technology Officer</p>
                <p style="margin:0 0 4px;"><strong>VanderBase</strong><br />The AI-Native Business OS</p>
                <p style="margin:0 0 4px;">📧 <a href="mailto:hello@vanderbase.com" style="color:#2563eb;text-decoration:none;">hello@vanderbase.com</a></p>
                <p style="margin:0;">🌐 <a href="https://vanderbase.com" style="color:#2563eb;text-decoration:none;">https://vanderbase.com</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

function buildInternalNotificationContent(input: WaitlistSignupEmailInput) {
  const formattedTime = formatTimestamp(input.timestamp);

  const text = `Name: ${input.name}
Email: ${input.email}
Time: ${formattedTime}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>New Waitlist Signup</title>
  </head>
  <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <h1 style="font-size:20px;margin:0 0 16px;">New Waitlist Signup</h1>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p style="margin:0;"><strong>Time:</strong> ${escapeHtml(formattedTime)}</p>
  </body>
</html>`;

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendWaitlistWelcomeEmail(input: Pick<WaitlistSignupEmailInput, "email">): Promise<boolean> {
  const content = buildWelcomeEmailContent();

  return sendMail({
    to: input.email,
    subject: "Welcome to the VanderBase Waitlist 🚀",
    text: content.text,
    html: content.html,
    replyTo: INTERNAL_NOTIFICATION_TO,
  });
}

export async function sendWaitlistInternalNotification(
  input: WaitlistSignupEmailInput,
): Promise<boolean> {
  const content = buildInternalNotificationContent(input);

  return sendMail({
    to: INTERNAL_NOTIFICATION_TO,
    subject: "New Waitlist Signup",
    text: content.text,
    html: content.html,
    replyTo: input.email,
  });
}

/**
 * Sends waitlist welcome + internal notification emails.
 * Never throws — signup must succeed even when email delivery fails.
 */
export async function sendWaitlistSignupEmails(input: WaitlistSignupEmailInput): Promise<void> {
  try {
    const [welcomeSent, internalSent] = await Promise.all([
      sendWaitlistWelcomeEmail({ email: input.email }),
      sendWaitlistInternalNotification(input),
    ]);

    if (!welcomeSent || !internalSent) {
      console.error("[mail] Waitlist signup emails partially failed:", {
        email: input.email,
        welcomeSent,
        internalSent,
      });
    }
  } catch (error) {
    console.error("[mail] Unexpected waitlist email error:", {
      email: input.email,
      error,
    });
  }
}
