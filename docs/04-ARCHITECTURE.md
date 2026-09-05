# Architecture

**Last updated:** September 2026

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        User's Browser (localhost:3000)               │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌───────────────────┐ │
│  │Dashboard │ │ Ingestion │ │ Review/Approve│ │    Settings       │ │
│  │(Tracker) │ │ (Text +   │ │  (Resume +   │ │ (API Keys, Gmail, │ │
│  │          │ │  Images)  │ │   Email)     │ │  Resume, Config)  │ │
│  └────┬─────┘ └─────┬─────┘ └──────┬───────┘ └─────────┬─────────┘ │
└───────┼──────────────┼──────────────┼──────────────────┼────────────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Next.js App Router (API Routes)                  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ /api/extract │  │ /api/tailor  │  │ /api/draft   │              │
│  │ (JD parse)   │  │ (Resume)     │  │ (Email)      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         ▼                 ▼                  ▼                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Vercel AI SDK (Unified LLM)            │            │
│  │  OpenAI │ Anthropic │ Gemini │ Groq │ Ollama        │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /api/compile     │  │ /api/approve     │  │ /api/auth/google │  │
│  │ (Tectonic→PDF)   │  │ (Queue job)      │  │ (OAuth flow)     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │              │
│           ▼                     ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Prisma + SQLite (Local DB)              │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────┐            │
│  │           Scheduler (node-cron, every 1 min)         │            │
│  │  - Picks QUEUED apps where scheduledSendAt <= now    │            │
│  │  - Sends via Gmail API                               │            │
│  │  - Creates follow-up tasks after N days              │            │
│  └─────────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        External Services                             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Gmail API       │  │  LLM Provider    │  │  Tectonic        │  │
│  │  (OAuth 2.0)    │  │  (BYOK API Key)  │  │  (Local Binary)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) + TypeScript + Tailwind | Full-stack in one framework; fast iteration |
| **UI Components** | shadcn/ui | Accessible, customizable, no dependency bloat |
| **ORM** | Prisma | Type-safe DB access, migrations, excellent DX |
| **Database** | SQLite | Zero-config local file; swap to Postgres for SaaS later |
| **AI/LLM** | Vercel AI SDK | Unified interface for OpenAI, Anthropic, Gemini, Groq, Ollama |
| **Email** | Gmail API via `googleapis` | OAuth 2.0; sends from user's real inbox |
| **LaTeX** | Tectonic | Single-binary; auto-downloads packages; no MiKTeX install |
| **Scheduling** | `node-cron` | In-process; checks DB every minute for due jobs |
| **Encryption** | `crypto` (Node built-in) | AES-256-GCM for API keys and tokens at rest |
| **File Upload** | `formidable` | Multipart form handling for images |
| **CSV Parsing** | `csv-parse` | For HR contacts import |

---

## 3. Data Model (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Setting {
  id            String   @id @default(cuid())
  key           String   @unique
  value         String   // JSON-encrypted for secrets, plain for prefs
  isEncrypted   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Resume {
  id            String   @id @default(cuid())
  name          String
  latexContent  String   // Raw .tex source
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Application {
  id              String   @id @default(cuid())
  
  // Extracted job info
  company         String
  role            String
  hrEmail         String?
  hrName          String?
  skills          String   @default("[]") // JSON array
  experience      String?
  location        String?
  isRemote        Boolean  @default(false)
  salary          String?
  source          String?  // "whatsapp", "linkedin", "manual"
  sourceRawText   String?  // Original pasted text
  sourceImage     String?  // Path to uploaded image
  
  // Resume
  resumeId        String?
  resume          Resume?  @relation(fields: [resumeId], references: [id])
  tailoredLatex   String?  // Tailored .tex content
  tailoredPdfPath String?  // Path to compiled PDF
  
  // Email
  emailSubject    String?
  emailBody       String?
  emailTemplate   String?  // Template used
  
  // Status
  status          String   @default("DRAFT")
  // DRAFT → PENDING_REVIEW → QUEUED → SENT → FOLLOW_UP_PENDING
  // → FOLLOWED_UP → REPLIED → ARCHIVED
  
  // Scheduling
  scheduledSendAt DateTime?
  sentAt          DateTime?
  followUpAt      DateTime?
  followUpCount   Int      @default(0)
  maxFollowUps    Int      @default(2)
  
  // Cold outreach flag
  isColdOutreach  Boolean  @default(false)
  contactId       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  emailLogs       EmailLog[]
  
  @@index([status])
  @@index([scheduledSendAt])
}

model EmailLog {
  id              String   @id @default(cuid())
  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id])
  
  type            String   // "INITIAL", "FOLLOW_UP_1", "FOLLOW_UP_2", "COLD_OUTREACH"
  gmailMessageId  String?  // Gmail API message ID
  gmailThreadId   String?  // Gmail thread ID (for threading)
  status          String   @default("QUEUED")
  // QUEUED, SENT, DELIVERED, BOUNCED, FAILED
  
  sentAt          DateTime?
  createdAt       DateTime @default(now())
}

model Contact {
  id              String   @id @default(cuid())
  
  name            String
  email           String
  company         String
  roleApplied     String?
  notes           String?
  
  // Outreach tracking
  emailSentCount  Int      @default(0)
  lastSentAt      DateTime?
  status          String   @default("NEW")
  // NEW, CONTACTED, REPLIED, BOUNCED, UNSUBSCRIBED
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  applications    Application[]
  
  @@index([email])
}
```

---

## 4. API Routes

### Extraction
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/extract` | Parse job post (text or image) → structured JSON |
| `POST` | `/api/extract/batch` | Parse multiple posts at once |

### Resume
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/resume/upload` | Upload master .tex resume |
| `POST` | `/api/resume/tailor` | Tailor resume to specific JD |
| `POST` | `/api/resume/compile` | Compile .tex → PDF (preview) |

### Email
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/email/draft` | Generate email draft from JD + resume |
| `POST` | `/api/email/cold-draft` | Generate cold outreach email per contact |

### Applications
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/applications` | List all (with filters) |
| `GET` | `/api/applications/[id]` | Get single application detail |
| `POST` | `/api/applications` | Create new (from extracted data) |
| `PATCH` | `/api/applications/[id]` | Update fields |
| `POST` | `/api/applications/[id]/approve` | Queue for sending |
| `POST` | `/api/applications/[id]/cancel` | Cancel queued send |
| `DELETE` | `/api/applications/[id]` | Delete application |

### Contacts (Cold Outreach)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/contacts/import` | Upload CSV/Excel |
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts/campaign` | Start campaign for contact list |

### Auth
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Start OAuth flow |
| `GET` | `/api/auth/google/callback` | OAuth callback |
| `POST` | `/api/auth/google/disconnect` | Remove Gmail connection |

### Settings
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settings` | Get all settings |
| `PATCH` | `/api/settings` | Update settings |

---

## 5. Page Structure

```
src/app/
├── page.tsx                          # Dashboard (application tracker)
├── layout.tsx                        # Root layout (sidebar nav)
├── new/
│   └── page.tsx                      # New application wizard
│       ├── Step 1: Paste/upload      # Text + image ingestion
│       ├── Step 2: Review extraction # Edit extracted fields
│       ├── Step 3: Resume preview    # Tailored PDF + email draft
│       └── Step 4: Approve & queue   # Final review → send
├── applications/
│   ├── page.tsx                      # Applications list
│   └── [id]/
│       └── page.tsx                  # Application detail view
├── outreach/
│   ├── page.tsx                      # Cold outreach dashboard
│   └── campaign/
│       └── [id]/
│           └── page.tsx              # Campaign detail
├── settings/
│   └── page.tsx                      # Settings (API keys, Gmail, resume, prefs)
└── api/                              # All API routes (see §4)
```

---

## 6. Key Flows

### Flow 1: Single Job Application

```
User pastes text / uploads image
        │
        ▼
POST /api/extract
  → LLM structured output (role, company, skills, hrEmail...)
  → Return to UI for user review
        │
        ▼
User edits fields → clicks "Generate Resume"
        │
        ▼
POST /api/resume/tailor
  → AI rewrites master .tex per JD
  → POST /api/resume/compile (Tectonic → PDF)
  → Return PDF preview
        │
        ▼
User clicks "Draft Email"
        │
        ▼
POST /api/email/draft
  → AI composes email using template + JD highlights
  → Return subject + body
        │
        ▼
User reviews everything → clicks "Approve & Queue"
        │
        ▼
POST /api/applications/[id]/approve
  → Sets status = QUEUED
  → Sets scheduledSendAt = next 9–11 AM IST weekday
        │
        ▼
Scheduler picks up at scheduledSendAt
  → Gmail API sends email with PDF attachment
  → Creates follow-up task (followUpAt = now + 2 days)
  → Sets status = SENT
        │
        ▼
After 2 days, scheduler picks up follow-up
  → Drafts follow-up email (same thread)
  → Sets status = FOLLOW_UP_PENDING
  → User reviews → approves → sent
```

### Flow 2: Cold Outreach Campaign

```
User uploads contacts.csv
        │
        ▼
POST /api/contacts/import
  → Parse CSV, validate emails
  → Create Contact records
        │
        ▼
User reviews contacts → clicks "Start Campaign"
        │
        ▼
POST /api/contacts/campaign
  → AI generates unique email per contact
  → Creates Application records (isColdOutreach = true)
  → Applies daily cap (safety rails)
        │
        ▼
Scheduler processes daily batch:
  - Checks safety cap (10→20→35→50 ramp)
  - Sends personalized emails
  - Tracks Gmail message IDs
        │
        ▼
Follow-ups at 2-day intervals (max 2)
Auto-stop on reply detection
```

### Flow 3: Gmail OAuth

```
GET /api/auth/google
  → Redirect to Google consent screen
  → Scopes: gmail.send, gmail.readonly (for thread IDs)
        │
        ▼
GET /api/auth/google/callback
  → Exchange code for tokens
  → Encrypt refresh token (AES-256-GCM)
  → Store in Setting table
  → Redirect to /settings with success
```

---

## 7. Encryption Strategy

### API Keys (LLM providers)
```
Storage: Setting table, isEncrypted = true
Encrypt: AES-256-GCM with key from .env ENCRYPTION_KEY
Decrypt: On use, in-memory only; never sent to client
```

### Gmail OAuth Tokens
```
Storage: Setting table (key = "google_refresh_token"), isEncrypted = true
Encrypt: Same AES-256-GCM
Access: Only API routes that send email
```

### .env Required Variables
```env
# App
ENCRYPTION_KEY=32-char-random-hex
NEXTAUTH_SECRET=32-char-random-hex

# Optional: pre-configured defaults
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o-mini

# Google OAuth (create at console.cloud.google.com)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Tectonic (auto-downloads if not found)
TECTONIC_PATH=tectonic  # or full path to binary
```

---

## 8. Scheduler Design

```typescript
// lib/scheduler.ts (conceptual)

import cron from 'node-cron';

// Check every minute for due sends
cron.schedule('* * * * *', async () => {
  const now = new Date();
  
  // 1. Find queued applications where scheduledSendAt <= now
  const dueApps = await prisma.application.findMany({
    where: {
      status: 'QUEUED',
      scheduledSendAt: { lte: now },
    },
  });
  
  for (const app of dueApps) {
    try {
      // 2. Send via Gmail API
      const result = await sendGmail(app);
      
      // 3. Log the send
      await prisma.emailLog.create({
        data: {
          applicationId: app.id,
          type: app.isColdOutreach ? 'COLD_OUTREACH' : 'INITIAL',
          gmailMessageId: result.messageId,
          gmailThreadId: result.threadId,
          status: 'SENT',
          sentAt: now,
        },
      });
      
      // 4. Update application status
      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: 'SENT',
          sentAt: now,
          followUpAt: addDays(now, FOLLOW_UP_INTERVAL_DAYS),
        },
      });
    } catch (error) {
      // Handle errors, retry logic
    }
  }
  
  // 5. Process follow-ups
  const dueFollowUps = await prisma.application.findMany({
    where: {
      status: 'SENT',
      followUpAt: { lte: now },
      followUpCount: { lt: MAX_FOLLOW_UPS },
    },
  });
  
  for (const app of dueFollowUps) {
    // Draft follow-up email, set status to FOLLOW_UP_PENDING
    await draftFollowUp(app);
  }
  
  // 6. Apply cold-outreach daily caps
  await enforceColdOutreachCaps();
});
```

---

## 9. File Structure

```
email-automation/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard
│   │   ├── new/page.tsx                # Ingestion wizard
│   │   ├── applications/               # Application views
│   │   ├── outreach/                   # Cold outreach views
│   │   ├── settings/page.tsx           # Settings
│   │   └── api/                        # All API routes
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── dashboard/                  # Tracker components
│   │   ├── ingestion/                  # Paste/upload components
│   │   ├── review/                     # Resume/email preview
│   │   └── settings/                   # Settings form components
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providers.ts            # Multi-provider LLM setup
│   │   │   ├── extract.ts              # JD extraction logic
│   │   │   ├── tailor.ts               # Resume tailoring logic
│   │   │   └── draft.ts                # Email drafting logic
│   │   ├── gmail/
│   │   │   ├── auth.ts                 # OAuth flow
│   │   │   ├── send.ts                 # Send email with attachment
│   │   │   └── thread.ts               # Thread management for follow-ups
│   │   ├── resume/
│   │   │   ├── compile.ts              # Tectonic integration
│   │   │   └── template.ts             # LaTeX manipulation utilities
│   │   ├── scheduler.ts                # Cron job logic
│   │   ├── crypto.ts                   # AES-256-GCM encryption
│   │   └── config.ts                   # Config loader (user.config.yaml)
│   ├── types/                          # TypeScript type definitions
│   └── styles/
│       └── globals.css
├── config/
│   ├── user.config.example.yaml        # Template
│   └── user.config.yaml                # User config (gitignored)
├── data/
│   ├── resume/                         # LaTeX resumes
│   ├── contacts/                       # CSV contacts
│   ├── posts/                          # Uploaded job post images
│   └── output/                         # Generated PDFs
├── docs/                               # This documentation
├── .env.example
├── .env                                # User secrets (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```
