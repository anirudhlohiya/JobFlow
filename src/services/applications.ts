import { apiFetch } from "@/lib/api";
import type { ExtractedJob } from "@/types";

export interface ApplicationRecord {
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
  tailoredPdfPath: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  scheduledSendAt: string | null;
  sentAt: string | null;
  followUpAt: string | null;
  followUpCount: number;
  gmailDraftId: string | null;
  createdAt: string;
  emailLogs: { id: string; type: string; status: string; sentAt: string | null }[];
}

export interface ApplicationListResponse {
  applications: ApplicationRecord[];
}

export interface ApplicationResponse {
  application: ApplicationRecord;
}

export function listApplications(status?: string): Promise<ApplicationListResponse> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApplicationListResponse>(`/api/applications${q}`);
}

export function createApplication(
  job: ExtractedJob,
  sourceRawText?: string
): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: job.company,
      role: job.role,
      hrEmail: job.hrEmail,
      hrName: job.hrName,
      skills: job.skills,
      experience: job.experience,
      location: job.location,
      isRemote: job.isRemote,
      salary: job.salary,
      source: job.source,
      sourceRawText,
    }),
  });
}

export function getApplication(id: string): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}`);
}

export function updateApplication(
  id: string,
  patch: Record<string, unknown>
): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export interface ApproveResponse extends ApplicationResponse {
  draft?: {
    draftId: string;
    draftUrl: string;
    autoScheduled: boolean;
    scheduledSendAt: string | null;
  };
}

export function approveApplication(id: string): Promise<ApproveResponse> {
  return apiFetch<ApproveResponse>(`/api/applications/${id}/approve`, {
    method: "POST",
  });
}

export function cancelApplication(id: string): Promise<ApplicationResponse> {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}/cancel`, {
    method: "POST",
  });
}

export function deleteApplication(id: string): Promise<void> {
  return apiFetch<void>(`/api/applications/${id}`, { method: "DELETE" });
}