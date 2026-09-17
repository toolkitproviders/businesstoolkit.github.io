"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";

/**
 * Top-level error boundary. Users see a plain explanation and a way forward —
 * never a stack trace. The digest is shown only so a report can be matched to
 * a server log entry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-[var(--fg-muted)]">
        This page hit an unexpected error. Nothing you were working on was sent anywhere — if a tool
        had your file open, it is still on your device.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RefreshCw />
          Try again
        </Button>
        <ButtonLink href="/tools" variant="outline" size="lg">
          Browse all tools
        </ButtonLink>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-xs text-[var(--fg-subtle)]">
          Reference: {error.digest}
        </p>
      )}

      <p className="mt-4 text-sm text-[var(--fg-subtle)]">
        If it keeps happening,{" "}
        <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
          tell us what you were doing
        </Link>
        .
      </p>
    </div>
  );
}
