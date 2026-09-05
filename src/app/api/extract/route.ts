import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { extractJobFromText } from "@/lib/ai/extract";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawText = body?.text;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 5) {
      return NextResponse.json(
        { error: "Provide the job post text (at least 5 characters)." },
        { status: 400 }
      );
    }

    const result = await extractJobFromText(rawText);
    return NextResponse.json({ job: result, rawText });
  } catch (error) {
    console.error("[extract] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Extraction failed." },
      { status: 500 }
    );
  }
}