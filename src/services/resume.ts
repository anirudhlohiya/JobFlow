import { apiFetch } from "@/lib/api";

export interface ResumeRow {
  id: string;
  name: string;
  isDefault: boolean;
  updatedAt: string;
}

export function listResumes(): Promise<{ resumes: ResumeRow[] }> {
  return apiFetch<{ resumes: ResumeRow[] }>("/api/resume");
}

export function tailorResume(
  resumeId: string,
  job: {
    role: string;
    company: string;
    skills: string[];
    experience?: string;
  }
): Promise<{ tailoredLatex: string }> {
  return apiFetch<{ tailoredLatex: string }>("/api/resume/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeId, job }),
  });
}

export function compileResume(
  latex: string,
  outputName?: string
): Promise<{ pdfPath: string; pdfBase64: string }> {
  return apiFetch<{ pdfPath: string; pdfBase64: string }>("/api/resume/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex, outputName }),
  });
}

export function pdfUrlFor(path: string): string {
  return `/api/resume/pdf?path=${encodeURIComponent(path)}`;
}