import type { TextResult, TextToolDef } from "../types";

/**
 * Counting tools. They share one analyser so that the word count shown by the
 * Word Counter, the Reading Time calculator and the Character Counter can
 * never disagree with each other.
 */

const SAMPLE = `The quarterly review is on Thursday. Please bring the updated figures.

We finished the year 12% ahead of forecast, which is the best result since the business opened. Costs held steady despite two price rises from our main supplier.

Next year's plan is simpler: fewer products, better margins, and a shorter payment cycle.`;

export interface TextCounts {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  longestWord: string;
  averageWordLength: number;
  averageSentenceWords: number;
}

/** Words are whitespace-delimited runs, which is what word processors count. */
export function splitWords(input: string): string[] {
  const trimmed = input.trim();
  return trimmed ? trimmed.split(/\s+/u) : [];
}

/** Lower-cased, stripped of surrounding punctuation — for frequency counts. */
export function normaliseWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "");
}

export function countSentences(input: string): number {
  const matches = input.match(/[^.!?…]*[.!?…]+|[^.!?…]+$/gu);
  if (!matches) return 0;
  return matches.filter((part) => /[\p{L}\p{N}]/u.test(part)).length;
}

export function countParagraphs(input: string): number {
  return input
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter(Boolean).length;
}

export function analyse(input: string): TextCounts {
  const words = splitWords(input);
  const normalised = words.map(normaliseWord).filter(Boolean);
  const sentences = countSentences(input);
  const letters = normalised.join("").length;
  const longest = normalised.reduce((best, w) => (w.length > best.length ? w : best), "");

  return {
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/gu, "").length,
    words: words.length,
    uniqueWords: new Set(normalised).size,
    sentences,
    paragraphs: countParagraphs(input),
    lines: input === "" ? 0 : input.split(/\r\n|\r|\n/u).length,
    longestWord: longest,
    averageWordLength: normalised.length ? letters / normalised.length : 0,
    averageSentenceWords: sentences ? words.length / sentences : 0,
  };
}

const n = (value: number) => value.toLocaleString("en-US");
const n1 = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

/** "1 min 40 sec", or "under a minute" when it rounds to nothing. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 sec";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

const sharedInput = {
  placeholder: "Paste or type your text here…",
  rows: 14,
  sample: SAMPLE,
  accept: ".txt,.md,.csv,text/plain",
};

/* --------------------------------------------------------- word counter -- */

export const wordCounter: TextToolDef = {
  input: { label: "Your text", ...sharedInput },
  transform: (input) => {
    const c = analyse(input);
    return {
      stats: [
        { label: "Words", value: n(c.words), tone: "accent" },
        { label: "Characters", value: n(c.characters) },
        { label: "Characters (no spaces)", value: n(c.charactersNoSpaces) },
        { label: "Sentences", value: n(c.sentences) },
        { label: "Paragraphs", value: n(c.paragraphs) },
        { label: "Lines", value: n(c.lines) },
        { label: "Unique words", value: n(c.uniqueWords) },
        { label: "Reading time", value: formatDuration((c.words / 238) * 60) },
        { label: "Speaking time", value: formatDuration((c.words / 130) * 60) },
      ],
      note: c.words
        ? `Average ${n1(c.averageWordLength)} letters per word and ${n1(c.averageSentenceWords)} words per sentence.`
        : undefined,
    } satisfies TextResult;
  },
  notes: [
    { label: "Words", formula: "Runs of characters separated by spaces or line breaks", note: "The same rule word processors use." },
    { label: "Reading time", formula: "words ÷ 238 words per minute", note: "The average adult silent-reading speed for English prose." },
    { label: "Speaking time", formula: "words ÷ 130 words per minute", note: "A comfortable presentation pace." },
  ],
};

/* ---------------------------------------------------- character counter -- */

const LIMITS: { value: string; label: string; limit: number }[] = [
  { value: "none", label: "No limit", limit: 0 },
  { value: "x", label: "X / Twitter post — 280", limit: 280 },
  { value: "sms", label: "SMS message — 160", limit: 160 },
  { value: "title", label: "SEO page title — 60", limit: 60 },
  { value: "meta", label: "SEO meta description — 160", limit: 160 },
  { value: "og", label: "Open Graph description — 200", limit: 200 },
  { value: "instagram", label: "Instagram caption — 2,200", limit: 2200 },
  { value: "linkedin", label: "LinkedIn post — 3,000", limit: 3000 },
  { value: "custom", label: "Custom limit", limit: -1 },
];

export const characterCounter: TextToolDef = {
  input: { label: "Your text", ...sharedInput, rows: 12 },
  options: [
    {
      key: "limit",
      label: "Compare against a limit",
      type: "select",
      initial: "none",
      options: LIMITS.map(({ value, label }) => ({ value, label })),
      wide: true,
    },
    {
      key: "custom",
      label: "Custom limit",
      type: "number",
      initial: "500",
      min: 1,
      when: (v) => v.limit === "custom",
    },
  ],
  transform: (input, _v, h) => {
    const c = analyse(input);
    const picked = LIMITS.find((l) => l.value === h.str("limit"));
    const limit = picked?.limit === -1 ? Math.max(1, h.num("custom", 500)) : (picked?.limit ?? 0);

    const stats: TextResult["stats"] = [
      { label: "Characters", value: n(c.characters), tone: "accent" },
      { label: "Characters (no spaces)", value: n(c.charactersNoSpaces) },
      { label: "Words", value: n(c.words) },
      { label: "Lines", value: n(c.lines) },
    ];

    if (limit > 0) {
      const left = limit - c.characters;
      stats.unshift({
        label: "Remaining",
        value: n(left),
        sub: `of ${n(limit)} allowed`,
        tone: left < 0 ? "error" : left <= limit * 0.1 ? "warning" : "success",
      });
    }

    return {
      stats,
      warning:
        limit > 0 && c.characters > limit
          ? `You are ${n(c.characters - limit)} characters over the ${n(limit)}-character limit.`
          : undefined,
    } satisfies TextResult;
  },
};

/* ------------------------------------------------------ sentence counter -- */

export const sentenceCounter: TextToolDef = {
  input: { label: "Your text", ...sharedInput },
  transform: (input) => {
    const c = analyse(input);
    const sentences = (input.match(/[^.!?…]*[.!?…]+|[^.!?…]+$/gu) ?? [])
      .map((s) => s.trim())
      .filter((s) => /[\p{L}\p{N}]/u.test(s));

    const longest = sentences.reduce(
      (best, s) => (splitWords(s).length > splitWords(best).length ? s : best),
      "",
    );

    return {
      stats: [
        { label: "Sentences", value: n(c.sentences), tone: "accent" },
        { label: "Words", value: n(c.words) },
        { label: "Words per sentence", value: n1(c.averageSentenceWords) },
        { label: "Paragraphs", value: n(c.paragraphs) },
      ],
      note: longest
        ? `Longest sentence: ${splitWords(longest).length} words.`
        : undefined,
      table: sentences.length
        ? {
            head: ["Sentence", "Words", "Characters"],
            rows: sentences
              .slice(0, 200)
              .map((s, i) => [`${i + 1}. ${s}`, n(splitWords(s).length), n(s.length)]),
            caption: "Every sentence with its word and character count",
          }
        : undefined,
      warning:
        c.averageSentenceWords > 25
          ? "Sentences average over 25 words. Shorter sentences are easier to read."
          : undefined,
    } satisfies TextResult;
  },
};

/* ----------------------------------------------------- paragraph counter -- */

export const paragraphCounter: TextToolDef = {
  input: { label: "Your text", ...sharedInput },
  transform: (input) => {
    const c = analyse(input);
    const paragraphs = input
      .split(/\n\s*\n/u)
      .map((p) => p.trim())
      .filter(Boolean);

    return {
      stats: [
        { label: "Paragraphs", value: n(c.paragraphs), tone: "accent" },
        { label: "Sentences", value: n(c.sentences) },
        { label: "Words", value: n(c.words) },
        {
          label: "Words per paragraph",
          value: c.paragraphs ? n1(c.words / c.paragraphs) : "0",
        },
      ],
      table: paragraphs.length
        ? {
            head: ["Paragraph", "Words", "Sentences"],
            rows: paragraphs
              .slice(0, 200)
              .map((p, i) => [
                `${i + 1}. ${p.replace(/\s+/gu, " ").slice(0, 120)}`,
                n(splitWords(p).length),
                n(countSentences(p)),
              ]),
            caption: "Every paragraph with its word and sentence count",
          }
        : undefined,
      note: "Paragraphs are blocks of text separated by a blank line.",
    } satisfies TextResult;
  },
};

/* ----------------------------------------------------------- reading time -- */

const SPEEDS = [
  { value: "200", label: "Slow — 200 wpm" },
  { value: "238", label: "Average adult — 238 wpm" },
  { value: "300", label: "Fast — 300 wpm" },
  { value: "450", label: "Skimming — 450 wpm" },
];

export const readingTimeCalculator: TextToolDef = {
  input: { label: "Your text", ...sharedInput },
  options: [
    {
      key: "wpm",
      label: "Reading speed",
      type: "select",
      initial: "238",
      options: SPEEDS,
    },
    {
      key: "speaking",
      label: "Speaking pace (words per minute)",
      type: "number",
      initial: "130",
      min: 60,
      max: 250,
      hint: "Typical presentation pace is 120–150.",
    },
  ],
  transform: (input, _v, h) => {
    const c = analyse(input);
    const wpm = Math.max(50, h.num("wpm", 238));
    const speaking = Math.max(50, h.num("speaking", 130));

    return {
      stats: [
        { label: "Reading time", value: formatDuration((c.words / wpm) * 60), tone: "accent" },
        { label: "Speaking time", value: formatDuration((c.words / speaking) * 60) },
        { label: "Words", value: n(c.words) },
        { label: "Sentences", value: n(c.sentences) },
        { label: "Paragraphs", value: n(c.paragraphs) },
        {
          label: "Typical blog label",
          value: c.words ? `${Math.max(1, Math.round(c.words / wpm))} min read` : "—",
        },
      ],
      note: "Times are rounded to the nearest second. Blog badges normally round up to a whole minute.",
    } satisfies TextResult;
  },
  notes: [
    { label: "Reading time", formula: "words ÷ reading speed (words per minute)" },
    { label: "Speaking time", formula: "words ÷ speaking pace (words per minute)" },
  ],
};

/* -------------------------------------------------------- word frequency -- */

const STOPWORDS = new Set(
  ("a an and are as at be but by for from has have he her his i if in is it its of on or she that the their them they this to was were will with you your we our us not no do does did can could would should".split(
    " ",
  )),
);

export const wordFrequencyCounter: TextToolDef = {
  input: { label: "Your text", ...sharedInput },
  options: [
    { key: "stop", label: "Ignore common words (the, and, of…)", type: "checkbox", initial: "1", wide: true },
    { key: "min", label: "Minimum word length", type: "number", initial: "1", min: 1, max: 20 },
    { key: "top", label: "Show top", type: "number", initial: "50", min: 5, max: 500 },
  ],
  transform: (input, _v, h) => {
    const ignoreStop = h.bool("stop");
    const minLength = Math.max(1, h.num("min", 1));
    const top = Math.max(5, h.num("top", 50));

    const counts = new Map<string, number>();
    let total = 0;
    for (const raw of splitWords(input)) {
      const word = normaliseWord(raw);
      if (!word || word.length < minLength) continue;
      if (ignoreStop && STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
      total += 1;
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    return {
      stats: [
        { label: "Counted words", value: n(total), tone: "accent" },
        { label: "Unique words", value: n(counts.size) },
        { label: "Most frequent", value: ranked[0]?.[0] ?? "—", sub: ranked[0] ? `${ranked[0][1]} times` : undefined },
      ],
      output: ranked
        .slice(0, top)
        .map(([word, count]) => `${count}\t${word}`)
        .join("\n"),
      filename: "word-frequency.tsv",
      table: ranked.length
        ? {
            head: ["Word", "Count", "Share"],
            rows: ranked
              .slice(0, top)
              .map(([word, count]) => [word, n(count), `${((count / total) * 100).toFixed(2)}%`]),
            caption: "Word frequency",
          }
        : undefined,
    } satisfies TextResult;
  },
};
