"use client";

import { useRouter } from "next/navigation";
import { IngestionStep } from "@/components/wizard/ingestion-step";
import { ExtractionReviewStep } from "@/components/wizard/extraction-review-step";
import { ResumeEmailStep } from "@/components/wizard/resume-email-step";
import { ApproveStep } from "@/components/wizard/approve-step";
import { useNewApplicationViewModel, WIZARD_STEPS } from "@/features/new-application/useNewApplicationViewModel";

export default function NewApplicationPage() {
  const router = useRouter();
  const vm = useNewApplicationViewModel();

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
        {WIZARD_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${
                  i < vm.step
                    ? "bg-ink text-white"
                    : i === vm.step
                      ? "bg-white border border-ink text-ink"
                      : "bg-hairline-soft text-mute border border-hairline"
                }`}
              >
                {i < vm.step ? "✓" : i + 1}
              </div>
              <span
                className={`text-[13px] ${
                  i === vm.step ? "text-ink font-medium" : "text-mute"
                }`}
              >
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className="w-8 h-px bg-hairline" />
            )}
          </div>
        ))}
      </div>

      {vm.error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {vm.error}
        </div>
      )}

      {/* Step content */}
      {vm.step === 0 && (
        <IngestionStep
          onComplete={({ extracted, text, images }) => {
            vm.setExtracted(extracted, text, images);
          }}
        />
      )}

      {vm.step === 1 && vm.job && (
        <ExtractionReviewStep
          job={vm.job}
          onBack={() => vm.goTo(0)}
          onComplete={async (finalJob) => {
            await vm.saveApplication(finalJob);
          }}
        />
      )}

      {vm.step === 2 && vm.applicationId && vm.job && (
        <ResumeEmailStep
          applicationId={vm.applicationId}
          job={vm.job}
          onBack={() => vm.goTo(1)}
          onComplete={() => vm.goTo(3)}
        />
      )}

      {vm.step === 3 && vm.applicationId && vm.job && (
        <ApproveStep
          applicationId={vm.applicationId}
          job={vm.job}
          onBack={() => vm.goTo(2)}
          onComplete={() => router.push("/")}
        />
      )}
    </div>
  );
}