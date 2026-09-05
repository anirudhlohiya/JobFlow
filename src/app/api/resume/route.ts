import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const resumes = await prisma.resume.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, isDefault: true, updatedAt: true },
  });

  return NextResponse.json({ resumes });
}