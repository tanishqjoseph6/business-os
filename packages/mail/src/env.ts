import { z } from "zod";

const SMTP_ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

export type SmtpEnvKey = (typeof SMTP_ENV_KEYS)[number];

const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
});

export type SmtpEnv = z.infer<typeof smtpEnvSchema>;

export type SmtpEnvDiagnostics = {
  configured: boolean;
  missing: SmtpEnvKey[];
  invalid: Array<{ key: SmtpEnvKey; issue: string }>;
  summary: Record<SmtpEnvKey, "set" | "missing" | "invalid">;
};

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function readRawSmtpEnv() {
  return {
    SMTP_HOST: normalizeEnvValue(process.env.SMTP_HOST),
    SMTP_PORT: normalizeEnvValue(process.env.SMTP_PORT),
    SMTP_USER: normalizeEnvValue(process.env.SMTP_USER),
    SMTP_PASS: normalizeEnvValue(process.env.SMTP_PASS),
    SMTP_FROM: normalizeEnvValue(process.env.SMTP_FROM),
  };
}

export function getSmtpEnvDiagnostics(): SmtpEnvDiagnostics {
  const raw = readRawSmtpEnv();
  const missing = SMTP_ENV_KEYS.filter((key) => !raw[key]);
  const summary = Object.fromEntries(
    SMTP_ENV_KEYS.map((key) => [key, raw[key] ? "set" : "missing"]),
  ) as Record<SmtpEnvKey, "set" | "missing" | "invalid">;

  const parsed = smtpEnvSchema.safeParse(raw);
  const invalid: Array<{ key: SmtpEnvKey; issue: string }> = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string" || !SMTP_ENV_KEYS.includes(key as SmtpEnvKey)) {
        continue;
      }

      summary[key as SmtpEnvKey] = "invalid";
      invalid.push({ key: key as SmtpEnvKey, issue: issue.message });
    }
  }

  return {
    configured: parsed.success,
    missing,
    invalid,
    summary,
  };
}

export function getSmtpEnv(): SmtpEnv | null {
  const parsed = smtpEnvSchema.safeParse(readRawSmtpEnv());
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function isSmtpConfigured(): boolean {
  return getSmtpEnv() !== null;
}

export function logSmtpEnvDiagnostics(context: string): SmtpEnvDiagnostics {
  const diagnostics = getSmtpEnvDiagnostics();

  if (diagnostics.configured) {
    const env = getSmtpEnv();
    console.info(`[mail] ${context} SMTP configured`, {
      host: env?.SMTP_HOST,
      port: env?.SMTP_PORT,
      user: env?.SMTP_USER,
      from: env?.SMTP_FROM,
      pass: env?.SMTP_PASS ? "set" : "missing",
    });
    return diagnostics;
  }

  console.error(`[mail] ${context} SMTP is not fully configured`, {
    missing: diagnostics.missing,
    invalid: diagnostics.invalid,
    summary: diagnostics.summary,
  });

  return diagnostics;
}
