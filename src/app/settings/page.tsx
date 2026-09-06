"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, XCircle, Upload, Link2 } from "lucide-react";
import { useSettingsViewModel } from "@/features/settings/useSettingsViewModel";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mute py-10">Loading settings…</p>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const vm = useSettingsViewModel();

  const gmailQuery = searchParams.get("gmail");
  const gmailConnectedEmail = searchParams.get("email");
  const gmailErrorReason = searchParams.get("reason");

  if (vm.loading) {
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

      {vm.banner && (
        <div className={`rounded-md border px-4 py-3 text-sm ${vm.banner.type === "ok" ? "bg-cyan-soft border-cyan/30 text-[#007970]" : "bg-warning-soft border-warning/30 text-warning-deep"}`}>
          {vm.banner.message}
        </div>
      )}

      {gmailQuery === "connected" && (
        <div className="rounded-md bg-cyan-soft border border-cyan/30 px-4 py-3 text-sm text-[#007970]">
          Gmail connected: {gmailConnectedEmail}
        </div>
      )}

      {gmailQuery === "error" && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          <p className="font-medium mb-1">Gmail connection failed.</p>
          {gmailErrorReason ? <p className="mb-2">Reason: {gmailErrorReason}</p> : null}
          <GmailSetupGuide redirectUri={vm.settings?.gmail?.redirectUri ?? null} hasCredentials={vm.settings?.gmail?.hasCredentials ?? false} />
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
          <RadioGroup value={vm.provider} onValueChange={vm.setProvider} className="flex flex-wrap gap-4">
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
            {vm.provider !== "openai" && vm.apiKeys["openai"] ? (
              <ProviderKeyField
                label="OpenAI API Key"
                value={vm.apiKeys["openai"]}
                onChange={(v) => vm.setApiKeys({ ...vm.apiKeys, openai: v })}
                placeholder="sk-…"
              />
            ) : null}
            {vm.provider === "openai" && (
              <Field label="OpenAI API Key">
                <Input type="password" value={vm.apiKeys["openai"]} onChange={(e) => vm.setApiKeys({ ...vm.apiKeys, openai: e.target.value })} placeholder="sk-…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {vm.provider === "anthropic" && (
              <Field label="Anthropic API Key">
                <Input type="password" value={vm.apiKeys["anthropic"]} onChange={(e) => vm.setApiKeys({ ...vm.apiKeys, anthropic: e.target.value })} placeholder="sk-ant-…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {vm.provider === "google" && (
              <Field label="Gemini API Key">
                <Input type="password" value={vm.apiKeys["google"]} onChange={(e) => vm.setApiKeys({ ...vm.apiKeys, google: e.target.value })} placeholder="AIza…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            {vm.provider === "groq" && (
              <Field label="Groq API Key">
                <Input type="password" value={vm.apiKeys["groq"]} onChange={(e) => vm.setApiKeys({ ...vm.apiKeys, groq: e.target.value })} placeholder="gsk_…" className="bg-white border-hairline rounded-md" />
              </Field>
            )}
            <Field label="Model (optional)">
              <Input value={vm.model} onChange={(e) => vm.setModel(e.target.value)} placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile" className="bg-white border-hairline rounded-md" />
            </Field>
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={vm.saveProvider} disabled={vm.saving} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              {vm.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Provider"}
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
            Emails are queued as real drafts in YOUR Gmail — recipients see a real person, and nothing depends on this machine at send time.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            {vm.gmailConnected ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#007970]" />
                <div>
                  <p className="text-sm font-medium text-ink">Gmail Connected</p>
                  <p className="text-[12px] text-mute">{vm.settings?.gmail?.email || "—"}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-ink">Not connected</p>
                  <p className="text-[12px] text-mute">Link your Gmail so approved applications can be queued as drafts.</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {vm.gmailConnected ? (
                <Button variant="ghost" className="rounded-md h-9 text-destructive" onClick={vm.disconnectGmail}>
                  Disconnect
                </Button>
              ) : (
                <Button render={<a href={vm.gmailConnectUrl} />} nativeButton={false} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
                  Connect Gmail
                </Button>
              )}
            </div>
          </div>
          {!vm.gmailConnected && (
            <GmailSetupGuide redirectUri={vm.settings?.gmail?.redirectUri ?? null} hasCredentials={vm.settings?.gmail?.hasCredentials ?? false} />
          )}
        </CardContent>
      </Card>

      {/* 2b. Gmail Scheduler (optional auto-send) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
            Gmail Scheduler (optional)
          </CardTitle>
          <p className="text-sm text-body">
            Want it to send by itself at the next send-window? Deploy the free Google Apps Script
            from <span className="font-mono">scripts/gmail-scheduler/Code.gs</span> once, then paste the web-app
            URL and a token here. Approvals then auto-send from Google&apos;s cloud — no local process needed.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Scheduler URL" sub="Apps Script web app /exec URL">
              <Input value={vm.schedulerUrl} onChange={(e) => vm.setSchedulerUrl(e.target.value)} placeholder="https://script.google.com/macros/s/XXX/exec" className="bg-white border-hairline rounded-md" />
            </Field>
            <Field label="Scheduler Token" sub="must match the token you set in the script">
              <Input type="password" value={vm.schedulerToken} onChange={(e) => vm.setSchedulerToken(e.target.value)} placeholder="your chosen token" className="bg-white border-hairline rounded-md" />
            </Field>
          </div>
          <div className="flex items-center justify-end">
            <Button onClick={vm.saveScheduler} disabled={vm.saving} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              {vm.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Scheduler"}
            </Button>
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
          {vm.defaultResume && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-hairline bg-canvas px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{vm.defaultResume.name}</p>
                <p className="text-[12px] text-mute">
                  Uploaded {new Date(vm.defaultResume.updatedAt).toLocaleString()}
                  {vm.defaultResume.isDefault ? " · default" : ""}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#007970] shrink-0" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-md border border-hairline bg-white px-4 py-2.5 cursor-pointer hover:border-body">
              <Upload className="w-4 h-4 text-mute" />
              <span className="text-sm text-body">{vm.uploading ? "Uploading…" : vm.defaultResume ? "Replace .tex file" : "Choose .tex file"}</span>
              <input
                type="file"
                accept=".tex,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) vm.uploadResume(file);
                }}
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
            <Input value={vm.userName} onChange={(e) => vm.setUserName(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="Email" sub="config: user.email">
            <Input value={vm.userEmail} onChange={(e) => vm.setUserEmail(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="Phone" sub="config: user.phone">
            <Input value={vm.userPhone} onChange={(e) => vm.setUserPhone(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <Field label="LinkedIn" sub="config: user.linkedin">
            <Input value={vm.userLinkedin} onChange={(e) => vm.setUserLinkedin(e.target.value)} className="bg-white border-hairline rounded-md" />
          </Field>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={vm.saveUser} disabled={vm.saving} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GmailSetupGuide({
  redirectUri,
  hasCredentials,
}: {
  redirectUri: string | null;
  hasCredentials: boolean;
}) {
  return (
    <div className="rounded-md border border-hairline bg-canvas px-4 py-3 text-[13px] text-body flex flex-col gap-2">
      <p className="font-medium text-ink flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" /> How to connect Google
      </p>
      {!hasCredentials && (
        <p>
          1. Add <span className="font-mono">GOOGLE_CLIENT_ID</span> and{" "}
          <span className="font-mono">GOOGLE_CLIENT_SECRET</span> to your{" "}
          <span className="font-mono">.env</span> file.
        </p>
      )}
      <p>
        1. In Google Cloud Console, enable the <strong>Gmail API</strong> for your project.
      </p>
      <p>
        2. Under <strong>Credentials</strong>, open your OAuth 2.0 Client ID and add this
        exact <strong>Authorized redirect URI</strong>:
      </p>
      <pre className="font-mono text-[12px] bg-white border border-hairline rounded-md px-3 py-2 overflow-x-auto">
        {redirectUri ?? "http://localhost:3000/api/auth/google/callback"}
      </pre>
      <p>
        3. Click <strong>Connect Gmail</strong> above and approve the consent screen.
      </p>
      <p className="text-[12px] text-mute">
        Getting <span className="font-mono">redirect_uri_mismatch</span>? It always means step 2
        wasn&apos;t saved — the URI above must be registered exactly, including{" "}
        <span className="font-mono">http://localhost:3000</span>.
      </p>
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

function ProviderKeyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <Input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-white border-hairline rounded-md" />
    </Field>
  );
}