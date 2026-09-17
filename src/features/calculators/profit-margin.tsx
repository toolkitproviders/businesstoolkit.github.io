"use client";

import * as React from "react";
import { Calculator, Target } from "lucide-react";
import { Alert, Field, Input, SegmentedControl, Select, Stat } from "@/components/ui";
import { BreakdownBar, FormulaNote, ToolPanel, ToolSplit } from "@/components/tools/shared";
import { currencies, formatMoney } from "@/lib/currencies";
import { formatPercent, round2, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Mode = "margin" | "target";

export function ProfitMarginCalculator({ toolSlug }: { toolSlug: string }) {
  const [mode, setMode] = React.useState<Mode>("margin");
  const [currency, setCurrency] = React.useState("USD");
  const [cost, setCost] = React.useState("60");
  const [price, setPrice] = React.useState("100");
  const [quantity, setQuantity] = React.useState("1");
  const [targetMargin, setTargetMargin] = React.useState("40");

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const costValue = Math.max(0, toNumber(cost));
  const qty = Math.max(0, toNumber(quantity, 1));

  // In target mode the selling price is derived from the margin you want.
  const targetPct = Math.min(99.99, Math.max(0, toNumber(targetMargin)));
  const derivedPrice = round2(costValue / (1 - targetPct / 100));
  const priceValue = mode === "target" ? derivedPrice : Math.max(0, toNumber(price));

  const unitProfit = round2(priceValue - costValue);
  const marginPct = priceValue > 0 ? (unitProfit / priceValue) * 100 : 0;
  const markupPct = costValue > 0 ? (unitProfit / costValue) * 100 : 0;

  const totalRevenue = round2(priceValue * qty);
  const totalCost = round2(costValue * qty);
  const totalProfit = round2(totalRevenue - totalCost);

  const sellingBelowCost = priceValue > 0 && priceValue < costValue;
  const noPrice = priceValue <= 0;

  const money = (value: number) => formatMoney(value, currency);

  return (
    <ToolSplit
      controls={
        <ToolPanel title="Your numbers" description="Enter the cost and price per unit.">
          <SegmentedControl<Mode>
            ariaLabel="Calculation mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "margin", label: "From price", icon: <Calculator className="size-4" /> },
              { value: "target", label: "Target margin", icon: <Target className="size-4" /> },
            ]}
          />

          <Field label="Currency" htmlFor="pm-currency">
            <Select
              id="pm-currency"
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

          <Field
            label="Cost price (per unit)"
            htmlFor="pm-cost"
            hint="What the item costs you to buy or make."
          >
            <Input
              id="pm-cost"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>

          {mode === "margin" ? (
            <Field
              label="Selling price (per unit)"
              htmlFor="pm-price"
              hint="What the customer pays."
              error={sellingBelowCost ? "Your selling price is below your cost price." : undefined}
            >
              <Input
                id="pm-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                invalid={sellingBelowCost}
              />
            </Field>
          ) : (
            <Field
              label="Target profit margin"
              htmlFor="pm-target"
              hint="The margin you want to achieve. The price is calculated for you."
            >
              <div className="relative">
                <Input
                  id="pm-target"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={99.99}
                  step="0.1"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]">
                  %
                </span>
              </div>
            </Field>
          )}

          <Field label="Quantity" htmlFor="pm-qty" hint="Used for the revenue and cost totals.">
            <Input
              id="pm-qty"
              type="number"
              inputMode="numeric"
              min={0}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>

          {mode === "target" && (
            <Alert tone="info">
              To hit a {formatPercent(targetPct, 1)} margin on a cost of {money(costValue)}, sell at{" "}
              <strong>{money(derivedPrice)}</strong>.
            </Alert>
          )}
        </ToolPanel>
      }
      result={
        <>
          <ToolPanel title="Results">
            {noPrice ? (
              <Alert tone="info">Enter a selling price to see your margin.</Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Profit margin"
                    value={formatPercent(marginPct, 2)}
                    sub="Profit ÷ selling price"
                    tone={marginPct < 0 ? "error" : marginPct < 10 ? "warning" : "success"}
                  />
                  <Stat
                    label="Markup"
                    value={formatPercent(markupPct, 2)}
                    sub="Profit ÷ cost price"
                    tone="accent"
                  />
                  <Stat
                    label="Gross profit (per unit)"
                    value={money(unitProfit)}
                    tone={unitProfit < 0 ? "error" : "neutral"}
                  />
                  <Stat label="Selling price" value={money(priceValue)} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Total revenue" value={money(totalRevenue)} sub={`${qty} units`} />
                  <Stat label="Total cost" value={money(totalCost)} />
                  <Stat
                    label="Total profit"
                    value={money(totalProfit)}
                    tone={totalProfit < 0 ? "error" : "success"}
                  />
                </div>

                {totalRevenue > 0 && (
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <p className="mb-3 text-sm font-medium">Where each unit of revenue goes</p>
                    <BreakdownBar
                      segments={[
                        { label: "Cost", value: totalCost, color: "#94a3b8" },
                        {
                          label: "Profit",
                          value: Math.max(0, totalProfit),
                          color: "#18818a",
                        },
                      ]}
                    />
                  </div>
                )}

                {sellingBelowCost && (
                  <Alert tone="error" title="You are making a loss">
                    Every unit sold costs you {money(Math.abs(unitProfit))}. Raise the price or
                    reduce the cost.
                  </Alert>
                )}
              </>
            )}
          </ToolPanel>

          <FormulaNote
            items={[
              {
                label: "Gross profit",
                formula: "Selling price − Cost price",
                note: `${money(priceValue)} − ${money(costValue)} = ${money(unitProfit)}`,
              },
              {
                label: "Profit margin",
                formula: "(Selling price − Cost) ÷ Selling price × 100",
                note: "Profit as a share of what the customer pays.",
              },
              {
                label: "Markup",
                formula: "(Selling price − Cost) ÷ Cost × 100",
                note: "Profit as a share of what the item cost you. Always the larger number.",
              },
              {
                label: "Price for a target margin",
                formula: "Cost ÷ (1 − margin ÷ 100)",
                note: "Adding the margin percentage to the cost is the classic mistake — it gives a smaller margin than intended.",
              },
            ]}
          />
        </>
      }
    />
  );
}
