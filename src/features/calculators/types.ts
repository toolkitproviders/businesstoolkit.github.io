/**
 * Calculator engine types and the pure evaluation helpers.
 *
 * Kept free of JSX so the definitions and their arithmetic can be imported
 * directly by the Node test suite, which strips TypeScript types but cannot
 * parse `.tsx`.
 */
import { formatMoney } from "@/lib/currencies";
import { toNumber } from "@/lib/utils";

export type FieldType = "number" | "currency" | "percent" | "text" | "select" | "date";

export interface CalcField {
  key: string;
  label: string;
  type: FieldType;
  /** Initial value. Numbers may be given as strings to control formatting. */
  initial?: string;
  hint?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Hide unless the predicate passes — used for mode-dependent inputs. */
  when?: (values: CalcValues) => boolean;
  /** Full width in the two-column input grid. */
  wide?: boolean;
}

export interface CalcMode {
  value: string;
  label: string;
}

export type CalcValues = Record<string, string>;

export interface CalcOutput {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "error" | "accent";
  /** Plain value offered by the copy button; defaults to `value`. */
  copy?: string;
}

export interface CalcSegment {
  label: string;
  value: number;
  color: string;
}

export interface CalcResult {
  outputs: CalcOutput[];
  /** Optional proportional bar under the stats. */
  segments?: CalcSegment[];
  /** Shown as a warning banner — e.g. "selling below cost". */
  warning?: string;
  /** Shown as an info banner. */
  note?: string;
  /** Rows appended as a table, for schedules and breakdowns. */
  table?: { head: string[]; rows: string[][]; caption?: string };
}

export interface CalculatorDef {
  /** Optional mode switcher rendered above the inputs. */
  modes?: { key: string; options: CalcMode[]; label?: string };
  fields: CalcField[];
  /** Pure function — this is what the test suite exercises. */
  compute: (values: CalcValues, helpers: CalcHelpers) => CalcResult;
  formulas?: { label: string; formula: string; note?: string }[];
  /** Adds a currency picker whose code is passed to `compute` via helpers. */
  currency?: boolean;
  inputTitle?: string;
  inputDescription?: string;
  resultTitle?: string;
}

export interface CalcHelpers {
  /** Numeric value of a field, never NaN. */
  num: (key: string, fallback?: number) => number;
  /** Raw string value of a field. */
  str: (key: string) => string;
  /** Selected currency code (defaults to USD). */
  currency: string;
  /** Formats using the selected currency. */
  money: (value: number) => string;
}

export function buildHelpers(values: CalcValues, currency: string): CalcHelpers {
  return {
    num: (key, fallback = 0) => toNumber(values[key], fallback),
    str: (key) => values[key] ?? "",
    currency,
    money: (value) => formatMoney(value, currency),
  };
}

/** Runs a definition headlessly — used by the calculator test suite. */
export function runCalculator(
  def: CalculatorDef,
  values: CalcValues,
  currency = "USD",
): CalcResult {
  return def.compute(values, buildHelpers(values, currency));
}
