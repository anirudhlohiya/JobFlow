/** Turn raw Google Gmail API errors into messages the user can act on. */

export function prettifyGmailError(error: unknown): Error {
  const raw = error instanceof Error ? error.message : String(error);

  const isApiDisabled =
    /has not been used in project/i.test(raw) ||
    (/is disabled/i.test(raw) && /gmail|googleapis/i.test(raw));

  if (isApiDisabled) {
    const project = raw.match(/in project (\d{6,})/i)?.[1] ?? "";
    const url = `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview${
      project ? `?project=${project}` : ""
    }`;
    return new Error(
      `Gmail API is not enabled for this Google Cloud project.\n\n` +
        `1. Open this link and click ENABLE:\n${url}\n` +
        `2. Wait about 2 minutes for it to propagate.\n` +
        `3. Go back to Settings and click "Connect Gmail" again.\n\n` +
        `(Original error: ${raw})`
    );
  }

  if (/invalid_grant/i.test(raw)) {
    return new Error(
      "Google access expired or was revoked. Go to Settings → Disconnect Gmail, then connect again."
    );
  }

  if (/insufficient permission|scope|access_denied/i.test(raw)) {
    return new Error(
      `No permission on this Google account. Open Settings → click "Connect Gmail" again and approve the requested scopes.\n\n(Original error: ${raw})`
    );
  }

  return new Error(raw);
}