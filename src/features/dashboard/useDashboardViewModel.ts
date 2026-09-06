"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listApplications,
  type ApplicationRecord,
} from "@/services/applications";
import { getSettings } from "@/services/settings";
import { isGmailQueued } from "@/lib/status";

export interface DashboardState {
  apps: ApplicationRecord[];
  loading: boolean;
  error: string | null;
  gmailConnected: boolean;
  gmailEmail?: string;
  gmailChecking: boolean;
  total: number;
  queued: ApplicationRecord[];
  sent: ApplicationRecord[];
  replied: ApplicationRecord[];
  followUpsDue: ApplicationRecord[];
}

export function useDashboardViewModel() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | undefined>();
  const [gmailChecking, setGmailChecking] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listApplications();
      setApps(data.applications);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    listApplications()
      .then((data) => {
        if (cancelled) return;
        setApps(data.applications);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getSettings()
      .then((s) => {
        if (!cancelled) {
          setGmailConnected(s.gmail?.connected ?? false);
          setGmailEmail(s.gmail?.email);
        }
      })
      .catch(() => {
        if (!cancelled) setGmailConnected(false);
      })
      .finally(() => {
        if (!cancelled) setGmailChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const queued = apps.filter((a) => isGmailQueued(a.status));
  const sent = apps.filter(
    (a) => ["SENT", "FOLLOW_UP_PENDING", "FOLLOWED_UP"].includes(a.status)
  );
  const replied = apps.filter((a) => a.status === "REPLIED");
  const followUpsDue = apps.filter((a) => a.status === "FOLLOW_UP_PENDING");

  const state: DashboardState = {
    apps,
    loading,
    error,
    gmailConnected,
    gmailEmail,
    gmailChecking,
    total: apps.length,
    queued,
    sent,
    replied,
    followUpsDue,
  };

  return { ...state, reload: load };
}