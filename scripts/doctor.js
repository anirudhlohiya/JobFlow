/**
 * JobFlow environment doctor.
 * Run: npm run doctor
 * Reports what's configured and what's still missing — no network calls.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const results = [];

function check(name, ok, hint) {
  results.push({ name, ok, hint: hint ?? "" });
  console.log(`  ${ok ? "[OK]  " : "[MISS]"} ${name}${hint && !ok ? "  → " + hint : ""}`);
}

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

console.log("\nJobFlow environment doctor\n==========================");

const env = loadEnv();

// .env
check(".env file exists", fs.existsSync(path.join(root, ".env")), "copy .env.example → .env");

// ENCRYPTION_KEY
const encRaw = env.ENCRYPTION_KEY || "";
const encOk =
  encRaw.length > 0 && !encRaw.includes("replace-with") && Buffer.byteLength(encRaw) === 64;
check(
  "ENCRYPTION_KEY (64-char hex)",
  encOk,
  `set ENCRYPTION_KEY (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")`
);

// Google OAuth
const hasClientId = /AIza|\.apps\.googleusercontent\.com/.test(env.GOOGLE_CLIENT_ID || "");
const hasSecret = env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CLIENT_SECRET.length > 10;
check(
  "Google OAuth credentials",
  hasClientId && hasSecret,
  "create at console.cloud.google.com → Credentials → OAuth client ID; set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET"
);

// AI provider keys (env)
const providers = [
  ["OPENAI_API_KEY", "openai", "platform.openai.com/api-keys"],
  ["ANTHROPIC_API_KEY", "anthropic", "console.anthropic.com"],
  ["GEMINI_API_KEY", "google", "aistudio.google.com/apikey"],
  ["GROQ_API_KEY", "groq", "console.groq.com/keys"],
];
const anyAiInEnv = providers.some(([k]) => env[k]);
check(
  "AI provider key in .env (any of 4)",
  anyAiInEnv,
  `${providers.map(([, p, url]) => `${p} (${url})`).join(" · ")}`
);

// Tectonic — checks PATH or TECTONIC_PATH from .env
let tectonicFound = false;
let tectonicErr = "";
const tectonicCustom = env.TECTONIC_PATH && fs.existsSync(env.TECTONIC_PATH);
if (tectonicCustom) {
  tectonicFound = true;
} else {
  try {
    const which = execSync(process.platform === "win32" ? "where tectonic" : "which tectonic", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    tectonicFound = which.length > 0;
  } catch (e) {
    tectonicErr = String(e.message || e).split("\n")[0];
  }
}
check(
  "Tectonic LaTeX compiler",
  tectonicFound,
  `install from https://tectonic-typesetting.github.io (or set TECTONIC_PATH in .env)${tectonicErr ? " — " + tectonicErr : ""}`
);

// user config
const userCfg = path.join(root, "config", "user.config.yaml");
check(
  "config/user.config.yaml",
  fs.existsSync(userCfg),
  "optional — falls back to user.config.example.yaml; copy it to customize send window/resume defaults"
);

// DB reachable (no credentials needed)
try {
  const Database = require("better-sqlite3");
  const url = env.DATABASE_URL || "file:./dev.db";
  const dbPath = path.join(root, url.replace(/^file:/, ""));
  const db = new Database(dbPath, { readonly: true });
  db.prepare("SELECT 1").get();
  db.close();
  check("Database (SQLite) reachable", true);
} catch (e) {
  check("Database (SQLite) reachable", false, String(e?.code || e?.message || e));
}
printSummary();

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const missing = results.filter((r) => !r.ok);
  console.log(`\n${ok}/${results.length} configured.`);
  if (missing.length) {
    console.log("Missing:");
    missing.forEach((r) => console.log(`  - ${r.name}${r.hint ? " (" + r.hint + ")" : ""}`));
  } else {
    console.log("All checks passed — you're ready to run the full pipeline. 🎉");
  }
  console.log("");
}