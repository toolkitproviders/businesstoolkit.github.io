import type { TextResult, TextToolDef } from "../types";
import { randomInt } from "@/lib/random";

export { randomInt };

/**
 * Text transformation tools: case conversion, cleaning, sorting, extracting
 * and generating. Every transform is a pure string function so the test suite
 * can assert on the exact output.
 */

const SAMPLE = `  the Q3 sales REPORT   is ready.

Contact sarah@example.com or call +44 20 7946 0958.
Full report: https://example.com/reports/q3-2026
Revenue was 128500 GBP, up 12% on Q2.
Revenue was 128500 GBP, up 12% on Q2.`;

const LINES_SAMPLE = `banana
Apple
cherry
apple
Banana
date
cherry`;

const lines = (input: string) => input.split(/\r\n|\r|\n/u);
const n = (value: number) => value.toLocaleString("en-US");

/** Unicode combining marks, left behind by NFKD when accents are stripped. */
const COMBINING_MARKS = /[̀-ͯ]/gu;

/* --------------------------------------------------------- case converter -- */

/** Words that stay lower-case in title case unless they open the title. */
const SMALL_WORDS = new Set(
  "a an and as at but by for in nor of on or per so the to v via vs with from into over up".split(" "),
);

function splitTokens(input: string): string[] {
  // Handles "helloWorld", "hello_world", "hello-world" and "hello world".
  return input
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function toTitleCase(input: string): string {
  const end = input.trimEnd().length;
  return input.replace(/\S+/gu, (word, offset: number) => {
    const lower = word.toLowerCase();
    const isFirst = input.slice(0, offset).trim() === "";
    const isLast = offset + word.length >= end;
    if (!isFirst && !isLast && SMALL_WORDS.has(lower.replace(/[^\p{L}]/gu, ""))) return lower;
    return lower.replace(/\p{L}/u, (c) => c.toUpperCase());
  });
}

export function toSentenceCase(input: string): string {
  return input
    .toLowerCase()
    .replace(
      /(^\s*|[.!?…]\s+|\n\s*)(\p{Ll})/gu,
      (_m, lead: string, letter: string) => lead + letter.toUpperCase(),
    )
    .replace(/\bi\b/gu, "I");
}

const CASES: Record<string, (input: string) => string> = {
  lower: (s) => s.toLowerCase(),
  upper: (s) => s.toUpperCase(),
  title: toTitleCase,
  sentence: toSentenceCase,
  camel: (s) =>
    splitTokens(s)
      .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
      .join(""),
  pascal: (s) =>
    splitTokens(s)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(""),
  snake: (s) => splitTokens(s).map((w) => w.toLowerCase()).join("_"),
  kebab: (s) => splitTokens(s).map((w) => w.toLowerCase()).join("-"),
  constant: (s) => splitTokens(s).map((w) => w.toUpperCase()).join("_"),
  dot: (s) => splitTokens(s).map((w) => w.toLowerCase()).join("."),
  alternating: (s) => {
    let i = 0;
    return s.replace(/\p{L}/gu, (c) => (i++ % 2 === 0 ? c.toLowerCase() : c.toUpperCase()));
  },
  inverse: (s) =>
    s.replace(/\p{L}/gu, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())),
};

export const caseConverter: TextToolDef = {
  input: {
    label: "Your text",
    placeholder: "Paste the text you want to convert…",
    rows: 12,
    sample: "the quick brown fox jumps over the lazy dog",
  },
  options: [
    {
      key: "case",
      label: "Convert to",
      type: "select",
      initial: "title",
      wide: true,
      options: [
        { value: "lower", label: "lower case" },
        { value: "upper", label: "UPPER CASE" },
        { value: "title", label: "Title Case" },
        { value: "sentence", label: "Sentence case" },
        { value: "camel", label: "camelCase" },
        { value: "pascal", label: "PascalCase" },
        { value: "snake", label: "snake_case" },
        { value: "kebab", label: "kebab-case" },
        { value: "constant", label: "CONSTANT_CASE" },
        { value: "dot", label: "dot.case" },
        { value: "alternating", label: "aLtErNaTiNg CaSe" },
        { value: "inverse", label: "iNVERSE cASE" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    const fn = CASES[h.str("case")] ?? CASES.lower;
    return { output: input ? fn(input) : "", filename: "converted-text.txt" };
  },
  output: { label: "Converted text", mono: false },
  notes: [
    {
      label: "Title Case",
      formula: "Capitalises each word, leaving short joining words lower-case",
      note: "Unless they start or end the title.",
    },
    { label: "Sentence case", formula: "Capitalises the first letter after . ! ? or a line break" },
  ],
};

/* ----------------------------------------------------- remove extra spaces -- */

export const removeExtraSpaces: TextToolDef = {
  input: { label: "Your text", placeholder: "Paste text with messy spacing…", rows: 12, sample: SAMPLE },
  options: [
    { key: "collapse", label: "Collapse repeated spaces into one", type: "checkbox", initial: "1", wide: true },
    { key: "trim", label: "Trim spaces at the start and end of each line", type: "checkbox", initial: "1", wide: true },
    { key: "tabs", label: "Convert tabs to a single space", type: "checkbox", initial: "1", wide: true },
    { key: "blank", label: "Remove blank lines", type: "checkbox", initial: "", wide: true },
    { key: "breaks", label: "Join everything onto one line", type: "checkbox", initial: "", wide: true },
    { key: "all", label: "Remove every space", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    let out = input;
    if (h.bool("tabs")) out = out.replace(/\t/gu, " ");
    if (h.bool("collapse")) out = out.replace(/[^\S\r\n]{2,}/gu, " ");
    if (h.bool("trim")) out = lines(out).map((l) => l.trim()).join("\n");
    if (h.bool("blank")) out = lines(out).filter((l) => l.trim()).join("\n");
    if (h.bool("breaks")) out = out.replace(/\s*\r?\n\s*/gu, " ").trim();
    if (h.bool("all")) out = out.replace(/\s+/gu, "");

    const removed = input.length - out.length;
    return {
      output: out,
      stats: [
        { label: "Characters before", value: n(input.length) },
        { label: "Characters after", value: n(out.length) },
        { label: "Removed", value: n(Math.max(0, removed)), tone: removed > 0 ? "success" : "neutral" },
      ],
      filename: "cleaned-text.txt",
    } satisfies TextResult;
  },
  output: { label: "Cleaned text", mono: false },
};

/* -------------------------------------------------- remove duplicate lines -- */

export const removeDuplicateLines: TextToolDef = {
  input: {
    label: "Your lines",
    placeholder: "One item per line…",
    rows: 14,
    sample: LINES_SAMPLE,
    accept: ".txt,.csv,text/plain",
  },
  options: [
    { key: "case", label: "Case sensitive", type: "checkbox", initial: "", wide: true },
    { key: "trim", label: "Ignore leading and trailing spaces", type: "checkbox", initial: "1", wide: true },
    { key: "blank", label: "Remove blank lines", type: "checkbox", initial: "1", wide: true },
    {
      key: "keep",
      label: "Keep",
      type: "select",
      initial: "first",
      wide: true,
      options: [
        { value: "first", label: "The first occurrence of each line" },
        { value: "last", label: "The last occurrence of each line" },
        { value: "unique", label: "Only lines that appear exactly once" },
        { value: "dupes", label: "Only the lines that were duplicated" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    const source = lines(input);
    const dropBlank = h.bool("blank");
    const key = (line: string) => {
      let k = h.bool("trim") ? line.trim() : line;
      if (!h.bool("case")) k = k.toLowerCase();
      return k;
    };

    const kept: string[] = [];
    const counts = new Map<string, number>();
    for (const line of source) {
      if (dropBlank && !line.trim()) continue;
      const k = key(line);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const mode = h.str("keep");

    if (mode === "last") {
      // Walk backwards so "last occurrence" is the one retained, then restore
      // the original order.
      const seen = new Set<string>();
      for (let i = source.length - 1; i >= 0; i--) {
        const line = source[i];
        if (dropBlank && !line.trim()) continue;
        const k = key(line);
        if (seen.has(k)) continue;
        seen.add(k);
        kept.unshift(line);
      }
    } else {
      const seen = new Set<string>();
      for (const line of source) {
        if (dropBlank && !line.trim()) continue;
        const k = key(line);
        const total = counts.get(k) ?? 0;
        if (mode === "unique") {
          if (total === 1) kept.push(line);
        } else if (mode === "dupes") {
          if (total > 1 && !seen.has(k)) {
            seen.add(k);
            kept.push(line);
          }
        } else if (!seen.has(k)) {
          seen.add(k);
          kept.push(line);
        }
      }
    }

    const removed = source.length - kept.length;
    return {
      output: kept.join("\n"),
      stats: [
        { label: "Lines in", value: n(source.length) },
        { label: "Lines out", value: n(kept.length), tone: "accent" },
        { label: "Removed", value: n(Math.max(0, removed)), tone: removed > 0 ? "success" : "neutral" },
      ],
      filename: "unique-lines.txt",
    } satisfies TextResult;
  },
  output: { label: "Result", mono: false },
};

/* ------------------------------------------------------------- sort lines -- */

export const sortLines: TextToolDef = {
  input: {
    label: "Your lines",
    placeholder: "One item per line…",
    rows: 14,
    sample: LINES_SAMPLE,
    accept: ".txt,.csv,text/plain",
  },
  options: [
    {
      key: "order",
      label: "Sort by",
      type: "select",
      initial: "az",
      wide: true,
      options: [
        { value: "az", label: "A to Z" },
        { value: "za", label: "Z to A" },
        { value: "num-asc", label: "Number, smallest first" },
        { value: "num-desc", label: "Number, largest first" },
        { value: "len-asc", label: "Length, shortest first" },
        { value: "len-desc", label: "Length, longest first" },
        { value: "reverse", label: "Reverse the current order" },
        { value: "shuffle", label: "Shuffle randomly" },
      ],
    },
    { key: "case", label: "Case sensitive", type: "checkbox", initial: "", wide: true },
    { key: "trim", label: "Trim each line", type: "checkbox", initial: "1", wide: true },
    { key: "blank", label: "Remove blank lines", type: "checkbox", initial: "1", wide: true },
    { key: "dedupe", label: "Remove duplicates", type: "checkbox", initial: "", wide: true },
  ],
  generate: { label: "Shuffle again" },
  transform: (input, _v, h) => {
    let list = lines(input);
    if (h.bool("trim")) list = list.map((l) => l.trim());
    if (h.bool("blank")) list = list.filter((l) => l.trim());
    if (h.bool("dedupe")) {
      const seen = new Set<string>();
      list = list.filter((l) => {
        const k = h.bool("case") ? l : l.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    const num = (l: string) => {
      const m = l.match(/-?\d+(\.\d+)?/u);
      return m ? Number.parseFloat(m[0]) : Number.NaN;
    };
    const cmp = (a: string, b: string) =>
      h.bool("case")
        ? a < b
          ? -1
          : a > b
            ? 1
            : 0
        : a.localeCompare(b, "en", { sensitivity: "base" });

    switch (h.str("order")) {
      case "za":
        list = [...list].sort((a, b) => cmp(b, a));
        break;
      case "num-asc":
      case "num-desc": {
        const dir = h.str("order") === "num-asc" ? 1 : -1;
        list = [...list].sort((a, b) => {
          const na = num(a);
          const nb = num(b);
          // Lines without a number sink to the bottom rather than scattering.
          if (Number.isNaN(na) && Number.isNaN(nb)) return cmp(a, b);
          if (Number.isNaN(na)) return 1;
          if (Number.isNaN(nb)) return -1;
          return (na - nb) * dir;
        });
        break;
      }
      case "len-asc":
        list = [...list].sort((a, b) => a.length - b.length || cmp(a, b));
        break;
      case "len-desc":
        list = [...list].sort((a, b) => b.length - a.length || cmp(a, b));
        break;
      case "reverse":
        list = [...list].reverse();
        break;
      case "shuffle": {
        list = [...list];
        for (let i = list.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [list[i], list[j]] = [list[j], list[i]];
        }
        break;
      }
      default:
        list = [...list].sort(cmp);
    }

    return {
      output: list.join("\n"),
      stats: [{ label: "Lines", value: n(list.length), tone: "accent" }],
      filename: "sorted-lines.txt",
    } satisfies TextResult;
  },
  output: { label: "Sorted lines", mono: false },
};

/* ---------------------------------------------------------- reverse text -- */

export const reverseText: TextToolDef = {
  input: {
    label: "Your text",
    placeholder: "Type or paste text to reverse…",
    rows: 10,
    sample: "Never odd or even",
  },
  options: [
    {
      key: "mode",
      label: "Reverse",
      type: "select",
      initial: "characters",
      wide: true,
      options: [
        { value: "characters", label: "Characters — dlrow olleH" },
        { value: "words", label: "Word order — world Hello" },
        { value: "lines", label: "Line order" },
        { value: "each-word", label: "Letters inside each word — olleH dlrow" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    // Split by code point so emoji and accented characters survive reversal.
    const reverseChars = (s: string) => [...s].reverse().join("");
    let output = "";
    switch (h.str("mode")) {
      case "words":
        output = input.split(/(\s+)/u).reverse().join("");
        break;
      case "lines":
        output = lines(input).reverse().join("\n");
        break;
      case "each-word":
        output = input.replace(/\S+/gu, reverseChars);
        break;
      default:
        output = reverseChars(input);
    }
    const stripped = input.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    return {
      output,
      note:
        stripped.length > 2 && stripped === [...stripped].reverse().join("")
          ? "That text is a palindrome — it reads the same in both directions."
          : undefined,
      filename: "reversed-text.txt",
    } satisfies TextResult;
  },
  output: { label: "Reversed text", mono: false },
};

/* -------------------------------------------------------- find & replace -- */

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export const findAndReplace: TextToolDef = {
  input: {
    label: "Your text",
    placeholder: "Paste the text to search…",
    rows: 12,
    sample: SAMPLE,
    accept: ".txt,.csv,.md,text/plain",
  },
  options: [
    { key: "find", label: "Find", type: "text", placeholder: "Text to look for", wide: true },
    { key: "replace", label: "Replace with", type: "text", placeholder: "Leave blank to delete", wide: true },
    { key: "case", label: "Match case", type: "checkbox", initial: "" },
    { key: "word", label: "Whole words only", type: "checkbox", initial: "" },
    { key: "regex", label: "Find using a regular expression", type: "checkbox", initial: "", wide: true },
    { key: "first", label: "Replace the first match only", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    const find = h.str("find");
    if (!find) {
      return {
        output: input,
        note: "Enter something to find and the result will update as you type.",
      };
    }

    let source = h.bool("regex") ? find : escapeRegExp(find);
    if (h.bool("word") && !h.bool("regex")) source = `\\b${source}\\b`;

    const flags = `${h.bool("first") ? "" : "g"}${h.bool("case") ? "" : "i"}u`;
    let pattern: RegExp;
    let counter: RegExp;
    try {
      pattern = new RegExp(source, flags);
      counter = new RegExp(source, `g${h.bool("case") ? "" : "i"}u`);
    } catch (err) {
      return {
        output: input,
        error: `That regular expression is not valid: ${err instanceof Error ? err.message : "unknown error"}`,
      };
    }

    const matches = input.match(counter);
    const replacement = h.str("replace");
    const output = input.replace(pattern, replacement);

    return {
      output,
      stats: [
        {
          label: "Matches found",
          value: n(matches?.length ?? 0),
          tone: matches?.length ? "accent" : "neutral",
        },
        {
          label: "Replacements",
          value: n(h.bool("first") ? Math.min(1, matches?.length ?? 0) : (matches?.length ?? 0)),
        },
      ],
      filename: "replaced-text.txt",
    } satisfies TextResult;
  },
  output: { label: "Result", mono: false },
  notes: [
    {
      label: "Whole words only",
      formula: "Wraps your search in word boundaries",
      note: "So “cat” no longer matches inside “category”.",
    },
    { label: "Regular expression", formula: "$1, $2 … insert captured groups into the replacement" },
  ],
};

/* ----------------------------------------------------------- text cleaner -- */

export const textCleaner: TextToolDef = {
  input: {
    label: "Your text",
    placeholder: "Paste text copied from a website, PDF or email…",
    rows: 12,
    sample:
      "<p>Hello <b>there</b> — see https://example.com or mail us@example.com 😀</p>\n\n“Smart quotes” and – dashes –  plus  extra   spaces.",
    accept: ".txt,.html,.md,text/plain",
  },
  options: [
    { key: "html", label: "Strip HTML tags", type: "checkbox", initial: "1", wide: true },
    { key: "urls", label: "Remove URLs", type: "checkbox", initial: "", wide: true },
    { key: "emails", label: "Remove email addresses", type: "checkbox", initial: "", wide: true },
    { key: "numbers", label: "Remove numbers", type: "checkbox", initial: "", wide: true },
    { key: "punct", label: "Remove punctuation", type: "checkbox", initial: "", wide: true },
    { key: "emoji", label: "Remove emoji and pictographs", type: "checkbox", initial: "", wide: true },
    { key: "smart", label: "Convert smart quotes and dashes to plain ones", type: "checkbox", initial: "1", wide: true },
    { key: "accents", label: "Strip accents (café becomes cafe)", type: "checkbox", initial: "", wide: true },
    { key: "ascii", label: "Remove anything that is not plain ASCII", type: "checkbox", initial: "", wide: true },
    { key: "spaces", label: "Tidy up whitespace afterwards", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (input, _v, h) => {
    let out = input;

    // Script and style bodies go first, otherwise their contents survive as
    // visible text once the surrounding tags are removed.
    if (h.bool("html")) {
      out = out
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/giu, " ")
        .replace(/<[^>]*>/gu, " ")
        .replace(/&nbsp;/giu, " ")
        .replace(/&lt;/giu, "<")
        .replace(/&gt;/giu, ">")
        .replace(/&quot;/giu, '"')
        .replace(/&#39;/gu, "'")
        .replace(/&amp;/giu, "&");
    }
    if (h.bool("urls")) out = out.replace(/\b(?:https?:\/\/|www\.)\S+/giu, "");
    if (h.bool("emails")) out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gu, "");
    if (h.bool("smart")) {
      out = out
        .replace(/[‘’‚‛]/gu, "'")
        .replace(/[“”„‟]/gu, '"')
        .replace(/[–—―]/gu, "-")
        .replace(/…/gu, "...")
        .replace(/ /gu, " ");
    }
    if (h.bool("accents")) out = out.normalize("NFKD").replace(COMBINING_MARKS, "");
    if (h.bool("emoji")) {
      out = out.replace(/\p{Extended_Pictographic}/gu, "").replace(/[️‍]/gu, "");
    }
    if (h.bool("numbers")) out = out.replace(/\p{N}+/gu, "");
    if (h.bool("punct")) out = out.replace(/[^\p{L}\p{N}\s]/gu, "");
    if (h.bool("ascii")) out = out.replace(/[^\t\n\r -~]/gu, "");
    if (h.bool("spaces")) {
      out = out
        .replace(/[^\S\r\n]{2,}/gu, " ")
        .split(/\r\n|\r|\n/u)
        .map((l) => l.trim())
        .join("\n")
        .replace(/\n{3,}/gu, "\n\n")
        .trim();
    }

    return {
      output: out,
      stats: [
        { label: "Characters before", value: n(input.length) },
        { label: "Characters after", value: n(out.length), tone: "accent" },
      ],
      filename: "cleaned-text.txt",
    } satisfies TextResult;
  },
  output: { label: "Cleaned text", mono: false },
};

/* --------------------------------------------------------- text extractor -- */

const EXTRACTORS: Record<string, { label: string; pattern: RegExp }> = {
  emails: { label: "Email addresses", pattern: /[\w.+-]+@[\w-]+\.[\w.-]{2,}/gu },
  urls: { label: "URLs", pattern: /\b(?:https?:\/\/|www\.)[^\s<>"')]+/giu },
  numbers: { label: "Numbers", pattern: /-?\d[\d,]*(?:\.\d+)?/gu },
  phones: {
    label: "Phone numbers",
    pattern: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d[\d\s.-]{6,}\d/gu,
  },
  hashtags: { label: "Hashtags", pattern: /#[\p{L}\p{N}_]+/gu },
  mentions: { label: "@ mentions", pattern: /@[\p{L}\p{N}_.]+/gu },
  ips: { label: "IP addresses", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gu },
  dates: { label: "Dates", pattern: /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/gu },
  words: { label: "Words", pattern: /[\p{L}][\p{L}'-]*/gu },
};

export const textExtractor: TextToolDef = {
  input: {
    label: "Your text",
    placeholder: "Paste the text to search…",
    rows: 12,
    sample: SAMPLE,
    accept: ".txt,.csv,.md,.html,text/plain",
  },
  options: [
    {
      key: "what",
      label: "Extract",
      type: "select",
      initial: "emails",
      wide: true,
      options: Object.entries(EXTRACTORS).map(([value, { label }]) => ({ value, label })),
    },
    { key: "unique", label: "Remove duplicates", type: "checkbox", initial: "1" },
    { key: "sort", label: "Sort the results", type: "checkbox", initial: "" },
    {
      key: "separator",
      label: "Separate with",
      type: "select",
      initial: "newline",
      options: [
        { value: "newline", label: "A new line" },
        { value: "comma", label: "Comma" },
        { value: "comma-space", label: "Comma and space" },
        { value: "space", label: "Space" },
        { value: "semicolon", label: "Semicolon" },
      ],
    },
  ],
  transform: (input, _v, h) => {
    const picked = EXTRACTORS[h.str("what")] ?? EXTRACTORS.emails;
    // A fresh RegExp each run: the shared literals carry /g and therefore
    // lastIndex state.
    let found: string[] = input.match(new RegExp(picked.pattern.source, picked.pattern.flags)) ?? [];
    found = found.map((m) => m.trim()).filter(Boolean);

    const total = found.length;
    if (h.bool("unique")) found = [...new Set(found)];
    if (h.bool("sort")) found = [...found].sort((a, b) => a.localeCompare(b, "en"));

    const separator =
      { newline: "\n", comma: ",", "comma-space": ", ", space: " ", semicolon: ";" }[
        h.str("separator")
      ] ?? "\n";

    return {
      output: found.join(separator),
      stats: [
        { label: "Found", value: n(total), tone: "accent" },
        { label: "Unique", value: n(new Set(found).size) },
      ],
      note:
        total === 0 && input.trim()
          ? `No ${picked.label.toLowerCase()} were found in that text.`
          : undefined,
      filename: `${h.str("what")}.txt`,
    } satisfies TextResult;
  },
  output: { label: "Extracted", mono: true },
};

/* ------------------------------------------------------ lorem ipsum ------- */

const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi occaecati cupiditate similique mollitia animi dolorem fuga harum quidem rerum facilis expedita distinctio nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus maxime placeat facere possimus omnis assumenda repellendus temporibus autem quibusdam aut officiis debitis necessitatibus saepe eveniet voluptates repudiandae recusandae itaque earum hic tenetur sapiente delectus reiciendis voluptatibus maiores alias perferendis doloribus asperiores repellat".split(
    " ",
  );

const LOREM_OPENER =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function loremSentence(): string {
  const length = 6 + randomInt(12);
  const words: string[] = [];
  for (let i = 0; i < length; i++) words.push(LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
  // A comma about half the time, placed away from both ends.
  if (length > 8 && randomInt(2) === 0) {
    const at = 3 + randomInt(length - 6);
    words[at] = `${words[at]},`;
  }
  const sentence = words.join(" ");
  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`;
}

export const loremIpsumGenerator: TextToolDef = {
  controlsTitle: "How much text",
  // Random: the server's dice roll would not match the browser's.
  deferred: true,
  options: [
    {
      key: "unit",
      label: "Generate",
      type: "select",
      initial: "paragraphs",
      options: [
        { value: "paragraphs", label: "Paragraphs" },
        { value: "sentences", label: "Sentences" },
        { value: "words", label: "Words" },
        { value: "list", label: "List items" },
      ],
    },
    { key: "count", label: "How many", type: "number", initial: "3", min: 1, max: 200 },
    {
      key: "classic",
      label: "Start with “Lorem ipsum dolor sit amet…”",
      type: "checkbox",
      initial: "1",
      wide: true,
    },
    { key: "html", label: "Wrap in HTML tags", type: "checkbox", initial: "", wide: true },
  ],
  generate: { label: "Generate new text" },
  transform: (_input, _v, h) => {
    const count = Math.min(200, Math.max(1, h.num("count", 3)));
    const unit = h.str("unit");
    const html = h.bool("html");

    let parts: string[] = [];
    if (unit === "words") {
      const words = Array.from({ length: count }, () => LOREM_WORDS[randomInt(LOREM_WORDS.length)]);
      if (h.bool("classic")) {
        const classic = "lorem ipsum dolor sit amet".split(" ");
        for (let i = 0; i < Math.min(classic.length, count); i++) words[i] = classic[i];
      }
      const text = words.join(" ");
      parts = [`${text[0].toUpperCase()}${text.slice(1)}`];
    } else if (unit === "sentences") {
      const sentences = Array.from({ length: count }, loremSentence);
      if (h.bool("classic")) sentences[0] = LOREM_OPENER;
      parts = [sentences.join(" ")];
    } else if (unit === "list") {
      parts = Array.from({ length: count }, () => loremSentence().slice(0, -1));
    } else {
      parts = Array.from({ length: count }, () =>
        Array.from({ length: 3 + randomInt(3) }, loremSentence).join(" "),
      );
      if (h.bool("classic")) parts[0] = `${LOREM_OPENER} ${parts[0]}`;
    }

    let output: string;
    if (unit === "list") {
      output = html
        ? `<ul>\n${parts.map((p) => `  <li>${p}</li>`).join("\n")}\n</ul>`
        : parts.map((p) => `• ${p}`).join("\n");
    } else if (html) {
      output = parts.map((p) => `<p>${p}</p>`).join("\n\n");
    } else {
      output = parts.join("\n\n");
    }

    const words = output.replace(/<[^>]*>/gu, " ").trim().split(/\s+/u).filter(Boolean).length;
    return {
      output,
      stats: [
        { label: "Words", value: n(words), tone: "accent" },
        { label: "Characters", value: n(output.length) },
      ],
      filename: "lorem-ipsum.txt",
    } satisfies TextResult;
  },
  output: { label: "Placeholder text", mono: false, rows: 16 },
  privacyNote: "Generated in your browser. Nothing is sent to a server.",
};

/* ---------------------------------------------------------- slug generator -- */

const SLUG_STOPWORDS = new Set("a an the and or but of in on at to for with is are".split(" "));

export const slugGenerator: TextToolDef = {
  input: {
    label: "Title or phrase",
    placeholder: "10 Ways to Improve Your Cash Flow",
    rows: 6,
    sample: "10 Ways to Improve Your Café's Cash Flow in 2026!",
  },
  options: [
    {
      key: "separator",
      label: "Separator",
      type: "select",
      initial: "-",
      options: [
        { value: "-", label: "Hyphen (recommended)" },
        { value: "_", label: "Underscore" },
        { value: "+", label: "Plus" },
        { value: "", label: "None" },
      ],
    },
    { key: "max", label: "Maximum length", type: "number", initial: "80", min: 10, max: 200 },
    { key: "stop", label: "Drop small words (a, the, of…)", type: "checkbox", initial: "", wide: true },
    { key: "numbers", label: "Keep numbers", type: "checkbox", initial: "1", wide: true },
    { key: "lines", label: "Treat each line as its own slug", type: "checkbox", initial: "", wide: true },
  ],
  transform: (input, _v, h) => {
    const separator = h.str("separator");
    const max = Math.max(10, h.num("max", 80));

    const slugify = (value: string) => {
      let words = value
        .normalize("NFKD")
        .replace(COMBINING_MARKS, "")
        .replace(/[‘’']/gu, "")
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);

      if (!h.bool("numbers")) words = words.filter((w) => !/^\p{N}+$/u.test(w));
      if (h.bool("stop")) {
        const kept = words.filter((w) => !SLUG_STOPWORDS.has(w));
        // Never return an empty slug just because every word was a stop word.
        if (kept.length) words = kept;
      }

      let slug = words.join(separator);
      if (slug.length > max) {
        slug = slug.slice(0, max);
        if (separator) {
          const cut = slug.lastIndexOf(separator);
          if (cut > 0) slug = slug.slice(0, cut);
        }
      }
      return slug;
    };

    const output = h.bool("lines")
      ? lines(input).map(slugify).filter(Boolean).join("\n")
      : slugify(input);

    return {
      output,
      stats: [
        {
          label: "Length",
          value: `${output.length} chars`,
          tone: output.length > 75 ? "warning" : "accent",
        },
      ],
      warning:
        output.length > 75 ? "Slugs over about 75 characters get truncated in search results." : undefined,
      filename: "slugs.txt",
    } satisfies TextResult;
  },
  output: { label: "URL slug", mono: true, rows: 4 },
  notes: [
    {
      label: "Good slug",
      formula: "lower-case-words-joined-by-hyphens",
      note: "Google treats hyphens as word separators and underscores as joiners.",
    },
  ],
};
