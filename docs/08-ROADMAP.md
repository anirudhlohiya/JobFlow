# Roadmap

**Build phases and milestones.**

---

## Phase 0: Documentation ✅

- [x] README
- [x] PRD (01)
- [x] Competitive Analysis (02)
- [x] Business Case (03)
- [x] Architecture (04)
- [x] Setup Guide (05)
- [x] Deliverability Playbook (06)
- [x] Template Library (07)
- [x] Roadmap (08)

**Exit criteria:** All docs written and approved. This file is the live roadmap.

---

## Phase 1: Core Application Engine ✅ (Code complete — needs user credentials)

**Goal:** Job post → tailored resume → email draft → review screen → send queue.

### Tasks
- [x] Scaffold Next.js project (TypeScript + Tailwind + Prisma + SQLite)
- [x] Project structure per Architecture doc
- [x] Settings page (API keys, BYOK multi-provider)
- [x] Gmail OAuth connect flow (encrypted token storage)
- [x] Ingestion: paste text → AI extraction
- [x] Ingestion: upload images → AI extraction (vision)
- [x] Extraction review UI (edit fields)
- [x] Resume upload (.tex)
- [x] Resume tailoring (AI rewrites LaTeX per JD)
- [x] Tectonic compile → PDF preview
- [x] Email draft generation
- [x] Review & approve screen (single view: JD + resume + email)
- [x] Send queue (scheduler: 9–11 AM IST weekday window)
- [x] Gmail send with PDF attachment
- [x] Follow-up draft generation (2 days, same thread)
- [x] Application tracker dashboard (list, statuses, countdowns)

### Deliverables
- Working local app: full job-application flow end-to-end
- Personal use capability (the single biggest unlock for you)

### Exit criteria
- You can paste a WhatsApp job post → receive a tailored resume + email → approve → it sends at next 9–11 AM window

---

## Phase 2: Batch Mode + Cold Outreach (Week 3)

**Goal:** Multiple posts at once + HR cold-outreach campaigns.

### Tasks
- [ ] Batch ingestion screen (multiple text + image posts in one session)
- [ ] Bulk extraction queue (process N posts, review in sequence)
- [ ] Contact import (CSV/Excel)
- [ ] Cold outreach campaign creation (per-contact AI emails)
- [ ] Daily cap enforcement (10→50 ramp over 21 days)
- [ ] Unique body enforcement (no two identical bodies)
- [ ] Follow-up sequences for outreach (max 2)
- [ ] Reply detection (auto-stop on reply)
- [ ] Deliverability monitoring (bounce detect, auto-pause)

### Exit criteria
- Upload 30 contacts.csv → campaign runs daily under caps → follow-ups fire → replies stop sequences

---

## Phase 3: Polish + Distribution (Week 4)

**Goal:** Make it usable by other people.

### Tasks
- [ ] `.env.example` + config file generation (the "5 changes" onboarding)
- [ ] Setup wizard in-app (first-run: connect Gmail, paste API key, upload resume)
- [ ] README polish + GIF demo
- [ ] Windows one-command launcher (`start.bat` for non-tech users)
- [ ] Error boundaries + friendly error messages
- [ ] Email threading verification (follow-ups in same thread)
- [ ] Test with real job posts (10+ varied examples)
- [ ] Personal dogfooding: run full job hunt for 1 week using the app

### Exit criteria
- A complete stranger can install and run the app in < 15 minutes following the setup guide

---

## Phase 4: Open-Source Release (Week 5)

**Goal:** Get it on GitHub, start community.

### Tasks
- [ ] GitHub repo with README
- [ ] License decision (AGPL-3.0 core)
- [ ] Contribution guidelines
- [ ] Issue templates
- [ ] Launch post: LinkedIn + Reddit + WhatsApp groups
- [ ] Collect feedback, fix critical bugs
- [ ] First 10 external users

### Exit criteria
- 100+ GitHub stars, 10+ active users, feedback loop running

---

## Phase 5: SaaS Evolution (Months 2–6)

**Goal:** Turn validated tool into a business.

### Tasks
- [ ] PostgreSQL migration (from SQLite)
- [ ] User auth (multi-tenant)
- [ ] Hosted deployment (Vercel / Railway)
- [ ] Stripe/Razorpay billing
- [ ] Premium template library
- [ ] Cold-outreach managed service
- [ ] Analytics dashboard (application stats, response rates)
- [ ] Google OAuth verification for production

### Exit criteria
- 100 free users → 20 paying users → ₹20K MRR

---

## Feature Backlog (Community-Driven)

- WhatsApp/Telegram bot integration (forward post → auto-draft)
- Chrome extension for LinkedIn post capture
- Cover letter generation
- ATS portal support (Greenhouse, Lever)
- Interview scheduling integration
- Resume version comparison view
- Multi-profile support (different resume per role type)
- A/B testing subject lines
- Statistical deliverability monitoring (per-campaign inbox placement)
- Templates UI (edit templates without code)

---

## Priority Matrix (Effort vs Value)

```
                    HIGH VALUE
                        │
      Cold outreach     │    Core application flow
      (P2)              │    (P1)  ← START HERE
                        │
   ─────────────────────┼────────────────────
                        │
      Templates UI      │    Batch mode (P2)
      (P4/backlog)      │    ATS support
                        │    WhatsApp bot integration
                    LOW VALUE
            LOW EFFORT ─┼───────────────────────────── HIGH EFFORT
```

---

## Definition of Done (per phase)

A phase is done when:
1. All tasks marked complete
2. Exit criteria met (verified, not assumed)
3. `npm run dev` works cleanly from a fresh clone
4. Errors are caught and logged (no silent failures)
5. .env.example is current and complete
6. Docs updated if behavior changed