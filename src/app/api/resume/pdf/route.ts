import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) {
    return new Response("Missing path", { status: 400 });
  }

  const resolved = path.resolve(filePath);
  const outputDir = path.resolve(process.cwd(), "data", "output");
  if (!resolved.startsWith(outputDir)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const data = fs.readFileSync(resolved);
    return new Response(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("PDF not found", { status: 404 });
  }
}