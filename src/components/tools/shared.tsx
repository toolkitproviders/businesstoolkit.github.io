"use client";

import * as React from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui";
import { cn, copyText } from "@/lib/utils";
import { track } from "@/lib/analytics";

/* --------------------------------------------------------- CopyButton ----- */

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "outline",
  size = "sm",
  className,
  onCopied,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={!value}
      onClick={async () => {
        const ok = await copyText(value);
        if (!ok) return;
        setCopied(true);
        onCopied?.();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="text-[var(--success)]" /> : <Copy />}
      {size === "icon" ? null : copied ? copiedLabel : label}
    </Button>
  );
}

/* ------------------------------------------------------- DownloadButton --- */

export interface DownloadButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Produces the blob lazily so heavy work only runs on click. */
  onDownload: () => void | Promise<void>;
  /** Tool slug, for the anonymous download-click event. */
  tool?: string;
  label: string;
}

export function DownloadButton({
  onDownload,
  tool,
  label,
  variant = "primary",
  ...rest
}: DownloadButtonProps) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant={variant}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onDownload();
          if (tool) track("download_clicked", { tool });
        } finally {
          setBusy(false);
        }
      }}
      {...rest}
    >
      <Download />
      {busy ? "Preparing…" : label}
    </Button>
  );
}

/* ------------------------------------------------------ ToolPanel/Result -- */

/** The left-hand settings column shared by every file/image tool. */
export function ToolPanel({
  title,
  description,
  children,
  className,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-card",
        className,
      )}
    >
      {(title || description) && (
        <header className="border-b border-[var(--border)] px-5 py-4">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{description}</p>}
        </header>
      )}
      <div className="space-y-4 p-5">{children}</div>
      {footer && (
        <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-3">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Two-column tool shell: controls on the left, live result on the right. */
export function ToolSplit({
  controls,
  result,
  className,
}: {
  controls: React.ReactNode;
  result: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]", className)}>
      <div className="space-y-6">{controls}</div>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">{result}</div>
    </div>
  );
}

/* ----------------------------------------------------------- Formula ------ */

/** Shows the arithmetic behind a calculator result. */
export function FormulaNote({
  title = "How this is calculated",
  items,
}: {
  title?: string;
  items: { label: string; formula: string; note?: string }[];
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
      <h3 className="text-sm font-semibold text-[var(--fg)]">{title}</h3>
      <dl className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
              {item.label}
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-[var(--fg)]">{item.formula}</dd>
            {item.note && <dd className="mt-0.5 text-xs text-[var(--fg-muted)]">{item.note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------------------------------------------- Proportional bar ---- */

/** Horizontal stacked bar used by the margin and salary calculators. */
export function BreakdownBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total <= 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${((s.value / total) * 100).toFixed(1)}%`}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            {s.label}
            <span className="tabular font-medium text-[var(--fg)]">
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- PrivacyNote ---- */

export function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-xs text-[var(--fg-subtle)]">
      {children ??
        "Everything happens in your browser. Your files are never uploaded to a server."}
    </p>
  );
}
