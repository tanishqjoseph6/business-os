import "server-only";

import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import type { Transporter } from "nodemailer";
import { formatMailError } from "./errors";
import { getSmtpEnv, type SmtpEnv } from "./env";

let cachedTransport: Transporter | null = null;
let cachedEnv: SmtpEnv | null = null;
let cachedVerifyPromise: Promise<boolean> | null = null;

function createSmtpTransport(env: SmtpEnv): Transporter {
  const options: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  };

  if (env.SMTP_PORT === 587) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
}

export function getMailTransport(): { transport: Transporter; env: SmtpEnv } | null {
  const env = getSmtpEnv();
  if (!env) {
    return null;
  }

  const envChanged =
    !cachedEnv ||
    cachedEnv.SMTP_HOST !== env.SMTP_HOST ||
    cachedEnv.SMTP_PORT !== env.SMTP_PORT ||
    cachedEnv.SMTP_USER !== env.SMTP_USER ||
    cachedEnv.SMTP_PASS !== env.SMTP_PASS;

  if (cachedTransport && !envChanged) {
    return { transport: cachedTransport, env: cachedEnv! };
  }

  cachedTransport = createSmtpTransport(env);
  cachedEnv = env;
  cachedVerifyPromise = null;

  console.info("[mail] Created SMTP transport", {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    user: env.SMTP_USER,
    from: env.SMTP_FROM,
  });

  return { transport: cachedTransport, env };
}

export async function verifyMailTransport(context: string): Promise<boolean> {
  const mailer = getMailTransport();
  if (!mailer) {
    return false;
  }

  cachedVerifyPromise ??= mailer.transport
    .verify()
    .then(() => {
      console.info(`[mail] ${context} SMTP connection verified`, {
        host: mailer.env.SMTP_HOST,
        port: mailer.env.SMTP_PORT,
        user: mailer.env.SMTP_USER,
      });
      return true;
    })
    .catch((error: unknown) => {
      console.error(`[mail] ${context} SMTP verification failed`, {
        host: mailer.env.SMTP_HOST,
        port: mailer.env.SMTP_PORT,
        user: mailer.env.SMTP_USER,
        error: formatMailError(error),
      });
      cachedVerifyPromise = null;
      return false;
    });

  return cachedVerifyPromise;
}
