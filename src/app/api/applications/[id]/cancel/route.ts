import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: "DRAFT",
      scheduledSendAt: null,
    },
  });

  return NextResponse.json({ application: updated });
}