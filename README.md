# JobFlow

Single-user email-automation app for job applications. Paste a job post (text or screenshot), and JobFlow:

1. **Extracts** the role, company, skills, and HR contact (AI).
2. **Tailors** your LaTeX resume to the role (AI).
3. **Compiles** the tailored PDF locally via **Tectonic**.
4. **Drafts** a personalized application email (AI) with the resume attached.
5. **Queues it in Gmail** — approving creates a real Gmail draft (subject + body + attached PDF prefilled). The app never sends email itself and doesn't need to be running at send time.
6. **Optional auto-send (handsfree)** — deploy the bundled Google Apps Script once and approvals are scheduled to send from Google's cloud at the next send-window time.

---

## Prerequisites

- **Node.js 18+** (LTS)
- An **AI API key** from one of: OpenAI, Anthropic, Google Gemini, or Groq
- **Tectonic** (LaTeX engine) — a single binary. Install via Scoop (`scoop install tectonic`) or from https://tectonic-typesetting.github.io, then set `TECTONIC_PATH` in `.env` (or add it to PATH).
- A **Google Cloud OAuth 2.0 Client ID** (for Gmail) — optional until you want to connect Gmail (see below).
- Your **resume in LaTeX** (`.tex`).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment — copy and fill in
cp .env.example .env
# Required: ENCRYPTION_KEY (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# Add at least one AI key: OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY / GROQ_API_KEY
# Optional: DEFAULT_LLM_PROVIDER + DEFAULT_LLM_MODEL (default: google / gemini-3.6-flash)

# 3. Configure your profile / send window / resume path
cp config/user.config.example.yaml config/user.config.yaml

# 4. Check readiness
npm run doctor

# 5. Run
npm run dev        # http://localhost:3000
```

The resume path, profile fields, and send window can also be edited in the **Settings** page (DB values override the config file).

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm run doctor` | Environment readiness check |
| `npx prisma studio` | Inspect the local SQLite DB |

---

## Connecting Gmail

1. Create credentials at https://console.cloud.google.com → **Credentials → Create Credentials → OAuth 2.0 Client ID** (app type: Web).
2. Add **`http://localhost:3000/api/auth/google/callback`** as an Authorized redirect URI — this must match `GOOGLE_REDIRECT_URI` in `.env`.
3. Fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.
4. In the app: **Settings → Connect Gmail**. Google shows an "unverified app" warning — it's your own local app, so use **Advanced → Go to ... (unsafe)**.
5. Approving an application now creates a real Gmail draft with the email and tailored PDF pre-filled — ready to send from Gmail whenever you like.

> Blocked until the redirect URI is registered in Cloud Console → the flow returns `redirect_uri_mismatch`.

---

## Optional: hands-free auto-send (Google Apps Script)

1. Open https://script.google.com → **New project** → replace the default code with the contents of **`scripts/gmail-scheduler/Code.gs`**.
2. Set a strong random token in `CONFIG_TOKEN` in that file (or as the script property `jobflow_token`).
3. **Deploy → New deployment → Web app** (Execute as: Me; Who has access: Anyone). **Do not deploy without a token** — the script fails closed otherwise.
4. Copy the `/exec` URL.
5. In JobFlow **Settings → Gmail Scheduler**, paste the URL and the same token, save.
6. Approvals are now scheduled to auto-send from Google's cloud at the next send-window time.

The script creates one time-based trigger per scheduled send and fires each exactly once; other scheduled sends are never disturbed.

---

## Security notes

- All API keys and OAuth/token secrets are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`).
- Secrets are never exposed to the browser; settings API returns masked values and ignores masked edits.
- The scheduler web app is **fail-closed**: without its token it rejects every request.
- `.env`, `dev.db`, and `config/user.config.yaml` are gitignored. The GitHub repo has secret-scanning **enabled** — never commit real keys.

---

## Docs

- `docs/01-PRD.md` — product requirements
- `docs/02-COMPETITIVE-ANALYSIS.md`
- `docs/03-BUSINESS-CASE.md`
- `docs/04-ARCHITECTURE.md`
- `docs/05-SETUP-GUIDE.md` — detailed end-user setup (resume, keys, Gmail, config)
- `docs/06-DELIVERABILITY-PLAYBOOK.md`
- `docs/07-TEMPLATE-LIBRARY.md`
- `docs/08-ROADMAP.md` — Phase 2 (cold outreach, CRM, analytics) — not built yet
- `project_context.md` — full technical handoff used by AI sessions

---

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Prisma 7 + SQLite (local) · AI SDK (OpenAI / Anthropic / Google / Groq) · googleapis (Gmail) · Tectonic (LaTeX → PDF) · node-cron