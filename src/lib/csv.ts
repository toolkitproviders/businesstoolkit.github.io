/**
 * CSV parsing and serialising, to RFC 4180.
 *
 * Written by hand rather than pulled in as a dependency because the whole job
 * is one state machine, and because the tools need things a general library
 * hides: which delimiter was detected, which rows had the wrong number of
 * columns, and where a quote was left open.
 *
 * Pure and browser-free, so the test suite exercises it directly.
 */

export const DELIMITERS: { value: string; label: string }[] = [
  { value: "auto", label: "Detect automatically" },
  { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe" },
];

/**
 * Picks the delimiter that divides the first few lines most consistently.
 * Counting occurrences alone is not enough — a comma inside prose beats a
 * genuine semicolon delimiter — so consistency across rows decides it.
 */
export function detectDelimiter(text: string): string {
  const candidates = [",", ";", "\t", "|"];
  const lines = text.split(/\r\n|\r|\n/u).filter((l) => l.trim()).slice(0, 10);
  if (lines.length === 0) return ",";

  let best = ",";
  let bestScore = -1;

  for (const candidate of candidates) {
    const counts = lines.map((line) => countOutsideQuotes(line, candidate));
    const first = counts[0];
    if (first === 0) continue;
    const consistent = counts.every((c) => c === first);
    // A delimiter that splits every line the same way wins; among those, the
    // one producing more columns is the more likely separator.
    const score = (consistent ? 1000 : 0) + first;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') i++;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && ch === delimiter) {
      count++;
    }
  }
  return count;
}

export interface CsvParseResult {
  rows: string[][];
  delimiter: string;
  /** Set when a quoted field was never closed. */
  unterminatedQuote: boolean;
}

/** Parses CSV into rows of raw strings. Never throws — problems are reported. */
export function parseCsv(text: string, delimiter?: string): CsvParseResult {
  const sep = !delimiter || delimiter === "auto" ? detectDelimiter(text) : delimiter;
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let started = false;

  // Strip a UTF-8 byte order mark, which Excel writes and which would
  // otherwise become part of the first column name.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = "";
    started = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field === "") {
      inQuotes = true;
      started = true;
      continue;
    }
    if (ch === sep) {
      endField();
      continue;
    }
    if (ch === "\r") {
      if (source[i + 1] === "\n") i++;
      endRow();
      continue;
    }
    if (ch === "\n") {
      endRow();
      continue;
    }
    field += ch;
    started = true;
  }

  // A trailing newline should not produce a phantom empty row.
  if (started || field !== "" || row.length > 0) endRow();

  return { rows, delimiter: sep, unterminatedQuote: inQuotes };
}

/** Quotes a field only when it needs it, as Excel and Sheets both do. */
export function escapeCsvField(value: string, delimiter = ","): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value !== value.trim();
  return needsQuotes ? `"${value.replace(/"/gu, '""')}"` : value;
}

export function serialiseCsv(rows: string[][], delimiter = ",", eol = "\n"): string {
  return rows.map((row) => row.map((f) => escapeCsvField(f ?? "", delimiter)).join(delimiter)).join(eol);
}

/** "name" + ["Ada"] -> { name: "Ada" }, with duplicate headers made unique. */
export function uniqueHeaders(header: string[]): string[] {
  const seen = new Map<string, number>();
  return header.map((raw, i) => {
    const name = raw.trim() || `column_${i + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count + 1}`;
  });
}

/** Reads "42", "true" and "" as their JSON equivalents when asked to. */
export function coerceValue(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  // Only plain numbers: "007" and "+44 20..." must stay strings.
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/u.test(trimmed)) {
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
}

/**
 * Flattens nested objects to dot paths so an array of arbitrary JSON can
 * become a rectangular table. Arrays of scalars are joined; arrays of objects
 * are indexed.
 */
export function flattenObject(
  value: unknown,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  if (value === null || value === undefined) {
    if (prefix) out[prefix] = "";
    return out;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== "object")) {
      out[prefix || "value"] = value.map((v) => (v === null ? "" : String(v))).join("; ");
      return out;
    }
    value.forEach((item, i) => flattenObject(item, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      if (prefix) out[prefix] = "";
      return out;
    }
    for (const [key, child] of entries) {
      flattenObject(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out[prefix || "value"] = String(value);
  return out;
}

/** Column order follows first appearance, so the output matches the input. */
export function collectColumns(records: Record<string, string>[]): string[] {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}
