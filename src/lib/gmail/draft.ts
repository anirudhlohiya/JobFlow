import { google } from "googleapis";
import fs from "fs";
import { getOAuthClient } from "./auth";
import { buildMimeMessage } from "./mime";
import { prisma } from "@/lib/db";
import { getNextSendTime } from "@/lib/schedule";

export interface CreateDraftParams {
  to: string;
  subject: string;
  body: string;
  pdfPath?: string | null;
  threadId?: string;
}

export interface CreateDraftResult {
  draftId: string;
  draftUrl: string;
  autoScheduled: boolean;
  scheduledSendAt: string | null;
}

const DRAFTS_URL = "https://mail.google.com/mail/u/0/#drafts";

/** Best-effort removal of a real Gmail draft. Throws if Gmail isn't connected. */
export async function deleteGmailDraft(draftId: string): Promise<void> {
  const oauth = await getOAuthClient();
  if (!oauth) throw new Error("Gmail not connected");
  const gmail = google.gmail({ version: "v1", auth: oauth.client });
  await gmail.users.drafts.delete({ userId: "me", id: draftId });
}

/**
 * Queue an email directly inside Gmail by creating a real draft
 * (subject, body, and resume attachment are all pre-filled).
 *
 * If the optional Google Apps Script scheduler is configured in Settings,
 * it also schedules the draft to send automatically from Google's cloud at
 * the next configured send-window time — nothing needs to run on this machine.
 */
export async function createGmailDraft(params: CreateDraftParams): Promise<CreateDraftResult> {
  const oauth = await getOAuthClient();
  if (!oauth) throw new Error("Gmail is not connected. Connect Google in Settings first.");

  const gmail = google.gmail({ version: "v1", auth: oauth.client });

  const attachment =
    params.pdfPath && fs.existsSync(params.pdfPath)
      ? { filename: "resume.pdf", content: fs.readFileSync(params.pdfPath).toString("base64") }
      : undefined;

  const { raw } = buildMimeMessage({
    to: params.to,
    subject: params.subject,
    body: params.body,
    attachments: attachment ? [attachment] : [],
    threadId: params.threadId,
  });

  const res = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw } as never },
  });

  const draftId = res.data.id ?? "";

  // Optional: auto-schedule the send via the Apps Script scheduler (runs in Google's cloud).
  const schedule = await scheduleSendViaAppsScript({
    draftId,
    to: params.to,
    subject: params.subject,
    body: params.body,
    attachment,
  });

  return {
    draftId,
    draftUrl: DRAFTS_URL,
    autoScheduled: schedule.scheduled,
    scheduledSendAt: schedule.scheduled && schedule.when ? schedule.when.toISOString() : null,
  };
}

async function scheduleSendViaAppsScript(input: {
  draftId: string;
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; content: string };
}): Promise<{ scheduled: boolean; when?: Date }> {
  const url = (
    await prisma.setting.findUnique({ where: { key: "gmail_scheduler_url" } })
  )?.value;
  const token = (
    await prisma.setting.findUnique({ where: { key: "gmail_scheduler_token" } })
  )?.value;
  if (!url || !token) return { scheduled: false };

  const when = getNextSendTime();
  const payload = {
    token,
    action: "schedule_send",
    to: input.to,
    subject: input.subject,
    body: input.body,
    when: when.toISOString(),
    attachmentBase64: input.attachment?.content ?? null,
    attachmentName: input.attachment?.filename ?? null,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[gmail/draft] Apps Script scheduler rejected:", response.status, detail.slice(0, 500));
    return { scheduled: false };
  }

  return { scheduled: true, when };
}