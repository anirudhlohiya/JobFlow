import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNextSendTime } from "@/lib/schedule";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
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

  const scheduledSendAt = getNextSendTime();

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: "QUEUED",
      scheduledSendAt,
      followUpCount: 0,
    },
  });

  return NextResponse.json({ application: updated });
}