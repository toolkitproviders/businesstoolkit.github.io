"use client";

import * as React from "react";
import { ArrowUpDown, RefreshCw, Search } from "lucide-react";
import { Alert, Button, Field, Input, Spinner, Stat } from "@/components/ui";
import { CopyButton, ToolPanel, ToolSplit } from "@/components/tools/shared";
import {
  currencies,
  currencyDecimals,
  formatMoney,
  getCurrency,
  searchCurrencies,
  type Currency,
} from "@/lib/currencies";
import { cn, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface RateTable {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  provider: string;
}

const QUICK_AMOUNTS = [1, 10, 100, 1000];

export function CurrencyConverter({ toolSlug }: { toolSlug: string }) {
  const [amount, setAmount] = React.useState("100");
  const [from, setFrom] = React.useState("USD");
  const [to, setTo] = React.useState("EUR");
  const [table, setTable] = React.useState<RateTable | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const load = React.useCallback(async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rates?base=${encodeURIComponent(base)}`);
      const payload = (await response.json()) as RateTable | { error: string };
      if (!response.ok || "error" in payload) {
        setError(
          "error" in payload
            ? payload.error
            : "Exchange rates are temporarily unavailable. Please try again shortly.",
        );
        return;
      }
      setTable(payload);
    } catch {
      setError(
        "Could not reach the exchange rate service. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(from);
  }, [from, load]);

  const rate = table && table.base === from ? table.rates[to] : undefined;
  const amountValue = Math.max(0, toNumber(amount));
  const converted = rate ? amountValue * rate : 0;
  const inverse = rate ? 1 / rate : 0;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fromCurrency = getCurrency(from);
  const toCurrency = getCurrency(to);

  // Only offer currencies the provider actually returned a rate for.
  const available = React.useMemo(() => {
    if (!table) return currencies;
    return currencies.filter((c) => c.code === table.base || c.code in table.rates);
  }, [table]);

  return (
    <ToolSplit
      controls={
        <ToolPanel title="Convert" description="Live mid-market rates, refreshed hourly.">
          <Field label="Amount" htmlFor="cc-amount">
            <Input
              id="cc-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(value))}
              >
                {value.toLocaleString()}
              </Button>
            ))}
          </div>

          <CurrencyPicker
            label="From"
            value={from}
            onChange={setFrom}
            options={available}
            id="cc-from"
          />

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swap}
              aria-label={`Swap ${from} and ${to}`}
              className="rounded-full"
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>

          <CurrencyPicker
            label="To"
            value={to}
            onChange={setTo}
            options={available}
            id="cc-to"
          />
        </ToolPanel>
      }
      result={
        <ToolPanel
          title="Result"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--fg-subtle)]">
              <span>
                {table
                  ? `Rates from ${table.provider}, updated ${new Date(table.updatedAt).toLocaleString()}`
                  : "Loading rate data…"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => load(from)} disabled={loading}>
                {loading ? <Spinner /> : <RefreshCw className="size-3.5" />}
                Refresh
              </Button>
            </div>
          }
        >
          {error ? (
            <Alert tone="error" title="Rates unavailable">
              {error}
            </Alert>
          ) : loading && !table ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--fg-muted)]">
              <Spinner />
              Fetching the latest exchange rates…
            </div>
          ) : !rate ? (
            <Alert tone="warning">
              No rate is available for {from} → {to}. Try a different currency pair.
            </Alert>
          ) : (
            <>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-5 text-center">
                <p className="text-sm text-[var(--fg-muted)]">
                  {formatMoney(amountValue, from)} {fromCurrency?.name} equals
                </p>
                <p className="tabular mt-2 text-3xl font-bold text-[var(--accent)] sm:text-4xl">
                  {formatMoney(converted, to)}
                </p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{toCurrency?.name}</p>
                <div className="mt-4 flex justify-center">
                  <CopyButton
                    value={converted.toFixed(currencyDecimals(to))}
                    label="Copy amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label={`1 ${from} =`}
                  value={`${rate.toFixed(rate < 0.01 ? 6 : 4)} ${to}`}
                />
                <Stat
                  label={`1 ${to} =`}
                  value={`${inverse.toFixed(inverse < 0.01 ? 6 : 4)} ${from}`}
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <caption className="sr-only">Conversion at common amounts</caption>
                  <thead className="bg-[var(--bg-subtle)]">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-[var(--fg-muted)]">
                        {from}
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium text-[var(--fg-muted)]">
                        {to}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[1, 5, 10, 50, 100, 500, 1000].map((value) => (
                      <tr key={value}>
                        <td className="tabular px-4 py-2">{formatMoney(value, from)}</td>
                        <td className="tabular px-4 py-2 text-right font-medium">
                          {formatMoney(value * rate, to)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Alert tone="info">
                These are mid-market reference rates. Banks, cards and transfer services add a
                spread and fees, so the rate you actually receive will be less favourable.
              </Alert>
            </>
          )}
        </ToolPanel>
      }
    />
  );
}

/** Searchable currency picker — a plain select over 160 options is unusable. */
function CurrencyPicker({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  options: Currency[];
  id: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selected = getCurrency(value);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = React.useMemo(() => {
    const matches = searchCurrencies(query, 200);
    const codes = new Set(options.map((o) => o.code));
    return matches.filter((c) => codes.has(c.code)).slice(0, 80);
  }, [query, options]);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-left transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <span className="w-9 shrink-0 text-center text-sm font-semibold text-[var(--accent)]">
          {selected?.symbol ?? value}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[var(--fg)]">{value}</span>
          <span className="block truncate text-xs text-[var(--fg-muted)]">
            {selected?.name ?? "Select a currency"}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-pop">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
            <Search className="size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, name or country"
              aria-label="Search currencies"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[var(--fg-subtle)]"
            />
          </div>
          <ul role="listbox" className="thin-scroll max-h-64 overflow-y-auto p-1">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--fg-muted)]">
                No currency matches “{query}”.
              </li>
            ) : (
              results.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.code === value}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      c.code === value
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "hover:bg-[var(--bg-subtle)]",
                    )}
                  >
                    <span className="w-9 shrink-0 text-center text-xs font-semibold">
                      {c.symbol}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {c.code} — {c.name}
                      </span>
                      <span className="block truncate text-xs text-[var(--fg-subtle)]">
                        {c.region}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
