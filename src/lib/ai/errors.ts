/** Translate AI-provider errors into messages the user can actually act on. */

function statusOf(error: unknown): number | undefined {
  const e = error as { statusCode?: number; status?: number };
  return e?.statusCode ?? e?.status;
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function toFriendlyAiError(error: unknown): Error {
  const status = statusOf(error);
  const msg = messageOf(error).toLowerCase();

  if (status === 429 || msg.includes("quota") || msg.includes("resource_exhausted")) {
    return new Error(
      "AI provider limit reached — usually the free-tier daily cap or a short rate limit. Add a paid key in Settings → AI Provider to remove the cap, or wait and retry."
    );
  }
  if (
    status === 401 ||
    status === 403 ||
    msg.includes("api key") ||
    msg.includes("permission") ||
    msg.includes("unauthorized")
  ) {
    return new Error(
      `AI provider rejected the key (${status ?? "auth error"}) — check it in Settings → AI Provider.`
    );
  }
  if (status && status >= 500) {
    return new Error(`AI provider is temporarily unavailable (${status}). Try again in a moment.`);
  }

  return new Error(messageOf(error));
}