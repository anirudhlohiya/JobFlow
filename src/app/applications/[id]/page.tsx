"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { getStatusBadgeClass } from "@/components/applications/status-badge";
import { formatCountdown } from "@/lib/format";

type Application = {
  id: string;
  company: string;
  role: string;
  hrEmail: string | null;
  hrName: string | null;
  skills: string;
  experience: string | null;
  location: string | null;
  isRemote: boolean;
  salary: string | null;
  source: string | null;
  sourceRawText: string | null;
  status: string;
  tailoredLatex: string | null;
  tailoredPdfPath: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  scheduledSendAt: string | null;
  sentAt: string | null;
  followUpAt: string | null;
  followUpCount: number;
  createdAt: string;
  emailLogs: { id: string; type: string; status: string; sentAt: string | null }[];
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  QUEUED: "Queued",
  SENT: "Sent",
  FOLLOW_UP_PENDING: "Follow-up Pending",
  FOLLOWED_UP: "Followed Up",
  REPLIED: "Replied",
  ARCHIVED: "Archived",
};

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("email");

  useEffect(() => {
    loadApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadApp() {
    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      setApp(data.application);
      if (data.application.tailoredPdfPath) {
        setPdfUrl(`/api/resume/pdf?path=${encodeURIComponent(data.application.tailoredPdfPath)}`);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    setBusy(true);
    await fetch(`/api/applications/${id}/approve`, { method: "POST" });
    await loadApp();
    setBusy(false);
  }

  async function cancel() {
    setBusy(true);
    await fetch(`/api/applications/${id}/cancel`, { method: "POST" });
    await loadApp();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this application permanently?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/applications");
  }

  if (loading) {
    return <p className="text-sm text-mute py-10">Loading application…</p>;
  }

  if (!app) {
    return <p className="text-sm text-mute py-10">Application not found.</p>;
  }

  const skills = JSON.parse(app.skills || "[]") as string[];
  const isQueued = app.status === "QUEUED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
              {app.role}
            </h1>
            <Badge className={`${getStatusBadgeClass(app.status)} border rounded-full font-medium`}>
              {STATUS_LABELS[app.status] ?? app.status}
            </Badge>
          </div>
          <p className="text-body mt-1">
            {app.company} · {app.location || "—"} · {app.isRemote ? "Remote" : "On-site"}
            {app.hrEmail ? ` · ${app.hrEmail}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isQueued ? (
            <Button onClick={cancel} disabled={busy} className="rounded-md h-9 bg-white text-ink border border-hairline hover:bg-hairline-soft">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Queued Send"}
            </Button>
          ) : (
            app.status === "FOLLOW_UP_PENDING" && (
              <Button onClick={approve} disabled={busy} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Follow-Up"}
              </Button>
            )
          )}
          {["SENT", "FOLLOWED_UP", "REPLIED", "ARCHIVED", "FOLLOW_UP_PENDING"].includes(app.status) ? null : (
            <Button onClick={approve} disabled={busy || !app.emailSubject || !app.emailBody || isQueued} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              Approve & Queue
            </Button>
          )}
          <Button onClick={handleDelete} variant="ghost" className="rounded-md h-9 text-destructive">
            Delete
          </Button>
        </div>
      </div>

      {/* Status strip */}
      {isQueued && app.scheduledSendAt && (
        <div className="rounded-md bg-link-soft border border-link/20 px-4 py-3 text-sm text-link-deep">
          Queued to send in <strong>{formatCountdown(new Date(app.scheduledSendAt))}</strong>
          {app.followUpCount > 0 && ` · Follow-up #${app.followUpCount}`}
        </div>
      )}
      {app.status === "FOLLOW_UP_PENDING" && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          A follow-up draft is ready — review below and approve to send.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border border-hairline rounded-full">
          <TabsTrigger value="email" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Email
          </TabsTrigger>
          <TabsTrigger value="resume" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Resume
          </TabsTrigger>
          <TabsTrigger value="details" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Details
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-full data-[state=active]:bg-ink data-[state=active]:text-white">
            Send Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardContent className="p-6 flex flex-col gap-3">
              <p className="text-sm font-medium text-ink">To: {app.hrEmail || "—"}</p>
              <div className="rounded-md border border-hairline bg-canvas px-4 py-3">
                <p className="text-sm font-medium text-ink">{app.emailSubject || "—"}</p>
              </div>
              <pre className="whitespace-pre-wrap bg-canvas border border-hairline rounded-md p-4 text-[13px] text-body font-sans">
                {app.emailBody || "No email drafted."}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume">
          <Card>
            <CardContent className="p-6">
              {pdfUrl ? (
                <iframe src={pdfUrl} className="w-full h-[700px] border border-hairline rounded-[12px] bg-white" title="Resume PDF" />
              ) : (
                <p className="text-sm text-mute">No tailored resume compiled yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
              <Detail label="Experience" value={app.experience} />
              <Detail label="Salary" value={app.salary} />
              <Detail label="Source" value={app.source} />
              <Detail label="Skills" value={skills.length ? skills.join(", ") : "—"} />
              <Detail label="Scheduled Send" value={app.scheduledSendAt ? new Date(app.scheduledSendAt).toLocaleString() : "—"} />
              <Detail label="Sent At" value={app.sentAt ? new Date(app.sentAt).toLocaleString() : "—"} />
              <div className="col-span-2 md:col-span-3">
                <p className="text-[12px] text-mute font-mono uppercase tracking-wide mb-1">Original Post</p>
                <pre className="whitespace-pre-wrap bg-canvas border border-hairline rounded-md p-4 text-[13px] text-body font-sans max-h-60 overflow-y-auto">
                  {app.sourceRawText || "No original post saved."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-6">
              {app.emailLogs.length === 0 ? (
                <p className="text-sm text-mute">No send logs yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {app.emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border border-hairline rounded-md px-4 py-2.5 text-sm">
                      <span className="font-mono text-body">{log.type}</span>
                      <Badge className={`${getStatusBadgeClass(log.type === "FOLLOW_UP_1" || log.type === "FOLLOW_UP_2" ? "SENT" : log.status === "FAILED" ? "PENDING_REVIEW" : "SENT")} border rounded-full font-medium`}>
                        {log.status}
                      </Badge>
                      <span className="text-mute">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div>
        <Link href="/applications" className="text-sm text-link hover:underline">
          ← Back to applications
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[12px] text-mute font-mono uppercase tracking-wide">{label}</p>
      <p className="text-ink">{value || "—"}</p>
    </div>
  );
}