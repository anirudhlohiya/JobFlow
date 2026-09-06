"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSettings,
  saveSettings,
  disconnectGmail as disconnectGmailApi,
  isMasked,
  GMAIL_CONNECT_URL,
  type SettingsPayload,
} from "@/services/settings";
import { listResumes, type ResumeRow } from "@/services/resume";

export interface Banner {
  type: "ok" | "err";
  message: string;
}

export interface SettingsState {
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  banner: Banner | null;
  settings: SettingsPayload | null;
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
  userName: string;
  userEmail: string;
  userPhone: string;
  userLinkedin: string;
  schedulerUrl: string;
  schedulerToken: string;
  resumes: ResumeRow[];
  defaultResume: ResumeRow | undefined;
  gmailConnected: boolean;
}

const KEY_FIELDS: Record<string, string> = {
  openai: "llm_key_openai_api_key",
  anthropic: "llm_key_anthropic_api_key",
  google: "llm_key_gemini_api_key",
  groq: "llm_key_groq_api_key",
};

export function useSettingsViewModel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userLinkedin, setUserLinkedin] = useState("");
  const [schedulerUrl, setSchedulerUrl] = useState("");
  const [schedulerToken, setSchedulerToken] = useState("");
  const [resumes, setResumes] = useState<ResumeRow[]>([]);

  const applySettings = useCallback(
    (data: SettingsPayload, resumeData: { resumes: ResumeRow[] }) => {
      setSettings(data);
      const providerInfo = data.activeProvider as { provider?: string; model?: string } | null;
      setProvider(providerInfo?.provider ?? "openai");
      setModel(providerInfo?.model ?? "");
      setApiKeys({
        openai: (data.llm_key_openai_api_key as string) ?? "",
        anthropic: (data.llm_key_anthropic_api_key as string) ?? "",
        google: (data.llm_key_gemini_api_key as string) ?? "",
        groq: (data.llm_key_groq_api_key as string) ?? "",
      });
      setUserName((data.user?.name as string) ?? "");
      setUserEmail((data.user?.email as string) ?? "");
      setUserPhone((data.user?.phone as string) ?? "");
      setUserLinkedin((data.user?.linkedin as string) ?? "");
      setSchedulerUrl((data.gmail_scheduler_url as string) ?? "");
      setSchedulerToken((data.gmail_scheduler_token as string) ?? "");
      setResumes(resumeData.resumes);
      setBanner(null);
    },
    []
  );

  const load = useCallback(async () => {
    const [data, resumeData] = await Promise.all([
      getSettings(),
      listResumes().catch(() => ({ resumes: [] as ResumeRow[] })),
    ]);
    applySettings(data, resumeData);
  }, [applySettings]);

  useEffect(() => {
    Promise.all([
      getSettings(),
      listResumes().catch(() => ({ resumes: [] as ResumeRow[] })),
    ])
      .then(([data, resumeData]) => {
        applySettings(data, resumeData);
      })
      .catch((err) => setBanner({ type: "err", message: (err as Error).message }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProvider = useCallback(async () => {
    setSaving(true);
    setBanner(null);
    try {
      const payload: Record<string, string> = { llm_provider: provider };
      if (model.trim()) payload.llm_model = model.trim();
      for (const [prov, key] of Object.entries(apiKeys)) {
        if (key.trim() && !isMasked(key)) payload[KEY_FIELDS[prov]] = key.trim();
      }
      await saveSettings(payload);
      setBanner({ type: "ok", message: "Provider settings saved." });
      await load();
    } catch (err) {
      setBanner({ type: "err", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }, [provider, model, apiKeys, load]);

  const saveUser = useCallback(async () => {
    setSaving(true);
    setBanner(null);
    try {
      await saveSettings({
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        user_linkedin: userLinkedin,
      });
      setBanner({ type: "ok", message: "Profile saved." });
    } catch (err) {
      setBanner({ type: "err", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }, [userName, userEmail, userPhone, userLinkedin]);

  const saveScheduler = useCallback(async () => {
    setSaving(true);
    setBanner(null);
    try {
      const payload: Record<string, string> = { gmail_scheduler_url: schedulerUrl };
      if (schedulerToken.trim() && !isMasked(schedulerToken)) {
        payload.gmail_scheduler_token = schedulerToken.trim();
      }
      await saveSettings(payload);
      setBanner({
        type: "ok",
        message: schedulerUrl
          ? "Gmail scheduler saved — new approvals will auto-send from Google."
          : "Scheduler cleared. Emails will stay as drafts in Gmail.",
      });
    } catch (err) {
      setBanner({ type: "err", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }, [schedulerUrl, schedulerToken]);

  const uploadResume = useCallback(async (file: File) => {
    setUploading(true);
    setBanner(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isDefault", "true");
      const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: string; resume?: ResumeRow };
      if (!res.ok || !data.resume) {
        throw new Error(data.error ?? "Upload failed.");
      }
      setBanner({ type: "ok", message: `Resume "${data.resume.name}" uploaded successfully.` });
      const { resumes: rd } = await listResumes();
      setResumes(rd);
    } catch (err) {
      setBanner({ type: "err", message: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }, []);

  const disconnectGmail = useCallback(async () => {
    try {
      await disconnectGmailApi();
      setBanner({ type: "ok", message: "Gmail disconnected." });
      await load();
    } catch (err) {
      setBanner({ type: "err", message: (err as Error).message });
    }
  }, [load]);

  const defaultResume = resumes.find((r) => r.isDefault) ?? resumes[0];

  const state: SettingsState = {
    loading,
    saving,
    uploading,
    banner,
    settings,
    provider,
    model,
    apiKeys,
    userName,
    userEmail,
    userPhone,
    userLinkedin,
    schedulerUrl,
    schedulerToken,
    resumes,
    defaultResume,
    gmailConnected: settings?.gmail?.connected ?? false,
  };

  return {
    ...state,
    load,
    setProvider,
    setModel,
    setApiKeys,
    setUserName,
    setUserEmail,
    setUserPhone,
    setUserLinkedin,
    setSchedulerUrl,
    setSchedulerToken,
    saveProvider,
    saveUser,
    saveScheduler,
    uploadResume,
    disconnectGmail,
    gmailConnectUrl: GMAIL_CONNECT_URL,
  };
}