import type { TextResult, TextToolDef } from "../types";
import { splitWords, normaliseWord } from "./counters";

/**
 * SEO and website generators.
 *
 * These build markup, so everything a visitor types is escaped on the way into
 * the output — the generated snippet is a string to copy, and the on-page
 * preview is plain text rendered by React rather than injected HTML.
 */

const n = (value: number) => value.toLocaleString("en-US");

/** Escapes the five characters that matter inside HTML and XML. */
export function esc(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

/** Keeps only http(s) URLs, so a `javascript:` string can never be emitted. */
export function safeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//iu.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmed)) return "";
  return `https://${trimmed}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//iu, "").split("/")[0];
  }
}

const meta = (name: string, content: string) =>
  content ? `<meta name="${esc(name)}" content="${esc(content)}" />` : "";
const property = (name: string, content: string) =>
  content ? `<meta property="${esc(name)}" content="${esc(content)}" />` : "";

/* ---------------------------------------------------------- meta tags ---- */

export const metaTagGenerator: TextToolDef = {
  controlsTitle: "Page details",
  options: [
    { key: "title", label: "Page title", type: "text", initial: "Free Invoice Generator — Create PDF Invoices Online", wide: true },
    {
      key: "description",
      label: "Meta description",
      type: "textarea",
      rows: 3,
      wide: true,
      initial: "Create professional invoices online for free. Add your logo, line items and tax, then download a print-ready PDF. No signup required.",
    },
    { key: "url", label: "Canonical URL", type: "text", initial: "https://example.com/invoice-generator", wide: true },
    { key: "keywords", label: "Keywords (comma separated)", type: "text", placeholder: "invoice generator, free invoice", wide: true },
    { key: "author", label: "Author", type: "text", placeholder: "Your name or company" },
    { key: "language", label: "Language", type: "text", initial: "en" },
    {
      key: "robots",
      label: "Robots",
      type: "select",
      initial: "index, follow",
      options: [
        { value: "index, follow", label: "index, follow — the normal choice" },
        { value: "noindex, follow", label: "noindex, follow — keep out of search" },
        { value: "index, nofollow", label: "index, nofollow" },
        { value: "noindex, nofollow", label: "noindex, nofollow — hide entirely" },
      ],
      wide: true,
    },
    { key: "themeColor", label: "Theme colour", type: "text", placeholder: "#0a1631" },
    { key: "viewport", label: "Include the viewport tag", type: "checkbox", initial: "1", wide: true },
    { key: "charset", label: "Include the charset tag", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (_input, _v, h) => {
    const title = h.str("title").trim();
    const description = h.str("description").trim();
    const url = safeHttpUrl(h.str("url"));

    const lines = [
      h.bool("charset") ? '<meta charset="utf-8" />' : "",
      h.bool("viewport") ? '<meta name="viewport" content="width=device-width, initial-scale=1" />' : "",
      title ? `<title>${esc(title)}</title>` : "",
      meta("description", description),
      meta("keywords", h.str("keywords").trim()),
      meta("author", h.str("author").trim()),
      meta("robots", h.str("robots")),
      meta("theme-color", h.str("themeColor").trim()),
      url ? `<link rel="canonical" href="${esc(url)}" />` : "",
      h.str("language").trim() ? `<html lang="${esc(h.str("language").trim())}">` : "",
    ].filter(Boolean);

    const warnings: string[] = [];
    if (title.length > 60) warnings.push(`The title is ${title.length} characters; Google usually truncates past about 60.`);
    if (description.length > 160) warnings.push(`The description is ${description.length} characters; aim for 150–160.`);
    if (description && description.length < 70) warnings.push("The description is short — there is room to say more.");

    return {
      output: lines.join("\n"),
      filename: "meta-tags.html",
      preview: { kind: "serp", url: url || "https://example.com", title, description },
      stats: [
        {
          label: "Title length",
          value: `${title.length}`,
          sub: "aim for 50–60",
          tone: title.length > 60 ? "warning" : title.length >= 30 ? "success" : "neutral",
        },
        {
          label: "Description length",
          value: `${description.length}`,
          sub: "aim for 150–160",
          tone: description.length > 160 ? "warning" : description.length >= 70 ? "success" : "neutral",
        },
      ],
      warning: warnings.length ? warnings.join(" ") : undefined,
      note: "Paste these inside the <head> of your page. The <html lang> line goes on the html element itself.",
    } satisfies TextResult;
  },
  output: { label: "Meta tags", mono: true, rows: 12 },
  notes: [
    { label: "Title", formula: "50–60 characters", note: "Google truncates by pixel width, so put the important words first." },
    { label: "Description", formula: "150–160 characters", note: "It does not affect ranking, but it does affect clicks." },
    { label: "Canonical", formula: "The one URL you want indexed", note: "Essential when the same page is reachable at several addresses." },
  ],
};

/* --------------------------------------------------------- open graph ---- */

export const openGraphGenerator: TextToolDef = {
  controlsTitle: "Share card details",
  options: [
    { key: "title", label: "Title", type: "text", initial: "Free Invoice Generator", wide: true },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      wide: true,
      initial: "Create and download professional PDF invoices in your browser. Free, no signup.",
    },
    { key: "url", label: "Page URL", type: "text", initial: "https://example.com/invoice-generator", wide: true },
    { key: "image", label: "Image URL (1200 × 630)", type: "text", initial: "https://example.com/og.png", wide: true },
    { key: "imageAlt", label: "Image alt text", type: "text", placeholder: "Describe the image", wide: true },
    { key: "siteName", label: "Site name", type: "text", initial: "BusinessToolKit" },
    {
      key: "type",
      label: "Type",
      type: "select",
      initial: "website",
      options: [
        { value: "website", label: "website" },
        { value: "article", label: "article" },
        { value: "product", label: "product" },
        { value: "profile", label: "profile" },
      ],
    },
    { key: "locale", label: "Locale", type: "text", initial: "en_GB" },
    { key: "twitter", label: "Also add the Twitter/X card tags", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (_input, _v, h) => {
    const title = h.str("title").trim();
    const description = h.str("description").trim();
    const url = safeHttpUrl(h.str("url"));
    const image = safeHttpUrl(h.str("image"));

    const lines = [
      property("og:title", title),
      property("og:description", description),
      property("og:url", url),
      property("og:image", image),
      image && h.str("imageAlt").trim() ? property("og:image:alt", h.str("imageAlt").trim()) : "",
      image ? property("og:image:width", "1200") : "",
      image ? property("og:image:height", "630") : "",
      property("og:type", h.str("type")),
      property("og:site_name", h.str("siteName").trim()),
      property("og:locale", h.str("locale").trim()),
    ].filter(Boolean);

    if (h.bool("twitter")) {
      lines.push(
        "",
        meta("twitter:card", image ? "summary_large_image" : "summary"),
        meta("twitter:title", title),
        meta("twitter:description", description),
        image ? meta("twitter:image", image) : "",
      );
    }

    return {
      output: lines.filter((l) => l !== "").join("\n"),
      filename: "open-graph.html",
      preview: {
        kind: "social",
        network: "Facebook, LinkedIn and Slack",
        site: hostOf(url),
        title,
        description,
        image: image || undefined,
      },
      warning: !image ? "Without an image the link will be shared as a small text-only card." : undefined,
      note: "Facebook, LinkedIn, Slack, WhatsApp and most other apps read these tags. Cached previews can take a while to refresh.",
    } satisfies TextResult;
  },
  output: { label: "Open Graph tags", mono: true, rows: 14 },
  notes: [
    { label: "Image size", formula: "1200 × 630 pixels, under 5 MB", note: "A 1.91:1 ratio fills the card on every major network." },
    { label: "Absolute URLs", formula: "https://example.com/og.png", note: "Relative paths are ignored by most crawlers." },
  ],
};

/* -------------------------------------------------------- twitter card --- */

export const twitterCardGenerator: TextToolDef = {
  controlsTitle: "Card details",
  options: [
    {
      key: "card",
      label: "Card type",
      type: "select",
      initial: "summary_large_image",
      wide: true,
      options: [
        { value: "summary_large_image", label: "Large image — a full-width picture" },
        { value: "summary", label: "Summary — a small square thumbnail" },
        { value: "player", label: "Player — for audio or video" },
      ],
    },
    { key: "title", label: "Title", type: "text", initial: "Free Invoice Generator", wide: true },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      wide: true,
      initial: "Create and download professional PDF invoices in your browser. Free, no signup.",
    },
    { key: "image", label: "Image URL", type: "text", initial: "https://example.com/og.png", wide: true },
    { key: "imageAlt", label: "Image alt text", type: "text", placeholder: "Describe the image", wide: true },
    { key: "site", label: "Site handle", type: "text", initial: "@businesstoolkit" },
    { key: "creator", label: "Author handle", type: "text", placeholder: "@yourname" },
  ],
  transform: (_input, _v, h) => {
    const handle = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return "";
      return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    };
    const title = h.str("title").trim();
    const description = h.str("description").trim();
    const image = safeHttpUrl(h.str("image"));

    const lines = [
      meta("twitter:card", h.str("card")),
      meta("twitter:site", handle(h.str("site"))),
      meta("twitter:creator", handle(h.str("creator"))),
      meta("twitter:title", title),
      meta("twitter:description", description),
      meta("twitter:image", image),
      image ? meta("twitter:image:alt", h.str("imageAlt").trim()) : "",
    ].filter(Boolean);

    const warnings: string[] = [];
    if (title.length > 70) warnings.push(`The title is ${title.length} characters and will be cut off past 70.`);
    if (description.length > 200) warnings.push(`The description is ${description.length} characters and will be cut off past 200.`);

    return {
      output: lines.join("\n"),
      filename: "twitter-card.html",
      preview: {
        kind: "social",
        network: "X",
        site: hostOf(safeHttpUrl(h.str("image"))) || "example.com",
        title,
        description,
        image: image || undefined,
      },
      stats: [
        { label: "Title", value: `${title.length}`, sub: "max 70", tone: title.length > 70 ? "warning" : "success" },
        { label: "Description", value: `${description.length}`, sub: "max 200", tone: description.length > 200 ? "warning" : "success" },
      ],
      warning: warnings.length ? warnings.join(" ") : undefined,
      note: "X falls back to your Open Graph tags for anything these do not set, so you rarely need both in full.",
    } satisfies TextResult;
  },
  output: { label: "Twitter card tags", mono: true, rows: 10 },
};

/* ------------------------------------------------------------ robots.txt -- */

export const robotsTxtGenerator: TextToolDef = {
  input: {
    label: "Paths to disallow",
    placeholder: "/admin/\n/cart\n/search?",
    rows: 8,
    mono: true,
    hint: "One path per line. Leave empty to allow everything.",
    initial: "/admin/\n/cart\n/checkout\n/*?s=",
  },
  options: [
    {
      key: "preset",
      label: "Starting point",
      type: "select",
      initial: "custom",
      wide: true,
      options: [
        { value: "custom", label: "Use the paths above" },
        { value: "allow", label: "Allow everything" },
        { value: "block", label: "Block every crawler entirely" },
        { value: "ai", label: "Allow search engines, block AI training crawlers" },
      ],
    },
    { key: "agent", label: "User-agent", type: "text", initial: "*" },
    { key: "crawlDelay", label: "Crawl delay (seconds)", type: "number", placeholder: "Leave blank for none", min: 0 },
    { key: "sitemap", label: "Sitemap URL", type: "text", initial: "https://example.com/sitemap.xml", wide: true },
    { key: "allowPaths", label: "Paths to allow inside a blocked folder", type: "text", placeholder: "/admin/public/", wide: true },
  ],
  transform: (input, _v, h) => {
    const preset = h.str("preset") || "custom";
    const sitemap = safeHttpUrl(h.str("sitemap"));
    const lines: string[] = ["# robots.txt", `# Generated ${"on BusinessToolKit"}`, ""];

    if (preset === "block") {
      lines.push("User-agent: *", "Disallow: /");
    } else if (preset === "allow") {
      lines.push("User-agent: *", "Disallow:");
    } else if (preset === "ai") {
      lines.push("User-agent: *", "Disallow:", "");
      for (const bot of ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "anthropic-ai", "PerplexityBot", "Bytespider"]) {
        lines.push(`User-agent: ${bot}`, "Disallow: /", "");
      }
    } else {
      lines.push(`User-agent: ${h.str("agent").trim() || "*"}`);
      const paths = input
        .split(/\r\n|\r|\n/u)
        .map((l) => l.trim())
        .filter(Boolean);
      if (paths.length === 0) lines.push("Disallow:");
      for (const path of paths) lines.push(`Disallow: ${path.startsWith("/") ? path : `/${path}`}`);
      for (const path of h.str("allowPaths").split(",").map((p) => p.trim()).filter(Boolean)) {
        lines.push(`Allow: ${path.startsWith("/") ? path : `/${path}`}`);
      }
      const delay = h.num("crawlDelay", 0);
      if (delay > 0) lines.push(`Crawl-delay: ${delay}`);
    }

    if (sitemap) lines.push("", `Sitemap: ${sitemap}`);

    return {
      output: lines.join("\n").replace(/\n{3,}/gu, "\n\n").trim() + "\n",
      filename: "robots.txt",
      warning:
        preset === "block"
          ? "This blocks every crawler from the whole site. Use it only on a staging server."
          : undefined,
      note: "Save this as robots.txt at the root of your domain. robots.txt asks crawlers not to fetch a page — it does not keep it out of the index. Use a noindex meta tag for that.",
    } satisfies TextResult;
  },
  output: { label: "robots.txt", mono: true, rows: 14 },
  notes: [
    { label: "Location", formula: "https://example.com/robots.txt", note: "It must be at the root; a subfolder is ignored." },
    { label: "Disallow vs noindex", formula: "Disallow stops crawling, noindex stops indexing", note: "A disallowed page can still appear in results if others link to it." },
    { label: "Wildcards", formula: "* matches anything, $ matches the end of the URL" },
  ],
};

/* -------------------------------------------------------------- sitemap -- */

export const sitemapGenerator: TextToolDef = {
  input: {
    label: "Your URLs",
    placeholder: "https://example.com/\nhttps://example.com/about\nhttps://example.com/contact",
    rows: 12,
    mono: true,
    hint: "One URL per line.",
    accept: ".txt,.csv,text/plain",
    initial: "https://example.com/\nhttps://example.com/about\nhttps://example.com/pricing\nhttps://example.com/contact",
  },
  options: [
    {
      key: "changefreq",
      label: "Change frequency",
      type: "select",
      initial: "weekly",
      options: [
        { value: "", label: "Do not include" },
        { value: "always", label: "always" },
        { value: "hourly", label: "hourly" },
        { value: "daily", label: "daily" },
        { value: "weekly", label: "weekly" },
        { value: "monthly", label: "monthly" },
        { value: "yearly", label: "yearly" },
        { value: "never", label: "never" },
      ],
    },
    { key: "priority", label: "Priority", type: "text", initial: "0.8", hint: "0.0 to 1.0, or blank to omit" },
    { key: "lastmod", label: "Last modified date", type: "text", placeholder: "2026-01-31", hint: "Leave blank to omit", wide: true },
    { key: "homeFirst", label: "Give the shortest URL priority 1.0", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (input, _v, h) => {
    const urls = input
      .split(/\r\n|\r|\n/u)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(safeHttpUrl)
      .filter(Boolean);

    const unique = [...new Set(urls)];
    if (unique.length === 0) {
      return { note: "Paste one URL per line and the sitemap will build itself." };
    }

    const shortest = unique.reduce((best, u) => (u.length < best.length ? u : best), unique[0]);
    const changefreq = h.str("changefreq");
    const priority = h.str("priority").trim();
    const lastmod = h.str("lastmod").trim();

    const entries = unique.map((url) => {
      const parts = [`    <loc>${esc(url)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${esc(lastmod)}</lastmod>`);
      if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
      const p = h.bool("homeFirst") && url === shortest ? "1.0" : priority;
      if (p) parts.push(`    <priority>${esc(p)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    });

    return {
      output: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`,
      filename: "sitemap.xml",
      stats: [
        { label: "URLs", value: n(unique.length), tone: "accent" },
        { label: "Duplicates removed", value: n(urls.length - unique.length) },
      ],
      warning:
        unique.length > 50000
          ? "A single sitemap may hold at most 50,000 URLs. Split it and use a sitemap index."
          : undefined,
      note: "Save as sitemap.xml at the root of your site, then point to it from robots.txt and submit it in Search Console.",
    } satisfies TextResult;
  },
  output: { label: "sitemap.xml", mono: true, rows: 16 },
  notes: [
    { label: "Limits", formula: "50,000 URLs or 50 MB uncompressed per file" },
    { label: "Priority", formula: "0.0 to 1.0, relative to your own pages", note: "Google largely ignores it; changefreq too." },
  ],
};

/* ------------------------------------------------------------------ UTM -- */

const UTM_FIELDS: { key: string; param: string; label: string; placeholder: string }[] = [
  { key: "source", param: "utm_source", label: "Source (required)", placeholder: "newsletter, google, linkedin" },
  { key: "medium", param: "utm_medium", label: "Medium (required)", placeholder: "email, cpc, social" },
  { key: "campaign", param: "utm_campaign", label: "Campaign (required)", placeholder: "spring_sale" },
  { key: "term", param: "utm_term", label: "Term", placeholder: "paid keywords" },
  { key: "content", param: "utm_content", label: "Content", placeholder: "header_link" },
  { key: "id", param: "utm_id", label: "Campaign ID", placeholder: "abc123" },
];

export const utmLinkBuilder: TextToolDef = {
  controlsTitle: "Campaign details",
  options: [
    { key: "url", label: "Destination URL", type: "text", initial: "https://example.com/pricing", wide: true },
    ...UTM_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      type: "text" as const,
      placeholder: f.placeholder,
      initial: f.key === "source" ? "newsletter" : f.key === "medium" ? "email" : f.key === "campaign" ? "spring_sale" : "",
    })),
    { key: "lower", label: "Force lower case", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (_input, _v, h) => {
    const base = safeHttpUrl(h.str("url"));
    if (!base) return { note: "Enter the page you want the link to open." };

    let url: URL;
    try {
      url = new URL(base);
    } catch {
      return { error: "That destination is not a URL this browser can parse. Check for spaces or a missing host." };
    }

    const tidy = (value: string) => {
      const trimmed = value.trim();
      return h.bool("lower") ? trimmed.toLowerCase() : trimmed;
    };

    const used: string[][] = [];
    for (const field of UTM_FIELDS) {
      const value = tidy(h.str(field.key));
      if (!value) continue;
      url.searchParams.set(field.param, value);
      used.push([field.param, value]);
    }

    const missing = ["source", "medium", "campaign"].filter((key) => !h.str(key).trim());

    return {
      output: url.toString(),
      filename: "utm-link.txt",
      stats: [
        { label: "Parameters", value: String(used.length), tone: "accent" },
        { label: "Link length", value: `${url.toString().length} chars` },
      ],
      table: used.length ? { head: ["Parameter", "Value"], rows: used, caption: "UTM parameters" } : undefined,
      warning: missing.length
        ? `Analytics tools group campaigns by source, medium and campaign. Missing: ${missing.join(", ")}.`
        : undefined,
      note: "Keep the spelling consistent — “Email” and “email” become two separate rows in most analytics reports.",
    } satisfies TextResult;
  },
  output: { label: "Tagged link", mono: true, rows: 4 },
  notes: [
    { label: "Source", formula: "Where the visit came from", note: "newsletter, google, partner-site" },
    { label: "Medium", formula: "How it arrived", note: "email, cpc, social, referral" },
    { label: "Campaign", formula: "Which push it belongs to", note: "spring_sale, launch_2026" },
  ],
};

/* -------------------------------------------------- keyword density ------ */

const DENSITY_STOPWORDS = new Set(
  "a an and are as at be but by for from has have he her his i if in is it its of on or she that the their them they this to was were will with you your we our us not no do does did can could would should".split(
    " ",
  ),
);

export const keywordDensityChecker: TextToolDef = {
  input: {
    label: "Your page copy",
    placeholder: "Paste the visible text of the page…",
    rows: 14,
    accept: ".txt,.md,.html,text/plain",
  },
  options: [
    {
      key: "length",
      label: "Phrase length",
      type: "select",
      initial: "1",
      options: [
        { value: "1", label: "Single words" },
        { value: "2", label: "Two-word phrases" },
        { value: "3", label: "Three-word phrases" },
      ],
    },
    { key: "top", label: "Show top", type: "number", initial: "30", min: 5, max: 200 },
    { key: "stop", label: "Ignore common words", type: "checkbox", initial: "1", wide: true },
    { key: "focus", label: "Focus keyword", type: "text", placeholder: "invoice generator", wide: true },
  ],
  transform: (input, _v, h) => {
    const size = Math.max(1, Math.min(3, h.num("length", 1)));
    const words = splitWords(input).map(normaliseWord).filter(Boolean);
    const filtered = h.bool("stop") && size === 1 ? words.filter((w) => !DENSITY_STOPWORDS.has(w)) : words;

    const counts = new Map<string, number>();
    for (let i = 0; i + size <= filtered.length; i++) {
      const phrase = filtered.slice(i, i + size).join(" ");
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }

    const total = Math.max(1, filtered.length - size + 1);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = Math.max(5, h.num("top", 30));

    const focus = h.str("focus").trim().toLowerCase();
    const focusCount = focus ? (counts.get(focus) ?? 0) : 0;
    const focusDensity = focus ? (focusCount / total) * 100 : 0;

    const stats: TextResult["stats"] = [
      { label: "Words", value: n(words.length), tone: "accent" },
      { label: "Unique phrases", value: n(counts.size) },
    ];
    if (focus) {
      stats.push({
        label: "Focus keyword",
        value: `${focusDensity.toFixed(2)}%`,
        sub: `${focusCount} of ${n(total)}`,
        tone: focusDensity > 3 ? "warning" : focusCount === 0 ? "error" : "success",
      });
    }

    return {
      stats,
      output: ranked
        .slice(0, top)
        .map(([phrase, count]) => `${((count / total) * 100).toFixed(2)}%\t${count}\t${phrase}`)
        .join("\n"),
      filename: "keyword-density.tsv",
      table: ranked.length
        ? {
            head: ["Phrase", "Count", "Density"],
            rows: ranked.slice(0, top).map(([phrase, count]) => [phrase, n(count), `${((count / total) * 100).toFixed(2)}%`]),
            caption: "Keyword density",
          }
        : undefined,
      warning:
        focus && focusDensity > 3
          ? "Over about 3% starts to read as keyword stuffing, which search engines have penalised for years."
          : focus && focusCount === 0
            ? "Your focus keyword does not appear in this text at all."
            : undefined,
      note: "Density is a diagnostic, not a target. Write for the reader and check the number afterwards.",
    } satisfies TextResult;
  },
  output: { label: "Density list", mono: true, rows: 10 },
};

/* ---------------------------------------------------- canonical/hreflang -- */

export const canonicalTagGenerator: TextToolDef = {
  options: [
    { key: "url", label: "The URL you want indexed", type: "text", initial: "https://example.com/pricing", wide: true },
    { key: "amp", label: "AMP version URL", type: "text", placeholder: "https://example.com/pricing/amp", wide: true },
    { key: "prev", label: "Previous page (paginated series)", type: "text", placeholder: "https://example.com/blog?page=1", wide: true },
    { key: "next", label: "Next page (paginated series)", type: "text", placeholder: "https://example.com/blog?page=3", wide: true },
    { key: "header", label: "Also show the HTTP header form", type: "checkbox", initial: "", wide: true },
  ],
  transform: (_input, _v, h) => {
    const url = safeHttpUrl(h.str("url"));
    if (!url) return { note: "Enter the URL you want search engines to treat as the original." };

    const lines = [`<link rel="canonical" href="${esc(url)}" />`];
    const amp = safeHttpUrl(h.str("amp"));
    if (amp) lines.push(`<link rel="amphtml" href="${esc(amp)}" />`);
    const prev = safeHttpUrl(h.str("prev"));
    if (prev) lines.push(`<link rel="prev" href="${esc(prev)}" />`);
    const next = safeHttpUrl(h.str("next"));
    if (next) lines.push(`<link rel="next" href="${esc(next)}" />`);

    if (h.bool("header")) {
      lines.push("", "# HTTP header form, for PDFs and other non-HTML files", `Link: <${url}>; rel="canonical"`);
    }

    return {
      output: lines.join("\n"),
      filename: "canonical.html",
      note: "A canonical tag must point at an absolute URL, and the page it names should be the one that actually serves the content.",
    } satisfies TextResult;
  },
  output: { label: "Canonical tags", mono: true, rows: 8 },
  notes: [
    { label: "Self-referencing", formula: "Every page should name itself", note: "It settles tracking parameters and trailing-slash variants." },
    { label: "Absolute only", formula: "https://example.com/page", note: "Relative canonicals are a common and costly mistake." },
  ],
};

export const hreflangTagGenerator: TextToolDef = {
  input: {
    label: "Language and URL, one per line",
    placeholder: "en-GB https://example.com/\nfr-FR https://example.com/fr/",
    rows: 10,
    mono: true,
    hint: "Separate the code and the URL with a space, comma, tab or pipe.",
    initial: "en-GB https://example.com/\nen-US https://example.com/us/\nfr-FR https://example.com/fr/\nde-DE https://example.com/de/",
  },
  options: [
    { key: "xdefault", label: "x-default URL", type: "text", initial: "https://example.com/", wide: true, hint: "Where visitors go when no language matches." },
  ],
  transform: (input, _v, h) => {
    const entries: [string, string][] = [];
    const problems: string[] = [];

    for (const line of input.split(/\r\n|\r|\n/u)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [code, ...rest] = trimmed.split(/[\s,|\t]+/u);
      const url = safeHttpUrl(rest.join(" "));
      if (!code || !url) {
        problems.push(trimmed);
        continue;
      }
      if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/u.test(code)) problems.push(trimmed);
      entries.push([code, url]);
    }

    if (entries.length === 0) {
      return { note: "Add one language and URL per line, for example: en-GB https://example.com/" };
    }

    const lines = entries.map(
      ([code, url]) => `<link rel="alternate" hreflang="${esc(code)}" href="${esc(url)}" />`,
    );
    const xdefault = safeHttpUrl(h.str("xdefault"));
    if (xdefault) lines.push(`<link rel="alternate" hreflang="x-default" href="${esc(xdefault)}" />`);

    return {
      output: lines.join("\n"),
      filename: "hreflang.html",
      stats: [{ label: "Languages", value: n(entries.length), tone: "accent" }],
      table: { head: ["Language", "URL"], rows: entries.map(([c, u]) => [c, u]), caption: "Alternates" },
      warning: problems.length
        ? `These lines did not look like a language code and URL: ${problems.slice(0, 3).join("; ")}`
        : undefined,
      note: "Every page in the set must list every other page, including itself. One-way hreflang is ignored.",
    } satisfies TextResult;
  },
  output: { label: "hreflang tags", mono: true, rows: 10 },
  notes: [
    { label: "Format", formula: "language, or language-REGION", note: "en, en-GB, pt-BR. The region is optional." },
    { label: "x-default", formula: "The fallback for unmatched visitors" },
  ],
};

/* ------------------------------------------------------- schema markup --- */

export const schemaMarkupGenerator: TextToolDef = {
  input: {
    label: "Questions and answers",
    placeholder: "Q: Is it free?\nA: Yes, completely.",
    rows: 10,
    hint: "Only used by the FAQ type. One Q: line then one A: line, repeated.",
    initial: "Q: Is the invoice generator free?\nA: Yes. There is no signup, no watermark and no paid tier.\nQ: Where is my data stored?\nA: Everything stays in your browser. Nothing is uploaded.",
  },
  options: [
    {
      key: "type",
      label: "Schema type",
      type: "select",
      initial: "Organization",
      wide: true,
      options: [
        { value: "Organization", label: "Organization — company details" },
        { value: "LocalBusiness", label: "LocalBusiness — shop or office with an address" },
        { value: "Product", label: "Product — item with a price" },
        { value: "FAQPage", label: "FAQPage — questions and answers" },
        { value: "Article", label: "Article — blog post or news story" },
      ],
    },
    { key: "name", label: "Name", type: "text", initial: "Harbour Coffee", wide: true, when: (v) => v.type !== "FAQPage" },
    { key: "url", label: "URL", type: "text", initial: "https://example.com", wide: true, when: (v) => v.type !== "FAQPage" },
    { key: "logo", label: "Logo URL", type: "text", placeholder: "https://example.com/logo.png", wide: true, when: (v) => v.type === "Organization" || v.type === "LocalBusiness" },
    { key: "description", label: "Description", type: "textarea", rows: 2, wide: true, when: (v) => v.type !== "FAQPage" },
    { key: "phone", label: "Telephone", type: "text", placeholder: "+44 20 7946 0958", when: (v) => v.type === "Organization" || v.type === "LocalBusiness" },
    { key: "email", label: "Email", type: "text", placeholder: "hello@example.com", when: (v) => v.type === "Organization" },
    { key: "street", label: "Street address", type: "text", placeholder: "12 Harbour Road", wide: true, when: (v) => v.type === "LocalBusiness" },
    { key: "city", label: "City", type: "text", placeholder: "Bristol", when: (v) => v.type === "LocalBusiness" },
    { key: "postcode", label: "Postcode", type: "text", placeholder: "BS1 4XX", when: (v) => v.type === "LocalBusiness" },
    { key: "country", label: "Country code", type: "text", initial: "GB", when: (v) => v.type === "LocalBusiness" },
    { key: "hours", label: "Opening hours", type: "text", placeholder: "Mo-Fr 09:00-17:30", wide: true, when: (v) => v.type === "LocalBusiness" },
    { key: "price", label: "Price", type: "text", placeholder: "18.50", when: (v) => v.type === "Product" },
    { key: "currency", label: "Currency", type: "text", initial: "GBP", when: (v) => v.type === "Product" },
    { key: "sku", label: "SKU", type: "text", placeholder: "ESP-1KG", when: (v) => v.type === "Product" },
    { key: "brand", label: "Brand", type: "text", placeholder: "Harbour Coffee", when: (v) => v.type === "Product" },
    { key: "author", label: "Author", type: "text", placeholder: "Sarah Chen", wide: true, when: (v) => v.type === "Article" },
    { key: "published", label: "Published date", type: "text", placeholder: "2026-03-14", when: (v) => v.type === "Article" },
    { key: "image", label: "Image URL", type: "text", placeholder: "https://example.com/hero.png", wide: true, when: (v) => v.type === "Product" || v.type === "Article" },
  ],
  transform: (input, _v, h) => {
    const type = h.str("type") || "Organization";
    const text = (key: string) => h.str(key).trim();
    const url = safeHttpUrl(h.str("url"));

    let data: Record<string, unknown>;

    if (type === "FAQPage") {
      const questions: { q: string; a: string }[] = [];
      let pending: string | null = null;
      for (const line of input.split(/\r\n|\r|\n/u)) {
        const trimmed = line.trim();
        if (/^q[:.]/iu.test(trimmed)) pending = trimmed.replace(/^q[:.]\s*/iu, "");
        else if (/^a[:.]/iu.test(trimmed) && pending) {
          questions.push({ q: pending, a: trimmed.replace(/^a[:.]\s*/iu, "") });
          pending = null;
        }
      }
      if (questions.length === 0) {
        return { error: "Add at least one pair of lines starting with “Q:” and “A:”." };
      }
      data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      };
    } else if (type === "LocalBusiness") {
      data = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: text("name"),
        ...(url ? { url } : {}),
        ...(safeHttpUrl(h.str("logo")) ? { logo: safeHttpUrl(h.str("logo")) } : {}),
        ...(text("description") ? { description: text("description") } : {}),
        ...(text("phone") ? { telephone: text("phone") } : {}),
        address: {
          "@type": "PostalAddress",
          ...(text("street") ? { streetAddress: text("street") } : {}),
          ...(text("city") ? { addressLocality: text("city") } : {}),
          ...(text("postcode") ? { postalCode: text("postcode") } : {}),
          ...(text("country") ? { addressCountry: text("country") } : {}),
        },
        ...(text("hours") ? { openingHours: text("hours") } : {}),
      };
    } else if (type === "Product") {
      data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: text("name"),
        ...(text("description") ? { description: text("description") } : {}),
        ...(safeHttpUrl(h.str("image")) ? { image: safeHttpUrl(h.str("image")) } : {}),
        ...(text("sku") ? { sku: text("sku") } : {}),
        ...(text("brand") ? { brand: { "@type": "Brand", name: text("brand") } } : {}),
        offers: {
          "@type": "Offer",
          ...(url ? { url } : {}),
          ...(text("price") ? { price: text("price") } : {}),
          ...(text("currency") ? { priceCurrency: text("currency") } : {}),
          availability: "https://schema.org/InStock",
        },
      };
    } else if (type === "Article") {
      data = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: text("name"),
        ...(text("description") ? { description: text("description") } : {}),
        ...(safeHttpUrl(h.str("image")) ? { image: safeHttpUrl(h.str("image")) } : {}),
        ...(text("author") ? { author: { "@type": "Person", name: text("author") } } : {}),
        ...(text("published") ? { datePublished: text("published") } : {}),
        ...(url ? { mainEntityOfPage: url } : {}),
      };
    } else {
      data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: text("name"),
        ...(url ? { url } : {}),
        ...(safeHttpUrl(h.str("logo")) ? { logo: safeHttpUrl(h.str("logo")) } : {}),
        ...(text("description") ? { description: text("description") } : {}),
        ...(text("phone") || text("email")
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                ...(text("phone") ? { telephone: text("phone") } : {}),
                ...(text("email") ? { email: text("email") } : {}),
              },
            }
          : {}),
      };
    }

    const json = JSON.stringify(data, null, 2);
    // The closing tag is split so the snippet cannot terminate a script block
    // if someone pastes it somewhere unexpected.
    const script = `<script type="application/ld+json">\n${json}\n</` + `script>`;

    return {
      output: script,
      filename: "schema.html",
      note: "Paste this into the page's <head>. Check it afterwards with Google's Rich Results Test — structured data only helps when it matches what is visible on the page.",
      warning: !text("name") && type !== "FAQPage" ? "Most schema types need a name to be eligible for rich results." : undefined,
    } satisfies TextResult;
  },
  output: { label: "JSON-LD", mono: true, rows: 18 },
  notes: [
    { label: "JSON-LD", formula: "A script tag in the head", note: "Google's preferred format — it does not touch your markup." },
    { label: "Honesty", formula: "Describe only what the page shows", note: "Marking up prices or reviews that are not visible risks a manual penalty." },
  ],
};
