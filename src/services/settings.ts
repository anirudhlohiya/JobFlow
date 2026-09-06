import { apiFetch } from "@/lib/api";

export interface SettingsPayload {
  provider: { configured: boolean };
  gmail: {
    connected: boolean;
    email?: string;
    redirectUri?: string | null;
    hasCredentials?: boolean;
  };
  user: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  send_timezone?: string;
  send_start_hour?: number;
  send_end_hour?: number;
  send_weekdays_only?: string;
  followup_interval_days?: number;
  followup_max_followups?: number;
  cold_outreach_daily_cap_start?: number;
  cold_outreach_daily_cap_max?: number;
  cold_outreach_ramp_up_days?: number;
  resume_default_file?: string;
  gmail_scheduler_url?: string;
  gmail_scheduler_token?: string;
  [key: string]: unknown;
}

export function getSettings(): Promise<SettingsPayload> {
  return apiFetch<SettingsPayload>("/api/settings");
}

export function saveSettings(
  patch: Record<string, string | boolean | number>
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function disconnectGmail(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/auth/google/disconnect", {
    method: "POST",
  });
}

/**
 * The settings endpoint echoes stored values back masked; sending a masked
 * value (e.g. `1234••••abcd`) back as an API key would corrupt the stored key.
 * Strip masked values before saving so only real, user-entered values persist.
 */
export function isMasked(value: string): boolean {
  return value.includes("•") || value.startsWith("****");
}

export const GMAIL_CONNECT_URL = "/api/auth/google";