import type { CSSProperties } from "react";
import { parseColor, type Rgb } from "./color";

/**
 * Colour and CSS tool engine.
 *
 * Same shape as the calculator and text engines: a list of controls plus a
 * pure `compute`. No JSX here, so the test suite can run every definition and
 * assert on the CSS it produces.
 *
 * Preview styles are built from values this code has already parsed — never
 * from a raw string the visitor typed — so nothing a visitor enters can become
 * arbitrary CSS.
 */

export type DesignFieldType = "color" | "number" | "range" | "select" | "checkbox" | "text";

export interface DesignField {
  key: string;
  label: string;
  type: DesignFieldType;
  initial?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: string;
  suffix?: string;
  options?: { value: string; label: string }[];
  when?: (values: DesignValues) => boolean;
  wide?: boolean;
}

export type DesignValues = Record<string, string>;

export interface DesignSwatch {
  label: string;
  /** A hex string this code produced, safe to put in a style attribute. */
  color: string;
  sub?: string;
}

export interface DesignRow {
  label: string;
  value: string;
}

export interface DesignStat {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "error" | "accent";
}

export type DesignPreview =
  | { kind: "box"; style: CSSProperties; label?: string }
  | { kind: "button"; style: CSSProperties; label: string }
  | { kind: "text"; foreground: string; background: string };

export interface DesignCode {
  label: string;
  value: string;
  /** Used for the download file extension; display is always monospace. */
  extension?: string;
}

export interface DesignResult {
  swatches?: DesignSwatch[];
  stats?: DesignStat[];
  rows?: DesignRow[];
  code?: DesignCode[];
  preview?: DesignPreview;
  note?: string;
  warning?: string;
  error?: string;
}

export interface DesignHelpers {
  str: (key: string) => string;
  num: (key: string, fallback?: number) => number;
  bool: (key: string) => boolean;
  /** Parsed colour for a field, falling back to mid grey on unreadable input. */
  color: (key: string, fallback?: string) => Rgb;
  /** Whether the field held something this code could actually read. */
  colorValid: (key: string) => boolean;
}

export interface DesignToolDef {
  fields: DesignField[];
  compute: (values: DesignValues, helpers: DesignHelpers) => DesignResult;
  /** Adds a button that re-runs `compute`, for the random tools. */
  generate?: { label: string };
  /** Set when `compute` is random or reads the clock, so it cannot be server-rendered. */
  deferred?: boolean;
  controlsTitle?: string;
  controlsDescription?: string;
  resultTitle?: string;
  notes?: { label: string; formula: string; note?: string }[];
}

const GREY: Rgb = { r: 128, g: 128, b: 128, a: 1 };

export function buildDesignHelpers(values: DesignValues): DesignHelpers {
  return {
    str: (key) => values[key] ?? "",
    num: (key, fallback = 0) => {
      const parsed = Number.parseFloat(String(values[key] ?? ""));
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    bool: (key) => Boolean(values[key]),
    color: (key, fallback) => parseColor(values[key] ?? "") ?? (fallback ? parseColor(fallback) ?? GREY : GREY),
    colorValid: (key) => parseColor(values[key] ?? "") !== null,
  };
}

/** Runs a definition headlessly — this is what the test suite calls. */
export function runDesignTool(def: DesignToolDef, values: DesignValues = {}): DesignResult {
  const merged: DesignValues = {};
  for (const field of def.fields) merged[field.key] = field.initial ?? "";
  Object.assign(merged, values);
  return def.compute(merged, buildDesignHelpers(merged));
}
