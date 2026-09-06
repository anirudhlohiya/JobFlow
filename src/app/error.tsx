"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-[12px] uppercase tracking-wide text-warning-deep">
        Something went wrong
      </p>
      <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.56px] text-ink max-w-md">
        The page hit an unexpected error. It has been logged to the console.
      </h1>
      {error.message && (
        <p className="text-sm text-body font-mono bg-hairline-soft rounded-md px-4 py-2 max-w-lg truncate">
          {error.message}
        </p>
      )}
      <Button onClick={reset} className="rounded-md h-10 px-5 bg-ink text-white hover:bg-ink/90">
        Try Again
      </Button>
    </div>
  );
}