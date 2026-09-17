import type { TextResult, TextToolDef } from "../types";

/**
 * Code formatters and minifiers.
 *
 * HTML, CSS and JavaScript are formatted by Prettier and minified by Terser,
 * both loaded on demand — a formatter page should not make a calculator page
 * heavier. XML, SQL and the markup minifiers are implemented here because no
 * small, browser-safe library does them well.
 *
 * Everything runs on the device; no code is ever uploaded.
 */

/* ------------------------------------------------------------ lazy loads -- */

type PrettierBundle = {
  format: (source: string, options: Record<string, unknown>) => Promise<string>;
  plugins: unknown[];
};

let prettierPromise: Promise<PrettierBundle> | null = null;

/** Loaded once per session, then reused. */
function loadPrettier(): Promise<PrettierBundle> {
  prettierPromise ??= (async () => {
    const [standalone, babel, estree, postcss, html] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/postcss"),
      import("prettier/plugins/html"),
    ]);
    const unwrap = (mod: unknown) => (mod as { default?: unknown }).default ?? mod;
    return {
      format: (source, options) =>
        (standalone as unknown as PrettierBundle).format(source, options),
      plugins: [unwrap(babel), unwrap(estree), unwrap(postcss), unwrap(html)],
    };
  })();
  return prettierPromise;
}

async function prettierFormat(source: string, parser: string, extra: Record<string, unknown> = {}) {
  const { format, plugins } = await loadPrettier();
  return format(source, { parser, plugins, ...extra });
}

const bytes = (value: number) => `${value.toLocaleString("en-US")} B`;

function sizeStats(before: string, after: string): TextResult["stats"] {
  const saved = before.length - after.length;
  return [
    { label: "Before", value: bytes(before.length) },
    { label: "After", value: bytes(after.length), tone: "accent" },
    {
      label: "Saved",
      value: before.length ? `${((saved / before.length) * 100).toFixed(1)}%` : "0%",
      tone: saved > 0 ? "success" : "neutral",
    },
  ];
}

/* ------------------------------------------------------------- XML / HTML -- */

const XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?><invoice id="1042"><customer vat="GB123456789">Harbour Coffee</customer><lines><line qty="12" price="18.50">Espresso blend 1kg</line><line qty="1" price="6.00">Delivery</line></lines><total currency="GBP">228.00</total></invoice>`;

const HTML_SAMPLE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice</title></head><body><!-- header --><header class="bar"><h1>Invoice 1042</h1></header><table><tr><td>Espresso blend</td><td>12</td></tr></table></body></html>`;

interface XmlToken {
  kind: "open" | "close" | "selfclose" | "text" | "decl" | "comment" | "cdata";
  value: string;
}

/**
 * Splits markup into tags and text. Deliberately not a parser — it does not
 * need to understand the document, only to know where each tag begins and ends
 * so the indenter can do its job without reordering anything.
 */
export function tokeniseMarkup(input: string): XmlToken[] {
  const tokens: XmlToken[] = [];
  let i = 0;

  while (i < input.length) {
    const next = input.indexOf("<", i);
    if (next === -1) {
      const text = input.slice(i);
      if (text.trim()) tokens.push({ kind: "text", value: text.trim() });
      break;
    }
    if (next > i) {
      const text = input.slice(i, next);
      if (text.trim()) tokens.push({ kind: "text", value: text.trim() });
    }

    if (input.startsWith("<!--", next)) {
      const end = input.indexOf("-->", next);
      const stop = end === -1 ? input.length : end + 3;
      tokens.push({ kind: "comment", value: input.slice(next, stop) });
      i = stop;
      continue;
    }
    if (input.startsWith("<![CDATA[", next)) {
      const end = input.indexOf("]]>", next);
      const stop = end === -1 ? input.length : end + 3;
      tokens.push({ kind: "cdata", value: input.slice(next, stop) });
      i = stop;
      continue;
    }

    // Find the closing ">", ignoring any that sit inside an attribute value.
    let j = next + 1;
    let quote: string | null = null;
    while (j < input.length) {
      const ch = input[j];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === ">") {
        break;
      }
      j++;
    }
    const tag = input.slice(next, Math.min(j + 1, input.length));
    const kind: XmlToken["kind"] = tag.startsWith("<?") || tag.startsWith("<!")
      ? "decl"
      : tag.startsWith("</")
        ? "close"
        : tag.endsWith("/>")
          ? "selfclose"
          : "open";
    tokens.push({ kind, value: tag });
    i = j + 1;
  }

  return tokens;
}

/** HTML elements that never have a closing tag. */
const VOID_ELEMENTS = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(" "),
);

function tagName(tag: string): string {
  return (/^<\/?\s*([^\s/>]+)/u.exec(tag)?.[1] ?? "").toLowerCase();
}

export function formatXml(input: string, indentUnit = "  ", html = false): string {
  const tokens = tokeniseMarkup(input);
  const out: string[] = [];
  let depth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const pad = indentUnit.repeat(Math.max(0, depth));

    if (token.kind === "close") {
      depth = Math.max(0, depth - 1);
      out.push(indentUnit.repeat(depth) + token.value);
      continue;
    }

    out.push(pad + token.value);

    if (token.kind === "open") {
      const name = tagName(token.value);
      if (!(html && VOID_ELEMENTS.has(name))) depth += 1;
    }
  }

  // Collapse <tag>text</tag> back onto a single line for readability.
  const lines = out;
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i];
    const text = lines[i + 1];
    const close = lines[i + 2];
    if (
      open !== undefined &&
      text !== undefined &&
      close !== undefined &&
      /^\s*<[^/!?][^>]*>$/u.test(open) &&
      /^\s*[^<]/u.test(text) &&
      /^\s*<\//u.test(close) &&
      text.trim().length <= 80
    ) {
      merged.push(`${open}${text.trim()}${close.trim()}`);
      i += 2;
    } else {
      merged.push(open);
    }
  }

  return merged.join("\n");
}

export function minifyMarkup(input: string, html = false): string {
  const tokens = tokeniseMarkup(input);
  const out: string[] = [];
  let preserve = 0;

  for (const token of tokens) {
    if (token.kind === "comment") continue; // conditional comments are legacy IE
    if (token.kind === "text") {
      out.push(preserve > 0 ? token.value : token.value.replace(/\s+/gu, " "));
      continue;
    }
    if (html) {
      const name = tagName(token.value);
      if (["pre", "textarea", "script", "style"].includes(name)) {
        if (token.kind === "open") preserve += 1;
        else if (token.kind === "close") preserve = Math.max(0, preserve - 1);
      }
    }
    out.push(token.value.replace(/\s+/gu, " ").replace(/\s+(\/?>)$/u, "$1"));
  }

  return out.join("").trim();
}

const xmlInput = {
  label: "Your XML",
  placeholder: "<root><item>value</item></root>",
  rows: 14,
  mono: true,
  sample: XML_SAMPLE,
  accept: ".xml,.svg,.rss,.txt,text/xml",
};

const htmlInput = {
  label: "Your HTML",
  placeholder: "<div><p>Hello</p></div>",
  rows: 14,
  mono: true,
  sample: HTML_SAMPLE,
  accept: ".html,.htm,.txt,text/html",
};

/** Uses the browser's own XML parser to report the first real error. */
function checkXml(input: string): string | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(input, "application/xml");
  const error = doc.querySelector("parsererror");
  return error ? error.textContent?.replace(/\s+/gu, " ").trim().slice(0, 240) ?? "Invalid XML" : null;
}

export const xmlFormatter: TextToolDef = {
  // The well-formed check needs the browser's own DOMParser.
  deferred: true,
  input: xmlInput,
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
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    const unit = h.str("indent") === "tab" ? "\t" : " ".repeat(Number.parseInt(h.str("indent"), 10) || 2);
    const output = formatXml(input, unit);
    const problem = checkXml(input);
    return {
      output,
      stats: [
        { label: "Well formed", value: problem ? "No" : "Yes", tone: problem ? "error" : "success" },
        { label: "Elements", value: (input.match(/<[^/!?][^>]*>/gu) ?? []).length.toLocaleString("en-US") },
      ],
      warning: problem ?? undefined,
      filename: "formatted.xml",
    } satisfies TextResult;
  },
  output: { label: "Formatted XML", mono: true, rows: 18 },
};

export const xmlMinifier: TextToolDef = {
  input: xmlInput,
  transform: (input) => {
    if (!input.trim()) return { output: "" };
    const output = minifyMarkup(input);
    return { output, stats: sizeStats(input, output), filename: "minified.xml" };
  },
  output: { label: "Minified XML", mono: true, rows: 10 },
};

export const htmlFormatter: TextToolDef = {
  // Awaits Prettier.
  deferred: true,
  input: htmlInput,
  options: [
    { key: "width", label: "Wrap at column", type: "number", initial: "100", min: 40, max: 200 },
    { key: "indent", label: "Indent size", type: "number", initial: "2", min: 1, max: 8 },
  ],
  transform: async (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    try {
      const output = await prettierFormat(input, "html", {
        printWidth: Math.max(40, h.num("width", 100)),
        tabWidth: Math.max(1, h.num("indent", 2)),
      });
      return {
        output,
        stats: [
          { label: "Lines", value: output.split("\n").length.toLocaleString("en-US"), tone: "accent" },
          { label: "Size", value: bytes(output.length) },
        ],
        filename: "formatted.html",
      } satisfies TextResult;
    } catch (err) {
      return { error: err instanceof Error ? err.message.split("\n")[0] : "That HTML could not be formatted." };
    }
  },
  output: { label: "Formatted HTML", mono: true, rows: 18 },
};

export const htmlMinifier: TextToolDef = {
  input: htmlInput,
  transform: (input) => {
    if (!input.trim()) return { output: "" };
    const output = minifyMarkup(input, true);
    return {
      output,
      stats: sizeStats(input, output),
      filename: "minified.html",
      note: "Comments and whitespace are removed. The contents of pre, textarea, script and style are left untouched.",
    };
  },
  output: { label: "Minified HTML", mono: true, rows: 10 },
};

/* ------------------------------------------------------------------- CSS -- */

const CSS_SAMPLE = `/* buttons */
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border-radius:8px;background:#0a1631;color:#fff}
.btn:hover{background:#11224a}
@media (max-width:640px){.btn{width:100%;justify-content:center}}`;

const cssInput = {
  label: "Your CSS",
  placeholder: ".button { color: red; }",
  rows: 14,
  mono: true,
  sample: CSS_SAMPLE,
  accept: ".css,.txt,text/css",
};

/**
 * Whitespace and comment removal only. Strings and url() values are copied
 * through byte for byte, so nothing inside them can be mangled.
 */
export function minifyCss(input: string): string {
  let out = "";
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      i = end === -1 ? input.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < input.length && (input[j] !== quote || input[j - 1] === "\\")) j++;
      out += input.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (/\s/u.test(ch)) {
      // One space, and only where it could still matter.
      if (!/\s/u.test(out[out.length - 1] ?? " ")) out += " ";
      i++;
      continue;
    }
    out += ch;
    i++;
  }

  return out
    .replace(/\s*([{}:;,>~+])\s*/gu, "$1")
    .replace(/;\}/gu, "}")
    .replace(/\s+!important/gu, "!important")
    .trim();
}

export const cssFormatter: TextToolDef = {
  // Awaits Prettier.
  deferred: true,
  input: cssInput,
  options: [{ key: "indent", label: "Indent size", type: "number", initial: "2", min: 1, max: 8 }],
  transform: async (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    try {
      const output = await prettierFormat(input, "css", { tabWidth: Math.max(1, h.num("indent", 2)) });
      return {
        output,
        stats: [
          { label: "Rules", value: (output.match(/\{/gu) ?? []).length.toLocaleString("en-US"), tone: "accent" },
          { label: "Lines", value: output.split("\n").length.toLocaleString("en-US") },
        ],
        filename: "formatted.css",
      } satisfies TextResult;
    } catch (err) {
      return {
        error: err instanceof Error ? err.message.split("\n").slice(0, 3).join(" ") : "That CSS could not be parsed.",
      };
    }
  },
  output: { label: "Formatted CSS", mono: true, rows: 18 },
};

export const cssMinifier: TextToolDef = {
  input: cssInput,
  transform: (input) => {
    if (!input.trim()) return { output: "" };
    const output = minifyCss(input);
    return { output, stats: sizeStats(input, output), filename: "minified.css" };
  },
  output: { label: "Minified CSS", mono: true, rows: 10 },
};

/* ------------------------------------------------------------ JavaScript -- */

const JS_SAMPLE = `// pricing helper
function total(lines, taxRate) {
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0)
  const tax = subtotal * (taxRate / 100)
  return { subtotal, tax, grandTotal: subtotal + tax }
}
console.log(total([{qty:12,price:18.5},{qty:1,price:6}], 20))`;

const jsInput = {
  label: "Your JavaScript",
  placeholder: "function hello() { return 'world' }",
  rows: 14,
  mono: true,
  sample: JS_SAMPLE,
  accept: ".js,.mjs,.jsx,.ts,.txt,text/javascript",
};

export const javascriptFormatter: TextToolDef = {
  // Awaits Prettier.
  deferred: true,
  input: jsInput,
  options: [
    { key: "width", label: "Wrap at column", type: "number", initial: "80", min: 40, max: 200 },
    { key: "indent", label: "Indent size", type: "number", initial: "2", min: 1, max: 8 },
    { key: "semi", label: "End statements with semicolons", type: "checkbox", initial: "1", wide: true },
    { key: "single", label: "Use single quotes", type: "checkbox", initial: "", wide: true },
  ],
  transform: async (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    try {
      const output = await prettierFormat(input, "babel", {
        printWidth: Math.max(40, h.num("width", 80)),
        tabWidth: Math.max(1, h.num("indent", 2)),
        semi: h.bool("semi"),
        singleQuote: h.bool("single"),
      });
      return {
        output,
        stats: [
          { label: "Lines", value: output.split("\n").length.toLocaleString("en-US"), tone: "accent" },
          { label: "Size", value: bytes(output.length) },
        ],
        filename: "formatted.js",
      } satisfies TextResult;
    } catch (err) {
      return {
        error: err instanceof Error ? err.message.split("\n").slice(0, 3).join(" ") : "That JavaScript could not be parsed.",
      };
    }
  },
  output: { label: "Formatted JavaScript", mono: true, rows: 18 },
};

export const javascriptMinifier: TextToolDef = {
  // Awaits Terser.
  deferred: true,
  input: jsInput,
  options: [
    { key: "mangle", label: "Shorten variable names", type: "checkbox", initial: "1", wide: true },
    { key: "compress", label: "Remove dead code and simplify expressions", type: "checkbox", initial: "1", wide: true },
    { key: "comments", label: "Keep licence comments", type: "checkbox", initial: "", wide: true },
  ],
  transform: async (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    try {
      const { minify } = await import("terser");
      const result = await minify(input, {
        mangle: h.bool("mangle"),
        compress: h.bool("compress"),
        format: { comments: h.bool("comments") ? "some" : false },
      });
      const output = result.code ?? "";
      return {
        output,
        stats: sizeStats(input, output),
        filename: "minified.js",
      } satisfies TextResult;
    } catch (err) {
      return {
        error: err instanceof Error ? err.message.split("\n")[0] : "That JavaScript could not be minified.",
      };
    }
  },
  output: { label: "Minified JavaScript", mono: true, rows: 10 },
  notes: [
    {
      label: "Minified by Terser",
      formula: "parse to a syntax tree, drop dead code, rename locals, print without whitespace",
      note: "Because it understands the code rather than the characters, the result behaves identically.",
    },
  ],
};

/* ------------------------------------------------------------------- SQL -- */

const SQL_SAMPLE = `select c.name, count(o.id) as orders, sum(o.total) as revenue from customers c inner join orders o on o.customer_id = c.id where o.created_at >= '2026-01-01' and o.status <> 'cancelled' group by c.name having sum(o.total) > 1000 order by revenue desc limit 20;`;

/** Clauses that start a new line at the current indent level. */
const SQL_MAJOR = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "UNION ALL", "UNION", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "RETURNING", "WITH",
  "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
  "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN",
];

/** Words that get a line of their own, indented one step. */
const SQL_MINOR = ["AND", "OR", "ON", "WHEN", "THEN", "ELSE"];

const SQL_KEYWORDS = new Set(
  [
    ...SQL_MAJOR.flatMap((k) => k.split(" ")),
    ...SQL_MINOR,
    "AS", "ON", "IN", "IS", "NOT", "NULL", "LIKE", "BETWEEN", "EXISTS", "CASE", "END",
    "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "ASC", "DESC", "BY", "INTO",
    "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "DEFAULT", "UNIQUE", "INDEX", "VIEW",
    "CAST", "COALESCE", "OVER", "PARTITION", "ROW_NUMBER", "ALL", "ANY", "TRUE", "FALSE",
  ].map((k) => k.toUpperCase()),
);

interface SqlToken {
  type: "word" | "string" | "comment" | "punct" | "number";
  value: string;
}

export function tokeniseSql(input: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/u.test(ch)) {
      i++;
      continue;
    }
    if (ch === "-" && input[i + 1] === "-") {
      const end = input.indexOf("\n", i);
      tokens.push({ type: "comment", value: input.slice(i, end === -1 ? input.length : end) });
      i = end === -1 ? input.length : end;
      continue;
    }
    if (ch === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const stop = end === -1 ? input.length : end + 2;
      tokens.push({ type: "comment", value: input.slice(i, stop) });
      i = stop;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      // Doubled quotes are the SQL escape: 'it''s'
      while (j < input.length) {
        if (input[j] === ch) {
          if (input[j + 1] === ch) j += 2;
          else break;
        } else j++;
      }
      tokens.push({ type: "string", value: input.slice(i, Math.min(j + 1, input.length)) });
      i = j + 1;
      continue;
    }
    if (/[\d.]/u.test(ch) && /\d/u.test(input.slice(i).match(/^[\d.]+/u)?.[0] ?? "")) {
      const m = input.slice(i).match(/^\d+(\.\d+)?/u);
      if (m) {
        tokens.push({ type: "number", value: m[0] });
        i += m[0].length;
        continue;
      }
    }
    const word = input.slice(i).match(/^[A-Za-z_@#][\w$.]*/u);
    if (word) {
      tokens.push({ type: "word", value: word[0] });
      i += word[0].length;
      continue;
    }
    tokens.push({ type: "punct", value: ch });
    i++;
  }

  return tokens;
}

export function formatSql(input: string, upper = true, indentUnit = "  "): string {
  const tokens = tokeniseSql(input);
  const parts: string[] = [];
  let depth = 0;
  let line = "";
  // One extra step of indent for the continuation lines (AND, ON, list items).
  let extraIndent = 0;

  const flush = () => {
    if (line.trim()) parts.push(indentUnit.repeat(Math.max(0, depth) + extraIndent) + line.trim());
    line = "";
    extraIndent = 0;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "word") {
      const upperValue = token.value.toUpperCase();
      // Two-word clauses such as GROUP BY are matched together.
      const pair = tokens[i + 1]?.type === "word" ? `${upperValue} ${tokens[i + 1].value.toUpperCase()}` : "";
      const triple =
        pair && tokens[i + 2]?.type === "word" ? `${pair} ${tokens[i + 2].value.toUpperCase()}` : "";

      const major = SQL_MAJOR.find((k) => k === triple) ?? SQL_MAJOR.find((k) => k === pair) ?? SQL_MAJOR.find((k) => k === upperValue);
      if (major) {
        flush();
        line = upper ? major : major.toLowerCase();
        i += major.split(" ").length - 1;
        continue;
      }
      if (SQL_MINOR.includes(upperValue)) {
        flush();
        extraIndent = 1;
        line = upper ? upperValue : upperValue.toLowerCase();
        continue;
      }

      const rendered =
        SQL_KEYWORDS.has(upperValue) && upper ? upperValue : SQL_KEYWORDS.has(upperValue) ? token.value.toLowerCase() : token.value;
      line += (line && !line.endsWith("(") ? " " : "") + rendered;
      continue;
    }

    if (token.type === "punct") {
      if (token.value === "(") {
        line += line.endsWith(" ") || !line ? "(" : " (";
        depth += 1;
        continue;
      }
      if (token.value === ")") {
        depth = Math.max(0, depth - 1);
        line += ")";
        continue;
      }
      if (token.value === ",") {
        line += ",";
        flush();
        extraIndent = 1;
        continue;
      }
      if (token.value === ";") {
        line += ";";
        flush();
        continue;
      }
      line += line.endsWith(" ") ? token.value : ` ${token.value}`;
      continue;
    }

    if (token.type === "comment") {
      flush();
      parts.push(indentUnit.repeat(Math.max(0, depth)) + token.value);
      continue;
    }

    line += (line ? " " : "") + token.value;
  }

  flush();
  return parts.join("\n").replace(/\s+,/gu, ",").replace(/\(\s+/gu, "(");
}

export const sqlFormatter: TextToolDef = {
  input: {
    label: "Your SQL",
    placeholder: "select * from customers where country = 'GB'",
    rows: 14,
    mono: true,
    sample: SQL_SAMPLE,
    accept: ".sql,.txt",
  },
  options: [
    { key: "upper", label: "Upper-case keywords", type: "checkbox", initial: "1", wide: true },
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
  ],
  transform: (input, _v, h) => {
    if (!input.trim()) return { output: "" };
    const unit = h.str("indent") === "tab" ? "\t" : " ".repeat(Number.parseInt(h.str("indent"), 10) || 2);
    const output = formatSql(input, h.bool("upper"), unit);
    return {
      output,
      stats: [
        { label: "Lines", value: output.split("\n").length.toLocaleString("en-US"), tone: "accent" },
        { label: "Statements", value: String(Math.max(1, (input.match(/;/gu) ?? []).length)) },
      ],
      filename: "formatted.sql",
      note: "Strings, quoted identifiers and comments are copied through untouched, so nothing inside them is changed.",
    } satisfies TextResult;
  },
  output: { label: "Formatted SQL", mono: true, rows: 18 },
};
