import { getConfig } from "./config";

/**
 * Compute the next valid send time per config:
 * weekday 9–11 AM IST by default. If the current time is inside the window,
 * returns the next minute; otherwise the next window start.
 */
export function getNextSendTime(from: Date = new Date()): Date {
  const cfg = getConfig().send;

  const timeZone = cfg.timezone || "Asia/Kolkata";
  const startHour = cfg.start_hour ?? 9;
  const endHour = cfg.end_hour ?? 11;
  const weekdaysOnly = cfg.weekdays_only !== false;

  // Calculate in the configured timezone
  const parts = Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(from);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const hour = parseInt(get("hour"), 10) % 24;

  const isWeekend = ["Sat", "Sun"].includes(weekday);

  if (weekdaysOnly && isWeekend) {
    // Jump to Monday 9 AM
    return nextWeekdayWindow(from, startHour, weekdaysOnly);
  }

  if (hour < startHour) {
    // Before window: send at start hour today
    return atHourInTZ(from, timeZone, startHour);
  }

  if (hour >= endHour) {
    // After window: next day
    return nextDayWindow(from, timeZone, startHour, weekdaysOnly);
  }

  // Inside window: send soon (small delay to stay in window)
  return new Date(from.getTime() + 60_000);
}

// Reset to a given hour (minute 0) in the configured timezone
function atHourInTZ(from: Date, timeZone: string, hour: number): Date {
  const iso = new Date(from.toLocaleString("en-US", { timeZone }));
  const offsetMs = iso.getTime() - from.getTime();
  const utcTarget = new Date(from.getTime() + offsetMs);
  utcTarget.setUTCHours(hour, 0, 0, 0);
  return new Date(utcTarget.getTime() - offsetMs);
}

function nextDayWindow(from: Date, timeZone: string, startHour: number, weekdaysOnly: boolean): Date {
  let candidate = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const parts = Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).formatToParts(candidate);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  if (weekdaysOnly && ["Sat", "Sun"].includes(weekday)) {
    candidate = nextWeekdayWindow(candidate, startHour, weekdaysOnly);
  }
  return atHourInTZ(candidate, timeZone, startHour);
}

function nextWeekdayWindow(from: Date, startHour: number, weekdaysOnly: boolean): Date {
  let candidate = new Date(from.getTime());
  for (let i = 0; i < 7; i++) {
    const parts = Intl.DateTimeFormat("en-US", {
      timeZone: getConfig().send.timezone || "Asia/Kolkata",
      weekday: "short",
    }).formatToParts(candidate);
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    if (!weekdaysOnly || !["Sat", "Sun"].includes(weekday)) {
      return atHourInTZ(candidate, getConfig().send.timezone || "Asia/Kolkata", startHour);
    }
    candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
  }
  return atHourInTZ(from, getConfig().send.timezone || "Asia/Kolkata", startHour);
}