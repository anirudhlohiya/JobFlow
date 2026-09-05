import { runText } from "./providers";
import type { ExtractedJob } from "@/types";

const TAILOR_SYSTEM = `You are a professional resume writer specializing in LaTeX resumes.
Your job: rewrite a master LaTeX resume to emphasize the skills and experience most relevant
to a specific job description.

STRICT RULES:
1. NEVER fabricate experience, companies, skills, metrics, or projects.
2. You may rephrase existing content, reorder bullet points, and emphasize skills already present.
3. You may reword the summary to highlight matching skills.
4. You may add "Skills" keywords ONLY if they already exist elsewhere in the resume content.
5. Preserve the LaTeX template structure, formatting, and packages exactly.
6. Keep output valid LaTeX that compiles without errors.
7. Keep the resume at the same page count as the original (or fewer), never more.`;

export async function tailorResume(
  latexContent: string,
  job: Pick<ExtractedJob, "role" | "company" | "skills" | "experience">
): Promise<string> {
  const skillList = (job.skills ?? []).join(", ") || "not specified";
  const prompt = `Master LaTeX resume:
<resume>
${latexContent}
</resume>

Job details:
- Role: ${job.role || "unknown"}
- Company: ${job.company || "unknown"}
- Required skills: ${skillList}
- Experience required: ${job.experience || "not specified"}

Rewrite the resume to emphasize alignment with this job. Return ONLY the complete LaTeX source,
starting with \\documentclass and ending with \\end{document}. No markdown fences, no commentary.`;

  try {
    const result = await runText({ prompt, system: TAILOR_SYSTEM });
    return cleanLatexOutput(result);
  } catch (error) {
    console.error("[tailor] Failed:", error);
    throw new Error("Failed to tailor resume. Check your AI provider configuration.");
  }
}

function cleanLatexOutput(output: string): string {
  let cleaned = output.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:latex|tex)?\s*/i, "").replace(/```\s*$/m, "");
  // Guard: ensure documentclass begins the content
  const docclassIndex = cleaned.indexOf("\\documentclass");
  if (docclassIndex > 0) {
    cleaned = cleaned.slice(docclassIndex);
  }
  const endIndex = cleaned.lastIndexOf("\\end{document}");
  if (endIndex > 0) {
    cleaned = cleaned.slice(0, endIndex + "\\end{document}".length);
  }
  return cleaned;
}