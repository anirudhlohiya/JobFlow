import { NextRequest, NextResponse } from "next/server";
import { draftEmail } from "@/lib/ai/draft";
import { getConfig } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      job,
      resumeHighlights,
      templateId,
      isFollowUp,
      followUpNumber,
    } = body;

    if (!job) {
      return NextResponse.json(
        { error: "Job details are required." },
        { status: 400 }
      );
    }

    const cfg = getConfig();
    const draft = await draftEmail({
      job: {
        role: job.role ?? "",
        company: job.company ?? "",
        hrEmail: job.hrEmail,
        hrName: job.hrName,
        skills: Array.isArray(job.skills) ? job.skills : [],
        experience: job.experience,
        source: job.source,
        location: job.location,
      },
      user: cfg.user,
      resumeHighlights,
      templateId,
      isFollowUp,
      followUpNumber,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("[email/draft] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}