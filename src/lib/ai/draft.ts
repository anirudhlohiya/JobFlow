import { runText } from "./providers";
import { toFriendlyAiError } from "./errors";
import type { ExtractedJob, UserConfig } from "@/types";

export interface Template {
  id: string;
  name: string;
  category: "application" | "cold" | "followup";
  subject: string[];
  body: string[];
  variables: string[];
  rules: string[];
}

export const templates: Record<string, Template> = {
  a1_apply_posted_role: {
    id: "a1_apply_posted_role",
    name: "A1. Applying to an Explicitly-Posted Role",
    category: "application",
    subject: ["Application for {{role}} — {{company}}"],
    body: [
      `Dear {{hrName}},

I'm applying for the {{role}} position at {{company}} as posted {{source}}. Your post mentioned a need for {{topSkills}}, which maps directly to my recent work {{keyProjectOrMetric}}.

Attached is my resume. {{fitStatement}}

I'm available to interview this week and happy to do an assignment or coding test. Thanks for your consideration.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}`,
    ],
    variables: ["role", "company", "hrName", "source", "topSkills", "keyProjectOrMetric", "fitStatement", "yourName", "yourPhone", "yourLinkedin"],
    rules: [
      "The word you/your must appear at least once",
      "Company name must appear at least once",
      "Role name must appear at least once",
      "Concise: 100-180 words",
      "Never fabricate metrics or experience",
    ],
  },
  a2_no_email_portal: {
    id: "a2_no_email_portal",
    name: "A2. Applying When No Email Address Given",
    category: "application",
    subject: ["Application for {{role}} at {{company}}"],
    body: [
      `Dear {{company}} Hiring Team,

I'm reaching out regarding the {{role}} opening at {{company}}. I saw the post on {{source}} and my experience covering {{topSkills}} aligns with the requirements.

I've attached my resume and a tailored summary of my most relevant work. If the role is still open, I'd welcome the chance to discuss how I can contribute.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}`,
    ],
    variables: ["role", "company", "source", "topSkills", "yourName", "yourPhone", "yourLinkedin"],
    rules: ["Company name must appear", "Role name must appear", "100-150 words"],
  },
  a3_quick_application: {
    id: "a3_quick_application",
    name: "A3. Quick Application (short post)",
    category: "application",
    subject: ["{{role}} application — {{yourName}}"],
    body: [
      `Dear {{hrName}},

I'm interested in the {{role}} role you posted for {{companyLabel}}. I have {{yearsExperience}} years of experience, primarily in {{primaryStack}}, and recently {{keyProjectOrMetric}}.

Resume attached. Available for interview anytime.

Best regards,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}`,
    ],
    variables: ["role", "hrName", "companyLabel", "yearsExperience", "primaryStack", "keyProjectOrMetric", "yourName", "yourPhone", "yourLinkedin"],
    rules: ["Role name must appear", "Concise: under 100 words"],
  },
  a4_followup: {
    id: "a4_followup",
    name: "A4. Follow-Up After Application (2 days)",
    category: "followup",
    subject: ["Re: Application for {{role}} — {{company}}"],
    body: [
      `Dear {{hrName}},

Just following up on my application for the {{role}} position I sent earlier. I wanted to confirm you received it and that I'm still very interested in the opportunity.

If there's any additional information or samples you'd like from me, I'm happy to provide them right away.

Best,
{{yourName}}
{{yourPhone}}`,
    ],
    variables: ["role", "company", "hrName", "yourName", "yourPhone"],
    rules: ["Short: under 80 words", "One question max", "Polite and brief"],
  },
  a5_final_followup: {
    id: "a5_final_followup",
    name: "A5. Final Follow-Up (day 6, gentle close)",
    category: "followup",
    subject: ["Re: {{role}} application — {{company}}"],
    body: [
      `Dear {{hrName}},

I'm closing the loop on my {{role}} application from earlier this week in case the position has been filled — just wanted to make sure I didn't miss any updates from your side.

If not, thanks for your time and I hope we connect in the future.

Best,
{{yourName}}
{{yourPhone}}`,
    ],
    variables: ["role", "company", "hrName", "yourName", "yourPhone"],
    rules: ["Very short: under 70 words", "Gracious tone", "No further questions"],
  },
  b1_cold_hr: {
    id: "b1_cold_hr",
    name: "B1. Initial Cold Email — Generic HR",
    category: "cold",
    subject: ["{{role}} fit at {{company}}"],
    body: [
      `Dear {{hrName}},

I came across {{company}} and noticed {{companyDetail}}.{{companyDetail2}}

I'm a {{yourRole}} with {{yearsExperience}} years experience, primarily in {{primaryStack}}. I recently {{keyProjectOrMetric}}.

I'd like to introduce myself for any current or upcoming {{role}} openings at {{company}}. My resume is attached.

Hoping to connect.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}`,
    ],
    variables: ["role", "company", "hrName", "companyDetail", "companyDetail2", "yourRole", "yearsExperience", "primaryStack", "keyProjectOrMetric", "yourName", "yourPhone", "yourLinkedin"],
    rules: [
      "Include 1-2 lines of genuine company context",
      "Company name must appear",
      "Role name must appear",
      "120-180 words",
      "Never fabricate company research",
      "No emojis, no exclamation marks in subject",
    ],
  },
};

export interface DraftContext {
  job: Pick<ExtractedJob, "role" | "company" | "hrEmail" | "hrName" | "skills" | "experience" | "source" | "location">;
  user: UserConfig["user"];
  resumeHighlights?: string;
  templateId?: string;
  followUpNumber?: number;
  isFollowUp?: boolean;
}

export async function draftEmail(context: DraftContext): Promise<{ subject: string; body: string; templateId: string }> {
  const templateId =
    context.templateId ??
    (context.isFollowUp
      ? context.followUpNumber && context.followUpNumber > 1
        ? "a5_final_followup"
        : "a4_followup"
      : context.job.hrEmail
        ? "a1_apply_posted_role"
        : "a2_no_email_portal");

  const template = templates[templateId] ?? templates.a1_apply_posted_role;

  const prompt = buildDraftPrompt(template, context);
  const system = buildDraftSystem(template);

  try {
    const output = await runText({ prompt, system });
    return parseDraftOutput(output, templateId);
  } catch (error) {
    console.error("[draft] Failed:", error);
    throw toFriendlyAiError(error);
  }
}

function buildDraftSystem(template: Template): string {
  return `You write concise, professional job-application emails.
Use this structural template (fill the {{variables}} with real values from the provided context):

${template.body.join("\n\n---\n\n")}

Subject line pattern: ${template.subject[0]}

RULES:
${template.rules.map((r) => `- ${r}`).join("\n")}
- Plain text only, no HTML.
- Max 1-2 lines per paragraph.
- No phrases like "I hope this email finds you well", "Dear Sir/Madam".
- Return output exactly in this format:
SUBJECT: <subject line>
---
<body text>`;

}

function buildDraftPrompt(template: Template, ctx: DraftContext): string {
  const j = ctx.job;
  const topSkills = j.skills?.slice(0, 3).join(", ") || "the required skills";
  return `Write the email using these real values:

- role: ${j.role || "this role"}
- company: ${j.company || "this company"}
- hrName: ${j.hrName || "Hiring Team"}
- source: ${j.source ? `in the ${j.source}` : "in the job posting"}
- topSkills: ${topSkills}
- experience: ${j.experience || "not specified"}
- location: ${j.location || "not specified"}
- yourName: ${ctx.user.name}
- yourPhone: ${ctx.user.phone}
- yourLinkedin: ${ctx.user.linkedin}

Resume highlights (use one concrete, existing achievement — never invent): ${ctx.resumeHighlights || "use nothing specific; keep generic but sincere"}

Template: ${template.id}

Follow the subject pattern and body structure. Fill every {{variable}} with a real value from above.`;
}

function parseDraftOutput(
  output: string,
  templateId: string
): { subject: string; body: string; templateId: string } {
  const subjectMatch = output.match(/^SUBJECT:\s*(.+)$/m);
  const subject = (subjectMatch?.[1] ?? "").trim();

  const bodySeparator = output.indexOf("---");
  const body = (bodySeparator >= 0
    ? output.slice(bodySeparator + 3).trim()
    : output.replace(/^SUBJECT:\s*.+\n?/m, "").trim()
  ).trim();

  return { subject, body, templateId };
}