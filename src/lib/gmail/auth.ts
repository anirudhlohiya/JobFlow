import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const TOKEN_KEY = "google_refresh_token";
const EMAIL_KEY = "google_connected_email";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to your .env file."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function handleOAuthCallback(code: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  if (!tokens.refresh_token) {
    throw new Error("No refresh token returned from Google. Disconnect and reconnect Gmail.");
  }

  // Get the connected email address
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const email = profile.data.emailAddress ?? "unknown";

  await upsertSetting(TOKEN_KEY, tokens.refresh_token, true);
  await upsertSetting(EMAIL_KEY, email, false);

  return email;
}

export async function getOAuthToken(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: TOKEN_KEY } });
  if (!setting) return null;
  return setting.isEncrypted ? decryptSecret(setting.value) : setting.value;
}

export async function getOAuthClient(): Promise<{ client: InstanceType<typeof google.auth.OAuth2>; email: string } | null> {
  const refreshToken = await getOAuthToken();
  if (!refreshToken) return null;
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const email =
    (await prisma.setting.findUnique({ where: { key: EMAIL_KEY } }))?.value ?? "";
  return { client, email };
}

export async function disconnectGmail(): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: { in: [TOKEN_KEY, EMAIL_KEY] } } });
}

export async function isGmailConnected(): Promise<boolean> {
  return !!(await getOAuthToken());
}

async function upsertSetting(key: string, value: string, isEncrypted: boolean) {
  const finalValue = isEncrypted ? encryptSecret(value) : value;
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: finalValue, isEncrypted },
    update: { value: finalValue, isEncrypted },
  });
}