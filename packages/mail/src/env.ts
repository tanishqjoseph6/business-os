import { z } from "zod";

const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
});

export type SmtpEnv = z.infer<typeof smtpEnvSchema>;

export function getSmtpEnv(): SmtpEnv | null {
  const parsed = smtpEnvSchema.safeParse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function isSmtpConfigured(): boolean {
  return getSmtpEnv() !== null;
}
