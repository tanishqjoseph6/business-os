import {
  AiProviderError,
  type AiProviderErrorCode,
  type AiProviderId,
} from "../types/ai";

export function normalizeProviderError(
  error: unknown,
  provider?: AiProviderId,
): AiProviderError {
  if (error instanceof AiProviderError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const status = extractStatus(message);
  const code: AiProviderErrorCode =
    lower.includes("not configured") || lower.includes("api key")
      ? "not_configured"
      : status === 401 || status === 403 || lower.includes("unauthorized")
        ? "authentication"
        : status === 429 || lower.includes("rate limit")
          ? "rate_limited"
          : lower.includes("timeout") || lower.includes("timed out")
            ? "timeout"
            : lower.includes("model_not_found") ||
                lower.includes("does not exist") ||
                lower.includes("invalid model") ||
                lower.includes("unknown model")
              ? "invalid_request"
              : status === 400 || lower.includes("invalid request")
                ? "invalid_request"
                : status !== undefined && status >= 500
                  ? "unavailable"
                  : "unknown";

  return new AiProviderError(message || "AI provider request failed.", {
    code,
    provider,
    status,
    retryable: code === "rate_limited" || code === "timeout" || code === "unavailable",
    retryAfterSeconds: extractRetryAfter(message),
    cause: error,
  });
}

function extractStatus(message: string): number | undefined {
  const match = message.match(/\bHTTP\s+(\d{3})\b|\bstatus(?:\s*code)?\s*[:=]?\s*(\d{3})\b/i);
  const value = match?.[1] ?? match?.[2];
  return value ? Number(value) : undefined;
}

function extractRetryAfter(message: string): number | undefined {
  const match = message.match(/retry[-\s]?after[^\d]*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}
