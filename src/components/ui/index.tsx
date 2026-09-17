"use client";

import * as React from "react";
import { AlertCircle, Check, ChevronDown, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export { Button, ButtonLink, buttonClasses } from "./button";
export type { ButtonProps, ButtonLinkProps } from "./button";

/* ------------------------------------------------------------------ Card -- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-[var(--fg)]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-[var(--fg-muted)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/* ---------------------------------------------------------------- Fields -- */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[var(--fg)]"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--error)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full rounded-lg border bg-[var(--surface)] text-[var(--fg)] transition-colors " +
  "placeholder:text-[var(--fg-subtle)] disabled:cursor-not-allowed disabled:opacity-60 " +
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--ring)]";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-10 px-3 text-sm",
        invalid ? "border-[var(--error)]" : "border-[var(--border-strong)]",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "resize-y border-[var(--border-strong)] px-3 py-2 text-sm", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          controlBase,
          "h-10 appearance-none border-[var(--border-strong)] pl-3 pr-9 text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-subtle)]"
        aria-hidden="true"
      />
    </div>
  );
});

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-[var(--border-strong)] accent-[var(--accent)]"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer select-none text-sm leading-snug text-[var(--fg)]">
        {label}
        {description && (
          <span className="mt-0.5 block text-xs text-[var(--fg-subtle)]">{description}</span>
        )}
      </label>
    </div>
  );
}

export function Slider({
  label,
  value,
  suffix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; suffix?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
          <span className="tabular text-sm text-[var(--fg-muted)]">
            {value}
            {suffix}
          </span>
        </div>
      )}
      <input
        type="range"
        value={value}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--bg-muted)] accent-[var(--accent)]"
        {...props}
      />
    </div>
  );
}

/** Segmented control — better than a select for 2–4 mutually exclusive modes. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--surface)] text-[var(--fg)] shadow-card"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { Badge, type BadgeTone } from "./badge";

/* ---------------------------------------------------------------- Alerts -- */

type AlertTone = "info" | "success" | "warning" | "error";

const alertTones: Record<AlertTone, { wrap: string; icon: React.ReactNode }> = {
  info: {
    wrap: "border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)]",
    icon: <Info className="size-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />,
  },
  success: {
    wrap: "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--fg)]",
    icon: <Check className="size-4 shrink-0 text-[var(--success)]" aria-hidden="true" />,
  },
  warning: {
    wrap: "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--fg)]",
    icon: <TriangleAlert className="size-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />,
  },
  error: {
    wrap: "border-[var(--error)]/30 bg-[var(--error-soft)] text-[var(--fg)]",
    icon: <AlertCircle className="size-4 shrink-0 text-[var(--error)]" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = alertTones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-lg border p-3 text-sm", t.wrap, className)}
    >
      <span className="mt-0.5">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-[var(--fg)]">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded p-0.5 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Stat tile -- */

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "error" | "accent";
  className?: string;
}) {
  const toneClass = {
    neutral: "text-[var(--fg)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    error: "text-[var(--error)]",
    accent: "text-[var(--accent)]",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">{label}</p>
      <p className={cn("tabular mt-1.5 text-2xl font-semibold", toneClass)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--fg-muted)]">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- Spinner ----- */

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-block", className)}>
      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------- Progress ---- */

export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs text-[var(--fg-muted)]">
          <span>{label}</span>
          <span className="tabular">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Switch ---- */

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  const auto = React.useId();
  const inputId = id ?? auto;
  return (
    <div className="flex items-center gap-2.5">
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
      <label htmlFor={inputId} className="cursor-pointer select-none text-sm text-[var(--fg)]">
        {label}
      </label>
    </div>
  );
}

/* ---------------------------------------------------------------- Modal ---- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-navy-950/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-pop sm:rounded-2xl",
          { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-3xl" }[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-[var(--fg-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Tabs ------ */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto border-b border-[var(--border)]", className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-[var(--accent)] text-[var(--fg)]"
                : "border-transparent text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span className="ml-1.5 rounded-full bg-[var(--bg-muted)] px-1.5 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Empty state -- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
      {icon && <div className="mb-3 text-[var(--fg-subtle)]">{icon}</div>}
      <p className="font-medium text-[var(--fg)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--fg-muted)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
