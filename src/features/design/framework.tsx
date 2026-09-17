"use client";

import * as React from "react";
import { Check, Copy, Pipette, RefreshCw, RotateCcw } from "lucide-react";
import { Alert, Button, Checkbox, Field, Input, Select, Slider, Stat } from "@/components/ui";
import { CopyButton, FormulaNote, PrivacyNote, ToolPanel, ToolSplit } from "@/components/tools/shared";
import { cn, copyText } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { readableTextColor, parseColor } from "./color";
import {
  buildDesignHelpers,
  type DesignField,
  type DesignResult,
  type DesignToolDef,
  type DesignValues,
} from "./types";

export * from "./types";

/**
 * Declarative engine for the colour and CSS tools.
 *
 * Controls on the left, a live preview and the generated CSS on the right.
 * Deterministic tools compute during the render pass so the server-rendered
 * page already shows the result; the random ones wait for mount.
 */

function initialValues(def: DesignToolDef): DesignValues {
  const values: DesignValues = {};
  for (const field of def.fields) values[field.key] = field.initial ?? "";
  return values;
}

export function DesignTool({ def, toolSlug }: { def: DesignToolDef; toolSlug: string }) {
  const [values, setValues] = React.useState<DesignValues>(() => initialValues(def));
  const [nonce, setNonce] = React.useState(0);
  const [deferredResult, setDeferredResult] = React.useState<DesignResult | null>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const valuesKey = JSON.stringify(values);

  const renderedResult = React.useMemo<DesignResult | null>(() => {
    if (def.deferred) return null;
    const current: DesignValues = JSON.parse(valuesKey);
    try {
      return def.compute(current, buildDesignHelpers(current));
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Those settings could not be applied." };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, valuesKey, nonce]);

  React.useEffect(() => {
    if (!def.deferred) return;
    const current: DesignValues = JSON.parse(valuesKey);
    try {
      setDeferredResult(def.compute(current, buildDesignHelpers(current)));
    } catch (err) {
      setDeferredResult({
        error: err instanceof Error ? err.message : "Those settings could not be applied.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, valuesKey, nonce]);

  const result: DesignResult = renderedResult ?? deferredResult ?? {};
  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const visibleFields = def.fields.filter((f) => !f.when || f.when(values));

  return (
    <ToolSplit
      controls={
        <ToolPanel
          title={def.controlsTitle ?? "Settings"}
          description={def.controlsDescription}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValues(initialValues(def));
                  setNonce((n) => n + 1);
                }}
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleFields.map((field) => (
              <DesignFieldInput
                key={field.key}
                field={field}
                id={`${toolSlug}-${field.key}`}
                value={values[field.key] ?? ""}
                onChange={(v) => set(field.key, v)}
              />
            ))}
          </div>

          {def.generate && (
            <Button onClick={() => setNonce((n) => n + 1)} className="w-full">
              <RefreshCw className="size-4" />
              {def.generate.label}
            </Button>
          )}
        </ToolPanel>
      }
      result={
        <>
          <ToolPanel title={def.resultTitle ?? "Result"}>
            {result.error ? (
              <Alert tone="error" title="Could not apply those settings">
                {result.error}
              </Alert>
            ) : (
              <>
                {result.preview && <Preview preview={result.preview} />}

                {result.stats && result.stats.length > 0 && (
                  <div
                    className={
                      result.stats.length <= 2
                        ? "grid gap-3 sm:grid-cols-2"
                        : "grid grid-cols-2 gap-3 lg:grid-cols-3"
                    }
                  >
                    {result.stats.map((stat) => (
                      <Stat
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        sub={stat.sub}
                        tone={stat.tone}
                      />
                    ))}
                  </div>
                )}

                {result.swatches && result.swatches.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {result.swatches.map((swatch, i) => (
                      <SwatchTile key={`${swatch.color}-${i}`} {...swatch} />
                    ))}
                  </div>
                )}

                {result.rows && result.rows.length > 0 && (
                  <dl className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
                    {result.rows.map((row) => (
                      <div key={row.label} className="flex items-center gap-3 px-3 py-2">
                        <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
                          {row.label}
                        </dt>
                        <dd className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--fg)]">
                          {row.value}
                        </dd>
                        <CopyButton
                          value={row.value}
                          label=""
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0 opacity-60 hover:opacity-100"
                        />
                      </div>
                    ))}
                  </dl>
                )}

                {result.warning && <Alert tone="warning">{result.warning}</Alert>}
                {result.note && <Alert tone="info">{result.note}</Alert>}

                {result.code?.map((block) => (
                  <div key={block.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-[var(--fg)]">{block.label}</h3>
                      <CopyButton value={block.value} label="Copy" />
                    </div>
                    <pre className="thin-scroll max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)]">
                      {block.value}
                    </pre>
                  </div>
                ))}
              </>
            )}

            <PrivacyNote>
              Everything is generated in your browser. Nothing you enter is sent to a server.
            </PrivacyNote>
          </ToolPanel>

          {def.notes && def.notes.length > 0 && <FormulaNote title="Reference" items={def.notes} />}
        </>
      }
    />
  );
}

/* ----------------------------------------------------------------- parts -- */

function Preview({ preview }: { preview: NonNullable<DesignResult["preview"]> }) {
  if (preview.kind === "text") {
    return (
      <div
        className="rounded-lg border border-[var(--border)] p-6"
        style={{ backgroundColor: preview.background, color: preview.foreground }}
      >
        <p className="text-2xl font-semibold">Large heading text</p>
        <p className="mt-2 text-base">
          Body copy at a normal size, which is what the AA and AAA thresholds are measured against.
        </p>
        <p className="mt-2 text-sm">Small print, captions and helper text.</p>
      </div>
    );
  }

  if (preview.kind === "button") {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-lg border border-[var(--border)] bg-[repeating-conic-gradient(var(--bg-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-6">
        <button type="button" style={preview.style}>
          {preview.label}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-[var(--border)] bg-[repeating-conic-gradient(var(--bg-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-8">
      <div style={preview.style} className="flex items-center justify-center">
        {preview.label && (
          <span className="px-3 text-sm font-medium text-[var(--fg-muted)]">{preview.label}</span>
        )}
      </div>
    </div>
  );
}

function SwatchTile({ label, color, sub }: { label: string; color: string; sub?: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const parsed = parseColor(color);
  const textColor = parsed ? readableTextColor(parsed) : "#000000";

  return (
    <button
      type="button"
      title={`Copy ${color}`}
      aria-label={`Copy ${label}, ${color}`}
      onClick={async () => {
        if (!(await copyText(color))) return;
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
      className="group relative flex h-24 w-full flex-col justify-end rounded-lg border border-[var(--border)] p-2.5 text-left transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: color }}
    >
      <span className="text-[11px] font-medium opacity-80" style={{ color: textColor }}>
        {label}
      </span>
      <span className="font-mono text-xs font-semibold" style={{ color: textColor }}>
        {color}
      </span>
      {sub && (
        <span className="text-[10px] opacity-75" style={{ color: textColor }}>
          {sub}
        </span>
      )}
      <span
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: textColor }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  );
}

function DesignFieldInput({
  field,
  id,
  value,
  onChange,
}: {
  field: DesignField;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const wrapper = field.wide ? "sm:col-span-2" : undefined;

  if (field.type === "checkbox") {
    return (
      <div className={cn("flex items-center", wrapper)}>
        <Checkbox
          label={field.label}
          description={field.hint}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked ? "1" : "")}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} htmlFor={id} hint={field.hint} className={wrapper}>
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  if (field.type === "range") {
    return (
      <div className={wrapper}>
        <Slider
          label={field.label}
          value={value}
          suffix={field.suffix}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.hint && <p className="mt-1 text-xs text-[var(--fg-subtle)]">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "color") {
    return <ColorFieldInput field={field} id={id} value={value} onChange={onChange} wrapper={wrapper} />;
  }

  return (
    <Field label={field.label} htmlFor={id} hint={field.hint} className={wrapper}>
      <div className="relative">
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          inputMode={field.type === "number" ? "decimal" : undefined}
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={field.suffix ? "pr-10" : undefined}
        />
        {field.suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
            {field.suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

function ColorFieldInput({
  field,
  id,
  value,
  onChange,
  wrapper,
}: {
  field: DesignField;
  id: string;
  value: string;
  onChange: (value: string) => void;
  wrapper?: string;
}) {
  const parsed = parseColor(value);
  const hexForPicker = parsed
    ? `#${[parsed.r, parsed.g, parsed.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
    : "#888888";

  // Chrome and Edge expose a system-wide eyedropper; everyone else gets the
  // swatch picker only, so the button is hidden rather than broken.
  const [hasDropper, setHasDropper] = React.useState(false);
  React.useEffect(() => {
    setHasDropper(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  const pick = async () => {
    try {
      const Dropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } })
        .EyeDropper;
      const { sRGBHex } = await new Dropper().open();
      onChange(sRGBHex);
    } catch {
      // The visitor dismissed the picker; nothing to do.
    }
  };

  return (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint ?? (parsed ? undefined : "Try #2563eb, rgb(37 99 235) or “navy”")}
      error={value && !parsed ? "Not a colour this browser can read" : undefined}
      className={wrapper}
    >
      <div className="flex gap-2">
        <label
          className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--border-strong)]"
          style={{ backgroundColor: parsed ? hexForPicker : "transparent" }}
        >
          <span className="sr-only">Pick {field.label}</span>
          <input
            type="color"
            value={hexForPicker}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
          placeholder="#2563eb"
        />
        {hasDropper && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Pick a colour from the screen"
            title="Pick a colour from the screen"
            onClick={pick}
            className="size-10 shrink-0"
          >
            <Pipette className="size-4" />
          </Button>
        )}
      </div>
    </Field>
  );
}
