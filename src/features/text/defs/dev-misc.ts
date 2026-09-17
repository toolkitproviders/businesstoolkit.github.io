import type { TextResult, TextSpan, TextToolDef } from "../types";

/**
 * The developer tools that are more than a string transform: a regex tester
 * with live highlighting, a cron expression reader, a line diff, and HTML
 * entity conversion.
 */

const n = (value: number) => value.toLocaleString("en-US");

/* --------------------------------------------------------- regex tester -- */

export const regexTester: TextToolDef = {
  input: {
    label: "Test text",
    placeholder: "Paste the text to run your pattern against…",
    rows: 12,
    mono: true,
    initial: `Order 1042 shipped on 2026-03-14 to sarah@example.com
Order 1043 shipped on 2026-03-15 to omar@example.co.uk
Order 1044 was cancelled`,
    sample: `Order 1042 shipped on 2026-03-14 to sarah@example.com
Order 1043 shipped on 2026-03-15 to omar@example.co.uk
Order 1044 was cancelled`,
  },
  options: [
    {
      key: "pattern",
      label: "Regular expression",
      type: "text",
      initial: "\\b\\d{4}-\\d{2}-\\d{2}\\b",
      placeholder: "\\d+",
      wide: true,
      hint: "Write the pattern only — no surrounding slashes.",
    },
    { key: "g", label: "g — find every match", type: "checkbox", initial: "1" },
    { key: "i", label: "i — ignore case", type: "checkbox", initial: "" },
    { key: "m", label: "m — ^ and $ match each line", type: "checkbox", initial: "" },
    { key: "s", label: "s — . also matches newlines", type: "checkbox", initial: "" },
    { key: "u", label: "u — full Unicode", type: "checkbox", initial: "1" },
  ],
  transform: (input, _v, h) => {
    const source = h.str("pattern");
    if (!source) return { note: "Type a pattern above to see what it matches." };

    const flags = `${h.bool("g") ? "g" : ""}${h.bool("i") ? "i" : ""}${h.bool("m") ? "m" : ""}${h.bool("s") ? "s" : ""}${h.bool("u") ? "u" : ""}`;

    let pattern: RegExp;
    try {
      pattern = new RegExp(source, flags.includes("g") ? flags : `${flags}g`);
    } catch (err) {
      return {
        stats: [{ label: "Pattern", value: "Invalid", tone: "error" }],
        error: err instanceof Error ? err.message : "That pattern is not a valid regular expression.",
      };
    }

    const spans: TextSpan[] = [];
    const rows: string[][] = [];
    let last = 0;
    let count = 0;

    for (const match of input.matchAll(pattern)) {
      const at = match.index ?? 0;
      if (at > last) spans.push({ text: input.slice(last, at) });
      // A zero-length match would loop forever if we did not step past it.
      const text = match[0];
      spans.push({ text: text || "∅", tone: "match" });
      last = at + (text.length || 1);
      count += 1;

      const groups = match.slice(1).map((g, i) => `$${i + 1}=${g ?? "(none)"}`);
      const named = match.groups
        ? Object.entries(match.groups).map(([key, value]) => `${key}=${value ?? "(none)"}`)
        : [];
      rows.push([text || "(empty)", String(at), [...groups, ...named].join("  ") || "—"]);

      if (count >= 5000) break;
      if (!h.bool("g")) break;
    }
    if (last < input.length) spans.push({ text: input.slice(last) });

    return {
      stats: [
        { label: "Matches", value: n(count), tone: count ? "accent" : "neutral" },
        { label: "Flags", value: `/${flags || "—"}` },
        { label: "Pattern", value: "Valid", tone: "success" },
      ],
      spans: input ? spans : undefined,
      output: rows.map((r) => r[0]).join("\n"),
      table: rows.length
        ? { head: ["Match", "Index", "Groups"], rows: rows.slice(0, 200), caption: "Matches" }
        : undefined,
      filename: "matches.txt",
    } satisfies TextResult;
  },
  output: { label: "Matches highlighted", mono: true },
  notes: [
    { label: "Character classes", formula: "\\d digit   \\w word character   \\s whitespace   . any character" },
    { label: "Quantifiers", formula: "* zero or more   + one or more   ? optional   {2,4} between two and four" },
    { label: "Anchors", formula: "^ start   $ end   \\b word boundary" },
    { label: "Groups", formula: "(…) capture   (?:…) group without capturing   (?<name>…) named" },
  ],
};

/* ---------------------------------------------------------- cron helper -- */

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export interface CronField {
  values: number[];
  wildcard: boolean;
}

/** Expands one cron field ("*", "1-5", "*​/15", "MON,WED") into its values. */
export function parseCronField(
  raw: string,
  min: number,
  max: number,
  names?: string[],
): CronField {
  const wildcard = raw === "*" || raw === "?";
  const values = new Set<number>();

  const readValue = (token: string): number => {
    const upper = token.toUpperCase();
    const named = names?.indexOf(upper) ?? -1;
    if (named >= 0) return named + (names === MONTH_NAMES ? 1 : 0);
    const parsed = Number.parseInt(token, 10);
    if (!Number.isInteger(parsed)) throw new Error(`“${token}” is not a valid value.`);
    return parsed;
  };

  for (const part of raw.split(",")) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart ? Number.parseInt(stepPart, 10) : 1;
    if (!Number.isInteger(step) || step < 1) throw new Error(`“${part}” has an invalid step.`);

    let from = min;
    let to = max;
    if (rangePart !== "*" && rangePart !== "?") {
      const bounds = rangePart.split("-");
      from = readValue(bounds[0]);
      to = bounds.length > 1 ? readValue(bounds[1]) : stepPart ? max : from;
    }
    if (from < min || to > max || from > to) {
      throw new Error(`“${part}” is outside the allowed range ${min}–${max}.`);
    }
    for (let v = from; v <= to; v += step) values.add(v);
  }

  if (values.size === 0) throw new Error(`“${raw}” does not match any value.`);
  return { values: [...values].sort((a, b) => a - b), wildcard };
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export function parseCron(expression: string): ParsedCron {
  const normalised = ALIASES[expression.trim().toLowerCase()] ?? expression.trim();
  const fields = normalised.split(/\s+/u);
  if (fields.length !== 5) {
    throw new Error(
      `A cron expression has five fields — minute, hour, day of month, month, day of week. You gave ${fields.length}.`,
    );
  }
  return {
    minute: parseCronField(fields[0], 0, 59),
    hour: parseCronField(fields[1], 0, 23),
    dayOfMonth: parseCronField(fields[2], 1, 31),
    // Sunday is both 0 and 7 in the traditional syntax.
    month: parseCronField(fields[3], 1, 12, MONTH_NAMES),
    dayOfWeek: normaliseWeekdays(parseCronField(fields[4], 0, 7, DAY_NAMES)),
  };
}

function normaliseWeekdays(field: CronField): CronField {
  return {
    wildcard: field.wildcard,
    values: [...new Set(field.values.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b),
  };
}

/**
 * Walks forward a minute at a time from `from`. A year of minutes is about
 * half a million cheap comparisons, which is instant and far simpler to get
 * right than jumping between candidate dates.
 */
export function nextCronRuns(cron: ParsedCron, from: Date, count: number): Date[] {
  const runs: Date[] = [];
  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = 366 * 24 * 60 * 5; // five years
  for (let step = 0; step < limit && runs.length < count; step++) {
    const dom = cron.dayOfMonth.values.includes(cursor.getDate());
    const dow = cron.dayOfWeek.values.includes(cursor.getDay());
    // Traditional cron: when both day fields are restricted, either may match.
    const dayMatches =
      cron.dayOfMonth.wildcard && cron.dayOfWeek.wildcard
        ? true
        : cron.dayOfMonth.wildcard
          ? dow
          : cron.dayOfWeek.wildcard
            ? dom
            : dom || dow;

    if (
      cron.minute.values.includes(cursor.getMinutes()) &&
      cron.hour.values.includes(cursor.getHours()) &&
      cron.month.values.includes(cursor.getMonth() + 1) &&
      dayMatches
    ) {
      runs.push(new Date(cursor.getTime()));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}

function list<T>(values: T[], render: (v: T) => string, joiner = "and"): string {
  const parts = values.map(render);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${joiner} ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} ${joiner} ${parts[parts.length - 1]}`;
}

export function describeCron(cron: ParsedCron): string {
  const pad = (v: number) => String(v).padStart(2, "0");

  let time: string;
  if (cron.minute.wildcard && cron.hour.wildcard) time = "Every minute";
  else if (cron.minute.wildcard) time = `Every minute during ${list(cron.hour.values, (h) => `${pad(h)}:00`)}`;
  else if (cron.hour.wildcard) {
    time =
      cron.minute.values.length === 1
        ? `At ${pad(cron.minute.values[0])} minutes past every hour`
        : `At ${list(cron.minute.values, pad)} minutes past every hour`;
  } else {
    const times: string[] = [];
    for (const h of cron.hour.values) for (const m of cron.minute.values) times.push(`${pad(h)}:${pad(m)}`);
    time = times.length <= 6 ? `At ${list(times, (t) => t)}` : `At ${times.length} times a day, starting ${times[0]}`;
  }

  const days: string[] = [];
  if (!cron.dayOfWeek.wildcard) days.push(`on ${list(cron.dayOfWeek.values, (d) => DAY_LONG[d])}`);
  if (!cron.dayOfMonth.wildcard) {
    days.push(`on day ${list(cron.dayOfMonth.values, (d) => String(d), "and")} of the month`);
  }
  const months = cron.month.wildcard ? "" : ` in ${list(cron.month.values, (m) => MONTH_LONG[m - 1])}`;

  const dayPart = days.length ? ` ${days.join(" or ")}` : " every day";
  return `${time}${dayPart}${months}.`;
}

export const cronHelper: TextToolDef = {
  // The next runs are relative to the device clock.
  deferred: true,
  input: {
    label: "Cron expression",
    // A worked example beats an empty box: the page explains itself on arrival.
    initial: "0 9 * * 1-5",
    placeholder: "0 9 * * 1-5",
    rows: 3,
    mono: true,
    sample: "30 8 1,15 * MON-FRI",
  },
  options: [
    {
      key: "preset",
      label: "Or start from a common schedule",
      type: "select",
      initial: "",
      wide: true,
      options: [
        { value: "", label: "Use the expression above" },
        { value: "* * * * *", label: "Every minute" },
        { value: "*/5 * * * *", label: "Every 5 minutes" },
        { value: "*/15 * * * *", label: "Every 15 minutes" },
        { value: "0 * * * *", label: "Hourly, on the hour" },
        { value: "0 9 * * *", label: "Every day at 09:00" },
        { value: "0 9 * * 1-5", label: "Weekdays at 09:00" },
        { value: "0 0 * * 0", label: "Every Sunday at midnight" },
        { value: "0 3 1 * *", label: "First of the month at 03:00" },
        { value: "0 0 1 1 *", label: "Once a year on 1 January" },
      ],
    },
    { key: "count", label: "Show the next", type: "number", initial: "10", min: 1, max: 50 },
  ],
  transform: (input, _v, h) => {
    const expression = (h.str("preset") || input).trim();
    if (!expression) return { note: "Type a cron expression, or pick a common schedule." };

    let cron: ParsedCron;
    try {
      cron = parseCron(expression);
    } catch (err) {
      return {
        stats: [{ label: "Expression", value: "Invalid", tone: "error" }],
        error: err instanceof Error ? err.message : "That is not a valid cron expression.",
      };
    }

    // The user's own clock and time zone, so the times shown are theirs.
    const now = new Date();
    const runs = nextCronRuns(cron, now, Math.min(50, Math.max(1, h.num("count", 10))));
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      stats: [
        { label: "Expression", value: "Valid", tone: "success" },
        { label: "Next run", value: runs[0] ? runs[0].toLocaleString() : "Never", tone: runs[0] ? "accent" : "warning" },
        { label: "Runs per day", value: runsPerDay(cron) },
      ],
      output: `${expression}\n\n${describeCron(cron)}\n\n${runs.map((r) => r.toLocaleString()).join("\n")}`,
      table: runs.length
        ? {
            head: ["Next runs", "Day", "In"],
            rows: runs.map((r) => [
              r.toLocaleString(),
              DAY_LONG[r.getDay()],
              humanGap(r.getTime() - now.getTime()),
            ]),
            caption: "Upcoming runs",
          }
        : undefined,
      note: `${describeCron(cron)} Times use this device's clock and time zone (${zone}) — a server usually runs on UTC.`,
      warning: runs.length === 0 ? "That expression never matches a real date — check the day and month fields." : undefined,
      filename: "cron-schedule.txt",
    } satisfies TextResult;
  },
  output: { label: "Schedule", mono: true, rows: 14 },
  notes: [
    { label: "Field order", formula: "minute  hour  day-of-month  month  day-of-week" },
    { label: "Ranges", formula: "* any   5 exactly   1-5 a range   */15 every 15   1,15 a list" },
    { label: "Day of week", formula: "0 or 7 = Sunday, 1 = Monday … 6 = Saturday. Names such as MON also work." },
    { label: "Both day fields set", formula: "The job runs when EITHER matches, not both", note: "A long-standing quirk of the original cron." },
  ],
};

function runsPerDay(cron: ParsedCron): string {
  const perDay = cron.minute.values.length * cron.hour.values.length;
  return perDay > 1440 ? "1,440" : n(perDay);
}

function humanGap(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

/* ---------------------------------------------------------- diff checker -- */

/**
 * Line diff via the classic longest-common-subsequence table. Identical
 * prefixes and suffixes are stripped first, which is what keeps the table
 * small for the usual case of two nearly identical files.
 */
export function diffLines(a: string[], b: string[]): { tone: "add" | "remove" | "same"; text: string }[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const result: { tone: "add" | "remove" | "same"; text: string }[] = [];
  for (let i = 0; i < start; i++) result.push({ tone: "same", text: a[i] });

  const LIMIT = 2000;
  if (midA.length > LIMIT || midB.length > LIMIT) {
    // Too large for the table; fall back to a straight positional comparison.
    const rows = Math.max(midA.length, midB.length);
    for (let i = 0; i < rows; i++) {
      if (midA[i] === midB[i]) result.push({ tone: "same", text: midA[i] });
      else {
        if (midA[i] !== undefined) result.push({ tone: "remove", text: midA[i] });
        if (midB[i] !== undefined) result.push({ tone: "add", text: midB[i] });
      }
    }
  } else {
    const rows = midA.length + 1;
    const table = new Uint32Array(rows * (midB.length + 1));
    for (let i = midA.length - 1; i >= 0; i--) {
      for (let j = midB.length - 1; j >= 0; j--) {
        table[i * (midB.length + 1) + j] =
          midA[i] === midB[j]
            ? table[(i + 1) * (midB.length + 1) + (j + 1)] + 1
            : Math.max(table[(i + 1) * (midB.length + 1) + j], table[i * (midB.length + 1) + (j + 1)]);
      }
    }

    let i = 0;
    let j = 0;
    while (i < midA.length && j < midB.length) {
      if (midA[i] === midB[j]) {
        result.push({ tone: "same", text: midA[i] });
        i++;
        j++;
      } else if (table[(i + 1) * (midB.length + 1) + j] >= table[i * (midB.length + 1) + (j + 1)]) {
        result.push({ tone: "remove", text: midA[i] });
        i++;
      } else {
        result.push({ tone: "add", text: midB[j] });
        j++;
      }
    }
    while (i < midA.length) result.push({ tone: "remove", text: midA[i++] });
    while (j < midB.length) result.push({ tone: "add", text: midB[j++] });
  }

  for (let i = endA; i < a.length; i++) result.push({ tone: "same", text: a[i] });
  return result;
}

export const diffChecker: TextToolDef = {
  input: {
    label: "Original text",
    placeholder: "Paste the first version…",
    rows: 12,
    mono: true,
    sample: "Invoice 1042\nHarbour Coffee\n12 x Espresso blend 1kg\nDelivery\nTotal: 228.00 GBP\nPayment due in 30 days",
    accept: ".txt,.csv,.json,.md,text/plain",
  },
  options: [
    {
      key: "other",
      label: "Changed text",
      type: "textarea",
      rows: 12,
      mono: true,
      wide: true,
      placeholder: "Paste the second version…",
      initial: "Invoice 1042\nHarbour Coffee Ltd\n12 x Espresso blend 1kg\n2 x Filter papers\nDelivery\nTotal: 246.00 GBP\nPayment due in 14 days",
    },
    { key: "trim", label: "Ignore leading and trailing spaces", type: "checkbox", initial: "1", wide: true },
    { key: "case", label: "Ignore case", type: "checkbox", initial: "", wide: true },
    { key: "context", label: "Show unchanged lines", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (input, _v, h) => {
    const prepare = (value: string) =>
      value.split(/\r\n|\r|\n/u).map((line) => {
        let l = h.bool("trim") ? line.trim() : line;
        if (h.bool("case")) l = l.toLowerCase();
        return l;
      });

    if (!input.trim() && !h.str("other").trim()) {
      return { note: "Paste a version into each box to compare them." };
    }

    const diff = diffLines(prepare(input), prepare(h.str("other")));
    const added = diff.filter((d) => d.tone === "add").length;
    const removed = diff.filter((d) => d.tone === "remove").length;
    const same = diff.filter((d) => d.tone === "same").length;

    const shown = h.bool("context") ? diff : diff.filter((d) => d.tone !== "same");

    return {
      stats: [
        { label: "Added", value: `+${n(added)}`, tone: added ? "success" : "neutral" },
        { label: "Removed", value: `-${n(removed)}`, tone: removed ? "error" : "neutral" },
        { label: "Unchanged", value: n(same) },
      ],
      spans: shown.map((d) => ({
        text: `${d.tone === "add" ? "+ " : d.tone === "remove" ? "- " : "  "}${d.text}\n`,
        tone: d.tone === "add" ? "add" : d.tone === "remove" ? "remove" : undefined,
      })),
      output: shown
        .map((d) => `${d.tone === "add" ? "+" : d.tone === "remove" ? "-" : " "} ${d.text}`)
        .join("\n"),
      note: added === 0 && removed === 0 ? "The two versions are identical." : undefined,
      filename: "diff.txt",
    } satisfies TextResult;
  },
  output: { label: "Differences", mono: true },
};

/* -------------------------------------------------------- HTML entities -- */

const NAMED_ENTITIES: [string, string][] = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
  [" ", "&nbsp;"],
  ["©", "&copy;"],
  ["®", "&reg;"],
  ["™", "&trade;"],
  ["€", "&euro;"],
  ["£", "&pound;"],
  ["¥", "&yen;"],
  ["¢", "&cent;"],
  ["§", "&sect;"],
  ["¶", "&para;"],
  ["†", "&dagger;"],
  ["•", "&bull;"],
  ["…", "&hellip;"],
  ["–", "&ndash;"],
  ["—", "&mdash;"],
  ["‘", "&lsquo;"],
  ["’", "&rsquo;"],
  ["“", "&ldquo;"],
  ["”", "&rdquo;"],
  ["«", "&laquo;"],
  ["»", "&raquo;"],
  ["°", "&deg;"],
  ["±", "&plusmn;"],
  ["×", "&times;"],
  ["÷", "&divide;"],
  ["¼", "&frac14;"],
  ["½", "&frac12;"],
  ["¾", "&frac34;"],
  ["→", "&rarr;"],
  ["←", "&larr;"],
  ["↑", "&uarr;"],
  ["↓", "&darr;"],
];

const ENCODE_MAP = new Map(NAMED_ENTITIES);
const DECODE_MAP = new Map(NAMED_ENTITIES.map(([char, entity]) => [entity, char]));

export function encodeHtmlEntities(input: string, mode: "minimal" | "named" | "numeric"): string {
  if (mode === "numeric") {
    return [...input]
      .map((char) => {
        if (/[A-Za-z0-9\s]/u.test(char)) return char;
        const code = char.codePointAt(0) ?? 0;
        return `&#${code};`;
      })
      .join("");
  }
  const minimal = new Set(["&", "<", ">", '"', "'"]);
  return [...input]
    .map((char) => {
      if (mode === "minimal") return minimal.has(char) ? ENCODE_MAP.get(char)! : char;
      return ENCODE_MAP.get(char) ?? (char.codePointAt(0)! > 127 ? `&#${char.codePointAt(0)};` : char);
    })
    .join("");
}

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&[a-zA-Z][a-zA-Z0-9]*;/gu, (entity) => DECODE_MAP.get(entity.toLowerCase()) ?? entity)
    .replace(/&#x([0-9a-fA-F]+);/gu, (_m, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_m, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

export const htmlEntityTool: TextToolDef = {
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
    placeholder: "<p>Tom & Jerry's “big” day</p>",
    rows: 12,
    mono: true,
    sample: "<p>Tom & Jerry's “big” day — 50% off, £9.99 only</p>",
  },
  options: [
    {
      key: "scope",
      label: "Encode",
      type: "select",
      initial: "minimal",
      wide: true,
      when: (v) => v.mode === "encode",
      options: [
        { value: "minimal", label: "Only the five characters HTML requires — & < > \" '" },
        { value: "named", label: "Named entities where one exists — &copy; &pound; &mdash;" },
        { value: "numeric", label: "Everything non-alphanumeric, as numbers — &#169;" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    if (!input) return { output: "" };
    const output =
      h.str("mode") === "decode"
        ? decodeHtmlEntities(input)
        : encodeHtmlEntities(input, h.str("scope") as "minimal" | "named" | "numeric");

    return {
      output,
      stats: [
        { label: "Characters in", value: n(input.length) },
        { label: "Characters out", value: n(output.length), tone: "accent" },
      ],
      filename: h.str("mode") === "decode" ? "decoded.txt" : "encoded.html",
    } satisfies TextResult;
  },
  output: { label: "Result", mono: true },
  notes: [
    { label: "Always escape", formula: "& becomes &amp;   < becomes &lt;   > becomes &gt;" },
    { label: "In attributes", formula: 'Also escape " as &quot; and \' as &#39;', note: "Otherwise a quote in the value can end the attribute early." },
  ],
};
