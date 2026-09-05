import { NextRequest, NextResponse } from "next/server";
import { compileLatex } from "@/lib/resume/compile";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latex, outputName } = body;

    if (!latex || typeof latex !== "string") {
      return NextResponse.json(
        { error: "latex source is required." },
        { status: 400 }
      );
    }

    const result = await compileLatex(latex, outputName);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[resume/compile] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}