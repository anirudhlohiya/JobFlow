"use client";

import { useCallback, useState } from "react";
import type { ExtractedJob } from "@/types";
import { createApplication } from "@/services/applications";

export const WIZARD_STEPS = ["Ingest", "Review Extraction", "Resume & Email", "Approve & Queue"];

export interface NewApplicationState {
  step: number;
  job: ExtractedJob | null;
  rawText: string;
  images: string[];
  applicationId: string | null;
  error: string | null;
}

export function useNewApplicationViewModel() {
  const [step, setStep] = useState(0);
  const [job, setJob] = useState<ExtractedJob | null>(null);
  const [rawText, setRawText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setExtracted = useCallback(
    (extracted: ExtractedJob, text: string, imgs: string[]) => {
      setJob(extracted);
      setRawText(text);
      setImages(imgs);
      setError(null);
      setStep(1);
    },
    []
  );

  const saveApplication = useCallback(
    async (finalJob: ExtractedJob): Promise<boolean> => {
      setError(null);
      try {
        const { application } = await createApplication(finalJob, rawText);
        setApplicationId(application.id);
        setJob(finalJob);
        setStep(2);
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [rawText]
  );

  const goTo = useCallback((next: number) => {
    setError(null);
    setStep(next);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setJob(null);
    setRawText("");
    setImages([]);
    setApplicationId(null);
    setError(null);
  }, []);

  const state: NewApplicationState = {
    step,
    job,
    rawText,
    images,
    applicationId,
    error,
  };

  return { ...state, setExtracted, saveApplication, goTo, reset };
}