"use client";

import { Alert01Icon } from "hugeicons-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen w-full flex-col items-center justify-center bg-[#09090b] text-[#fafafa] font-sans px-4 text-center">
        <div className="flex max-w-[420px] flex-col items-center space-y-4 rounded-xl border border-white/10 bg-[#09090b] p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-900/20 text-red-500">
            <Alert01Icon className="size-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Critical Error</h2>
          <p className="text-sm text-zinc-400">
            A fatal application error occurred. We apologize for the inconvenience.
          </p>
          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
