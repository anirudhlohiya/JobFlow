import cron from "node-cron";
import { prisma } from "./db";
import { getConfig } from "./config";
import { getUserProfile } from "./profile";
import { createGmailDraft } from "./gmail/draft";
import { isGmailConnected } from "./gmail/auth";

let schedulerStarted = false;

/**
 * The app never SENDS email itself anymore — that would require this machine
 * to be running at send time. All outbound email is queued as real Gmail
 * drafts (optionally auto-sent by the Google Apps Script scheduler).
 *
 * This scheduler only *drafts follow-ups* into Gmail whenever the app happens
 * to be running and a follow-up is due. If the app isn't running, the master
 * draft flow is unaffected.
 */
export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    try {
      await draftDueFollowUps();
    } catch (error) {
      console.error("[scheduler] follow-up tick failed:", error);
    }
  });

  console.log("[scheduler] Started — drafting follow-ups into Gmail when due.");
}

async function draftDueFollowUps(): Promise<void> {
  const cfg = getConfig().followup;

  const dueFollowUps = await prisma.application.findMany({
    where: {
      status: "SENT",
      followUpAt: { lte: new Date() },
      followUpCount: { lt: cfg.max_followups },
    },
  });

  if (dueFollowUps.length === 0) return;
  if (!(await isGmailConnected())) return;

  const profile = await getUserProfile();

  for (const app of dueFollowUps) {
    try {
      const followUpNumber = app.followUpCount + 1;
      const subject = `Re: ${app.emailSubject ?? ""}`;
      const body = `Dear ${app.hrName ?? "Hiring Team"},\n\nJust following up on my application for the ${app.role} position at ${app.company}. I wanted to confirm you received it and that I'm still very interested in the opportunity.\n\nBest,\n${profile.name}`;

      const result = await createGmailDraft({
        to: app.hrEmail ?? "",
        subject,
        body,
        pdfPath: app.tailoredPdfPath,
      });

      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: "QUEUED_IN_GMAIL",
          followUpCount: followUpNumber,
          gmailDraftId: result.draftId,
          emailSubject: subject,
          emailBody: body,
          scheduledSendAt: result.scheduledSendAt,
        },
      });

      await prisma.emailLog.create({
        data: {
          applicationId: app.id,
          type: `FOLLOW_UP_${followUpNumber}`,
          status: "QUEUED",
          sentAt: result.scheduledSendAt ? new Date(result.scheduledSendAt) : null,
        },
      });
    } catch (error) {
      console.error(`[scheduler] Failed drafting follow-up for ${app.id}:`, error);
    }
  }
}