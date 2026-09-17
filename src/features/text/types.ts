/**
 * Text-tool engine types and pure helpers.
 *
 * The same trick as the calculator engine: no JSX in this file, so every
 * transform can be imported and exercised directly by the Node test suite.
 *
 * A text tool is an optional mode switcher, a list of option controls, and a
 * `transform` function. Everything a transform needs — the raw input and the
 * current option values — is passed in, and everything it wants to show comes
 * back in one `TextResult`. Nothing in here touches the network.
 */

export type TextOptionType =
  | "select"
  | "checkbox"
  | "number"
  | "text"
  | "textarea"
  | "date"
  | "time"
  | "datetime";

export interface TextOption {
  key: string;
  label: string;
  type: TextOptionType;
  /** Initial value. Checkboxes use "1" for on and "" for off. */
  initial?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: string;
  /** Hide unless the predicate passes — used for mode-dependent options. */
  when?: (values: TextValues) => boolean;
  /** Rows for a textarea option. */
  rows?: number;
  /** Monospace textarea option. */
  mono?: boolean;
  /** Full width in the option grid. */
  wide?: boolean;
}

export type TextValues = Record<string, string>;

export interface TextStat {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "error" | "accent";
}

/** One run of text in a highlighted output (regex matches, diff lines). */
export interface TextSpan {
  text: string;
  tone?: "match" | "add" | "remove" | "muted";
}

export interface TextResult {
  /** The main output, shown with Copy and Download buttons. */
  output?: string;
  /** Headline figures shown above the output. */
  stats?: TextStat[];
  /** Replaces the plain output box when the tool marks up its result. */
  spans?: TextSpan[];
  /** Rendered as a table beneath the output. */
  table?: { head: string[]; rows: string[][]; caption?: string };
  /**
   * A mock-up of how the generated markup will be seen. Every field is plain
   * text rendered by React, never markup, so a generator can show a realistic
   * preview without any of the visitor's input reaching the page as HTML.
   */
  preview?:
    | { kind: "serp"; url: string; title: string; description: string }
    | { kind: "social"; network: string; site: string; title: string; description: string; image?: string };
  /** A problem with the input — shown in place of the output. */
  error?: string;
  warning?: string;
  note?: string;
  /** Download file name, extension included. Defaults to `<slug>.txt`. */
  filename?: string;
}

export interface TextInputConfig {
  label?: string;
  /** Pre-fills the box, so the tool demonstrates itself on arrival. */
  initial?: string;
  placeholder?: string;
  hint?: string;
  /** Monospace box — the code-editor treatment for developer tools. */
  mono?: boolean;
  rows?: number;
  /** Populates the box from the "Load sample" button. */
  sample?: string;
  /**
   * File types the box will accept from the local picker, e.g. ".json,.txt".
   * The file is read with FileReader and never leaves the browser.
   */
  accept?: string;
}

export interface TextHelpers {
  str: (key: string) => string;
  num: (key: string, fallback?: number) => number;
  bool: (key: string) => boolean;
}

export interface TextToolDef {
  /** Optional mode switcher rendered above the input. */
  modes?: { key: string; options: { value: string; label: string }[]; label?: string };
  options?: TextOption[];
  /** Omit for generator tools (UUID, Lorem Ipsum, Random String). */
  input?: TextInputConfig;
  /**
   * The whole tool. Pure where it can be — the few that are not (hashing,
   * formatting via a lazily imported library) return a promise instead.
   */
  transform: (
    input: string,
    values: TextValues,
    helpers: TextHelpers,
  ) => TextResult | Promise<TextResult>;
  output?: { label?: string; mono?: boolean; rows?: number };
  /** Heading for the controls panel. Defaults to the input label, or "Options". */
  controlsTitle?: string;
  /**
   * Shows a Generate button and re-runs `transform` on click. Set for tools
   * whose result is random, so typing elsewhere does not reshuffle it.
   */
  generate?: { label: string };
  /**
   * Set when `transform` cannot run during the server render: it returns a
   * promise, reads the clock, uses the random number generator, or needs a
   * browser-only API. Those tools produce their result after mount instead.
   *
   * Leave it off wherever possible — a deterministic transform runs during
   * the render pass, so the result is in the HTML the server sends and is on
   * screen before any JavaScript has loaded.
   */
  deferred?: boolean;
  /** Reference notes rendered under the tool. */
  notes?: { label: string; formula: string; note?: string }[];
  /** Overrides the default privacy line. */
  privacyNote?: string;
}

export function buildTextHelpers(values: TextValues): TextHelpers {
  return {
    str: (key) => values[key] ?? "",
    num: (key, fallback = 0) => {
      const parsed = Number.parseFloat(String(values[key] ?? "").replace(/[^0-9.\-]/g, ""));
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    bool: (key) => Boolean(values[key]),
  };
}

/** Runs a definition headlessly — this is what the test suite calls. */
export function runTextTool(
  def: TextToolDef,
  input: string,
  values: TextValues = {},
): TextResult | Promise<TextResult> {
  const merged: TextValues = {};
  if (def.modes) merged[def.modes.key] = def.modes.options[0].value;
  for (const option of def.options ?? []) merged[option.key] = option.initial ?? "";
  Object.assign(merged, values);
  return def.transform(input, merged, buildTextHelpers(merged));
}
