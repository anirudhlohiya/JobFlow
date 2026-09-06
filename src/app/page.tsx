"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getStatusBadgeClass } from "@/components/applications/status-badge";
import { formatCountdown } from "@/lib/format";
import { statusLabel, DRAFTS_URL } from "@/lib/status";
import { useDashboardViewModel } from "@/features/dashboard/useDashboardViewModel";
import { ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const vm = useDashboardViewModel();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-1">
          Overview
        </p>
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
          Dashboard
        </h1>
        <p className="text-body mt-1">
          One pipeline: paste → tailor → draft → queue in Gmail.
        </p>
      </div>

      {vm.gmailChecking ? null : !vm.gmailConnected ? (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          Gmail isn&apos;t connected, so nothing will actually be queued.{" "}
          <Link href="/settings" className="underline font-medium">
            Connect Google in Settings
          </Link>{" "}
          before approving applications.
        </div>
      ) : null}

      {vm.error && (
        <div className="rounded-md bg-warning-soft border border-warning/30 px-4 py-3 text-sm text-warning-deep">
          {vm.error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={vm.total} />
        <StatCard label="In Gmail" value={vm.queued.length} />
        <StatCard label="Sent" value={vm.sent.length} />
        <StatCard label="Replied" value={vm.replied.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queued as Gmail drafts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
              Gmail Drafts
            </CardTitle>
            <p className="text-sm text-body">
              Emails sit here until Gmail sends them — nothing runs on this machine.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {vm.loading ? (
              <p className="text-sm text-mute">Loading…</p>
            ) : vm.queued.length === 0 ? (
              <p className="text-sm text-mute">
                No drafts queued. Start a{" "}
                <Link href="/new" className="text-link hover:underline">
                  new application
                </Link>
                .
              </p>
            ) : (
              vm.queued.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between hover:bg-hairline-soft rounded-md px-2 -mx-2 py-1"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{app.role}</p>
                    <p className="text-[12px] text-mute">{app.company}</p>
                  </div>
                  <span className="font-mono text-[12px] text-mute shrink-0">
                    {app.scheduledSendAt
                      ? formatCountdown(new Date(app.scheduledSendAt))
                      : "in Gmail"}
                  </span>
                </Link>
              ))
            )}
            {vm.queued.length > 0 && (
              <a
                href={DRAFTS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-link hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Open Gmail drafts
              </a>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups Due */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
              Follow-ups Due
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {vm.loading ? (
              <p className="text-sm text-mute">Loading…</p>
            ) : vm.followUpsDue.length === 0 ? (
              <p className="text-sm text-mute">No follow-ups awaiting action.</p>
            ) : (
              vm.followUpsDue.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between hover:bg-hairline-soft rounded-md px-2 -mx-2 py-1"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{app.role}</p>
                    <p className="text-[12px] text-mute">{app.company}</p>
                  </div>
                  <span className="text-[12px] text-warning-deep shrink-0">
                    due {app.followUpAt ? formatCountdown(new Date(app.followUpAt)) : "now"}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold tracking-[-0.4px]">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button render={<Link href="/new" />} nativeButton={false} className="rounded-md h-9">
              New Application
            </Button>
            <Button render={<Link href="/applications" />} variant="ghost" nativeButton={false} className="rounded-md h-9 text-ink">
              View All Applications
            </Button>
            <Button render={<Link href="/settings" />} variant="ghost" nativeButton={false} className="rounded-md h-9 text-ink">
              Settings &amp; Connections
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-4">
          Recent Applications
        </p>
        <div className="border border-hairline rounded-[12px] bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-hairline">
                <Th>Role</Th>
                <Th>Company</Th>
                <Th>Status</Th>
                <Th>Next Step</Th>
              </tr>
            </thead>
            <tbody>
              {vm.loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-mute">
                    Loading applications…
                  </td>
                </tr>
              ) : vm.apps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-mute">
                    No applications yet.{" "}
                    <Link href="/new" className="text-link hover:underline">
                      Create your first one →
                    </Link>
                  </td>
                </tr>
              ) : (
                vm.apps.slice(0, 10).map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-hairline last:border-b-0 hover:bg-hairline-soft"
                  >
                    <Td>
                      <Link href={`/applications/${app.id}`} className="font-medium text-ink hover:underline truncate block max-w-[280px]">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Separator />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-[32px] leading-9 font-semibold tracking-[-0.64px] text-ink">
          {value}
        </p>
        <p className="text-[12px] text-mute mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[12px] uppercase tracking-wide text-mute font-medium">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}