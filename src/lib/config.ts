import fs from "fs";
import path from "path";
import { load } from "js-yaml";
import type { UserConfig } from "@/types";

const CONFIG_PATH = path.join(process.cwd(), "config", "user.config.yaml");
const EXAMPLE_PATH = path.join(process.cwd(), "config", "user.config.example.yaml");

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!override) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const baseVal = result[key];
    const overrideVal = (override as Record<string, unknown>)[key];
    if (
      baseVal &&
      overrideVal &&
      typeof baseVal === "object" &&
      typeof overrideVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

export function getDefaultConfig(): UserConfig {
  return {
    user: { name: "", email: "", phone: "", linkedin: "" },
    send: {
      timezone: "Asia/Kolkata",
      start_hour: 9,
      end_hour: 11,
      weekdays_only: true,
    },
    followup: { interval_days: 2, max_followups: 2 },
    resume: { default_file: "data/resume/resume.tex", max_pages: 1 },
    cold_outreach: {
      daily_cap_start: 10,
      daily_cap_max: 50,
      ramp_up_days: 21,
      max_followups: 2,
    },
  };
}

export function loadConfig(): UserConfig {
  try {
    const base = getDefaultConfig();
    const filePath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_PATH;
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = load(raw) as Partial<UserConfig>;
    return deepMerge(base, parsed);
  } catch (error) {
    console.error("[config] Failed to load config, using defaults:", error);
    return getDefaultConfig();
  }
}

let cachedConfig: UserConfig | null = null;

export function getConfig(): UserConfig {
  if (!cachedConfig) cachedConfig = loadConfig();
  return cachedConfig;
}

export function reloadConfig(): UserConfig {
  cachedConfig = loadConfig();
  return cachedConfig;
}