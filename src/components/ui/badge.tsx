import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Server-safe on purpose: the tool pages, homepage and blog are server
 * components, and importing from the client `ui` barrel would drag the whole
 * interactive kit into their bundles.
 */
export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "error" | "navy";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--bg-muted)] text-[var(--fg-muted)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  error: "bg-[var(--error-soft)] text-[var(--error)]",
  navy: "bg-navy-50 text-navy-800 dark:bg-navy-900/60 dark:text-navy-200",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
