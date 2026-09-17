"use client";

import * as React from "react";
import { Alert, Field, Input, Select, Stat } from "@/components/ui";
import { BreakdownBar, FormulaNote, ToolPanel, ToolSplit } from "@/components/tools/shared";
import { currencies, formatMoney } from "@/lib/currencies";
import { formatPercent, round2, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Frequency = "annual" | "monthly" | "weekly" | "daily" | "hourly";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "annual", label: "Per year" },
  { value: "monthly", label: "Per month" },
  { value: "weekly", label: "Per week" },
  { value: "daily", label: "Per day" },
  { value: "hourly", label: "Per hour" },
];

type DeductionType = "percent" | "fixed";

interface Deduction {
  id: string;
  label: string;
  value: string;
  type: DeductionType;
}

export function SalaryCalculator({ toolSlug }: { toolSlug: string }) {
  const [currency, setCurrency] = React.useState("USD");
  const [gross, setGross] = React.useState("60000");
  const [frequency, setFrequency] = React.useState<Frequency>("annual");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("37.5");
  const [weeksPerYear, setWeeksPerYear] = React.useState("52");
  const [daysPerWeek, setDaysPerWeek] = React.useState("5");

  const [deductions, setDeductions] = React.useState<Deduction[]>([
    { id: "tax", label: "Income tax", value: "20", type: "percent" },
    { id: "pension", label: "Pension / retirement", value: "5", type: "percent" },
    { id: "insurance", label: "Insurance", value: "0", type: "fixed" },
    { id: "other", label: "Other deductions", value: "0", type: "fixed" },
  ]);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const hours = Math.max(0.1, toNumber(hoursPerWeek, 37.5));
  const weeks = Math.max(1, toNumber(weeksPerYear, 52));
  const days = Math.max(1, Math.min(7, toNumber(daysPerWeek, 5)));
  const grossInput = Math.max(0, toNumber(gross));

  // Normalise whatever frequency was entered into an annual figure once.
  const annualGross = round2(
    {
      annual: grossInput,
      monthly: grossInput * 12,
      weekly: grossInput * weeks,
      daily: grossInput * days * weeks,
      hourly: grossInput * hours * weeks,
    }[frequency],
  );

  const applied = deductions.map((d) => {
    const raw = Math.max(0, toNumber(d.value));
    // Fixed deductions are entered per year, matching the annual normalisation.
    const amount = d.type === "percent" ? round2(annualGross * (raw / 100)) : round2(raw);
    return { ...d, amount: Math.min(amount, annualGross) };
  });

  const totalDeductions = round2(
    applied.reduce((sum, d) => sum + d.amount, 0),
  );
  const cappedDeductions = Math.min(totalDeductions, annualGross);
  const annualNet = round2(annualGross - cappedDeductions);
  const effectiveRate = annualGross > 0 ? (cappedDeductions / annualGross) * 100 : 0;

  const money = (value: number) => formatMoney(value, currency);

  const periods = [
    { label: "Per year", gross: annualGross, net: annualNet },
    { label: "Per month", gross: annualGross / 12, net: annualNet / 12 },
    { label: "Per week", gross: annualGross / weeks, net: annualNet / weeks },
    { label: "Per day", gross: annualGross / (weeks * days), net: annualNet / (weeks * days) },
    { label: "Per hour", gross: annualGross / (weeks * hours), net: annualNet / (weeks * hours) },
  ];

  const setDeduction = (id: string, patch: Partial<Deduction>) =>
    setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const overDeducted = totalDeductions > annualGross && annualGross > 0;

  return (
    <ToolSplit
      controls={
        <>
          <ToolPanel title="Salary" description="Enter your gross pay before any deductions.">
            <Field label="Currency" htmlFor="sal-currency">
              <Select
                id="sal-currency"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gross salary" htmlFor="sal-gross">
                <Input
                  id="sal-gross"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={gross}
                  onChange={(e) => setGross(e.target.value)}
                />
              </Field>
              <Field label="Pay frequency" htmlFor="sal-freq">
                <Select
                  id="sal-freq"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Hours per week" htmlFor="sal-hours">
                <Input
                  id="sal-hours"
                  type="number"
                  min={1}
                  max={168}
                  step="0.5"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                />
              </Field>
              <Field label="Days per week" htmlFor="sal-days">
                <Input
                  id="sal-days"
                  type="number"
                  min={1}
                  max={7}
                  step="1"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                />
              </Field>
              <Field label="Weeks per year" htmlFor="sal-weeks">
                <Input
                  id="sal-weeks"
                  type="number"
                  min={1}
                  max={53}
                  step="1"
                  value={weeksPerYear}
                  onChange={(e) => setWeeksPerYear(e.target.value)}
                />
              </Field>
            </div>
          </ToolPanel>

          <ToolPanel
            title="Deductions"
            description="Percentages apply to gross pay. Fixed amounts are per year."
          >
            <div className="space-y-3">
              {deductions.map((d) => (
                <div key={d.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
                  <Field label={d.label} htmlFor={`ded-${d.id}`}>
                    <Input
                      id={`ded-${d.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={d.value}
                      onChange={(e) => setDeduction(d.id, { value: e.target.value })}
                    />
                  </Field>
                  <Select
                    aria-label={`${d.label} type`}
                    value={d.type}
                    onChange={(e) =>
                      setDeduction(d.id, { type: e.target.value as DeductionType })
                    }
                    className="w-28"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Amount</option>
                  </Select>
                  <span className="tabular pb-2.5 text-right text-sm font-medium text-[var(--fg-muted)]">
                    {money(applied.find((a) => a.id === d.id)?.amount ?? 0)}
                  </span>
                </div>
              ))}
            </div>

            {overDeducted && (
              <Alert tone="warning">
                Your deductions add up to more than your gross salary. Net pay is shown as zero.
              </Alert>
            )}
          </ToolPanel>
        </>
      }
      result={
        <>
          <ToolPanel title="Take-home pay">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Gross (year)" value={money(annualGross)} />
              <Stat label="Deductions" value={money(cappedDeductions)} tone="warning" />
              <Stat label="Net (year)" value={money(annualNet)} tone="success" />
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-subtle)] text-left">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium text-[var(--fg-muted)]">
                      Period
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium text-[var(--fg-muted)]">
                      Gross
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium text-[var(--fg-muted)]">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {periods.map((p) => (
                    <tr key={p.label}>
                      <th scope="row" className="px-4 py-2.5 text-left font-normal">
                        {p.label}
                      </th>
                      <td className="tabular px-4 py-2.5 text-right text-[var(--fg-muted)]">
                        {money(p.gross)}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right font-semibold">
                        {money(p.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {annualGross > 0 && (
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-medium">Where your gross pay goes</p>
                  <p className="text-xs text-[var(--fg-muted)]">
                    Effective deduction rate {formatPercent(effectiveRate, 1)}
                  </p>
                </div>
                <BreakdownBar
                  segments={[
                    { label: "Take-home", value: annualNet, color: "#18818a" },
                    ...applied
                      .filter((d) => d.amount > 0)
                      .map((d, i) => ({
                        label: d.label,
                        value: d.amount,
                        color: ["#345aa5", "#6996d4", "#b45309", "#94a3b8"][i % 4],
                      })),
                  ]}
                />
              </div>
            )}

            <Alert tone="warning" title="An estimate, not a payslip">
              This applies the flat rates you enter. It does not model progressive tax bands,
              personal allowances, national insurance thresholds or local rules for any specific
              country. Treat your payslip or an accountant as authoritative.
            </Alert>
          </ToolPanel>

          <FormulaNote
            items={[
              {
                label: "Annual gross",
                formula: "Pay × periods per year",
                note: `Based on ${weeks} weeks, ${days} days per week and ${hours} hours per week.`,
              },
              {
                label: "Net pay",
                formula: "Gross − (percentage deductions + fixed deductions)",
              },
              {
                label: "Hourly rate",
                formula: "Annual pay ÷ (weeks per year × hours per week)",
                note: `${money(annualNet)} ÷ (${weeks} × ${hours}) = ${money(annualNet / (weeks * hours))} net per hour`,
              },
            ]}
          />
        </>
      }
    />
  );
}
