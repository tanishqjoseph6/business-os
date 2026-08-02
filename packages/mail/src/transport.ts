import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getSmtpEnv, type SmtpEnv } from "./env";

let cachedTransport: Transporter | null = null;
let cachedEnv: SmtpEnv | null = null;

export function getMailTransport(): { transport: Transporter; env: SmtpEnv } | null {
  const env = getSmtpEnv();
  if (!env) {
    return null;
  }

  if (cachedTransport && cachedEnv && cachedEnv.SMTP_PASS === env.SMTP_PASS) {
    return { transport: cachedTransport, env: cachedEnv };
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  cachedTransport = transport;
  cachedEnv = env;

  return { transport, env };
}
