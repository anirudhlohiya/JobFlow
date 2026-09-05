import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail/auth";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[auth] Failed to start OAuth:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}