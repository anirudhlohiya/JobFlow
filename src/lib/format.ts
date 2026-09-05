"use client";

/**
 * Human-readable relative time (countdown) for the dashboard.
 * Client-safe — no Node.js imports.
 */
export function formatCountdown(date: Date | null | undefined): string {
  if (!date) return "—";
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "now";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}