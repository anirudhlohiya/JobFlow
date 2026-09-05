import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { company: { contains: search } },
      { role: { contains: search } },
    ];
  }

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { emailLogs: true },
  });

  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    company,
    role,
    hrEmail,
    hrName,
    skills = [],
    experience,
    location,
    isRemote = false,
    salary,
    source,
    sourceRawText,
  } = body;

  if (!company || !role) {
    return NextResponse.json(
      { error: "company and role are required." },
      { status: 400 }
    );
  }

  const application = await prisma.application.create({
    data: {
      company,
      role,
      hrEmail: hrEmail || null,
      hrName: hrName || null,
      skills: JSON.stringify(skills),
      experience: experience || null,
      location: location || null,
      isRemote,
      salary: salary || null,
      source: source || null,
      sourceRawText: sourceRawText || null,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}