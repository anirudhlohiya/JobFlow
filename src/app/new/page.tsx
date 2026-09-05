"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IngestionStep } from "@/components/wizard/ingestion-step";
import { ExtractionReviewStep } from "@/components/wizard/extraction-review-step";
import { ResumeEmailStep } from "@/components/wizard/resume-email-step";
import { ApproveStep } from "@/components/wizard/approve-step";
import type { ExtractedJob } from "@/types";

const STEPS = ["Ingest", "Review Extraction", "Resume & Email", "Approve & Queue"];

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [job, setJob] = useState<ExtractedJob | null>(null);
  const [rawText, setRawText] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-1">
          Pipeline
        </p>
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
          New Application
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${
                  i < step
                    ? "bg-ink text-white"
                    : i === step
                      ? "bg-white border border-ink text-ink"
                      : "bg-hairline-soft text-mute border border-hairline"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-[13px] ${
                  i === step ? "text-ink font-medium" : "text-mute"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-hairline" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <IngestionStep
          onComplete={({ extracted, text }) => {
            setJob(extracted);
            setRawText(text);
            setStep(1);
          }}
        />
      )}

      {step === 1 && job && (
        <ExtractionReviewStep
          job={job}
          onBack={() => setStep(0)}
          onComplete={async (finalJob) => {
            setJob(finalJob);
            // Create the application record
            const res = await fetch("/api/applications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                company: finalJob.company,
                role: finalJob.role,
                hrEmail: finalJob.hrEmail,
                hrName: finalJob.hrName,
                skills: finalJob.skills,
                experience: finalJob.experience,
                location: finalJob.location,
                isRemote: finalJob.isRemote,
                salary: finalJob.salary,
                source: finalJob.source,
                sourceRawText: rawText,
              }),
            });
            const data = await res.json();
            if (res.ok && data.application) {
              setApplicationId(data.application.id);
              setStep(2);
            } else {
              alert(data.error ?? "Failed to create application.");
            }
          }}
        />
      )}

      {step === 2 && applicationId && job && (
        <ResumeEmailStep
          applicationId={applicationId}
          job={job}
          onBack={() => setStep(1)}
          onComplete={() => setStep(3)}
        />
      )}

      {step === 3 && applicationId && job && (
        <ApproveStep
          applicationId={applicationId}
          job={job}
          onBack={() => setStep(2)}
          onComplete={() => router.push("/")}
        />
      )}
    </div>
  );
}