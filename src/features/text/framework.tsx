"use client";

import * as React from "react";
import { Download, FileUp, RefreshCw, RotateCcw, Wand2 } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  SegmentedControl,
  Select,
  Stat,
  Textarea,
} from "@/components/ui";
import {
  CopyButton,
  FormulaNote,
  PrivacyNote,
  ToolPanel,
  ToolSplit,
} from "@/components/tools/shared";
import { cn, downloadText, sanitizeFilename } from "@/lib/utils";
import { track } from "@/lib/analytics";
import {
  buildTextHelpers,
  type TextOption,
  type TextResult,
  type TextToolDef,
  type TextValues,
} from "./types";

export * from "./types";

/**
 * Declarative text-tool engine.
 *
 * Counters, converters, cleaners, formatters and encoders all share this one
 * shell: input on the left, live result on the right, with Copy and Download
 * already wired up. Each tool supplies only its options and its transform.
 *
 * Transforms may return a promise — the formatters lazily import their
 * library, and the hash tool awaits SubtleCrypto — so the result is held in
 * state and stale runs are discarded rather than racing each other.
 */

const MAX_INPUT = 2_000_000; // ~2 MB of text; past this the browser stalls

function initialValues(def: TextToolDef): TextValues {
  const values: TextValues = {};
  if (def.modes) values[def.modes.key] = def.modes.options[0].value;
  for (const option of def.options ?? []) values[option.key] = option.initial ?? "";
  return values;
}

export function TextTool({ def, toolSlug }: { def: TextToolDef; toolSlug: string }) {
  const [input, setInput] = React.useState(def.input?.initial ?? "");
  const [values, setValues] = React.useState<TextValues>(() => initialValues(def));
  const [nonce, setNonce] = React.useState(0);
  const [deferredResult, setDeferredResult] = React.useState<TextResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [fileNote, setFileNote] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  // Option values are compared by content: a new object identity every render
  // would otherwise re-run the transform forever.
  const valuesKey = JSON.stringify(values);

  const failed = (err: unknown): TextResult => ({
    error: err instanceof Error ? err.message : "That input could not be processed.",
  });

  // A deterministic transform runs during the render pass, so the answer is
  // already in the HTML the server sends — visible before any JavaScript has
  // loaded, and indexable. Only the tools that cannot do that (random,
  // clock-reading, or awaiting a library) wait for the effect below.
  const renderedResult = React.useMemo<TextResult | null>(() => {
    if (def.deferred) return null;
    const current: TextValues = JSON.parse(valuesKey);
    try {
      const produced = def.transform(input, current, buildTextHelpers(current));
      return produced instanceof Promise ? null : produced;
    } catch (err) {
      return failed(err);
    }
    // `nonce` is a dependency so the Shuffle button re-runs a random ordering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, input, valuesKey, nonce]);

  React.useEffect(() => {
    if (!def.deferred) return;
    let cancelled = false;
    const current: TextValues = JSON.parse(valuesKey);

    const finish = (next: TextResult) => {
      if (cancelled) return;
      setDeferredResult(next);
      setBusy(false);
    };

    try {
      const produced = def.transform(input, current, buildTextHelpers(current));
      if (produced instanceof Promise) {
        setBusy(true);
        produced.then(finish).catch((err: unknown) => finish(failed(err)));
      } else {
        finish(produced);
      }
    } catch (err) {
      finish(failed(err));
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, input, valuesKey, nonce]);

  const result: TextResult = renderedResult ?? deferredResult ?? {};

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setInput(def.input?.initial ?? "");
    setValues(initialValues(def));
    setDeferredResult(null);
    setFileNote(null);
    setNonce((n) => n + 1);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const name = sanitizeFilename(file.name, "file.txt");
    if (file.size > MAX_INPUT) {
      setFileNote(`${name} is too large to open here (limit ${Math.round(MAX_INPUT / 1e6)} MB).`);
      return;
    }
    // Read locally. The file is never sent anywhere.
    const text = await file.text();
    setInput(text.slice(0, MAX_INPUT));
    setFileNote(`Opened ${name} in your browser.`);
  };

  const visibleOptions = (def.options ?? []).filter((o) => !o.when || o.when(values));
  const hasOutput = typeof result.output === "string" || Boolean(result.spans);
  const downloadName = result.filename ?? `${toolSlug}.txt`;

  return (
    <ToolSplit
      controls={
        <ToolPanel
          title={def.controlsTitle ?? def.input?.label ?? "Options"}
          description={def.input?.hint}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              {def.input?.sample && (
                <Button variant="ghost" size="sm" onClick={() => setInput(def.input!.sample!)}>
                  <Wand2 className="size-3.5" />
                  Load sample
                </Button>
              )}
              {def.input?.accept && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                    <FileUp className="size-3.5" />
                    Open a file
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={def.input.accept}
                    className="sr-only"
                    onChange={(e) => {
                      void onFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>
          }
        >
          {def.modes && (
            <SegmentedControl
              ariaLabel={def.modes.label ?? "Mode"}
              value={values[def.modes.key] ?? def.modes.options[0].value}
              onChange={(v) => set(def.modes!.key, v)}
              options={def.modes.options}
            />
          )}

          {def.input && (
            // The panel header already names this box, so the label is for
            // screen readers only rather than repeated on screen.
            <div className="space-y-1.5">
              <label htmlFor={`${toolSlug}-input`} className="sr-only">
                {def.input.label ?? "Input"}
              </label>
              <Textarea
                id={`${toolSlug}-input`}
                rows={def.input.rows ?? 12}
                spellCheck={!def.input.mono}
                value={input}
                placeholder={def.input.placeholder}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
                className={cn(def.input.mono && "font-mono text-[13px] leading-relaxed")}
              />
              {input.length > 0 && (
                <p className="text-xs text-[var(--fg-subtle)]">
                  {input.length.toLocaleString()} characters
                </p>
              )}
            </div>
          )}

          {fileNote && <p className="text-xs text-[var(--fg-subtle)]">{fileNote}</p>}

          {visibleOptions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleOptions.map((option) => (
                <TextOptionInput
                  key={option.key}
                  option={option}
                  id={`${toolSlug}-${option.key}`}
                  value={values[option.key] ?? ""}
                  onChange={(v) => set(option.key, v)}
                />
              ))}
            </div>
          )}

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
          <ToolPanel
            title={def.output?.label ?? "Result"}
            footer={
              hasOutput && result.output ? (
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={result.output} label="Copy result" />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!result.output}
                    onClick={() => downloadText(result.output ?? "", downloadName)}
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              ) : undefined
            }
          >
            {result.preview && <ResultPreview preview={result.preview} />}

            {result.stats && result.stats.length > 0 && (
              <div
                className={
                  result.stats.length <= 2
                    ? "grid gap-3 sm:grid-cols-2"
                    : "grid gap-3 grid-cols-2 lg:grid-cols-3"
                }
              >
                {result.stats.map((stat) => (
                  <div key={stat.label} className="relative">
                    <Stat label={stat.label} value={stat.value} sub={stat.sub} tone={stat.tone} />
                    <CopyButton
                      value={stat.value}
                      label=""
                      size="icon"
                      variant="ghost"
                      className="absolute right-1.5 top-1.5 size-7 opacity-60 hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            )}

            {result.error ? (
              <Alert tone="error" title="Could not process that input">
                {result.error}
              </Alert>
            ) : busy ? (
              <p className="text-sm text-[var(--fg-muted)]">Working…</p>
            ) : result.spans ? (
              <pre
                className={cn(
                  "thin-scroll max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-[13px] leading-relaxed",
                  "font-mono",
                )}
              >
                {result.spans.map((span, i) => (
                  <span key={i} className={SPAN_TONES[span.tone ?? "plain"]}>
                    {span.text}
                  </span>
                ))}
              </pre>
            ) : typeof result.output === "string" ? (
              result.output ? (
                <Textarea
                  readOnly
                  aria-label={def.output?.label ?? "Result"}
                  rows={def.output?.rows ?? 12}
                  value={result.output}
                  className={cn(
                    "bg-[var(--bg-subtle)]",
                    def.output?.mono !== false && "font-mono text-[13px] leading-relaxed",
                  )}
                />
              ) : (
                <p className="text-sm text-[var(--fg-muted)]">
                  {def.input ? "Your result will appear here as you type." : "No result yet."}
                </p>
              )
            ) : null}

            {result.warning && <Alert tone="warning">{result.warning}</Alert>}
            {result.note && <Alert tone="info">{result.note}</Alert>}

            {result.table && result.table.rows.length > 0 && (
              <div className="thin-scroll max-h-96 overflow-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  {result.table.caption && (
                    <caption className="sr-only">{result.table.caption}</caption>
                  )}
                  <thead className="sticky top-0 bg-[var(--bg-subtle)]">
                    <tr>
                      {result.table.head.map((cell, i) => (
                        <th
                          key={cell}
                          scope="col"
                          className={
                            i === 0
                              ? "px-3 py-2 text-left font-medium text-[var(--fg-muted)]"
                              : "px-3 py-2 text-right font-medium text-[var(--fg-muted)]"
                          }
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {result.table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={
                              j === 0
                                ? "max-w-[18rem] truncate px-3 py-1.5 text-left"
                                : "tabular px-3 py-1.5 text-right"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <PrivacyNote>
              {def.privacyNote ??
                "Your text is processed locally in your browser. Nothing you paste is uploaded to a server."}
            </PrivacyNote>
          </ToolPanel>

          {def.notes && def.notes.length > 0 && (
            <FormulaNote title="Reference" items={def.notes} />
          )}
        </>
      }
    />
  );
}

/** Mock-ups of a Google result and a shared social card. Text only. */
function ResultPreview({ preview }: { preview: NonNullable<TextResult["preview"]> }) {
  if (preview.kind === "serp") {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
          How this looks in search results
        </p>
        <p className="truncate text-xs text-[var(--fg-muted)]">{preview.url || "example.com"}</p>
        <p className="mt-0.5 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
          {preview.title || "Your page title"}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-muted)]">
          {preview.description || "Your meta description appears here, trimmed to fit the width of the result."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
        How this looks when shared on {preview.network}
      </p>
      <div className="overflow-hidden rounded-lg border border-[var(--border-strong)]">
        <div className="flex aspect-[1.91/1] items-center justify-center bg-[var(--bg-muted)] px-4 text-center">
          <span className="truncate text-xs text-[var(--fg-subtle)]">
            {preview.image ? preview.image : "No image set — add one at 1200 × 630"}
          </span>
        </div>
        <div className="space-y-1 bg-[var(--bg-subtle)] p-3">
          <p className="truncate text-xs uppercase tracking-wide text-[var(--fg-subtle)]">
            {preview.site || "example.com"}
          </p>
          <p className="truncate text-sm font-semibold text-[var(--fg)]">
            {preview.title || "Your title"}
          </p>
          <p className="line-clamp-2 text-xs text-[var(--fg-muted)]">
            {preview.description || "Your description appears here."}
          </p>
        </div>
      </div>
    </div>
  );
}

const SPAN_TONES: Record<string, string> = {
  plain: "",
  match: "rounded bg-[var(--accent-soft)] font-semibold text-[var(--fg)] ring-1 ring-[var(--accent)]/40",
  add: "block bg-[var(--success-soft)] text-[var(--fg)]",
  remove: "block bg-[var(--error-soft)] text-[var(--fg)] line-through decoration-[var(--error)]/50",
  muted: "text-[var(--fg-subtle)]",
};

function TextOptionInput({
  option,
  id,
  value,
  onChange,
}: {
  option: TextOption;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const wrapper = option.wide ? "sm:col-span-2" : undefined;

  if (option.type === "checkbox") {
    return (
      <div className={cn("flex items-center", wrapper)}>
        <Checkbox
          label={option.label}
          description={option.hint}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked ? "1" : "")}
        />
      </div>
    );
  }

  if (option.type === "textarea") {
    return (
      <Field label={option.label} htmlFor={id} hint={option.hint} className={wrapper}>
        <Textarea
          id={id}
          rows={option.rows ?? 10}
          spellCheck={!option.mono}
          value={value}
          placeholder={option.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(option.mono && "font-mono text-[13px] leading-relaxed")}
        />
      </Field>
    );
  }

  if (option.type === "select") {
    return (
      <Field label={option.label} htmlFor={id} hint={option.hint} className={wrapper}>
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {(option.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  const inputType =
    option.type === "number"
      ? "number"
      : option.type === "date"
        ? "date"
        : option.type === "time"
          ? "time"
          : option.type === "datetime"
            ? "datetime-local"
            : "text";

  return (
    <Field label={option.label} htmlFor={id} hint={option.hint} className={wrapper}>
      <Input
        id={id}
        type={inputType}
        inputMode={option.type === "number" ? "numeric" : undefined}
        min={option.min}
        max={option.max}
        step={option.step}
        value={value}
        placeholder={option.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
