"use client";

import { useCallback, useEffect, useState } from "react";
import * as applicationsService from "@/services/applications";
import type { ApplicationRecord } from "@/services/applications";
import { pdfUrlFor } from "@/services/resume";
import { isGmailQueued, isTerminal } from "@/lib/status";

export interface ApplicationDetailState {
  app: ApplicationRecord | null;
  loading: boolean;
  busy: string | null;
  error: string | null;
  pdfUrl: string | null;
  isQueued: boolean;
  canApprove: boolean;
  skills: string[];
}

export function useApplicationDetailViewModel(id: string) {
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { application } = await applicationsService.getApplication(id);
      setApp(application);
      setPdfUrl(application.tailoredPdfPath ? pdfUrlFor(application.tailoredPdfPath) : null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    applicationsService
      .getApplication(id)
      .then(({ application }) => {
        if (cancelled) return;
        setApp(application);
        setPdfUrl(
          application.tailoredPdfPath ? pdfUrlFor(application.tailoredPdfPath) : null
        );
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const approve = useCallback(async () => {
    if (!app) return;
    setBusy("approve");
    setError(null);
    try {
      const { application } = await applicationsService.approveApplication(app.id);
      setApp(application);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }, [app]);

  const cancel = useCallback(async () => {
    if (!app) return;
    setBusy("cancel");
    setError(null);
    try {
      const { application } = await applicationsService.cancelApplication(app.id);
      setApp(application);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }, [app]);

  const remove = useCallback(async () => {
    if (!app) return;
    await applicationsService.deleteApplication(app.id);
  }, [app]);

  const skills = app ? (JSON.parse(app.skills || "[]") as string[]) : [];
  const isQueued = app ? isGmailQueued(app.status) : false;
  const canApprove = Boolean(
    app && !isTerminal(app.status) && !isQueued && app.emailSubject && app.emailBody
  );

  const state: ApplicationDetailState = {
    app,
    loading,
    busy,
    error,
    pdfUrl,
    isQueued,
    canApprove,
    skills,
  };

  return { ...state, load, approve, cancel, remove };
}