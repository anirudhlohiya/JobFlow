import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/gmail/auth";

export async function POST() {
  await disconnectGmail();
  return NextResponse.json({ ok: true });
}