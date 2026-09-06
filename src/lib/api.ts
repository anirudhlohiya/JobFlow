/**
 * Client-safe API wrapper that turns backend responses into friendly errors.
 * Every backend route returns `{ error: "<message>" }` on failure; this helper
 * guarantees the UI always shows a meaningful message instead of a bare
 * "Failed to fetch" or swallowed status.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (err) {
    const hint =
      typeof window !== "undefined"
        ? " Check that the dev server is still running."
        : "";
    throw new ApiError(
      `Could not reach the server (${(err as Error).message}).${hint}`,
      0
    );
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  throw await toApiError(response);
}

async function toApiError(response: Response): Promise<ApiError> {
  let message: string | undefined;
  const status = response.status;

  try {
    const body = (await response.json()) as { error?: string };
    message = body?.error;
  } catch {
    // not JSON — fall through to status text
  }

  if (!message) {
    message = response.statusText ? response.statusText : "Request failed";
  }

  const context = friendlyContext(status, message);
  if (context) message = `${message}. ${context}`;

  return new ApiError(message, status);
}

function friendlyContext(status: number, message: string): string | null {
  if (status === 400 && /gmail/i.test(message)) {
    return "Connect Google in Settings → Connections first.";
  }
  if (status === 401) {
    return "Your session expired. Reconnect Gmail in Settings.";
  }
  if (status === 404) {
    return "The item no longer exists. Refresh the page.";
  }
  if (status === 429) {
    return "Rate limited — try again in a moment.";
  }
  return null;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}