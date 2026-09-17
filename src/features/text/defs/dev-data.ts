import type { TextResult, TextToolDef } from "../types";
import { randomInt } from "./transform";

/**
 * Developer data tools: JSON, encoding, identifiers, timestamps and hashes.
 *
 * Everything here runs on the device. The hash tool uses the browser's own
 * SubtleCrypto for the SHA family; MD5 and CRC32 are implemented below because
 * no browser exposes them, and both are checked against their published test
 * vectors in the test suite.
 */

const n = (value: number) => value.toLocaleString("en-US");

const JSON_SAMPLE = `{"invoice":"INV-1042","currency":"GBP","customer":{"name":"Harbour Coffee","vat":"GB123456789"},"lines":[{"item":"Espresso blend 1kg","qty":12,"price":18.5},{"item":"Delivery","qty":1,"price":6}],"paid":false}`;

/* ------------------------------------------------------------------ JSON -- */

/**
 * Turns the browser's terse SyntaxError into something a person can act on.
 *
 * Engines disagree about what they tell you: Safari and Firefox report a
 * character position, while V8 quotes the text it choked on instead. Both are
 * handled so the message always points somewhere real.
 */
function describeJsonError(input: string, err: unknown): string {
  const message = err instanceof Error ? err.message : "Invalid JSON";
  const reason = message.split(/,\s|:\s/u)[0].trim();

  const at = /position (\d+)/u.exec(message);
  if (at) {
    const index = Number.parseInt(at[1], 10);
    const before = input.slice(0, index);
    const line = before.split("\n").length;
    const column = index - before.lastIndexOf("\n");
    const excerpt = input.slice(Math.max(0, index - 30), index + 30).replace(/\s+/gu, " ");
    return `${reason} — line ${line}, column ${column}. Near: …${excerpt}…`;
  }

  const quoted = /"([\s\S]*)"\s+is not valid JSON/u.exec(message);
  if (quoted) {
    const snippet = quoted[1].replace(/^\.\.\./u, "");
    const index = input.lastIndexOf(snippet);
    const tidy = snippet.replace(/\s+/gu, " ").trim();
    if (index >= 0) {
      const line = input.slice(0, index).split("\n").length;
      return `${reason} — line ${line}. Near: …${tidy}…`;
    }
    return `${reason} — near: …${tidy}…`;
  }

  return message;
}

function jsonStats(value: unknown): { keys: number; depth: number; nodes: number } {
  let keys = 0;
  let nodes = 0;
  // Depth counts nested containers, so a flat object is 1 and a scalar is 0.
  const walk = (node: unknown, depth: number): number => {
    nodes += 1;
    if (Array.isArray(node)) {
      return node.reduce<number>((max, child) => Math.max(max, walk(child, depth + 1)), depth);
    }
    if (node && typeof node === "object") {
      const entries = Object.entries(node as Record<string, unknown>);
      keys += entries.length;
      return entries.reduce((max, [, child]) => Math.max(max, walk(child, depth + 1)), depth);
    }
    return depth - 1;
  };
  const depth = Math.max(0, walk(value, 1));
  return { keys, depth, nodes };
}

/** Recursively sorts object keys so two payloads can be compared by eye. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b, "en"))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

const jsonInput = {
  label: "Your JSON",
  placeholder: '{"hello": "world"}',
  rows: 14,
  mono: true,
  sample: JSON_SAMPLE,
  accept: ".json,application/json,.txt",
};

export const jsonFormatter: TextToolDef = {
  input: jsonInput,
  options: [
    {
      key: "indent",
      label: "Indent with",
      type: "select",
      initial: "2",
      options: [
        { value: "2", label: "2 spaces" },
        { value: "4", label: "4 spaces" },
        { value: "tab", label: "Tab" },
      ],
    },
    { key: "sort", label: "Sort keys alphabetically", type: "checkbox", initial: "" },
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return { error: describeJsonError(input, err) };
    }
    const indent = h.str("indent") === "tab" ? "\t" : Number.parseInt(h.str("indent"), 10) || 2;
    const value = h.bool("sort") ? sortKeys(parsed) : parsed;
    const output = JSON.stringify(value, null, indent);
    const s = jsonStats(parsed);
    return {
      output,
      stats: [
        { label: "Valid JSON", value: "Yes", tone: "success" },
        { label: "Keys", value: n(s.keys) },
        { label: "Max depth", value: n(s.depth) },
      ],
      filename: "formatted.json",
    } satisfies TextResult;
  },
  output: { label: "Formatted JSON", mono: true, rows: 18 },
};

export const jsonMinifier: TextToolDef = {
  input: jsonInput,
  transform: (input) => {
    if (!input.trim()) return { output: "" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return { error: describeJsonError(input, err) };
    }
    const output = JSON.stringify(parsed);
    const saved = input.length - output.length;
    return {
      output,
      stats: [
        { label: "Before", value: `${n(input.length)} B` },
        { label: "After", value: `${n(output.length)} B`, tone: "accent" },
        {
          label: "Saved",
          value: input.length ? `${((saved / input.length) * 100).toFixed(1)}%` : "0%",
          tone: saved > 0 ? "success" : "neutral",
        },
      ],
      filename: "minified.json",
    } satisfies TextResult;
  },
  output: { label: "Minified JSON", mono: true, rows: 10 },
};

export const jsonValidator: TextToolDef = {
  input: jsonInput,
  transform: (input) => {
    if (!input.trim()) return { note: "Paste some JSON and it will be checked as you type." };
    try {
      const parsed = JSON.parse(input);
      const s = jsonStats(parsed);
      const type = Array.isArray(parsed)
        ? `Array of ${parsed.length}`
        : parsed === null
          ? "null"
          : typeof parsed === "object"
            ? "Object"
            : typeof parsed;
      return {
        stats: [
          { label: "Result", value: "Valid", tone: "success" },
          { label: "Root type", value: type },
          { label: "Keys", value: n(s.keys) },
          { label: "Values", value: n(s.nodes) },
          { label: "Max depth", value: n(s.depth) },
          { label: "Size", value: `${n(input.length)} B` },
        ],
        note: "Valid against the JSON specification (RFC 8259). Trailing commas and comments are not allowed in JSON.",
      } satisfies TextResult;
    } catch (err) {
      return {
        stats: [{ label: "Result", value: "Invalid", tone: "error" }],
        error: describeJsonError(input, err),
      };
    }
  },
};

/* ---------------------------------------------------------------- Base64 -- */

export function base64Encode(input: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "") : encoded;
}

export function base64Decode(input: string): string {
  let cleaned = input.trim().replace(/\s+/gu, "").replace(/-/gu, "+").replace(/_/gu, "/");
  // Restore the padding a URL-safe encoder strips.
  if (cleaned.length % 4) cleaned += "=".repeat(4 - (cleaned.length % 4));
  const binary = atob(cleaned);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export const base64Tool: TextToolDef = {
  modes: {
    key: "mode",
    label: "Direction",
    options: [
      { value: "encode", label: "Encode" },
      { value: "decode", label: "Decode" },
    ],
  },
  input: {
    label: "Input",
    placeholder: "Text to encode, or Base64 to decode…",
    rows: 12,
    mono: true,
    sample: "BusinessToolKit — free tools, no signup.",
  },
  options: [
    {
      key: "urlsafe",
      label: "URL-safe alphabet (- and _ instead of + and /)",
      type: "checkbox",
      initial: "",
      wide: true,
      when: (v) => v.mode === "encode",
    },
    {
      key: "wrap",
      label: "Wrap output every 76 characters (MIME style)",
      type: "checkbox",
      initial: "",
      wide: true,
      when: (v) => v.mode === "encode",
    },
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    if (h.str("mode") === "decode") {
      try {
        const output = base64Decode(input);
        return {
          output,
          stats: [
            { label: "Decoded characters", value: n(output.length), tone: "accent" },
            { label: "Input length", value: n(input.trim().length) },
          ],
          filename: "decoded.txt",
        } satisfies TextResult;
      } catch {
        return { error: "That is not valid Base64. Check for stray characters or a truncated string." };
      }
    }

    let output = base64Encode(input, h.bool("urlsafe"));
    if (h.bool("wrap")) output = (output.match(/.{1,76}/gu) ?? []).join("\n");

    return {
      output,
      stats: [
        { label: "Input bytes", value: n(new TextEncoder().encode(input).length) },
        { label: "Base64 length", value: n(output.replace(/\n/gu, "").length), tone: "accent" },
      ],
      filename: "encoded.txt",
    } satisfies TextResult;
  },
  output: { label: "Result", mono: true },
  notes: [
    {
      label: "Size",
      formula: "Base64 length = ceil(bytes ÷ 3) × 4",
      note: "Base64 always makes data about a third larger. It is an encoding, not compression or encryption.",
    },
  ],
};

/* ------------------------------------------------------------------- URL -- */

export const urlEncoder: TextToolDef = {
  modes: {
    key: "mode",
    label: "Direction",
    options: [
      { value: "encode", label: "Encode" },
      { value: "decode", label: "Decode" },
    ],
  },
  input: {
    label: "Input",
    placeholder: "https://example.com/search?q=coffee & tea",
    rows: 10,
    mono: true,
    sample: "https://example.com/search?q=coffee & tea#résumé",
  },
  options: [
    {
      key: "component",
      label: "Scope",
      type: "select",
      initial: "component",
      wide: true,
      options: [
        { value: "component", label: "Component — escapes & ? = / # (for query values)" },
        { value: "full", label: "Whole URL — leaves the structure characters alone" },
        { value: "form", label: "Form data — spaces become + (application/x-www-form-urlencoded)" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    if (!input) return { output: "" };
    const scope = h.str("component");

    try {
      if (h.str("mode") === "decode") {
        const prepared = scope === "form" ? input.replace(/\+/gu, " ") : input;
        return { output: decodeURIComponent(prepared), filename: "decoded-url.txt" };
      }
      let output: string;
      if (scope === "full") output = encodeURI(input);
      else if (scope === "form") output = encodeURIComponent(input).replace(/%20/gu, "+");
      else output = encodeURIComponent(input);

      return {
        output,
        stats: [
          { label: "Characters in", value: n(input.length) },
          { label: "Characters out", value: n(output.length), tone: "accent" },
        ],
        filename: "encoded-url.txt",
      } satisfies TextResult;
    } catch {
      return {
        error:
          "That text could not be decoded. A stray % that is not followed by two hexadecimal digits is the usual cause.",
      };
    }
  },
  output: { label: "Result", mono: true },
};

export const urlParser: TextToolDef = {
  input: {
    label: "URL",
    placeholder: "https://example.com/pricing?utm_source=newsletter&plan=pro#faq",
    rows: 5,
    mono: true,
    sample: "https://shop.example.com:8443/uk/products/espresso?utm_source=newsletter&utm_medium=email&size=1kg#reviews",
  },
  transform: (input) => {
    const raw = input.trim();
    if (!raw) return { note: "Paste a URL to break it into its parts." };

    let url: URL;
    try {
      url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    } catch {
      return { error: "That is not a URL this browser can parse. Check for spaces or a missing host." };
    }

    const params = [...url.searchParams.entries()];
    const rows: string[][] = [
      ["Protocol", url.protocol.replace(":", "")],
      ["Host", url.host],
      ["Hostname", url.hostname],
      ["Port", url.port || "(default)"],
      ["Path", url.pathname],
      ["Query string", url.search || "(none)"],
      ["Fragment", url.hash ? url.hash.slice(1) : "(none)"],
      ["Origin", url.origin],
    ];
    if (url.username) rows.push(["Username", url.username]);

    return {
      stats: [
        { label: "Host", value: url.hostname, tone: "accent" },
        { label: "Query parameters", value: n(params.length) },
        { label: "Secure", value: url.protocol === "https:" ? "Yes" : "No", tone: url.protocol === "https:" ? "success" : "warning" },
      ],
      output: params.length
        ? params.map(([key, value]) => `${key} = ${value}`).join("\n")
        : "",
      table: { head: ["Part", "Value"], rows: [...rows, ...params.map(([k, v]) => [`?${k}`, v])], caption: "URL parts" },
      filename: "url-parts.txt",
      warning: url.protocol !== "https:" && url.protocol !== "http:" ? `Unusual protocol: ${url.protocol}` : undefined,
    } satisfies TextResult;
  },
  output: { label: "Query parameters", mono: true, rows: 6 },
};

/* ------------------------------------------------------------------ UUID -- */

function uuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = randomInt(256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  return formatUuid(bytes);
}

/** Version 7: 48-bit millisecond timestamp then randomness, so ids sort by time. */
function uuidV7(nowMs: number): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = randomInt(256);

  let ms = Math.floor(nowMs);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  return formatUuid(bytes);
}

function formatUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const uuidGenerator: TextToolDef = {
  controlsTitle: "Options",
  // Random, and v7 embeds the current time.
  deferred: true,
  options: [
    {
      key: "version",
      label: "Version",
      type: "select",
      initial: "4",
      options: [
        { value: "4", label: "v4 — random (the usual choice)" },
        { value: "7", label: "v7 — time-ordered, sorts by creation" },
        { value: "nil", label: "Nil UUID — all zeros" },
      ],
    },
    { key: "count", label: "How many", type: "number", initial: "5", min: 1, max: 500 },
    { key: "upper", label: "Upper case", type: "checkbox", initial: "" },
    { key: "hyphens", label: "Include hyphens", type: "checkbox", initial: "1" },
    { key: "braces", label: "Wrap in braces { }", type: "checkbox", initial: "", wide: true },
  ],
  generate: { label: "Generate new UUIDs" },
  transform: (_input, _v, h) => {
    const count = Math.min(500, Math.max(1, h.num("count", 5)));
    const version = h.str("version");
    // Device time, as the user asked — v7 embeds the moment of generation.
    const now = Date.now();

    const list = Array.from({ length: count }, (_x, i) => {
      let id =
        version === "nil"
          ? "00000000-0000-0000-0000-000000000000"
          : version === "7"
            ? uuidV7(now + i)
            : uuidV4();
      if (!h.bool("hyphens")) id = id.replace(/-/gu, "");
      if (h.bool("upper")) id = id.toUpperCase();
      if (h.bool("braces")) id = `{${id}}`;
      return id;
    });

    return {
      output: list.join("\n"),
      stats: [
        { label: "Generated", value: n(list.length), tone: "accent" },
        { label: "Version", value: version === "nil" ? "Nil" : `v${version}` },
      ],
      filename: "uuids.txt",
    } satisfies TextResult;
  },
  output: { label: "UUIDs", mono: true, rows: 14 },
  privacyNote: "Generated with your browser's cryptographic random number generator. Nothing is sent to a server.",
  notes: [
    { label: "v4", formula: "122 random bits", note: "Roughly 5.3 × 10^36 possible values — collisions are not a practical concern." },
    { label: "v7", formula: "48-bit timestamp + 74 random bits", note: "Sorts chronologically, which keeps database indexes tidy." },
  ],
};

/* --------------------------------------------------------- random string -- */

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!#$%&*+-=?@^_~",
  hex: "0123456789abcdef",
};

export const randomStringGenerator: TextToolDef = {
  controlsTitle: "Options",
  // Random.
  deferred: true,
  options: [
    { key: "length", label: "Length", type: "number", initial: "24", min: 1, max: 512 },
    { key: "count", label: "How many", type: "number", initial: "5", min: 1, max: 200 },
    { key: "lower", label: "Lower case a–z", type: "checkbox", initial: "1" },
    { key: "upper", label: "Upper case A–Z", type: "checkbox", initial: "1" },
    { key: "digits", label: "Digits 0–9", type: "checkbox", initial: "1" },
    { key: "symbols", label: "Symbols", type: "checkbox", initial: "" },
    { key: "hexonly", label: "Hexadecimal only (overrides the choices above)", type: "checkbox", initial: "", wide: true },
    { key: "custom", label: "Or use exactly these characters", type: "text", placeholder: "Leave blank to use the options above", wide: true },
  ],
  generate: { label: "Generate new strings" },
  transform: (_input, _v, h) => {
    let alphabet = "";
    if (h.str("custom").trim()) alphabet = [...new Set(h.str("custom").trim())].join("");
    else if (h.bool("hexonly")) alphabet = CHARSETS.hex;
    else {
      if (h.bool("lower")) alphabet += CHARSETS.lower;
      if (h.bool("upper")) alphabet += CHARSETS.upper;
      if (h.bool("digits")) alphabet += CHARSETS.digits;
      if (h.bool("symbols")) alphabet += CHARSETS.symbols;
    }

    if (!alphabet) {
      return { error: "Pick at least one character set, or type your own characters." };
    }

    const length = Math.min(512, Math.max(1, h.num("length", 24)));
    const count = Math.min(200, Math.max(1, h.num("count", 5)));

    const list = Array.from({ length: count }, () => {
      let out = "";
      for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
      return out;
    });

    const bits = Math.log2(alphabet.length) * length;
    return {
      output: list.join("\n"),
      stats: [
        { label: "Alphabet size", value: n(alphabet.length) },
        { label: "Entropy each", value: `${bits.toFixed(1)} bits`, tone: bits >= 128 ? "success" : bits >= 64 ? "accent" : "warning" },
        { label: "Generated", value: n(count) },
      ],
      filename: "random-strings.txt",
    } satisfies TextResult;
  },
  output: { label: "Random strings", mono: true, rows: 12 },
  privacyNote:
    "Every string is generated locally in your browser using its cryptographic random number generator. Nothing is sent to a server.",
};

/* ------------------------------------------------------------ timestamps -- */

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

export const timestampConverter: TextToolDef = {
  // Reads the device clock.
  deferred: true,
  modes: {
    key: "mode",
    label: "Direction",
    options: [
      { value: "to-date", label: "Timestamp to date" },
      { value: "to-stamp", label: "Date to timestamp" },
    ],
  },
  input: {
    label: "Input",
    placeholder: "1767225600  —  or  2026-01-01 00:00",
    rows: 6,
    mono: true,
  },
  options: [
    {
      key: "unit",
      label: "Timestamp unit",
      type: "select",
      initial: "auto",
      wide: true,
      options: [
        { value: "auto", label: "Detect automatically" },
        { value: "s", label: "Seconds" },
        { value: "ms", label: "Milliseconds" },
      ],
      when: (v) => v.mode === "to-date",
    },
  ],
  generate: { label: "Use the current time" },
  transform: (input, _v, h) => {
    const raw = input.trim();
    // "Now" comes from the device clock, so the answer matches the user's watch.
    const now = new Date();

    const describe = (date: Date, label: string): TextResult => {
      if (Number.isNaN(date.getTime())) {
        return { error: "That is not a date this browser recognises. Try 2026-01-31, or 2026-01-31 14:30." };
      }
      const offsetMinutes = -date.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const seconds = Math.floor(date.getTime() / 1000);
      const diff = (date.getTime() - now.getTime()) / 1000;
      const relative =
        Math.abs(diff) < 60
          ? "just now"
          : Math.abs(diff) < 3600
            ? `${Math.round(Math.abs(diff) / 60)} minutes ${diff < 0 ? "ago" : "from now"}`
            : Math.abs(diff) < 86400
              ? `${Math.round(Math.abs(diff) / 3600)} hours ${diff < 0 ? "ago" : "from now"}`
              : `${Math.round(Math.abs(diff) / 86400)} days ${diff < 0 ? "ago" : "from now"}`;

      return {
        stats: [
          { label: "Unix seconds", value: String(seconds), tone: "accent" },
          { label: "Unix milliseconds", value: String(date.getTime()) },
          { label: "Relative", value: relative },
        ],
        output: [
          `Unix seconds       ${seconds}`,
          `Unix milliseconds  ${date.getTime()}`,
          `ISO 8601 (UTC)     ${date.toISOString()}`,
          `UTC                ${date.toUTCString()}`,
          `Your local time    ${date.toLocaleString()}`,
          `Your time zone     ${zone} (UTC${offset})`,
          `Day of week        ${date.toLocaleDateString(undefined, { weekday: "long" })}`,
          `Source             ${label}`,
        ].join("\n"),
        note: `Local values use this device's clock and time zone (${zone}).`,
        filename: "timestamp.txt",
      };
    };

    if (h.str("mode") === "to-stamp") {
      if (!raw) return describe(now, "the current time on this device");
      // Bare "YYYY-MM-DD HH:MM" is parsed as local time, which is what people mean.
      const normalised = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/u.test(raw) ? raw.replace(" ", "T") : raw;
      return describe(new Date(normalised), raw);
    }

    if (!raw) return describe(now, "the current time on this device");

    const numeric = Number(raw.replace(/[_,\s]/gu, ""));
    if (!Number.isFinite(numeric)) {
      return { error: "Enter a Unix timestamp — a whole number of seconds or milliseconds." };
    }
    const unit = h.str("unit");
    // A seconds value for any plausible date is at most 10 digits.
    const isMillis = unit === "ms" || (unit === "auto" && Math.abs(numeric) >= 1e11);
    return describe(new Date(isMillis ? numeric : numeric * 1000), `${raw} (${isMillis ? "milliseconds" : "seconds"})`);
  },
  output: { label: "All formats", mono: true, rows: 10 },
  notes: [
    { label: "Unix time", formula: "Seconds elapsed since 1 January 1970, 00:00:00 UTC" },
    { label: "Detection", formula: "Values of 11 digits or more are read as milliseconds" },
  ],
};

/* ------------------------------------------------------------------ hash -- */

/** RFC 1321 MD5. Browsers do not offer it, and old systems still ask for it. */
export function md5(input: string): string {
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = Array.from({ length: 64 }, (_v, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));

  const message = new TextEncoder().encode(input);
  const bitLength = message.length * 8;
  const padded = new Uint8Array((((message.length + 8) >> 6) + 1) * 64);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLength >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLength / 4294967296), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  for (let chunk = 0; chunk < padded.length; chunk += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(chunk + i * 4, true);

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, S[i])) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  const hex = (value: number) => {
    let out = "";
    for (let i = 0; i < 4; i++) out += ((value >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    return out;
  };
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

async function subtleHash(algorithm: string, input: string): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const hashGenerator: TextToolDef = {
  // Awaits the browser's SubtleCrypto.
  deferred: true,
  input: {
    label: "Text to hash",
    placeholder: "Anything — a password, a file's contents, a message…",
    rows: 10,
    mono: true,
    sample: "The quick brown fox jumps over the lazy dog",
  },
  options: [{ key: "upper", label: "Upper case output", type: "checkbox", initial: "", wide: true }],
  transform: async (input, _v, h) => {
    if (!input) return { output: "" };

    const [sha1, sha256, sha384, sha512] = await Promise.all([
      subtleHash("SHA-1", input),
      subtleHash("SHA-256", input),
      subtleHash("SHA-384", input),
      subtleHash("SHA-512", input),
    ]);

    const rows: [string, string][] = [
      ["MD5", md5(input)],
      ["SHA-1", sha1],
      ["SHA-256", sha256],
      ["SHA-384", sha384],
      ["SHA-512", sha512],
      ["CRC32", crc32(input)],
    ];
    const cased = rows.map(([name, value]) => [name, h.bool("upper") ? value.toUpperCase() : value]);

    return {
      output: cased.map(([name, value]) => `${name.padEnd(8)} ${value}`).join("\n"),
      stats: [
        { label: "SHA-256", value: `${cased[2][1].slice(0, 16)}…`, tone: "accent" },
        { label: "Input bytes", value: n(new TextEncoder().encode(input).length) },
      ],
      table: { head: ["Algorithm", "Digest"], rows: cased, caption: "Hash digests" },
      filename: "hashes.txt",
      note: "MD5 and SHA-1 are broken for security purposes. Use SHA-256 or stronger for anything that matters.",
    } satisfies TextResult;
  },
  output: { label: "Digests", mono: true, rows: 8 },
  privacyNote:
    "Hashing happens locally in your browser using its own cryptography engine. Your text is never uploaded.",
};

/* ------------------------------------------------------------------- JWT -- */

export const jwtDecoder: TextToolDef = {
  // Compares the expiry against the device clock.
  deferred: true,
  input: {
    label: "JSON Web Token",
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature",
    rows: 8,
    mono: true,
  },
  transform: (input) => {
    const token = input.trim().replace(/^Bearer\s+/iu, "");
    if (!token) return { note: "Paste a token to see what is inside it." };

    const parts = token.split(".");
    if (parts.length < 2) {
      return { error: "A JWT has three dot-separated parts: header, payload and signature." };
    }

    const decodePart = (part: string, name: string) => {
      try {
        return JSON.parse(base64Decode(part)) as Record<string, unknown>;
      } catch {
        throw new Error(`The ${name} is not valid Base64URL-encoded JSON.`);
      }
    };

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;
    try {
      header = decodePart(parts[0], "header");
      payload = decodePart(parts[1], "payload");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not decode that token." };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const iat = typeof payload.iat === "number" ? payload.iat : null;
    const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

    const claimRows: string[][] = Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    ]);
    for (const [key, seconds] of [["iat", iat], ["nbf", nbf], ["exp", exp]] as const) {
      if (seconds !== null) {
        claimRows.push([`${key} (as a date)`, new Date(seconds * 1000).toLocaleString()]);
      }
    }

    const expired = exp !== null && exp < nowSeconds;

    return {
      stats: [
        { label: "Algorithm", value: String(header.alg ?? "unknown"), tone: header.alg === "none" ? "error" : "accent" },
        { label: "Type", value: String(header.typ ?? "JWT") },
        {
          label: "Expiry",
          value: exp === null ? "None set" : expired ? "Expired" : "Valid",
          sub: exp === null ? undefined : new Date(exp * 1000).toLocaleString(),
          tone: exp === null ? "warning" : expired ? "error" : "success",
        },
      ],
      output: `HEADER\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD\n${JSON.stringify(payload, null, 2)}`,
      table: claimRows.length ? { head: ["Claim", "Value"], rows: claimRows, caption: "Payload claims" } : undefined,
      warning: expired ? "This token expired — the exp claim is in the past according to your device clock." : undefined,
      note: "The signature is shown but not verified. Verifying it needs the secret or public key, which should never be pasted into a web page.",
      filename: "jwt.json",
    } satisfies TextResult;
  },
  output: { label: "Decoded token", mono: true, rows: 16 },
  privacyNote:
    "The token is decoded locally in your browser and never sent anywhere. Even so, treat any token you paste as compromised and rotate it if it is live.",
};
