import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteGmailDraft } from "@/lib/gmail/draft";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.gmailDraftId) {
    await deleteGmailDraft(application.gmailDraftId).catch((err) =>
      console.error("[applications/cancel] Could not delete Gmail draft:", err)
    );
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: "DRAFT",
      scheduledSendAt: null,
      gmailDraftId: null,
    },
  });

  return NextResponse.json({ application: updated });
}