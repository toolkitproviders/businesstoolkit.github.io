"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Alert, Field, Input, SegmentedControl, Select, Stat } from "@/components/ui";
import { BreakdownBar, CopyButton, FormulaNote, ToolPanel, ToolSplit } from "@/components/tools/shared";
import { currencies, formatMoney } from "@/lib/currencies";
import { round2, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Mode = "add" | "remove";

interface TaxRegion {
  country: string;
  label: string;
  rates: { name: string; rate: number }[];
}

/**
 * Presets are a convenience, not tax advice. The country list is deliberately
 * shaped so more jurisdictions can be added without touching the component.
 */
const REGIONS: TaxRegion[] = [
  { country: "custom", label: "Custom rate", rates: [] },
  {
    country: "gb", label: "United Kingdom (VAT)",
    rates: [
      { name: "Standard", rate: 20 },
      { name: "Reduced", rate: 5 },
      { name: "Zero", rate: 0 },
    ],
  },
  {
    country: "ie", label: "Ireland (VAT)",
    rates: [
      { name: "Standard", rate: 23 },
      { name: "Reduced", rate: 13.5 },
      { name: "Second reduced", rate: 9 },
    ],
  },
  {
    country: "de", label: "Germany (USt)",
    rates: [
      { name: "Standard", rate: 19 },
      { name: "Reduced", rate: 7 },
    ],
  },
  {
    country: "fr", label: "France (TVA)",
    rates: [
      { name: "Standard", rate: 20 },
      { name: "Intermediate", rate: 10 },
      { name: "Reduced", rate: 5.5 },
    ],
  },
  {
    country: "es", label: "Spain (IVA)",
    rates: [
      { name: "Standard", rate: 21 },
      { name: "Reduced", rate: 10 },
      { name: "Super-reduced", rate: 4 },
    ],
  },
  {
    country: "it", label: "Italy (IVA)",
    rates: [
      { name: "Standard", rate: 22 },
      { name: "Reduced", rate: 10 },
    ],
  },
  {
    country: "nl", label: "Netherlands (BTW)",
    rates: [
      { name: "Standard", rate: 21 },
      { name: "Reduced", rate: 9 },
    ],
  },
  {
    country: "ae", label: "United Arab Emirates (VAT)",
    rates: [{ name: "Standard", rate: 5 }],
  },
  {
    country: "sa", label: "Saudi Arabia (VAT)",
    rates: [{ name: "Standard", rate: 15 }],
  },
  {
    country: "pk", label: "Pakistan (Sales Tax)",
    rates: [
      { name: "Standard", rate: 18 },
      { name: "Services (varies)", rate: 15 },
    ],
  },
  {
    country: "in", label: "India (GST)",
    rates: [
      { name: "GST 28%", rate: 28 },
      { name: "GST 18%", rate: 18 },
      { name: "GST 12%", rate: 12 },
      { name: "GST 5%", rate: 5 },
    ],
  },
  {
    country: "au", label: "Australia (GST)",
    rates: [{ name: "Standard", rate: 10 }],
  },
  {
    country: "nz", label: "New Zealand (GST)",
    rates: [{ name: "Standard", rate: 15 }],
  },
  {
    country: "ca", label: "Canada (GST/HST)",
    rates: [
      { name: "GST", rate: 5 },
      { name: "HST (ON)", rate: 13 },
      { name: "HST (NS/NB/NL/PE)", rate: 15 },
    ],
  },
  {
    country: "za", label: "South Africa (VAT)",
    rates: [{ name: "Standard", rate: 15 }],
  },
  {
    country: "sg", label: "Singapore (GST)",
    rates: [{ name: "Standard", rate: 9 }],
  },
  {
    country: "jp", label: "Japan (Consumption Tax)",
    rates: [
      { name: "Standard", rate: 10 },
      { name: "Reduced", rate: 8 },
    ],
  },
];

export function VatTaxCalculator({ toolSlug }: { toolSlug: string }) {
  const [mode, setMode] = React.useState<Mode>("add");
  const [amount, setAmount] = React.useState("100");
  const [rate, setRate] = React.useState("20");
  const [region, setRegion] = React.useState("gb");
  const [currency, setCurrency] = React.useState("USD");

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const amountValue = Math.max(0, toNumber(amount));
  const rateValue = Math.max(0, toNumber(rate));
  const selectedRegion = REGIONS.find((r) => r.country === region) ?? REGIONS[0];

  // Add: the entered amount is net. Remove: the entered amount is gross.
  const net = mode === "add" ? amountValue : round2(amountValue / (1 + rateValue / 100));
  const tax = mode === "add" ? round2(amountValue * (rateValue / 100)) : round2(amountValue - net);
  const gross = mode === "add" ? round2(amountValue + tax) : amountValue;

  const money = (value: number) => formatMoney(value, currency);

  return (
    <ToolSplit
      controls={
        <ToolPanel title="Calculate tax" description="Add tax to a net figure, or strip it out of a gross one.">
          <SegmentedControl<Mode>
            ariaLabel="Tax mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "add", label: "Add tax", icon: <Plus className="size-4" /> },
              { value: "remove", label: "Remove tax", icon: <Minus className="size-4" /> },
            ]}
          />

          <Field
            label={mode === "add" ? "Amount excluding tax (net)" : "Amount including tax (gross)"}
            htmlFor="vat-amount"
            hint={
              mode === "add"
                ? "The price before tax is applied."
                : "The total the customer paid, tax included."
            }
          >
            <Input
              id="vat-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field label="Country or region" htmlFor="vat-region">
            <Select
              id="vat-region"
              value={region}
              onChange={(e) => {
                const next = e.target.value;
                setRegion(next);
                const found = REGIONS.find((r) => r.country === next);
                if (found?.rates.length) setRate(String(found.rates[0].rate));
              }}
            >
              {REGIONS.map((r) => (
                <option key={r.country} value={r.country}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>

          {selectedRegion.rates.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--fg)]">Preset rates</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegion.rates.map((preset) => {
                  const active = toNumber(rate) === preset.rate;
                  return (
                    <button
                      key={`${preset.name}-${preset.rate}`}
                      type="button"
                      onClick={() => setRate(String(preset.rate))}
                      aria-pressed={active}
                      className={
                        active
                          ? "rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
                          : "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }
                    >
                      {preset.name} {preset.rate}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Field label="Tax rate" htmlFor="vat-rate" hint="Any rate, including fractional rates such as 8.25%.">
            <div className="relative">
              <Input
                id="vat-rate"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
                %
              </span>
            </div>
          </Field>

          <Field label="Currency" htmlFor="vat-currency">
            <Select id="vat-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </ToolPanel>
      }
      result={
        <>
          <ToolPanel title="Result">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Net amount" value={money(net)} sub="Excluding tax" />
              <Stat label="Tax amount" value={money(tax)} sub={`At ${rateValue}%`} tone="accent" />
              <Stat label="Gross amount" value={money(gross)} sub="Including tax" tone="success" />
            </div>

            {gross > 0 && (
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="mb-3 text-sm font-medium">Split of the gross amount</p>
                <BreakdownBar
                  segments={[
                    { label: "Net", value: net, color: "#345aa5" },
                    { label: "Tax", value: tax, color: "#18818a" },
                  ]}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <CopyButton value={net.toFixed(2)} label="Copy net" />
              <CopyButton value={tax.toFixed(2)} label="Copy tax" />
              <CopyButton value={gross.toFixed(2)} label="Copy gross" />
            </div>

            <Alert tone="warning" title="Verify the rate before you use it">
              Tax rates change, and many countries apply different rates to different goods and
              services. These presets are a starting point, not tax advice — confirm the rate that
              applies to your transaction with your tax authority or accountant.
            </Alert>
          </ToolPanel>

          <FormulaNote
            items={[
              {
                label: "Adding tax",
                formula: "Gross = Net × (1 + rate ÷ 100)",
                note: `${money(net)} × ${(1 + rateValue / 100).toFixed(4)} = ${money(gross)}`,
              },
              {
                label: "Removing tax",
                formula: "Net = Gross ÷ (1 + rate ÷ 100)",
                note: "Subtracting the percentage from the gross is wrong — it takes the percentage off the larger number.",
              },
              {
                label: "Tax amount",
                formula: "Tax = Gross − Net",
                note: `${money(gross)} − ${money(net)} = ${money(tax)}`,
              },
            ]}
          />
        </>
      }
    />
  );
}
