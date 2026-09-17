"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Alert, Button, Field, Input, SegmentedControl, Select, Stat } from "@/components/ui";
import {
  BreakdownBar,
  CopyButton,
  FormulaNote,
  PrivacyNote,
  ToolPanel,
  ToolSplit,
} from "@/components/tools/shared";
import { currencies } from "@/lib/currencies";
import { track } from "@/lib/analytics";
import { buildHelpers, type CalcField, type CalculatorDef, type CalcResult, type CalcValues } from "./types";

export * from "./types";

/**
 * Declarative calculator engine.
 *
 * Every calculator on the site is a `CalculatorDef` — a list of inputs plus a
 * pure `compute` function — rather than a bespoke component. That keeps the
 * arithmetic (the part that must be right) in plain testable functions, and
 * means a new calculator is a few dozen lines of configuration with the
 * layout, accessibility, currency handling and formula notes already solved.
 */

function initialValues(def: CalculatorDef): CalcValues {
  const values: CalcValues = {};
  if (def.modes) values[def.modes.key] = def.modes.options[0].value;
  for (const field of def.fields) values[field.key] = field.initial ?? "";
  return values;
}

export function Calculator({
  def,
  toolSlug,
}: {
  def: CalculatorDef;
  toolSlug: string;
}) {
  const [values, setValues] = React.useState<CalcValues>(() => initialValues(def));
  const [currency, setCurrency] = React.useState("USD");

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setValues(initialValues(def));
  };

  // A definition should never be able to blank the page; surface the failure.
  let result: CalcResult;
  let failed = false;
  try {
    result = def.compute(values, buildHelpers(values, currency));
  } catch {
    failed = true;
    result = { outputs: [] };
  }

  const visibleFields = def.fields.filter((f) => !f.when || f.when(values));

  return (
    <ToolSplit
      controls={
        <ToolPanel
          title={def.inputTitle ?? "Your numbers"}
          description={def.inputDescription}
          footer={
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
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

          {def.currency && (
            <Field label="Currency" htmlFor={`${toolSlug}-currency`}>
              <Select
                id={`${toolSlug}-currency`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {visibleFields.map((field) => (
              <CalcFieldInput
                key={field.key}
                field={field}
                id={`${toolSlug}-${field.key}`}
                value={values[field.key] ?? ""}
                onChange={(v) => set(field.key, v)}
              />
            ))}
          </div>
        </ToolPanel>
      }
      result={
        <>
          <ToolPanel title={def.resultTitle ?? "Results"}>
            {failed ? (
              <Alert tone="error">
                Those values could not be calculated. Check the inputs and try again.
              </Alert>
            ) : (
              <>
                <div
                  className={
                    result.outputs.length <= 2
                      ? "grid gap-3 sm:grid-cols-2"
                      : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  }
                >
                  {result.outputs.map((output) => (
                    <div key={output.label} className="relative">
                      <Stat
                        label={output.label}
                        value={output.value}
                        sub={output.sub}
                        tone={output.tone}
                      />
                      <CopyButton
                        value={output.copy ?? output.value}
                        label=""
                        size="icon"
                        variant="ghost"
                        className="absolute right-1.5 top-1.5 size-7 opacity-60 hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>

                {result.segments && result.segments.length > 0 && (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <BreakdownBar segments={result.segments} />
                  </div>
                )}

                {result.warning && <Alert tone="warning">{result.warning}</Alert>}
                {result.note && <Alert tone="info">{result.note}</Alert>}

                {result.table && result.table.rows.length > 0 && (
                  <div className="thin-scroll max-h-80 overflow-auto rounded-lg border border-[var(--border)]">
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
                                    ? "px-3 py-1.5 text-left"
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
              </>
            )}

            <PrivacyNote>
              Everything is calculated in your browser. Nothing you enter is sent anywhere.
            </PrivacyNote>
          </ToolPanel>

          {def.formulas && def.formulas.length > 0 && <FormulaNote items={def.formulas} />}
        </>
      }
    />
  );
}

function CalcFieldInput({
  field,
  id,
  value,
  onChange,
}: {
  field: CalcField;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const wrapper = field.wide ? "sm:col-span-2" : undefined;

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

  const isNumeric = field.type === "number" || field.type === "currency" || field.type === "percent";
  const suffix = field.suffix ?? (field.type === "percent" ? "%" : undefined);

  return (
    <Field label={field.label} htmlFor={id} hint={field.hint} className={wrapper}>
      <div className="relative">
        <Input
          id={id}
          type={field.type === "date" ? "date" : isNumeric ? "number" : "text"}
          inputMode={isNumeric ? "decimal" : undefined}
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === "currency" ? "0.01" : undefined)}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={suffix ? "pr-9" : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}
