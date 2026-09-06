import { apiFetch } from "@/lib/api";
import type { ExtractedJob } from "@/types";

export function draftEmail(input: {
  job: Pick<
    ExtractedJob,
    | "role"
    | "company"
    | "hrEmail"
    | "hrName"
    | "skills"
    | "experience"
    | "source"
    | "location"
  >;
  resumeHighlights?: string;
  templateId?: string;
  isFollowUp?: boolean;
  followUpNumber?: number;
}): Promise<{ subject: string; body: string; templateId?: string }> {
  return apiFetch<{ subject: string; body: string; templateId?: string }>(
    "/api/email/draft",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
}