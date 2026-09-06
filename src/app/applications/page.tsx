"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/components/applications/status-badge";
import { formatCountdown } from "@/lib/format";
import { statusLabel, STATUS_LABELS } from "@/lib/status";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  scheduledSendAt: string | null;
  followUpAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        setApps(data.applications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter ? apps.filter((a) => a.status === filter) : apps;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-1">
          Tracker
        </p>
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
          Applications
        </h1>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={!filter} onClick={() => setFilter(null)} label="All" />
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <FilterPill
            key={key}
            active={filter === key}
            onClick={() => setFilter(filter === key ? null : key)}
            label={label}
          />
        ))}
      </div>

      <div className="border border-hairline rounded-[12px] bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline">
              <Th>Role</Th>
              <Th>Company</Th>
              <Th>Status</Th>
              <Th>Next Step</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-mute">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-mute">
                  No applications.{" "}
                  <Link href="/new" className="text-link hover:underline">
                    Start one →
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-b border-hairline last:border-b-0 hover:bg-hairline-soft">
                  <Td>
                    <Link href={`/applications/${app.id}`} className="font-medium text-ink hover:underline block truncate max-w-[280px]">
                      {app.role}
                    </Link>
                  </Td>
                  <Td className="text-body">{app.company}</Td>
<Td>
<Badge className={`${getStatusBadgeClass(app.status)} border rounded-full font-medium`}>
  {statusLabel(app.status)}
</Badge>
</Td>
<Td className="text-mute">
  {app.scheduledSendAt
    ? `sends in ${formatCountdown(new Date(app.scheduledSendAt))}`
    : app.status === "QUEUED_IN_GMAIL"
      ? "waiting in Gmail"
      : app.followUpAt
        ? `follow-up ${formatCountdown(new Date(app.followUpAt))}`
        : "—"}
</Td>
                  <Td className="text-mute">{new Date(app.createdAt).toLocaleDateString()}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-body border-hairline hover:border-body"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[12px] uppercase tracking-wide text-mute font-medium">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}