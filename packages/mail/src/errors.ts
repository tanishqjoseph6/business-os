export function formatMailError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const enriched = error as Error & {
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };

  return {
    name: enriched.name,
    message: enriched.message,
    code: enriched.code,
    command: enriched.command,
    responseCode: enriched.responseCode,
    response: enriched.response,
  };
}
