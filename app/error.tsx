"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert01Icon } from "hugeicons-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our centralized logger
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex max-w-[420px] flex-col items-center space-y-4 rounded-xl border border-border/50 bg-card p-8 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Alert01Icon className="size-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="pt-2">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
