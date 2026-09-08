import { prisma } from "@/lib/db";

const TOKEN_KEY = "google_refresh_token";
const EMAIL_KEY = "google_connected_email";

/**
 * Turn raw Google Gmail API errors into messages the user can act on.
 * For scope problems it also clears the stored connection so the app
 * returns to "Not connected" and guides a fresh, full re-approval —
 * otherwise a stale token will keep failing forever.
 */
export async function prettifyGmailError(
  error: unknown,
  grantedScopes?: string[] | null
): Promise<Error> {
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

  if (/insufficient authentication scopes|insufficient permission|access_denied/i.test(raw)) {
    await prisma.setting.deleteMany({
      where: { key: { in: [TOKEN_KEY, EMAIL_KEY] } },
    });

    if (/access_denied/i.test(raw)) {
      return new Error(
        `Google access was denied. The app reset itself to "Not connected" — click Connect Gmail and approve the requested permissions.\n\n(Original error: ${raw})`
      );
    }

    const grantedList = (grantedScopes ?? []).filter(Boolean);
    const scopesNote = grantedList.length
      ? `Scopes Google returned: ${grantedList.join(" ")}`
      : "Scopes Google returned: none — the OAuth consent screen in Google Cloud Console has not been configured with the Gmail scopes.";

    return new Error(
      `Google issued Gmail access without the required permission scopes.\n\n` +
        `This is a Google Cloud Console configuration issue (not an app bug). Fix it there:\n` +
        `1. Open https://console.cloud.google.com/apis/credentials → OAuth consent screen → Data Access.\n` +
        `2. Click ADD OR REMOVE SCOPES and add:\n` +
        `   https://www.googleapis.com/auth/gmail.readonly\n` +
        `   https://www.googleapis.com/auth/gmail.send\n` +
        `   https://www.googleapis.com/auth/gmail.compose\n` +
        `3. Click UPDATE, then re-run Connect Gmail and approve every toggle.\n\n` +
        `${scopesNote}\n\n` +
        `(Original error: ${raw})`
    );
  }

  if (/invalid_grant/i.test(raw)) {
    await prisma.setting.deleteMany({
      where: { key: { in: [TOKEN_KEY, EMAIL_KEY] } },
    });
    return new Error(
      "Google access expired or was revoked. The app reset itself to \"Not connected\" — click Connect Gmail and approve again."
    );
  }

  return new Error(raw);
}