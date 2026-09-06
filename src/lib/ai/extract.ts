import { z } from "zod";
import { runObjectGeneration } from "./providers";
import { toFriendlyAiError, messageOf } from "./errors";
import type { ExtractedJob } from "@/types";

const extractionSchema = z.object({
  role: z.string(),
  company: z.string(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  hrEmail: z.string().optional(),
  hrName: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  salary: z.string().optional(),
  source: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

type ExtractionResult = z.infer<typeof extractionSchema>;

const SYSTEM_PROMPT = `You are a job posting parser. Extract job details from the given text or image.
Rules:
- role: the exact job title
- company: the company name
- skills: array of required skills/technologies
- experience: required years/level if mentioned
- hrEmail: the HR/recruiter email if present, else omit
- hrName: HR name if present, else omit
- location: job location if present
- isRemote: true only if explicitly stated as remote/WFH
- salary: range if mentioned, else omit
- source: where the post is from (e.g. "WhatsApp group", "LinkedIn", "Telegram")
- confidence: high if all key fields are clear, medium if some missing, low if very incomplete
Never fabricate an email address. If no email exists, leave hrEmail empty.
Return strict JSON.`;

export async function extractJobFromText(rawText: string): Promise<ExtractedJob> {
  const prompt = `Extract job details from this job post:\n\n${rawText.slice(0, 8000)}`;
  try {
    const result = await runObjectGeneration<ExtractionResult>({
      prompt,
      system: SYSTEM_PROMPT,
      schema: extractionSchema,
    });
    return {
      role: result.role,
      company: result.company,
      skills: result.skills ?? [],
      experience: result.experience,
      hrEmail: result.hrEmail,
      hrName: result.hrName,
      location: result.location,
      isRemote: result.isRemote ?? false,
      salary: result.salary,
      source: result.source,
      confidence: result.confidence ?? "medium",
    };
  } catch (error) {
    console.error("[extract] Failed:", error);
    throw toFriendlyAiError(error);
  }
}

export async function extractJobFromImage(
  imageBase64: string
): Promise<ExtractedJob> {
  const prompt = `You are parsing a screenshot of a job posting. Extract the job details from the attached image.`;
  try {
    const result = await runObjectGeneration<ExtractionResult>({
      prompt,
      system: SYSTEM_PROMPT,
      schema: extractionSchema,
      vision: true,
      image: imageBase64,
    });
    return {
      role: result.role,
      company: result.company,
      skills: result.skills ?? [],
      experience: result.experience,
      hrEmail: result.hrEmail,
      hrName: result.hrName,
      location: result.location,
      isRemote: result.isRemote ?? false,
      salary: result.salary,
      source: result.source,
      confidence: result.confidence ?? "medium",
    };
  } catch (error) {
    console.error("[extract] Vision failed:", error);
    throw new Error(
      messageOf(error).includes("429") || messageOf(error).toLowerCase().includes("quota")
        ? toFriendlyAiError(error).message
        : "Failed to extract from image. Check that your provider supports vision."
    );
  }
}