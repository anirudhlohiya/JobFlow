"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react";

type SettingsData = Record<string, unknown> & {
  gmail: { connected: boolean; email?: string };
  provider: { configured: boolean };
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mute py-10">Loading settings…</p>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  type ResumeRow = { id: string; name: string; isDefault: boolean; updatedAt: string };
  const [resumes, setResumes] = useState<ResumeRow[]>([]);

  // Provider keys
  const [provider, setProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [model, setModel] = useState("");

  const defaultResume = resumes.find((r) => r.isDefault) ?? resumes[0];

  // Gmail
  const gmailConnected = settings?.gmail?.connected ?? false;
  const gmailEmail = settings?.gmail?.email;
  const gmailQuery = searchParams.get("gmail");
  const gmailConnectedEmail = searchParams.get("email");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userLinkedin, setUserLinkedin] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setProvider((data.activeProvider?.provider as string) ?? "openai");
        setModel(data.activeProvider?.model ?? "");
        setOpenaiKey((data.llm_key_openai_api_key as string) ?? "");
        setAnthropicKey((data.llm_key_anthropic_api_key as string) ?? "");
        setGeminiKey((data.llm_key_gemini_api_key as string) ?? "");
        setGroqKey((data.llm_key_groq_api_key as string) ?? "");
        setUserName(data.user?.name ?? "");
        setUserEmail(data.user?.email ?? "");
        setUserPhone(data.user?.phone ?? "");
        setUserLinkedin(data.user?.linkedin ?? "");
      })
      .catch(() => setMsgType("err"))
      .finally(() => setLoading(false));

    fetch("/api/resume")
      .then((r) => r.json())
      .then((data) => setResumes(data.resumes ?? []))
      .catch(() => setResumes([]));
  }, []);

  async function handleSaveProvider() {
    setSaving(true);
    setMsg(null);
    const payload: Record<string, string> = {
      llm_provider: provider,
    };
    if (model.trim()) payload.llm_model = model.trim();
    if (openaiKey) payload.llm_key_openai_api_key = openaiKey;
    if (anthropicKey) payload.llm_key_anthropic_api_key = anthropicKey;
    if (geminiKey) payload.llm_key_gemini_api_key = geminiKey;
    if (groqKey) payload.llm_key_groq_api_key = groqKey;

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
setSaving(false);
    if (res.ok) {
      setMsg("Provider settings saved.");
      setMsgType("ok");
      window.location.reload();
    } else {
      setMsg("Failed to save: " + (data.error ?? "unknown error"));
      setMsgType("err");
    }
  }

  async function handleUploadResume(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isDefault", "true");

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Resume "${data.resume.name}" uploaded successfully.`);
        setMsgType("ok");
        const r = await fetch("/api/resume");
        const rd = await r.json();
        setResumes(rd.resumes ?? []);
      } else {
        setMsg("Upload failed: " + (data.error ?? "unknown error"));
        setMsgType("err");
      }
    } catch {
      setMsg("Upload failed: network error.");
      setMsgType("err");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveUser() {
    setSaving(true);
    setMsg(null);
const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        user_linkedin: userLinkedin,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Profile saved.");
      setMsgType("ok");
    } else {
      setMsg("Failed to save profile.");
      setMsgType("err");
    }
  }

  if (loading) {
    return <p className="text-sm text-mute py-10">Loading settings…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-1">
          Configuration
        </p>
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
          Settings
        </h1>
        <p className="text-body mt-1">
          Connect the pieces — API keys, Gmail, your resume — and you&apos;re ready to apply.
        </p>
      </div>

      {msg && (
        <div className={`rounded-md border px-4 py-3 text-sm ${msgType === "ok" ? "bg-cyan-soft border-cyan/30 text-[#007970]" : "bg-warning-soft border-warning/30 text-warning-deep"}`}>
          {msg}
        </div>
      )}
      {gmailQuery === "connected" && (
        <div className="rounded-md bg-cyan-soft border border-cyan/30 px-4 py-3 text-sm text-[#007970]">
          Gmail connected: {gmailConnectedEmail}
        </div>
      )}
      {gmailQuery === "error" && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          Gmail connection failed. Check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in your .env file.
        </div>
      )}

      {/* 1. AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
            AI Provider
          </CardTitle>
          <p className="text-sm text-body">
            Bring your own key — OpenAI, Anthropic, Gemini, or Groq. Keys are encrypted at rest.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <RadioGroup value={provider} onValueChange={setProvider} className="flex flex-wrap gap-4">
            {[
              { value: "openai", label: "OpenAI", placeholder: "sk-…" },
              { value: "anthropic", label: "Anthropic", placeholder: "sk-ant-…" },
              { value: "google", label: "Gemini", placeholder: "AIza…" },
              { value: "groq", label: "Groq", placeholder: "gsk_…" },
            ].map((p) => (
              <div key={p.value} className="flex items-center gap-2">
                <RadioGroupItem value={p.value} id={`prov-${p.value}`} />
                <label htmlFor={`prov-${p.value}`} className="text-sm text-ink cursor-pointer">
                  {p.label}
                </label>
              </div>
            ))}
          </RadioGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider === "openai" && (
              <Field label="OpenAI API Key">
                <Input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {provider === "anthropic" && (
              <Field label="Anthropic API Key">
                <Input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder="sk-ant-…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {provider === "google" && (
              <Field label="Gemini API Key">
                <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {provider === "groq" && (
              <Field label="Groq API Key">
                <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="gsk_…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            <Field label="Model (optional)">
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile" className="bg-white border-hairline rounded-md" />
            </Field>
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={handleSaveProvider} disabled={saving} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Provider"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Gmail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
            Gmail Connection
          </CardTitle>
          <p className="text-sm text-body">
            Emails are sent from YOUR Gmail via OAuth — recipients see a real person.
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          {gmailConnected ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#007970]" />
              <div>
                <p className="text-sm font-medium text-ink">Gmail Connected</p>
                <p className="text-[12px] text-mute">{gmailEmail || "—"}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-ink">Not connected</p>
                <p className="text-[12px] text-mute">Link your Gmail to enable sending.</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {gmailConnected ? (
              <Button
                variant="ghost"
                className="rounded-md h-9 text-destructive"
                onClick={async () => {
                  await fetch("/api/auth/google/disconnect", { method: "POST" });
                  window.location.reload();
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button render={<a href="/api/auth/google" />} nativeButton={false} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
                Connect Gmail
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
            Master Resume
          </CardTitle>
          <p className="text-sm text-body">
            Your LaTeX (.tex) resume. JobFlow tailors it per application. Never fabricates anything.
          </p>
        </CardHeader>
        <CardContent>
          {defaultResume && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-hairline bg-canvas px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{defaultResume.name}</p>
                <p className="text-[12px] text-mute">
                  Uploaded {new Date(defaultResume.updatedAt).toLocaleString()}
                  {defaultResume.isDefault ? " · default" : ""}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#007970] shrink-0" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-md border border-hairline bg-white px-4 py-2.5 cursor-pointer hover:border-body">
              <Upload className="w-4 h-4 text-mute" />
              <span className="text-sm text-body">{uploading ? "Uploading…" : defaultResume ? "Replace .tex file" : "Choose .tex file"}</span>
              <input
                type="file"
                accept=".tex,text/plain"
                className="hidden"
                onChange={(e) => handleUploadResume(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-[12px] text-mute">
              Or drop your file at <span className="font-mono">data/resume/resume.tex</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
            Your Profile
          </CardTitle>
          <p className="text-sm text-body">
            Fills the signature line of every email. Saved here — defaults come from config/user.config.yaml.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" sub="config: user.name">
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="Email" sub="config: user.email">
            <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="Phone" sub="config: user.phone">
            <Input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="LinkedIn" sub="config: user.linkedin">
            <Input value={userLinkedin} onChange={(e) => setUserLinkedin(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSaveUser} disabled={saving} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] text-body font-medium">{label}</Label>
      {sub ? <p className="text-[12px] text-faint -mt-1">{sub}</p> : null}
      {children}
    </div>
  );
}
