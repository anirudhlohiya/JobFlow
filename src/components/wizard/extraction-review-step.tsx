"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExtractedJob } from "@/types";

interface Props {
  job: ExtractedJob;
  onBack: () => void;
  onComplete: (job: ExtractedJob) => void;
}

export function ExtractionReviewStep({ job: initialJob, onBack, onComplete }: Props) {
  const [job, setJob] = useState<ExtractedJob>({ ...initialJob });

  const confidenceBadge =
    job.confidence === "high"
      ? "bg-cyan-soft text-[#007970]"
      : job.confidence === "medium"
        ? "bg-warning-soft text-warning-deep"
        : "bg-error/10 text-error-deep";

  function update<K extends keyof ExtractedJob>(key: K, value: ExtractedJob[K]) {
    setJob((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-mute">Extraction confidence:</span>
        <Badge className={`${confidenceBadge} border rounded-full font-medium`}>
          {job.confidence ?? "medium"}
        </Badge>
        {!job.hrEmail && (
          <Badge className="bg-warning-soft text-warning-deep border rounded-full font-medium">
            No HR email found
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Role *">
            <Input
              value={job.role}
              onChange={(e) => update("role", e.target.value)}
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="Company *">
            <Input
              value={job.company}
              onChange={(e) => update("company", e.target.value)}
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="HR Email">
            <Input
              value={job.hrEmail ?? ""}
              onChange={(e) => update("hrEmail", e.target.value)}
              placeholder="hr@company.com"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="HR Name">
            <Input
              value={job.hrName ?? ""}
              onChange={(e) => update("hrName", e.target.value)}
              placeholder="e.g. Priya Singh"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="Experience">
            <Input
              value={job.experience ?? ""}
              onChange={(e) => update("experience", e.target.value)}
              placeholder="e.g. 2-4 years"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="Location">
            <Input
              value={job.location ?? ""}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Bengaluru"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="Salary">
            <Input
              value={job.salary ?? ""}
              onChange={(e) => update("salary", e.target.value)}
              placeholder="e.g. ₹12-18 LPA"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <Field label="Source">
            <Input
              value={job.source ?? ""}
              onChange={(e) => update("source", e.target.value)}
              placeholder="e.g. WhatsApp group"
              className="bg-white border-hairline rounded-md"
            />
          </Field>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={job.isRemote}
                onChange={(e) => update("isRemote", e.target.checked)}
                className="w-4 h-4 accent-ink"
              />
              Remote
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Label className="text-sm text-ink font-medium">Required Skills</Label>
          <p className="text-[12px] text-mute mb-3">
            Comma-separated. Used for resume tailoring and email drafting.
          </p>
          <Textarea
            value={(job.skills ?? []).join(", ")}
            onChange={(e) =>
              update(
                "skills",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            className="bg-white border-hairline rounded-md min-h-[80px]"
            placeholder="Node.js, PostgreSQL, AWS, Docker"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-md h-10 text-ink">
          Back
        </Button>
        <Button
          onClick={() => onComplete(job)}
          disabled={!job.role || !job.company}
          className="rounded-md h-10 px-4 bg-ink text-white hover:bg-ink/90"
        >
          Save &amp; Generate Resume →
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] text-body font-medium">{label}</Label>
      {children}
    </div>
  );
}