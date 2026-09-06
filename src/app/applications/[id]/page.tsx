"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ExternalLink } from "lucide-react";
import { getStatusBadgeClass } from "@/components/applications/status-badge";
import { formatCountdown } from "@/lib/format";
import { statusLabel, DRAFTS_URL, isGmailQueued, isTerminal } from "@/lib/status";
import { useApplicationDetailViewModel } from "@/features/application-detail/useApplicationDetailViewModel";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const vm = useApplicationDetailViewModel(id);
  const [activeTab, setActiveTab] = useState("email");

  async function handleDelete() {
    if (!window.confirm("Delete this application permanently?")) return;
    await vm.remove();
    router.push("/applications");
  }

  if (vm.loading) {
    return <p className="text-sm text-mute py-10">Loading application…</p>;
  }

  if (!vm.app) {
    return <p className="text-sm text-mute py-10">Application not found.</p>;
  }

  const app = vm.app;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
              {app.role}
            </h1>
            <Badge className={`${getStatusBadgeClass(app.status)} border rounded-full font-medium`}>
              {statusLabel(app.status)}
            </Badge>
          </div>
          <p className="text-body mt-1">
            {app.company} · {app.location || "—"} · {app.isRemote ? "Remote" : "On-site"}
            {app.hrEmail ? ` · ${app.hrEmail}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vm.isQueued ? (
            <Button onClick={vm.cancel} disabled={vm.busy !== null} className="rounded-md h-9 bg-white text-ink border border-hairline hover:bg-hairline-soft">
              {vm.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove from Queue"}
            </Button>
          ) : null}
          {isTerminal(app.status) ? null : (
            <Button
              onClick={vm.approve}
              disabled={vm.busy !== null || !vm.canApprove}
              className="rounded-md h-9 bg-ink text-white hover:bg-ink/90"
            >
              {vm.busy === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Queue in Gmail"}
            </Button>
          )}
          <Button onClick={handleDelete} variant="ghost" className="rounded-md h-9 text-destructive">
            Delete
          </Button>
        </div>
      </div>

      {vm.error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {vm.error}
        </div>
      )}

      {/* Status strip */}
      {vm.isQueued && (
        <div className="rounded-md bg-link-soft border border-link/20 px-4 py-3 text-sm text-link-deep">
          <span className="font-medium">Queued in Gmail.</span>{" "}
          {app.scheduledSendAt ? (
            <>
              Scheduled to send in <strong>{formatCountdown(new Date(app.scheduledSendAt))}</strong>{" "}
              (auto-sent by the Gmail scheduler).
            </>
          ) : (
            <>It&apos;s sitting in your Gmail drafts — review and send whenever you&apos;re ready.</>
          )}{" "}
          <a
            href={DRAFTS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline"
          >
            <ExternalLink className="w-3 h-3" /> Open Gmail drafts
          </a>
          {app.followUpCount > 0 && ` · Follow-up #${app.followUpCount}`}
        </div>
      )}
      {app.status === "FOLLOW_UP_PENDING" && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          A follow-up draft is ready — review below and queue it.
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
              {vm.pdfUrl ? (
                <iframe src={vm.pdfUrl} className="w-full h-[700px] border border-hairline rounded-[12px] bg-white" title="Resume PDF" />
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
              <Detail label="Skills" value={vm.skills.length ? vm.skills.join(", ") : "—"} />
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
                      <Badge className={`${getStatusBadgeClass(log.type === "FOLLOW_UP_1" || log.type === "FOLLOW_UP_2" ? "SENT" : isGmailQueued(log.status) ? "QUEUED_IN_GMAIL" : log.status === "FAILED" ? "PENDING_REVIEW" : "SENT")} border rounded-full font-medium`}>
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