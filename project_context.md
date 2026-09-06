# JobFlow — Project Context (give this file to any AI to pick up full state)

> Handoff document. Covers everything about the JobFlow project as of the last session so a fresh AI session (or another model) can continue without re-discovering the codebase.
> **Last updated:** Sun Sep 06 2026. **Latest commit:** `666f699` on `main`, pushed to GitHub (this session's changes are committed in the commits listed in §2).

---

## 1. What this project is

**JobFlow** is a single-user Next.js web app that automates the job-application workflow for its owner (Anirudh Lohiya):

1. **Ingest a job post** — paste text or upload a screenshot → AI extracts structured job details.
2. **Tailor the resume** — AI rewrites the user's master LaTeX resume (`main.tex`) for the specific role.
3. **Compile the PDF** — locally via **Tectonic** (XeTeX engine).
4. **Draft the email** — AI writes a personalized application email (with resume attached).
5. **Review + approve** — a review screen shows subject, body, PDF preview; user approves or cancels.
6. **Queue in Gmail itself** — approving creates a **real Gmail draft** (subject, body, and the tailored resume PDF are pre-filled) via the Gmail API. The app **never sends email itself** and does not need to be running at send time.
7. **Optional auto-send (handsfree)** — if the user optionally deploys the bundled Google Apps Script (`scripts/gmail-scheduler/Code.gs`) and pastes its URL/token into Settings, approvals are *also* scheduled to send automatically from Google's cloud at the next send-window time (computed in the user's timezone).

Phase 1 (this core) is **code-complete**. The Gmail side needs two one-time, user-side actions to go fully live: (a) register the OAuth redirect URI in Google Cloud Console (see §10 blocker), and (b) optionally deploy the Apps Script for true auto-send. Phase 2 (cold outreach/CRM, deliverability, dashboard analytics) is documented in `docs/08-ROADMAP.md` — not built yet.

---

## 2. Repo / git state

- **Workspace root:** `E:\Radhe\email automation` (note the SPACE — it broke Tectonic arg quoting once, see section 11).
- **Remote:** `https://github.com/anirudhlohiya/JobFlow.git` (user `anirudhlohiya`, email `anirudhlohiya999@gmail.com`).
- **Branch:** `main`. Package name in `package.json` is `jobflow`.
- **Commit history (newest first):**
  - Session 2 commits (Gmail-queue architecture + MVVM refactor + error surface work):
    - `a4222db` — feat: queue emails as real Gmail drafts, surface OAuth errors, MVVM refactor (approve → Gmail draft, scheduler no longer auto-sends, services + ViewModels, error surfaces, schema `gmailDraftId`, deleted `send.ts` + test data)
  - `666f699` — fix: PDF/send pipeline, vision extraction, profile save, tz math (previous HEAD)
  - `0bd4ae2` — fix: update Gemini defaults to gemini-3.6-flash, wire DEFAULT_LLM_MODEL env
  - `7e29bc0` — feat: add npm run doctor
  - `bae1e9f` — fix: preserve follow-up count on approve
  - `4b8c676` — feat: JobFlow Phase 1 — core application engine
- **CRITICAL GitHub rule:** secret-scanning is ACTIVE on the repo. Any push containing a real secret (e.g. `GOCSPX-…` client secret, `AIza…` API key) is REJECTED. Never commit real values; `.env`, `dev.db`, `dev-server.log`, `error_logs.txt` are gitignored.

---

## 3. How to run

```bash
npm install          # deps already installed
npm run dev          # dev server on http://localhost:3000 (Turbopack)
npm run build        # production build (verified green)
npm start            # prod server
npm run lint         # eslint — currently 0 errors / 0 warnings
npx tsc --noEmit     # typecheck — currently clean
npm run doctor       # env readiness check (scripts/doctor.js)
```

Dev server is usually left running detached (`Start-Process`). Scheduler logs `[scheduler] Started — drafting follow-ups into Gmail when due.` on boot.

**Windows/PowerShell 5.1 notes:** `Invoke-WebRequest -Form` does not exist (use `curl.exe` or Node for multipart); some PowerShell test scripts failed for that reason only. Em-dash prints as `�??` in the console (encoding only, not data).

---

## 4. Environment / configuration (NO real values in this doc)

- `DATABASE_URL="file:./dev.db"` → **`dev.db` lives at PROJECT ROOT** (not `prisma/`).
- `ENCRYPTION_KEY` = **64 hex chars (32 bytes)** AES-256-GCM.
- `GEMINI_API_KEY` set; active LLM provider is Google, model **`gemini-3.6-flash`** (`DEFAULT_LLM_PROVIDER`/`DEFAULT_LLM_MODEL`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set. `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback` — **must be registered exactly as an Authorized redirect URI in Google Cloud Console** (currently NOT registered → `redirect_uri_mismatch`, see §10).
- `TECTONIC_PATH=C:\tools\Tectonic\tectonic.exe` (installed v0.17.0, NOT on PATH).
- `config/user.config.yaml` (gitignored): if missing, falls back to `config/user.config.example.yaml` (placeholder profile, 9–11 IST send window). DB `Setting` rows (`user_name`, `user_email`, …) **overlay** config via `src/lib/profile.ts` `getUserProfile()` (DB wins) — this is what makes Settings → Save Profile work.
- Settings `Setting`-table keys: AI keys (`llm_provider`, `llm_model`, `llm_key_*` — encrypted at rest), Gmail tokens (encrypted), profile (`user_*`), and now **`gmail_scheduler_url` + `gmail_scheduler_token`** (Apps Script web app config).

---

## 5. Tech stack + architecture (locked decisions)

- Next.js **16.3.4**, App Router, **Turbopack**, React 19, TypeScript. Tailwind v4 + **Geist** design tokens (`src/app/globals.css`).
- shadcn/ui **base-ui**: `Button` uses `render={<Link/>}`/`render={<a/>}` — **no `asChild`; pass `nativeButton={false}`** when rendering a non-`<button>`.
- **Prisma 7.10 + SQLite** via `@prisma/adapter-better-sqlite3`; generated client at `src/generated/prisma`; import from **`@/generated/prisma/client`**, never `@prisma/client`.
- AI SDK (google/openai/anthropic/groq); google provider model **`gemini-3.6-flash`**.
- googleapis (Gmail drafts + OAuth2), node-cron, zod, js-yaml.
- **MVVM (pragmatic, applied this session):**
  - **Views** = pages + components in `src/app/*` and `src/components/*`.
  - **ViewModels** = per-feature hooks in `src/features/*/use*ViewModel.ts` (state + actions + load; pages are thin and call `vm.*`).
  - **Service/Model layer** = typed API clients in `src/services/*` (`applications.ts`, `resume.ts`, `email.ts`, `extraction.ts`, `settings.ts`) built on one error-shaping helper **`src/lib/api.ts`** (`apiFetch` throws `ApiError{status,message}`; every route returns `{error}` on failure).
  - Client-safe shared status labels in **`src/lib/status.ts`** (`STATUS_LABELS`, `statusLabel`, `isGmailQueued`, `DRAFTS_URL`).

---

## 6. Prisma specifics (the foot-guns)

- Datasource in `prisma/schema.prisma` has **no `url`**; connection lives in **`prisma7.config.ts`** (`defineConfig({ datasource: { url, adapter: new PrismaBetterSqlite3({...}) } })`).
- Migrations: init (`20260905152156`) + **`20260905211846_add_gmail_draft_id`** (adds `Application.gmailDraftId String?`). Re-sync client with `npx prisma generate`.
- `dev.db` at root; `next.config.ts` sets `serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"]`.

### Data model (5 tables)
- **Setting** `id, key(unique), value, isEncrypted, createdAt, updatedAt`
- **Resume** `id, name, latexContent, isDefault, createdAt, updatedAt` ↔ Applications (`resumeId`)
- **Application** `id, company, role, hrEmail?, hrName?, skills(JSON string), experience?, location?, isRemote, salary?, source?, sourceRawText?, sourceImage?, resumeId?, tailoredLatex?, tailoredPdfPath?, **gmailDraftId?**, emailSubject?, emailBody?, emailTemplate?, status(DRAFT|PENDING_REVIEW|QUEUED|**QUEUED_IN_GMAIL**|SENT|FOLLOW_UP_PENDING|FOLLOWED_UP|REPLIED|ARCHIVED), scheduledSendAt?, sentAt?, followUpAt?, followUpCount(0), maxFollowUps(2), isColdOutreach, contactId?, …` + indexes (status, scheduledSendAt)
- **EmailLog** `id, applicationId→Application, type, gmailMessageId?, gmailThreadId?, status, sentAt?`
- **Contact** `id, name, email, company, roleApplied?, notes?, emailSentCount, lastSentAt?, status(NEW)`

---

## 7. API routes (all `runtime="nodejs"`)

| Route | Method | Notes |
|---|---|---|
| `/api/extract` | POST | `{text}` → `{job, rawText}` |
| `/api/extract/image` | POST | `{image: dataURL, mimeType}` → `{job}` (vision; actually sends image part) |
| `/api/email/draft` | POST | `{job:{...}, resumeHighlights?, templateId?, isFollowUp?, followUpNumber?}` → `{subject, body, templateId}` |
| `/api/applications` | GET/POST | list/lookup; create `{company, role, ...}` → 201 |
| `/api/applications/[id]` | GET/PATCH/DELETE | PATCH persists all fields incl. tailored + email; DELETE now also deletes the Gmail draft |
| `/api/applications/[id]/approve` | POST | **Requires Gmail connected** (else 400 with friendly message) + hrEmail/emailSubject/emailBody; creates **real Gmail draft** via `draft.ts`, sets `QUEUED_IN_GMAIL` + `gmailDraftId` (+ `scheduledSendAt` if Apps Script scheduler configured), writes `EmailLog(DRAFT_SCHEDULED|DRAFT_CREATED)` → `{application, draft:{draftId, draftUrl, autoScheduled, scheduledSendAt}}` |
| `/api/applications/[id]/cancel` | POST | deletes the Gmail draft (best-effort), → `DRAFT`, clears `scheduledSendAt`/`gmailDraftId` |
| `/api/resume` | GET | `{resumes}` |
| `/api/resume/upload` | POST | multipart `file`+`isDefault`; validates `\documentclass`; saves DB + `data/resume/<name>` |
| `/api/resume/tailor` | POST | `{resumeId, job:{role,company,skills[],experience}}` → `{tailoredLatex}` |
| `/api/resume/compile` | POST | `{latex, outputName?}` → `{pdfPath, pdfBase64}` via Tectonic (maxDuration 300) |
| `/api/resume/pdf` | GET | serves PDF inline; 403 unless path under `<cwd>/data/output` |
| `/api/auth/google` | GET | start OAuth flow |
| `/api/auth/google/callback` | GET | **forwards the real Google error + `error_description`** to `/settings?gmail=error&reason=…`; success → `/settings?gmail=connected&email=…` |
| `/api/auth/google/disconnect` | POST | removes tokens (disconnect is now POST; page uses it) |
| `/api/settings` | GET/PATCH | GET now also returns `gmail.redirectUri` + `gmail.hasCredentials` for the setup guide |

Pages: `/` (dashboard; shows Gmail-disconnected banner, "Gmail Drafts" card with countdown-or-"in Gmail", no fake queue), `/new` (wizard, error banner instead of `alert()`), `/applications` (list, `QUEUED_IN_GMAIL` filter), `/applications/[id]` (review + "Queue in Gmail" + cancel + logs), `/settings` (real OAuth error reason + redirect-URI setup guide + **Gmail Scheduler fields**), `/outreach` (Phase-2 teaser). Global `src/app/error.tsx` boundary renders any uncaught error.

---

## 8. Key flows (how the pieces connect)

- **Wizard** (`/new`): `IngestionStep` (text/image → `/api/extract{,/image}`) → `ExtractionReviewStep` (edit fields) → save via `POST /api/applications` (DRAFT) → `ResumeEmailStep` (`/api/resume/tailor` → `/api/resume/compile` → `/api/email/draft` → PATCH persists everything, status `PENDING_REVIEW`) → `ApproveStep` (load app; "Approve & Queue in Gmail"). All steps use services + `apiFetch`, show errors inline, no `alert()`.
- **Approval** (`src/lib/gmail/draft.ts`): `createGmailDraft()` builds the same MIME as the old sender (`src/lib/gmail/mime.ts`, shared) → `gmail.users.drafts.create` with the PDF attached → then, if `gmail_scheduler_url` + `gmail_scheduler_token` are set in Settings, it POSTs a `schedule_send` payload to the **Google Apps Script** web app (`scripts/gmail-scheduler/Code.gs`) which creates a one-time time-based trigger to send from Gmail's cloud at `getNextSendTime()`. Nothing runs locally at send time.
- **Scheduler** (`src/lib/scheduler.ts`, booted from `instrumentation.ts` when `NEXT_RUNTIME==="nodejs"`): now does **NOT send anything at all**. Every minute it finds `SENT` apps past `followUpAt` (under `max_followups`) and, when Gmail is connected, **drafts the follow-up into Gmail** (`QUEUED_IN_GMAIL`, `EmailLog(FOLLOW_UP_n)`).
- **Timezone/scheduling math** (`src/lib/schedule.ts`): `getNextSendTime()` returns the next window start **in the configured timezone** via `Intl.DateTimeFormat` round-trips (verified: weekend approve → Mon `2026-09-07T03:30:00Z` for 9 AM IST). Used only by the Apps Script scheduling path now.

---

## 9. Resume pipeline & Tectonic (gotchas, all FIXED)

- Flow: master latex → `tailorResume` (LLM) → `compileLatex` → PDF in `<cwd>/data/output/resume_*.pdf`.
- **Path-with-space** (`E:\Radhe\email automation\…`): `spawn(..., {shell:true})` mangles args — FIXED by removing `shell`.
- **First run ~143 s** (bundle download); child timeout 300 s + route `maxDuration` 300. Later runs <1–2 s.
- **pdfTeX-only macros** (`\input{glyphtounicode}`, `\pdfgentounicode=1`) break XeTeX → `compatWithXeTeX()` in `src/lib/resume/compile.ts` guards/removes them. Don't "fix" the template instead.
- **Never regress:** PATCH must persist `tailoredLatex` + `tailoredPdfPath` (kept), and now **approve must go through `createGmailDraft`**, not a local send.

---

## 10. Current live state (verified this session)

- Dev server running on `localhost:3000` (detached). `/`, `/new`, `/applications`, `/applications/[id]`, `/settings` all 200.
- `npm run build`, `npm run lint`, `npx tsc --noEmit` all **green**.
- **Test data cleared** (user requested): `Application`=0, `EmailLog`=0. `Resume`=1 (`main.tex`, 7,235 chars, `isDefault`; row `cmtot9a8r0000g0wb2fdwj903`). `Setting`=4 profile rows.
- Verified live: `/api/settings` returns `gmail.connected=false`, `gmail.redirectUri=http://localhost:3000/api/auth/google/callback`, `gmail.hasCredentials=true`; a smoke application `POST` → `approve` returns **400 `"Gmail is not connected yet. Open Settings → Connections …"`** (correct gate).
- **User blockers (not code bugs):**
  1. Google sign-in fails with **`redirect_uri_mismatch`** (`error_logs.txt` at repo root, gitignored) — the Owner must register `http://localhost:3000/api/auth/google/callback` as an Authorized redirect URI in Google Cloud Console for their OAuth client. Settings now shows the exact URI + steps.
  2. **Apps Script optional auto-send** requires one-time deploy of `scripts/gmail-scheduler/Code.gs` + pasting the `/exec` URL and token into Settings. Until then, approvals create drafts that stay in Gmail (still correct: nothing is lost).

---

## 11. Known issues / low-priority leftovers

1. **Gmail not actually connected** on this machine (see §10 blocker 1) — draft creation can't be live-tested until the redirect URI is registered. The gate (400 + message) and draft code path are otherwise exercised.
2. **Apps Script scheduler not deployed** — `scheduleSendViaAppsScript` silently returns `scheduled:false` when unconfigured (by design). No local test possible until user deploys.
3. Vision extraction still not live-tested end-to-end (needs a screenshot). Code path is fixed.
4. Scheduler follow-up drafting only runs while the dev/machine is on (by design: follow-ups also rely on the app being alive); the master draft flow is fully Gmail-side and independent.
5. `npm audit` reports 4 high-severity vulns (dev-machine app; don't blindly `npm audit fix --force`).
6. Outreach page links to a docs playbook that isn't served publicly (minor).
7. If you ever re-add instant "send now", keep it behind **`src/lib/gmail/send.ts` usage — that file was deleted**; rebuild it on `mime.ts` if needed. Prefer Gmail drafts per the architecture.

---

## 12. Phase 2 (next roadmap — NOT started)

Per `docs/08-ROADMAP.md`: cold outreach / CRM (Contact table exists), deliverability playbook, outreach dashboard, sequence management, ramp-up caps. `/outreach` is a placeholder.

---

## 13. Handy command snippets

```bash
# DB peek (db file at project root)
node -e "const D=require('better-sqlite3');const db=new D('dev.db');console.log(db.prepare('select id,status,company,role,followUpCount,gmailDraftId from Application').all())"

# Clear test data (idempotent)
@'
DELETE FROM "EmailLog";
DELETE FROM "Application";
'@ | npx prisma db execute --stdin

# Settings checkout
Invoke-RestMethod http://localhost:3000/api/settings

# Expected approve failure without Gmail
curl.exe -s -X POST http://localhost:3000/api/applications/<id>/approve   # → 400 friendly JSON
```

---

## 14. Golden rules for the next AI

- **Never commit or push real secrets** (GitHub secret-scanning hard-rejects). Real keys live only in gitignored `.env` / `.env.bak`.
- **Import Prisma from `@/generated/prisma/client`, never `@prisma/client`.** Url/adapter live in `prisma7.config.ts`.
- **Do not re-introduce local auto-sending.** The architecture is *queue inside Gmail* (drafts + optional Apps Script auto-send). `src/lib/gmail/mime.ts` is the single MIME builder; `send.ts` was deleted.
- **Layout:** Views (`src/app`, `src/components`) → ViewModels (`src/features/*/use*ViewModel.ts`) → Services (`src/services/*`) → `apiFetch` (`src/lib/api.ts`). New UI work: put logic in a ViewModel, wire through a typed service, show errors via inline banner or `ApiError.message`; never `alert()`; check `res.ok` is handled by `apiFetch`.
- **Client-safe rendering:** use `@/lib/format` (`formatCountdown`) and `@/lib/status`, not `@/lib/schedule`/`atHourInTZ`.
- **Button links** → `render={<Link/>}` + `nativeButton={false}`.
- **Don’t touch** `compatWithXeTeX`, the PATCH tailored-lines, `atHourInTZ`, or the approve→`createGmailDraft` wiring without re-running lint/tsc/build + a live smoke.
- After every change: `npm run lint`, `npx tsc --noEmit`, `npm run build`, smoke `/` returns 200, **update `project_context.md`**, commit+squash only intended files (never `.env`, `dev.db`, logs, `error_logs.txt`).
- PowerShell 5.1: `-Form` doesn't exist; use `curl.exe` or Node for multipart tests.