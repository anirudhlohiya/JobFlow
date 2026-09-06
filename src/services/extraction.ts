import { apiFetch } from "@/lib/api";
import type { ExtractedJob } from "@/types";

export function extractFromText(text: string): Promise<{ job: ExtractedJob; rawText: string }> {
  return apiFetch<{ job: ExtractedJob; rawText: string }>("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function extractFromImage(
  imageBase64: string,
  mimeType?: string
): Promise<{ job: ExtractedJob }> {
  return apiFetch<{ job: ExtractedJob }>("/api/extract/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, mimeType }),
  });
}