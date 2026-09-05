import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/gmail/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?gmail=error`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/settings?gmail=error`, request.url));
  }

  try {
    const email = await handleOAuthCallback(code);
    return NextResponse.redirect(
      new URL(`/settings?gmail=connected&email=${encodeURIComponent(email)}`, request.url)
    );
  } catch (err) {
    console.error("[auth] Callback failed:", err);
    return NextResponse.redirect(new URL(`/settings?gmail=error`, request.url));
  }
}