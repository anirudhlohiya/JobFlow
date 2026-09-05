"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCountdown } from "@/lib/format";
import type { ExtractedJob } from "@/types";

interface Props {
  applicationId: string;
  job: ExtractedJob;
  onBack: () => void;
  onComplete: () => void;
}

type Application = {
  emailSubject?: string;
  emailBody?: string;
  tailoredPdfPath?: string;
  scheduledSendAt?: string | null;
  status: string;
};

export function ApproveStep({ applicationId, job, onBack, onComplete }: Props) {
  const [app, setApp] = useState<Application | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/applications/${applicationId}`)
      .then((r) => r.json())
      .then((d) => setApp(d.application))
      .catch(() => setError("Failed to load application."));
  }, [applicationId]);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = data.application;
      setApp(updated);
      alert(
        `Application queued!\n\nIt will send at: ${new Date(updated.scheduledSendAt).toLocaleString()}\n\nCheck the dashboard to track it.`
      );
      onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: extracted job summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
              {job.role}
            </CardTitle>
            <p className="text-sm text-body">{job.company}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[12px] text-mute font-mono uppercase tracking-wide">HR Email</dt>
                <dd className="text-ink">{job.hrEmail || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-mute font-mono uppercase tracking-wide">HR Name</dt>
                <dd className="text-ink">{job.hrName || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-mute font-mono uppercase tracking-wide">Location</dt>
                <dd className="text-ink">{job.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-mute font-mono uppercase tracking-wide">Experience</dt>
                <dd className="text-ink">{job.experience || "—"}</dd>
              </div>
            </dl>
            <div>
              <p className="text-[12px] text-mute font-mono uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(job.skills ?? []).map((s, i) => (
                  <Badge key={i} className="bg-hairline-soft text-body border rounded-full font-medium">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: email preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
              Email Preview
            </CardTitle>
            <p className="text-sm text-body">To: {job.hrEmail || "No HR email"}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-md border border-hairline bg-canvas px-4 py-3">
              <p className="text-sm font-medium text-ink">{app?.emailSubject || "—"}</p>
            </div>
            <pre className="whitespace-pre-wrap bg-canvas border border-hairline rounded-md p-4 text-[13px] text-body font-sans">
              {app?.emailBody || "No email drafted yet."}
            </pre>
            <div className="rounded-md border border-hairline bg-hairline-soft/50 px-4 py-3 text-[12px] text-mute">
              Attachment: tailored resume PDF
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-md h-10 text-ink">
          Back
        </Button>
        <div className="flex items-center gap-4">
          {app?.status === "QUEUED" && app.scheduledSendAt ? (
            <div className="text-sm text-mute">
              Queued — sends in <span className="text-ink font-medium">{formatCountdown(new Date(app.scheduledSendAt))}</span>
            </div>
          ) : (
            <Button
              onClick={handleApprove}
              disabled={approving || !app?.emailSubject || !app?.emailBody}
              className="rounded-md h-10 px-5 bg-ink text-white hover:bg-ink/90"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Queuing…
                </>
              ) : (
                "Approve & Queue for Send"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}