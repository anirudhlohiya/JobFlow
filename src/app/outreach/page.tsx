"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OutreachPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-wide text-mute mb-1">
          Cold Outreach
        </p>
        <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.64px] text-ink">
          Cold Outreach Module
        </h1>
        <p className="text-body mt-1">
          Upload HR contacts, get personalized cold emails, under safety rails.
        </p>
      </div>

      <Card>
        <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-ink text-white flex items-center justify-center text-2xl font-semibold">
            ⏳
          </div>
          <h2 className="text-[20px] font-semibold tracking-[-0.4px] text-ink">
            Coming in Phase 2
          </h2>
          <p className="text-sm text-body max-w-md">
            Batch ingestion, contact CSV import, per-contact AI cold emails, the 10→50/day
            safety ramp, follow-up sequences, and reply detection land in the next milestone.
          </p>
          <div className="flex gap-3 mt-2">
            <Button render={<Link href="/new" />} nativeButton={false} className="rounded-md h-9 bg-ink text-white hover:bg-ink/90">
              Start an Application
            </Button>
            <Button render={<Link href="/docs/06-DELIVERABILITY-PLAYBOOK.md" />} variant="outline" nativeButton={false} className="rounded-md h-9 bg-white text-ink border-hairline hover:bg-hairline-soft">
              Read the Deliverability Playbook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
