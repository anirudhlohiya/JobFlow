import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGmailDraft } from "@/lib/gmail/draft";
import { isGmailConnected } from "@/lib/gmail/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (!(await isGmailConnected())) {
    return NextResponse.json(
      {
        error:
          "Gmail is not connected yet. Open Settings → Connections and sign in with Google first — the email is queued as a real draft inside Gmail.",
      },
      { status: 400 }
    );
  }

  if (!application.hrEmail || !application.emailSubject || !application.emailBody) {
    return NextResponse.json(
      {
        error:
          "Application is missing recipient, subject, or body. Complete the draft before approving.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createGmailDraft({
      to: application.hrEmail,
      subject: application.emailSubject,
      body: application.emailBody,
      pdfPath: application.tailoredPdfPath,
    });

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "QUEUED_IN_GMAIL",
        gmailDraftId: result.draftId,
        scheduledSendAt: result.scheduledSendAt,
        sentAt: null,
      },
    });

    await prisma.emailLog.create({
      data: {
        applicationId: id,
        type: result.autoScheduled ? "DRAFT_SCHEDULED" : "DRAFT_CREATED",
        status: "QUEUED",
        sentAt: result.scheduledSendAt ? new Date(result.scheduledSendAt) : null,
      },
    });

    return NextResponse.json({
      application: updated,
      draft: result,
    });
  } catch (error) {
    console.error(`[applications/approve] Failed queuing draft for ${id}:`, error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create the Gmail draft." },
      { status: 500 }
    );
  }
}