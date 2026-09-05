import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tailorResume } from "@/lib/ai/tailor";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, job } = body;

    if (!resumeId || !job) {
      return NextResponse.json(
        { error: "resumeId and job details are required." },
        { status: 400 }
      );
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const tailoredLatex = await tailorResume(resume.latexContent, {
      role: job.role ?? "",
      company: job.company ?? "",
      skills: Array.isArray(job.skills) ? job.skills : [],
      experience: job.experience,
    });

    return NextResponse.json({ tailoredLatex });
  } catch (error) {
    console.error("[resume/tailor] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}