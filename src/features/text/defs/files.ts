import type { TextResult, TextToolDef } from "../types";
import {
  coerceValue,
  collectColumns,
  DELIMITERS,
  detectDelimiter,
  flattenObject,
  parseCsv,
  serialiseCsv,
  uniqueHeaders,
} from "@/lib/csv";

/**
 * File tools: CSV, JSON and plain text files.
 *
 * Files are opened with the browser's own FileReader and stay in the page —
 * nothing is uploaded. The heavy lifting is in `lib/csv.ts`, which the test
 * suite exercises directly.
 */

const n = (value: number) => value.toLocaleString("en-US");

const CSV_SAMPLE = `invoice,customer,amount,paid,due
INV-1042,"Harbour Coffee, Ltd",228.00,false,2026-04-14
INV-1043,Pier Bakery,86.50,true,2026-03-30
INV-1044,"Smith ""The Grocer"" & Co",1240.75,false,2026-05-02`;

const JSON_SAMPLE = `[
  { "invoice": "INV-1042", "customer": "Harbour Coffee", "amount": 228, "paid": false },
  { "invoice": "INV-1043", "customer": "Pier Bakery", "amount": 86.5, "paid": true },
  { "invoice": "INV-1044", "customer": "Smith & Co", "amount": 1240.75, "paid": false }
]`;

const delimiterOption = {
  key: "delimiter",
  label: "Delimiter",
  type: "select" as const,
  initial: "auto",
  options: DELIMITERS,
};

const DELIMITER_NAMES: Record<string, string> = {
  ",": "comma",
  ";": "semicolon",
  "\t": "tab",
  "|": "pipe",
};

/* -------------------------------------------------------------- CSV viewer -- */

export const csvViewer: TextToolDef = {
  input: {
    label: "Your CSV",
    placeholder: "Paste CSV, or open a .csv file…",
    rows: 12,
    mono: true,
    sample: CSV_SAMPLE,
    initial: CSV_SAMPLE,
    accept: ".csv,.tsv,.txt,text/csv,text/plain",
  },
  options: [
    delimiterOption,
    { key: "header", label: "First row is a header", type: "checkbox", initial: "1", wide: true },
    { key: "trim", label: "Trim spaces around each value", type: "checkbox", initial: "", wide: true },
    { key: "rows", label: "Rows to show", type: "number", initial: "200", min: 1, max: 2000 },
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { note: "Paste some CSV, or open a file, and it will appear as a table." };

    const parsed = parseCsv(input, h.str("delimiter"));
    const rows = h.bool("trim") ? parsed.rows.map((r) => r.map((c) => c.trim())) : parsed.rows;
    if (rows.length === 0) return { note: "That file has no rows." };

    const hasHeader = h.bool("header");
    const header = hasHeader ? uniqueHeaders(rows[0]) : rows[0].map((_c, i) => `Column ${i + 1}`);
    const body = hasHeader ? rows.slice(1) : rows;
    const limit = Math.max(1, h.num("rows", 200));

    // A row with the wrong number of fields is almost always a quoting problem,
    // and silently padding it would hide the real fault.
    const ragged = body
      .map((row, i) => ({ line: i + (hasHeader ? 2 : 1), count: row.length }))
      .filter((r) => r.count !== header.length);

    return {
      stats: [
        { label: "Rows", value: n(body.length), tone: "accent" },
        { label: "Columns", value: n(header.length) },
        { label: "Delimiter", value: DELIMITER_NAMES[parsed.delimiter] ?? parsed.delimiter },
      ],
      table: {
        head: header,
        rows: body.slice(0, limit).map((row) =>
          header.map((_c, i) => row[i] ?? ""),
        ),
        caption: "CSV contents",
      },
      warning: parsed.unterminatedQuote
        ? "A quoted field was never closed, so the last rows may have run together. Check for a stray double quote."
        : ragged.length
          ? `${ragged.length} row${ragged.length === 1 ? "" : "s"} do not have ${header.length} fields — first at line ${ragged[0].line}, which has ${ragged[0].count}.`
          : undefined,
      note:
        body.length > limit
          ? `Showing the first ${n(limit)} of ${n(body.length)} rows. Raise the limit to see more.`
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "Table" },
  notes: [
    { label: "Quoting", formula: 'Wrap a field in " when it holds the delimiter, a quote or a line break' },
    { label: "Escaped quote", formula: 'A literal " is written as ""', note: 'So "Smith ""The Grocer""" reads as Smith "The Grocer".' },
  ],
};

/* ------------------------------------------------------------- CSV to JSON -- */

export const csvToJson: TextToolDef = {
  input: {
    label: "Your CSV",
    placeholder: "name,email\nAda,ada@example.com",
    rows: 12,
    mono: true,
    sample: CSV_SAMPLE,
    initial: CSV_SAMPLE,
    accept: ".csv,.tsv,.txt,text/csv,text/plain",
  },
  options: [
    delimiterOption,
    {
      key: "shape",
      label: "Output shape",
      type: "select",
      initial: "objects",
      options: [
        { value: "objects", label: "Array of objects, keyed by header" },
        { value: "arrays", label: "Array of arrays" },
        { value: "columns", label: "One object of columns" },
      ],
    },
    { key: "header", label: "First row is a header", type: "checkbox", initial: "1", wide: true },
    { key: "coerce", label: "Read numbers and true/false as values, not strings", type: "checkbox", initial: "1", wide: true },
    { key: "trim", label: "Trim spaces around each value", type: "checkbox", initial: "1", wide: true },
    { key: "pretty", label: "Indent the JSON", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };

    const parsed = parseCsv(input, h.str("delimiter"));
    const rows = h.bool("trim") ? parsed.rows.map((r) => r.map((c) => c.trim())) : parsed.rows;
    if (rows.length === 0) return { output: "[]" };

    const cast = (value: string) => (h.bool("coerce") ? coerceValue(value) : value);
    const hasHeader = h.bool("header");
    const header = hasHeader ? uniqueHeaders(rows[0]) : rows[0].map((_c, i) => `column_${i + 1}`);
    const body = hasHeader ? rows.slice(1) : rows;
    const shape = h.str("shape");

    let data: unknown;
    if (shape === "arrays") {
      data = (hasHeader ? [header, ...body] : body).map((row) => row.map(cast));
    } else if (shape === "columns") {
      data = Object.fromEntries(header.map((name, i) => [name, body.map((row) => cast(row[i] ?? ""))]));
    } else {
      data = body.map((row) => Object.fromEntries(header.map((name, i) => [name, cast(row[i] ?? "")])));
    }

    return {
      output: JSON.stringify(data, null, h.bool("pretty") ? 2 : 0),
      filename: "data.json",
      stats: [
        { label: "Records", value: n(body.length), tone: "accent" },
        { label: "Fields", value: n(header.length) },
        { label: "Delimiter", value: DELIMITER_NAMES[parsed.delimiter] ?? parsed.delimiter },
      ],
      warning: parsed.unterminatedQuote
        ? "A quoted field was never closed — check the CSV for a stray double quote."
        : undefined,
    } satisfies TextResult;
  },
  output: { label: "JSON", mono: true, rows: 16 },
};

/* ------------------------------------------------------------- JSON to CSV -- */

export const jsonToCsv: TextToolDef = {
  input: {
    label: "Your JSON",
    placeholder: '[{ "name": "Ada", "email": "ada@example.com" }]',
    rows: 12,
    mono: true,
    sample: JSON_SAMPLE,
    initial: JSON_SAMPLE,
    accept: ".json,application/json,.txt",
  },
  options: [
    {
      key: "delimiter",
      label: "Delimiter",
      type: "select",
      initial: ",",
      options: DELIMITERS.filter((d) => d.value !== "auto"),
    },
    { key: "header", label: "Include a header row", type: "checkbox", initial: "1", wide: true },
    { key: "flatten", label: "Flatten nested objects into dot.paths", type: "checkbox", initial: "1", wide: true },
    { key: "crlf", label: "Use Windows line endings (CRLF)", type: "checkbox", initial: "", wide: true },
    { key: "bom", label: "Add a byte order mark so Excel reads accents correctly", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "That is not valid JSON." };
    }

    // Accept an array, a single object, or an object whose one array property
    // holds the records — all three turn up in real API responses.
    let items: unknown[];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === "object") {
      const arrays = Object.values(parsed as Record<string, unknown>).filter(Array.isArray);
      items = arrays.length === 1 ? (arrays[0] as unknown[]) : [parsed];
    } else {
      return { error: "CSV needs a list of records. Give an array of objects, or an object containing one." };
    }

    if (items.length === 0) return { output: "", note: "That array is empty, so there is nothing to convert." };

    const records = items.map((item) =>
      h.bool("flatten") && item && typeof item === "object"
        ? flattenObject(item)
        : item && typeof item === "object"
          ? Object.fromEntries(
              Object.entries(item as Record<string, unknown>).map(([k, v]) => [
                k,
                v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v),
              ]),
            )
          : { value: String(item) },
    );

    const columns = collectColumns(records);
    const rows = records.map((record) => columns.map((c) => record[c] ?? ""));
    const body = h.bool("header") ? [columns, ...rows] : rows;
    const csv = serialiseCsv(body, h.str("delimiter") || ",", h.bool("crlf") ? "\r\n" : "\n");

    return {
      output: h.bool("bom") ? `﻿${csv}` : csv,
      filename: "data.csv",
      stats: [
        { label: "Rows", value: n(rows.length), tone: "accent" },
        { label: "Columns", value: n(columns.length) },
      ],
      note:
        columns.length > 0 && columns.some((c) => c.includes("."))
          ? "Nested values were flattened into dot paths, so { a: { b: 1 } } becomes a column called a.b."
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "CSV", mono: true, rows: 14 },
  notes: [
    { label: "Excel and accents", formula: "Add the byte order mark", note: "Without it Excel on Windows mangles anything non-ASCII." },
    { label: "Ragged records", formula: "Missing keys become empty cells", note: "The columns are the union of every record's keys." },
  ],
};

/* -------------------------------------------------------- text file viewer -- */

export const textFileViewer: TextToolDef = {
  input: {
    label: "Your file",
    placeholder: "Open a text file, or paste its contents…",
    rows: 16,
    mono: true,
    accept: ".txt,.csv,.tsv,.log,.md,.json,.xml,.yml,.yaml,.ini,.conf,.env,text/plain",
  },
  options: [
    { key: "numbers", label: "Show line numbers", type: "checkbox", initial: "1", wide: true },
    { key: "wrap", label: "Show invisible characters", type: "checkbox", initial: "", wide: true },
    { key: "from", label: "From line", type: "number", initial: "1", min: 1 },
    { key: "count", label: "Lines to show", type: "number", initial: "500", min: 1, max: 20000 },
  ],
  transform: (input, _v, h) => {
    if (!input) return { note: "Open a file with the button below, or paste text in. Nothing is uploaded." };

    const crlf = (input.match(/\r\n/gu) ?? []).length;
    const lfOnly = (input.match(/(?<!\r)\n/gu) ?? []).length;
    const crOnly = (input.match(/\r(?!\n)/gu) ?? []).length;
    const lines = input.split(/\r\n|\r|\n/u);

    const from = Math.max(1, h.num("from", 1));
    const count = Math.max(1, h.num("count", 500));
    const slice = lines.slice(from - 1, from - 1 + count);

    const width = String(from + slice.length - 1).length;
    const rendered = slice
      .map((line, i) => {
        let text = line;
        if (h.bool("wrap")) text = text.replace(/\t/gu, "→   ").replace(/ +$/u, (m) => "·".repeat(m.length));
        return h.bool("numbers") ? `${String(from + i).padStart(width, " ")} │ ${text}` : text;
      })
      .join("\n");

    const endings =
      crlf && (lfOnly || crOnly) ? "Mixed" : crlf ? "CRLF (Windows)" : crOnly ? "CR (classic Mac)" : "LF (Unix)";

    return {
      output: rendered,
      filename: "view.txt",
      stats: [
        { label: "Lines", value: n(lines.length), tone: "accent" },
        { label: "Characters", value: n(input.length) },
        { label: "Line endings", value: endings, tone: endings === "Mixed" ? "warning" : "neutral" },
        { label: "Longest line", value: n(lines.reduce((m, l) => Math.max(m, l.length), 0)) },
        { label: "Blank lines", value: n(lines.filter((l) => !l.trim()).length) },
        {
          label: "Non-ASCII",
          value: n((input.match(/[^\t\n\r -~]/gu) ?? []).length),
        },
      ],
      warning:
        endings === "Mixed"
          ? "This file mixes Windows and Unix line endings, which confuses some editors and version control. The Text File Converter can normalise them."
          : undefined,
      note: `Showing lines ${n(from)} to ${n(Math.min(lines.length, from + slice.length - 1))} of ${n(lines.length)}.`,
    } satisfies TextResult;
  },
  output: { label: "File contents", mono: true, rows: 20 },
  privacyNote:
    "The file is read by your browser and never leaves this page. Your file is processed locally in your browser.",
};

/* ----------------------------------------------------- text file converter -- */

export const textFileConverter: TextToolDef = {
  input: {
    label: "Your file",
    placeholder: "Open a text file, or paste its contents…",
    rows: 12,
    mono: true,
    accept: ".txt,.csv,.tsv,.log,.md,.json,.xml,.yml,.yaml,text/plain",
  },
  options: [
    {
      key: "endings",
      label: "Line endings",
      type: "select",
      initial: "lf",
      wide: true,
      options: [
        { value: "keep", label: "Leave as they are" },
        { value: "lf", label: "LF — Unix, macOS, git" },
        { value: "crlf", label: "CRLF — Windows" },
        { value: "cr", label: "CR — classic Mac" },
      ],
    },
    {
      key: "indent",
      label: "Tabs and spaces",
      type: "select",
      initial: "keep",
      wide: true,
      options: [
        { value: "keep", label: "Leave as they are" },
        { value: "spaces2", label: "Tabs to 2 spaces" },
        { value: "spaces4", label: "Tabs to 4 spaces" },
        { value: "tabs", label: "Leading spaces to tabs" },
      ],
    },
    { key: "trailing", label: "Strip trailing spaces from every line", type: "checkbox", initial: "1", wide: true },
    { key: "finalNewline", label: "End the file with a newline", type: "checkbox", initial: "1", wide: true },
    { key: "bom", label: "Add a byte order mark", type: "checkbox", initial: "", wide: true },
    { key: "ascii", label: "Replace smart quotes and dashes with ASCII", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    if (!input) return { output: "" };

    let out = input.replace(/^﻿/u, "");
    const hadBom = input.charCodeAt(0) === 0xfeff;

    if (h.bool("ascii")) {
      out = out
        .replace(/[‘’‚‛]/gu, "'")
        .replace(/[“”„‟]/gu, '"')
        .replace(/[–—―]/gu, "-")
        .replace(/…/gu, "...")
        .replace(/ /gu, " ");
    }

    // Normalise to LF first so the later choices only have one case to handle.
    out = out.replace(/\r\n|\r/gu, "\n");

    const indent = h.str("indent");
    if (indent === "spaces2") out = out.replace(/\t/gu, "  ");
    else if (indent === "spaces4") out = out.replace(/\t/gu, "    ");
    else if (indent === "tabs") {
      out = out.replace(/^[ ]+/gmu, (spaces) => "\t".repeat(Math.floor(spaces.length / 4)) + " ".repeat(spaces.length % 4));
    }

    if (h.bool("trailing")) out = out.replace(/[ \t]+$/gmu, "");
    if (h.bool("finalNewline") && out && !out.endsWith("\n")) out += "\n";

    const endings = h.str("endings");
    if (endings === "crlf") out = out.replace(/\n/gu, "\r\n");
    else if (endings === "cr") out = out.replace(/\n/gu, "\r");

    if (h.bool("bom")) out = `﻿${out}`;

    return {
      output: out,
      filename: "converted.txt",
      stats: [
        { label: "Bytes before", value: n(new TextEncoder().encode(input).length) },
        { label: "Bytes after", value: n(new TextEncoder().encode(out).length), tone: "accent" },
        { label: "Lines", value: n(out.split(/\r\n|\r|\n/u).length) },
      ],
      note: hadBom && !h.bool("bom") ? "The original byte order mark was removed." : undefined,
    } satisfies TextResult;
  },
  output: { label: "Converted file", mono: true, rows: 14 },
  notes: [
    { label: "LF vs CRLF", formula: "Unix uses \\n, Windows uses \\r\\n", note: "Mixed endings are what produce phantom whole-file diffs in git." },
    { label: "Byte order mark", formula: "An invisible U+FEFF at the start", note: "Excel wants it; most parsers and shells do not." },
  ],
};
