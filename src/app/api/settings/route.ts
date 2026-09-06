import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { getOAuthToken, getOAuthClient } from "@/lib/gmail/auth";
import { resolveProvider } from "@/lib/ai/providers";
import { getUserProfile } from "@/lib/profile";

const SENSITIVE_KEYS = [
  "llm_key_openai_api_key",
  "llm_key_anthropic_api_key",
  "llm_key_gemini_api_key",
  "llm_key_groq_api_key",
  "google_refresh_token",
  "gmail_scheduler_token",
];

function maskValue(key: string, value: string): string {
  if (value.length <= 8) return "••••••••";
  if (SENSITIVE_KEYS.includes(key)) {
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
  }
  return value;
}

export async function GET() {
  const settings = await prisma.setting.findMany();

  const payload: Record<string, unknown> & {
    provider: { configured: boolean };
    gmail: {
      connected: boolean;
      email?: string;
      redirectUri?: string | null;
      hasCredentials?: boolean;
    };
    user: Record<string, unknown>;
  } = {
    provider: { configured: false },
    gmail: { connected: false },
    user: (await getConfigUser()) as Record<string, unknown>,
  };

  for (const s of settings) {
    if (SENSITIVE_KEYS.includes(s.key)) {
      payload[s.key] = s.isEncrypted ? maskValue(s.key, decryptSecret(s.value)) : maskValue(s.key, s.value);
      if (s.key.startsWith("llm_key_")) payload.provider.configured = true;
    } else {
      payload[s.key] = s.isEncrypted ? maskValue(s.key, decryptSecret(s.value)) : s.value;
    }
  }

  const gmailToken = await getOAuthToken();
  if (gmailToken) payload.gmail.connected = true;

  payload.gmail.redirectUri = process.env.GOOGLE_REDIRECT_URI ?? null;
  payload.gmail.hasCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const email = await prisma.setting.findUnique({ where: { key: "google_connected_email" } });
  if (email) payload.gmail.email = email.value;

  const providerConfig = await resolveProvider().catch(() => null);
  payload.activeProvider = providerConfig;

  return NextResponse.json(payload);
}

async function getConfigUser() {
  return getUserProfile();
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const updates = body as Record<string, string | boolean | number>;

  for (const [key, rawValue] of Object.entries(updates)) {
    if (key === "provider" || key === "gmail" || key === "activeProvider") continue;

    const value = String(rawValue);
    const needsEncryption = SENSITIVE_KEYS.includes(key);

    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: needsEncryption ? encryptSecret(value) : value,
        isEncrypted: needsEncryption,
      },
      update: {
        value: needsEncryption ? encryptSecret(value) : value,
        isEncrypted: needsEncryption,
      },
    });
  }

  await getOAuthClient(); // refresh cached token state

  return NextResponse.json({ ok: true });
}