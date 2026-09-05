import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { emailLogs: true, resume: true, contact: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.company !== undefined) data.company = body.company;
  if (body.role !== undefined) data.role = body.role;
  if (body.hrEmail !== undefined) data.hrEmail = body.hrEmail || null;
  if (body.hrName !== undefined) data.hrName = body.hrName || null;
  if (body.skills !== undefined) data.skills = JSON.stringify(body.skills);
  if (body.experience !== undefined) data.experience = body.experience || null;
  if (body.location !== undefined) data.location = body.location || null;
  if (body.isRemote !== undefined) data.isRemote = body.isRemote;
  if (body.salary !== undefined) data.salary = body.salary || null;
  if (body.source !== undefined) data.source = body.source || null;
  if (body.emailSubject !== undefined) data.emailSubject = body.emailSubject || null;
  if (body.emailBody !== undefined) data.emailBody = body.emailBody || null;
  if (body.emailTemplate !== undefined) data.emailTemplate = body.emailTemplate || null;
  if (body.tailoredLatex !== undefined) data.tailoredLatex = body.tailoredLatex || null;
  if (body.tailoredPdfPath !== undefined) data.tailoredPdfPath = body.tailoredPdfPath || null;
  if (body.status !== undefined) data.status = body.status;

  try {
    const application = await prisma.application.update({
      where: { id },
      data,
    });
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.emailLog.deleteMany({ where: { applicationId: id } });
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}