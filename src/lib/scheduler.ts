import cron from "node-cron";
import { prisma } from "./db";
import { getConfig } from "./config";
import { sendEmail } from "./gmail/send";

let schedulerStarted = false;

/**
 * Compute days since the cold-outreach ramp began, to determine the daily cap.
 */
export function getColdOutreachDailyCap(): number {
  const cfg = getConfig().cold_outreach;
  const rampStart = (
    globalThis as typeof globalThis & { __coldRampStart?: Date }
  ).__coldRampStart;
  if (!rampStart) {
    return cfg.daily_cap_start;
  }
  const days = Math.floor(
    (Date.now() - new Date(rampStart).getTime()) / (1000 * 60 * 60 * 24)
  );
  const step = (cfg.daily_cap_max - cfg.daily_cap_start) / (cfg.ramp_up_days || 21);
  return Math.min(cfg.daily_cap_max, Math.round(cfg.daily_cap_start + days * step));
}

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    try {
      await processDueSends();
    } catch (error) {
      console.error("[scheduler] send tick failed:", error);
    }
  });

  console.log("[scheduler] Started — checking every minute for due sends.");
}

/**
 * Process any QUEUED applications whose scheduledSendAt is in the past.
 */
export async function processDueSends(): Promise<void> {
  const now = new Date();

  const dueApps = await prisma.application.findMany({
    where: {
      status: "QUEUED",
      scheduledSendAt: { lte: now },
    },
    include: { resume: true },
  });

  for (const app of dueApps) {
    await sendQueuedApplication(app);
  }

  await processFollowUps();
}

async function sendQueuedApplication(app: Record<string, unknown>): Promise<void> {
  try {
    if (!app.emailSubject || !app.emailBody || !app.hrEmail) {
      await prisma.application.update({
        where: { id: app.id as string },
        data: { status: "PENDING_REVIEW" },
      });
      return;
    }

    const attachment = app.tailoredPdfPath
      ? await readAttachment(app.tailoredPdfPath as string)
      : undefined;

    // Enforce 30s min gap between sends
    const lastLog = await prisma.emailLog.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (lastLog) {
      const elapsed = Date.now() - new Date(lastLog.createdAt).getTime();
      if (elapsed < 30_000) {
        // reschedule slightly later rather than dropping
        await prisma.application.update({
          where: { id: app.id as string },
          data: { scheduledSendAt: new Date(Date.now() + 31_000) },
        });
        return;
      }
    }

    // Check cold-outreach cap
    if (app.isColdOutreach) {
      const cap = getColdOutreachDailyCap();
      const sentToday = await prisma.emailLog.count({
        where: {
          status: "SENT",
          sentAt: { gte: new Date(now().toISOString().split("T")[0]) },
        },
      });
      if (sentToday >= cap) return;
    }

    const result = await sendEmail({
      to: app.hrEmail as string,
      subject: app.emailSubject as string,
      body: app.emailBody as string,
      attachments: attachment ? [{ filename: "resume.pdf", content: attachment }] : [],
    });

    await prisma.emailLog.create({
      data: {
        applicationId: app.id as string,
        type: app.isColdOutreach ? "COLD_OUTREACH" : "INITIAL",
        gmailMessageId: result.messageId,
        gmailThreadId: result.threadId,
        status: "SENT",
        sentAt: now(),
      },
    });

    const cfg = getConfig().followup;
    await prisma.application.update({
      where: { id: app.id as string },
      data: {
        status: "SENT",
        sentAt: now(),
        followUpAt: new Date(Date.now() + cfg.interval_days * 24 * 60 * 60 * 1000),
        scheduledSendAt: null,
      },
    });

    if (app.contactId) {
      await prisma.contact.update({
        where: { id: app.contactId as string },
        data: {
          status: "CONTACTED",
          emailSentCount: { increment: 1 },
          lastSentAt: now(),
        },
      });
    }
  } catch (error) {
    console.error(`[scheduler] Failed sending application ${app.id}:`, error);
    await prisma.emailLog.create({
      data: {
        applicationId: app.id as string,
        type: app.isColdOutreach ? "COLD_OUTREACH" : "INITIAL",
        status: "FAILED",
      },
    });
  }
}

async function processFollowUps(): Promise<void> {
  const now = new Date();
  const cfg = getConfig().followup;

  const dueFollowUps = await prisma.application.findMany({
    where: {
      status: "SENT",
      followUpAt: { lte: now },
      followUpCount: { lt: cfg.max_followups },
    },
    include: { resume: true },
  });

  for (const app of dueFollowUps) {
    try {
      // Draft a follow-up that still needs user approval
      const followUpNumber = app.followUpCount + 1;
      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: "FOLLOW_UP_PENDING",
          followUpCount: followUpNumber,
          emailSubject: `Re: ${app.emailSubject ?? ""}`,
          emailBody: `Dear ${app.hrName ?? "Hiring Team"},\n\nJust following up on my application for the ${app.role} position at ${app.company}. I wanted to confirm you received it and that I'm still very interested in the opportunity.\n\nBest,\n${getConfig().user.name}`,
        },
      });
    } catch (error) {
      console.error(`[scheduler] Failed drafting follow-up for ${app.id}:`, error);
    }
  }
}

async function readAttachment(path: string): Promise<string> {
  const fs = await import("fs");
  return fs.readFileSync(path).toString("base64");
}

function now(): Date {
  return new Date();
}