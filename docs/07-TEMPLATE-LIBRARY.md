# Template Library

**Email templates with `{{variable}}` slots. The app personalizes every email body via AI so no two emails are identical — these are structural guides, not copy-paste scripts.**

---

## Usage Notes

- Every template is a **structure**, not final text
- The AI fills variables and rewrites wording per recipient — **no two sent emails are identical**
- Max 1–2 lines per paragraph. Plain text. No HTML tables or images.
- Attachments: always the tailored resume PDF (application emails) or master resume PDF (cold outreach).
- Templates live in `src/lib/ai/draft.ts` and are editable.

---

## SECTION A: Job Application Emails

Used when applying to a specific posted role (WhatsApp/LinkedIn post → email to HR).

### A1. Applying to an Explicitly-Posted Role (most common)

```
Subject: Application for {{role}} — {{company}}

Dear {{hrName}},

I'm applying for the {{role}} position at {{company}} as posted
{{source}}. Your post mentioned a need for {{topSkills}}, which
maps directly to my recent work {{keyProjectOrMetric}}.

Attached is my resume. {{customLine1_fitStatement}}

I'm available to interview this week and happy to do an assignment
or coding test. Thanks for your consideration.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}
```

**Variables:**
- `{{role}}`, `{{company}}` — extracted from job post
- `{{hrName}}` — HR name if present in post (else "Hiring Team")
- `{{source}}` — "in the WhatsApp group", "on LinkedIn", "on your job posting"
- `{{topSkills}}` — top 3 skills from the JD (AI-selected)
- `{{keyProjectOrMetric}}` — one concrete achievement from your resume that matches (e.g., "scaling a Django API to 50k requests/day")
- `{{customLine1_fitStatement}}` — AI-generated sentence explaining your fit
- `{{yourName}}`, `{{yourPhone}}`, `{{yourLinkedin}}` — from config

**Success note:** 1st line states the role + where you saw it (proves relevance). 2nd line shows one concrete match. Short. Direct.

---

### A2. Applying When No Email Address Given (role has external portal)

```
Subject: Application for {{role}} at {{company}}

Dear {{company}} Hiring Team,

I'm reaching out regarding the {{role}} opening at {{company}}.
I saw the post on {{source}} and my experience covering
{{topSkills}} aligns with the requirements.

I've attached my resume and a tailored summary of my most relevant
work. If the role is still open, I'd welcome the chance to discuss
how I can contribute.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}
```

---

### A3. Quick Application (short post, minimal info, generic HR email)

```
Subject: {{role}} application — {{yourName}}

Dear {{hrName}},

I'm interested in the {{role}} role you posted for {{companyLabel}}.
I have {{yearsExperience}} years of experience, primarily in
{{primaryStack}}, and recently {{keyProjectOrMetric}}.

Resume attached. Available for interview anytime.

Best regards,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}
```

---

### A4. Follow-Up After Application (2 days, same thread)

```
Subject: Re: Application for {{role}} — {{company}}

Dear {{hrName}},

Just following up on my application for the {{role}} position I
sent earlier. I wanted to confirm you received it and that I'm
still very interested in the opportunity.

If there's any additional information or samples you'd like from
me, I'm happy to provide them right away.

Best,
{{yourName}}
{{yourPhone}}
```

---

### A5. Final Follow-Up (day 6, gentle close)

```
Subject: Re: {{role}} application — {{company}}

Dear {{hrName}},

I'm closing the loop on my {{role}} application from earlier this
week in case the position has been filled — just wanted to make
sure I didn't miss any updates from your side.

If not, thanks for your time and I hope we connect in the future.

Best,
{{yourName}}
{{yourPhone}}
```

---

## SECTION B: Cold Outreach Emails (to HR lists)

Used in the Cold Outreach Module (upload contacts.csv). Each body is AI-personalized per company/contact so no two are identical.

### B1. Initial Cold Email — Generic HR

```
Subject: {{role}} fit at {{company}}

Dear {{hrName}},

I came across {{company}} and noticed {{companyDetail}}.
{{companyDetail2}}

I'm a {{yourRole}} with {{yearsExperience}} years experience,
primarily in {{primaryStack}}. I recently {{keyProjectOrMetric}}.

I'd like to introduce myself for any current or upcoming {{role}}
openings at {{company}}. My resume is attached.

Hoping to connect.

Best,
{{yourName}}
{{yourPhone}}
{{yourLinkedin}}
```

**Key difference from A1:** The contact did NOT post a job. So you must show why THIS company — 1–2 lines of genuine company research (from their website/LinkedIn/news). This is what converts "spam" into an intro.

---

### B2. Cold Email — Referencing a Mutual Connection or Shared Interest

```
Subject: Introduction — {{yourRole}} via {{mutualContact}}

Dear {{hrName}},

{{mutualContactName}} suggested I reach out regarding your team at
{{company}}.

I work in {{yourRole}} with focus on {{primaryStack}}. One recent
project was {{keyProjectOrMetric}} which is relevant to how
{{company}} serves {{theirClientsType}}.

Thought it might be worth a quick chat about current or future
roles. Resume attached.

Best,
{{yourName}}
```

**Note:** Only use `{{mutualContactName}}` if you genuinely have one. Never fabricate a referrer — it will be caught and burn a bridge.

---

### B3. Cold Email — When You Have a Specific Portfolio Piece

```
Subject: {{projectHighlight}} at {{company}}

Dear {{hrName}},

I built {{specificProject}} — {{projectOneLine}}. I noticed
{{company}} is doing {{companyRelevantWork}}, which overlaps with
the skills involved.

I'm a {{yourRole}} looking for opportunities at companies like
{{company}}. Here's what I'd bring to a {{roleApplied}} role:

- {{skillOrProject1}}
- {{skillOrProject2}}
- {{skillOrProject3}}

Resume and links attached. Would love to connect.

Best,
{{yourName}}
```

---

### B4. Cold Follow-Up 1 (2 days after initial)

```
Subject: Re: {{role}} fit at {{company}}

Dear {{hrName}},

Quick follow-up on the note I sent about a {{role}} opportunity at
{{company}}. Wondering if you had a chance to look or if there are
existing timelines I should consider.

Happy to answer any questions or provide more context.

Best,
{{yourName}}
```

---

### B5. Cold Follow-Up 2 (final, day 6)

```
Subject: Re: {{role}} fit at {{company}}

Dear {{hrName}},

Last follow-up on my earlier messages — I understand you're busy,
so I'll keep this out of your inbox after today. If a need for
{{role}} opens up at {{company}}, I'd welcome being considered.

Thanks for your time either way.

Best,
{{yourName}}
{{yourLinkedin}}
```

---

## SECTION C: Anti-Spam Compliance Lines

Append to cold outreach emails (B-section) when required:

```
# At the end of the body:
If you'd like to connect on LinkedIn instead: {{yourLinkedin}}

# Opt-out (if legal jurisdiction requires):
Reply REMOVE to stop future emails.
```

---

## SECTION D: Subject Line Playbook

### By Scenario

| Scenario | Pattern | Example |
|---|---|---|
| Applying to posted role | `Application for {{role}} — {{company}}` | "Application for Backend Dev — Acme Corp" |
| Used HR name | `{{role}} — {{hrName}}` | "Frontend role — Ms. Mehta" |
| Cold outreach | `{{role}} fit at {{company}}` | "Data Engineer fit at Fluxly" |
| Cold w/ project hook | `{{projectName}} → {{company}}` | "Inventory Pipeline → Snapcart" |
| First follow-up | `Re: {{original subject}}` | "Re: Application for Backend Dev — Acme" |
| Second follow-up | `Re: {{original subject}}` | "Re: Application for Backend Dev — Acme" (keep same) |

### Rules
- Max 6 words
- No `!`, no ALL CAPS, no emojis, no punctuation spam
- Lowercase function words: "for", "at", "in", "to" — Title Case otherwise
- Never "URGENT", "QUICK QUESTION" (these are automated-sender fingerprints)

---

## SECTION E: AI Personalization Rules (Enforced in Code)

```
Personalization Rules:
  1. The word "you"/"your" must appear (1 or more times)
  2. Company name must appear (1 or more times)
  3. Role name must appear (1 or more times)
  4. Two consecutive sentences may not share the first 8 words
  5. Token budget: 120-180 words per body
  6. Every recipient gets a unique body (Levenshtein distance > 0.5)
  7. Never fabricate: no fake metrics, no fake referrers, no fake
     experience levels
  8. For cold outreach: include 1-2 lines of real company context
```

---

## SECTION F: Template File Management

Templates are stored in source as structured objects so AI can compose from them:

```typescript
type Template = {
  id: string;
  name: string;
  category: 'application' | 'cold' | 'followup';
  subject: string[];      // subject-line variants
  body: string[];         // body variants
  variables: string[];    // required variables
  rules: string[];        // personalization rules (Section E)
};
```

**Roadmap:** v2 adds a Templates UI (Settings → Templates) where users can add/edit templates without touching code.