"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatCountdown } from "@/lib/format";
import { DRAFTS_URL, isGmailQueued } from "@/lib/status";
import { getApplication, approveApplication, type ApplicationRecord } from "@/services/applications";
import type { ExtractedJob } from "@/types";

interface Props {
  applicationId: string;
  job: ExtractedJob;
  onBack: () => void;
  onComplete: () => void;
}

interface ApprovalResult {
  draftUrl: string;
  autoScheduled: boolean;
  scheduledSendAt: string | null;
}

export function ApproveStep({ applicationId, job, onBack, onComplete }: Props) {
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApprovalResult | null>(null);

  useEffect(() => {
    getApplication(applicationId)
      .then(({ application }) => setApp(application))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await approveApplication(applicationId);
      setApp(res.application);
      if ("draft" in res && res.draft) {
        setResult({
          draftUrl: res.draft.draftUrl,
          autoScheduled: res.draft.autoScheduled,
          scheduledSendAt: res.draft.scheduledSendAt,
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-mute py-10">Loading application…</p>;
  }

  const alreadyQueued = app ? isGmailQueued(app.status) : false;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md bg-cyan-soft border border-cyan/30 px-4 py-3 text-sm text-[#007970] flex flex-col gap-1">
          <p className="font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Queued in your Gmail as a real draft.
          </p>
          {result.autoScheduled && result.scheduledSendAt ? (
            <p>
              Auto-send scheduled for{" "}
              <strong>{new Date(result.scheduledSendAt).toLocaleString()}</strong> (
              {formatCountdown(new Date(result.scheduledSendAt))} from now).
            </p>
          ) : (
            <p>Emails stay as drafts until Gmail sends them. You can review and send anytime.</p>
          )}
          <a
            href={result.draftUrl || DRAFTS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium underline mt-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Gmail drafts
          </a>
        </div>
      )}

      {alreadyQueued && !result && (
        <div className="rounded-md bg-link-soft border border-link/20 px-4 py-3 text-sm text-link-deep">
          This application is already queued in Gmail.{" "}
          <a
            href={DRAFTS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Gmail drafts
          </a>
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
          {alreadyQueued || result ? (
            <Button onClick={onComplete} className="rounded-md h-10 px-5 bg-ink text-white hover:bg-ink/90">
              Done
            </Button>
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
                "Approve & Queue in Gmail"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}