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

// Offset (ms) of the given epoch's wall-clock time in `timeZone` from its UTC epoch.
function tzOffsetMs(ts: number, timeZone: string): number {
  const wall = new Date(new Date(ts).toLocaleString("en-US", { timeZone }));
  return wall.getTime() - ts;
}

// Reset to a given hour (minute 0) in the configured timezone.
function atHourInTZ(from: Date, timeZone: string, hour: number): Date {
  const tp = (t: Date) => {
    const parts = Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(t);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    return {
      y: +get("year"),
      m: +get("month") - 1,
      d: +get("day"),
      h: +get("hour") % 24,
      min: +get("minute"),
    };
  };

  const target = tp(from);
  const targetUtcDay = Date.UTC(target.y, target.m, target.d);

  const naive = Date.UTC(target.y, target.m, target.d, hour, 0, 0);
  let epoch = naive - tzOffsetMs(naive, timeZone);

  // Converge until the wall-clock time in TZ equals the target date/time.
  for (let i = 0; i < 5; i++) {
    const w = tp(new Date(epoch));
    const dayDelta = (Date.UTC(w.y, w.m, w.d) - targetUtcDay) / 86_400_000;
    const minuteDelta = w.h * 60 + w.min - hour * 60;
    if (dayDelta === 0 && minuteDelta === 0) break;
    epoch -= dayDelta * 86_400_000 + minuteDelta * 60_000;
  }

  return new Date(epoch);
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