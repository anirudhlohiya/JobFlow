import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/gmail/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    const description = request.nextUrl.searchParams.get("error_description");
    const reason = [oauthError, description ? decodeURIComponent(description).slice(0, 200) : ""]
      .filter(Boolean)
      .join(" · ");
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=${encodeURIComponent(reason)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=missing_code`, request.url));
  }

  try {
    const email = await handleOAuthCallback(code);
    return NextResponse.redirect(
      new URL(`/settings?gmail=connected&email=${encodeURIComponent(email)}`, request.url)
    );
  } catch (err) {
    console.error("[auth] Callback failed:", err);
    const reason = (err as { message?: string }).message ?? "OAuth callback failed.";
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=${encodeURIComponent(reason)}`, request.url));
  }
}