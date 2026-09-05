import { NextRequest } from "next/server";
import { extractJobFromImage } from "@/lib/ai/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageBase64 = body?.image as string; // "data:image/png;base64,...."
    const mimeType = body?.mimeType as string;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const base64Data = imageBase64.includes("base64,")
      ? imageBase64
      : `data:${mimeType ?? "image/png"};base64,${imageBase64}`;

    const job = await extractJobFromImage(base64Data, mimeType ?? "image/png");

    return new Response(JSON.stringify({ job }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[extract] Image error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Image extraction failed." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}