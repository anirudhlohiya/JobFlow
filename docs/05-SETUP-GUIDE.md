# Setup Guide — The 5 Changes

**For end users. Non-technical. No code edits required.**

---

## Prerequisites

You need:
1. **Node.js 18+** installed — [Download here](https://nodejs.org) (LTS version)
2. A **Gmail account** you want to send from
3. An **AI API key** from one of: OpenAI, Anthropic, Google Gemini, or Groq
4. Your **resume in LaTeX format** (a `.tex` file)

Check if Node.js is installed:
```bash
node --version
# Should show v18.x.x or higher
```

---

## Installation (One Time)

```bash
# 1. Download the project
git clone <repo-url> email-automation
cd email-automation

# 2. Install dependencies
npm install

# 3. Start the app
npm run dev
```

Your browser opens at **http://localhost:3000**. You'll see the setup screen.

---

## The 5 Changes

Open the project folder in File Explorer. Everything happens by **dropping files** and **editing config files** (NOT code).

### Change 1: Add Your Resume LaTeX File

**Where:** `data/resume/resume.tex`

1. Open the `data/resume/` folder
2. Copy your `.tex` resume file into this folder
3. Rename it to `resume.tex`

That's it. The app will detect it automatically in Settings.

**Don't have a .tex file?** Ask in the project's GitHub Discussions for help converting your resume to LaTeX format.

---

### Change 2: Add Your AI API Key

**Where:** `.env` file in the project root

1. In the project root, find the file called `.env.example`
2. Copy it and rename the copy to `.env`
3. Open `.env` in Notepad (right-click → Open With → Notepad)
4. Find the provider you want to use and add your key:

```env
# Choose ONE (or more — you can switch later in Settings):

# OpenAI (get key at https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic (get key at https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini (get key at https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx

# Groq (get key at https://console.groq.com — fast + free tier)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
```

5. Save the file

**Which provider should I pick?**
- **Groq** — Free tier, fast. Good for getting started.
- **OpenAI** — Most reliable. GPT-4o-mini is cheap and good.
- **Gemini** — Best for image understanding (WhatsApp screenshots).
- **Anthropic** — Best writing quality. Most expensive.

---

### Change 3: Connect Your Gmail

1. Open the app at http://localhost:3000
2. Go to **Settings** (sidebar)
3. Click **"Connect Gmail"**
4. A Google sign-in window opens — sign in with the Gmail you want to send FROM
5. Grant permission (the app only needs "Send email" permission)
6. You're done — you'll see "Gmail Connected" in Settings

**Important:** Google shows a "This app isn't verified" warning (normal for local apps). Click **Advanced → Go to [project name] (unsafe)** to proceed. This is safe because YOU are the only user.

**How it works:** The app sends emails from YOUR Gmail account. Recipients see it as coming from a real person (you), not a bot. This is critical for avoiding spam filters.

---

### Change 4: Configure Your Send Preferences

**Where:** `config/user.config.yaml`

1. Open the `config/` folder
2. Copy `user.config.example.yaml` → `user.config.yaml`
3. Open `user.config.yaml` in Notepad
4. Edit these key settings:

```yaml
# Your information (used in email templates)
user:
  name: "Rahul Sharma"
  email: "rahul@gmail.com"
  phone: "+91-9876543210"
  linkedin: "linkedin.com/in/rahulsharma"

# Send window (default: 9-11 AM IST on weekdays)
send:
  timezone: "Asia/Kolkata"
  start_hour: 9
  end_hour: 11
  weekdays_only: true

# Follow-up settings
followup:
  interval_days: 2
  max_followups: 2

# Resume settings
resume:
  default_file: "data/resume/resume.tex"
  max_pages: 1

# Cold outreach safety (do NOT change unless you know what you're doing)
cold_outreach:
  daily_cap_start: 10
  daily_cap_max: 50
  ramp_up_days: 21
  max_followups: 2
```

5. Save the file

---

### Change 5 (Optional): Add HR Contacts for Cold Outreach

**Where:** `data/contacts/contacts.csv`

1. Open the `data/contacts/` folder
2. Create a file called `contacts.csv` (or .xlsx)
3. Use these columns:

```csv
name,email,company,role_applied,notes
Priya Singh,priya@acme.com,Acme Corp,Backend Developer,Found on LinkedIn
Raj Kumar,raj@startup.io,StartupIO,Frontend Developer,WhatsApp group
```

4. Save the file
5. In the app, go to **Outreach** → **Import Contacts** → select the file

---

## Verify Everything Works

1. Open http://localhost:3000
2. Go to **Settings** — you should see:
   - API Key: Connected ✓
   - Gmail: Connected ✓
   - Resume: Loaded ✓
3. Go to **New Application**
4. Paste a sample job post text
5. Click **Extract**
6. You should see the AI extract role, company, skills, HR email

**If something doesn't work:**
- Check the terminal (the black window where you ran `npm run dev`) for error messages
- Make sure your `.env` file has the correct API key (no extra spaces)
- Make sure Tectonic is installed (run `tectonic --version` in terminal)

---

## Installing Tectonic (LaTeX Compiler)

Tectonic is needed to convert your `.tex` resume to PDF. It's a single file, no heavy installation.

**Windows:**
```bash
# Option 1: Using Scoop (if you have it)
scoop install tectonic

# Option 2: Manual download
# Go to https://tectonic-typesetting.github.io
# Download the Windows binary
# Put it somewhere on your PATH (or set TECTONIC_PATH in .env)
```

**Verify:**
```bash
tectonic --version
```

**First compile:** Tectonic auto-downloads LaTeX packages on first use. Needs internet once. After that, it's offline-capable.

---

## Updating

```bash
git pull
npm install
```

Your config files (`.env`, `config/user.config.yaml`, `data/`) are preserved. Only source code updates.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm: command not found` | Install Node.js from nodejs.org |
| `tectonic: command not found` | Install Tectonic (see above) |
| Gmail OAuth error | Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env |
| API key error | Check for extra spaces in .env; make sure you copied the whole key |
| Resume compile fails | Check your .tex file compiles standalone with `tectonic resume.tex` |
| Port 3000 already in use | Run `npm run dev -- -p 3001` to use port 3001 |
