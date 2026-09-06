export interface ExtractedJob {
  role: string;
  company: string;
  skills: string[];
  experience?: string;
  hrEmail?: string;
  hrName?: string;
  location?: string;
  isRemote: boolean;
  salary?: string;
  source?: string;
  confidence: "high" | "medium" | "low";
}

export interface ApplicationDraft {
  id?: string;
  company: string;
  role: string;
  hrEmail?: string;
  hrName?: string;
  skills: string[];
  experience?: string;
  location?: string;
  isRemote: boolean;
  salary?: string;
  source?: string;
  sourceRawText?: string;
  sourceImage?: string;
}

export type ApplicationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "QUEUED"
  | "QUEUED_IN_GMAIL"
  | "SENT"
  | "FOLLOW_UP_PENDING"
  | "FOLLOWED_UP"
  | "REPLIED"
  | "ARCHIVED";

export type LLMProvider = "openai" | "anthropic" | "google" | "groq";

export interface UserConfig {
  user: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  send: {
    timezone: string;
    start_hour: number;
    end_hour: number;
    weekdays_only: boolean;
  };
  followup: {
    interval_days: number;
    max_followups: number;
  };
  resume: {
    default_file: string;
    max_pages: number;
  };
  cold_outreach: {
    daily_cap_start: number;
    daily_cap_max: number;
    ramp_up_days: number;
    max_followups: number;
  };
}

export interface ResumeData {
  id: string;
  name: string;
  latexContent: string;
  isDefault: boolean;
}

export interface EmailDraft {
  subject: string;
  body: string;
  templateId?: string;
}