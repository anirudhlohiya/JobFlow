/** Application status labels and helpers shared across pages. */

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  QUEUED: "Queued",
  QUEUED_IN_GMAIL: "Queued in Gmail",
  SENT: "Sent",
  FOLLOW_UP_PENDING: "Follow-up Pending",
  FOLLOWED_UP: "Followed Up",
  REPLIED: "Replied",
  ARCHIVED: "Archived",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function isGmailQueued(status: string): boolean {
  return status === "QUEUED_IN_GMAIL" || status === "QUEUED";
}

export function isTerminal(status: string): boolean {
  return ["SENT", "FOLLOWED_UP", "REPLIED", "ARCHIVED"].includes(status);
}

export const DRAFTS_URL = "https://mail.google.com/mail/u/0/#drafts";