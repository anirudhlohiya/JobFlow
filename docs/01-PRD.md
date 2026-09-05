# Product Requirements Document (PRD)

**Product Name:** JobFlow
**Version:** 0.1.0 (MVP)
**Date:** September 2026
**Author:** Radhe

---

## 1. Problem Statement

Job seekers in India (and globally) follow job-posting WhatsApp groups, Telegram channels, and LinkedIn feeds. When they find a relevant post, the manual workflow is:

1. Read the post (text or screenshot) and identify the role, company, skills needed, and HR email
2. Tailor their resume to match the job description
3. Compose a professional email to the HR with the resume attached
4. Send at the right time (weekday morning)
5. Follow up after 2 days if no response
6. Track what was sent, when, and what happened

This process takes **20–45 minutes per application** and is repeated daily. It is time-consuming, error-prone, and emotionally draining. Multiple solutions exist for ATS portal applications, but none serve the email-based application workflow that dominates WhatsApp/Telegram job groups.

## 2. Target Users

### Primary (v1)
- Indian IT job seekers (freshers + experienced, 0–10 years)
- Following WhatsApp/Telegram job-posting groups
- Applying via **email** to HR contacts (not ATS portals)

### Secondary (v2+)
- Recruiters conducting cold outreach to candidates
- Freelancers/consultants pitching to HR contacts
- Anyone managing job applications at scale

### Persona
> **Rahul, 24**, Software Engineer with 2 years experience, actively job hunting.
> Follows 8 WhatsApp groups. Finds 3–5 relevant posts daily. Currently spends 2 hours/day on applications.
> Wants to apply to 10+ roles/day without burnout. Needs something that works with his LaTeX resume.

## 3. User Stories

### Job Application Flow
| ID | Story | Priority |
|---|---|---|
| US-01 | As a user, I want to paste a job post text and have the system extract role, company, skills, and HR email | Must |
| US-02 | As a user, I want to upload a screenshot/image of a job post and have the AI extract the same fields | Must |
| US-03 | As a user, I want to paste or upload multiple posts at once (batch mode) | Must |
| US-04 | As a user, I want to review/edit the extracted fields before proceeding | Must |
| US-05 | As a user, I want the system to tailor my LaTeX resume to match each job description | Must |
| US-06 | As a user, I want to preview the tailored resume as PDF before approving | Must |
| US-07 | As a user, I want the system to draft a professional email to the HR with the resume attached | Must |
| US-08 | As a user, I want to review and edit the email before approving | Must |
| US-09 | As a user, I want approved emails to be queued for optimal send time (9–11 AM IST weekday) | Must |
| US-10 | As a user, I want a follow-up email drafted automatically after 2 days (same thread) | Must |
| US-11 | As a user, I want to review and approve follow-ups before they send | Must |
| US-12 | As a user, I want a dashboard showing all applications with status and countdowns | Must |

### Cold Outreach Flow
| ID | Story | Priority |
|---|---|---|
| CO-01 | As a user, I want to upload an Excel/CSV of HR contacts with columns: name, email, company, role | Must |
| CO-02 | As a user, I want the system to generate personalized cold emails per contact | Must |
| CO-03 | As a user, I want to set a daily sending cap (default 50) | Must |
| CO-04 | As a user, I want built-in safety: the cap ramps up from 10→50 over 3 weeks | Must |
| CO-05 | As a user, I want to review cold email drafts in bulk before approving a campaign | Must |
| CO-06 | As a user, I want automatic follow-ups on cold outreach (2-day gap, max 2 follow-ups) | Should |
| CO-07 | As a user, I want reply detection (auto-stop sequence when HR replies) | Should |

### Configuration
| ID | Story | Priority |
|---|---|---|
| CF-01 | As a user, I want to enter my API keys for OpenAI / Anthropic / Gemini / Groq | Must |
| CF-02 | As a user, I want to choose which provider and model to use | Must |
| CF-03 | As a user, I want to connect my Gmail via OAuth (one-click browser flow) | Must |
| CF-04 | As a user, I want to upload my master LaTeX resume (.tex file) | Must |
| CF-05 | As a user, I want to configure send window (default 9–11 AM IST) | Must |
| CF-06 | As a user, I want to set follow-up interval (default 2 days) | Must |

## 4. Feature Specifications

### 4.1 Job Post Ingestion
- **Text input:** Multi-line text area supporting paste from WhatsApp/LinkedIn
- **Image upload:** Drag-and-drop or file picker; supports PNG, JPG, WEBP; multi-image batch
- **Mixed mode:** Users can paste text AND upload images in the same session
- **Batch processing:** System processes all inputs and presents a queue of extracted applications
- **OCR/Vision:** Images sent directly to vision-capable LLM (no separate OCR needed)

### 4.2 AI Extraction
- **Input:** Raw text or image
- **Output (structured JSON):**
  - `role`: Job title
  - `company`: Company name
  - `skills`: Array of required skills/technologies
  - `experience`: Required experience level
  - `hrEmail`: Recruiter/HR email address
  - `hrName`: HR name (if present)
  - `location`: Job location
  - `remote`: boolean
  - `salary`: Salary range (if mentioned)
  - `source`: Where the post came from
- **Validation:** User can edit every field before proceeding
- **Fallback:** If extraction confidence is low, system flags for manual review

### 4.3 Resume Tailoring
- **Input:** Master .tex resume + extracted JD
- **Processing:**
  1. AI analyzes JD requirements against resume content
  2. Rewrites summary, skills section, and bullet points to emphasize relevance
  3. **Strict honesty rule:** Never fabricates experience, companies, or metrics
  4. Preserves LaTeX template structure and formatting
- **Output:** Tailored .tex file + compiled PDF preview
- **Compilation:** Tectonic runs locally; single-binary, downloads packages on first run
- **Page check:** If PDF exceeds page limit (configurable, default: 1 page), AI compresses

### 4.4 Email Drafting
- **Input:** Extracted JD + resume highlights + template choice
- **Output:**
  - Subject line (role-specific, personalized)
  - Email body (concise, professional, references specific JD requirements)
  - Attachment: tailored resume PDF
- **Template system:** See [07-TEMPLATE-LIBRARY.md](07-TEMPLATE-LIBRARY.md)
- **Anti-spam:** Each email is AI-unique (no two identical bodies)

### 4.5 Review & Approve
- **Screen:** One screen showing extracted fields + email preview + resume PDF
- **Edit capability:** User can modify any field, email text, or resume
- **Approve button:** Moves application to send queue
- **Reject button:** Discards application with optional notes

### 4.6 Send Scheduling
- **Default window:** Weekday 9–11 AM IST
- **Configurable:** User can override send window in settings
- **Queue:** Approved applications sorted by priority and scheduled for next available window
- **Same-thread follow-ups:** Uses Gmail API threading (In-Reply-To headers)
- **Timezone:** IST by default, configurable

### 4.7 Cold Outreach Engine
- **Input:** CSV/Excel with columns: name, email, company, role_applied, notes (optional)
- **Processing:**
  1. AI generates a unique cold email per contact using templates
  2. Each email references the company and role specifically
  3. Attachments: master resume PDF (not tailored per cold contact)
- **Safety rails:**
  - Day 1: max 10 emails
  - Day 7: max 20 emails
  - Day 14: max 35 emails
  - Day 21+: max 50 emails (configurable cap)
  - Forced personalization: no two emails have identical body text
  - Unique subject lines per contact
- **Follow-ups:** 2 follow-ups max, 2-day intervals, stops on reply
- **Compliance:** Includes unsubscribe option for cold emails

### 4.8 Application Tracker Dashboard
- **Views:**
  - All applications table (sortable, filterable)
  - Status badges: Draft, Queued, Sent, Follow-up Pending, Replied, Archived
  - "Sending Today" section
  - "Follow-ups Due" section
- **Per-application detail:** Original post, extracted JD, resume versions, email logs, thread status
- **Stats:** Total sent, response rate, interview callbacks (manual tag)

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Latex compilation** | < 10 seconds per resume |
| **AI extraction** | < 15 seconds (text), < 20 seconds (image) |
| **Email draft generation** | < 10 seconds |
| **Batch processing** | 10 posts in < 2 minutes |
| **Database** | SQLite, zero-config, local file |
| **API keys** | AES-256-GCM encrypted at rest |
| **Gmail OAuth tokens** | Encrypted at rest, never sent to client |
| **Send rate limit** | Enforced per-user; cannot be overridden |
| **Uptime** | Local app; no server dependency |

## 6. Out of Scope (v1)

- ATS portal auto-fill (Greenhouse, Workday, LinkedIn Easy Apply)
- Job board scraping / discovery
- Multi-user / team features
- Hosted SaaS deployment
- Mobile app
- WhatsApp/Telegram bot integration
- Cover letter generation (can add later)
- Interview scheduling

## 7. Success Metrics (personal use v1)

| Metric | Target |
|---|---|
| Applications per day | 10+ (up from 3–5 manual) |
| Time per application | < 3 minutes review (down from 20–45 min) |
| Follow-up rate | 100% of eligible applications |
| Inbox placement | > 90% (monitored via inbox checks) |
| Interview callbacks | Track manually; baseline established in month 1 |
