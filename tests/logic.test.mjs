/**
 * Logic tests for the parts that must be exactly right: money maths, barcode
 * encoding rules, PDF text safety and the tool registry that drives routing
 * and SEO. Run with `node logic-test.mjs` (Node strips the TypeScript types).
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

import { computeTotals, emptyParty, emptyItem } from "../src/features/documents/types.ts";
import { pdfSafe, isPdfSafe, wrapText, hexToRgb, truncateToWidth } from "../src/features/documents/pdf-text.ts";
import { validateBarcode, checkDigit } from "../src/features/generators/barcode-formats.ts";
import { PASSPHRASE_WORDS, BITS_PER_WORD } from "../src/features/generators/wordlist.ts";
import { tools, toolSlugs, searchTools, relatedTools, categories } from "../src/lib/tools.ts";
import { CALCULATOR_DEFS, calculatorSlugs } from "../src/features/calculators/defs/index.ts";
import { textToolSlugs } from "../src/features/text/defs/index.ts";
import { designToolSlugs } from "../src/features/design/defs/index.ts";
import { runCalculator } from "../src/features/calculators/types.ts";
import {
  convert, formatUnitValue, UNIT_CATEGORIES,
  LENGTH, WEIGHT, TEMPERATURE, AREA, VOLUME, SPEED, DATA, TIME,
} from "../src/features/calculators/defs/units.ts";
import { posts, postSlugs } from "../src/lib/blog.ts";
import { currencies, formatMoney, currencyDecimals } from "../src/lib/currencies.ts";
import { round2, toNumber, sanitizeFilename, safeUrl, escapeHtml, addDaysISO } from "../src/lib/utils.ts";

let pass = 0;
const failures = [];
const check = (name, cond, extra = "") => {
  if (cond) {
    pass += 1;
  } else {
    failures.push(`${name} ${extra}`);
    console.log("  FAIL", name, extra);
  }
};
const group = (name) => console.log(`\n${name}`);

/* ------------------------------------------------------------- invoice maths */
group("invoice / quotation totals");

const doc = (items) => ({
  kind: "invoice", template: "classic", pageSize: "a4", accent: "#11224a",
  logo: null, signature: null, from: emptyParty(), to: emptyParty(),
  number: "INV-1", date: "2026-01-01", dueDate: "2026-01-31", currency: "USD",
  paymentTerms: "", reference: "", items, notes: "", paymentInstructions: "",
  terms: "", signatureName: "",
});

{
  const t = computeTotals(doc([{ ...emptyItem("a"), quantity: 2, unitPrice: 1750, discount: 10, tax: 20 }]));
  check("subtotal is pre-discount gross", t.subtotal === 3500, `got ${t.subtotal}`);
  check("discount amount", t.discountTotal === 350, `got ${t.discountTotal}`);
  check("tax on discounted net", t.taxTotal === 630, `got ${t.taxTotal}`);
  check("grand total", t.total === 3780, `got ${t.total}`);
  check("line amount column = gross", t.lines.a.gross === 3500, `got ${t.lines.a.gross}`);
  check("columns reconcile", t.subtotal - t.discountTotal + t.taxTotal === t.total);
}
{
  // Two rates must appear as separate tax rows, not one blended figure.
  const t = computeTotals(doc([
    { ...emptyItem("a"), quantity: 1, unitPrice: 100, discount: 0, tax: 20 },
    { ...emptyItem("b"), quantity: 1, unitPrice: 100, discount: 0, tax: 5 },
  ]));
  check("tax split by rate", t.taxByRate.length === 2, JSON.stringify(t.taxByRate));
  check("tax rows sorted ascending", t.taxByRate[0].rate === 5 && t.taxByRate[1].rate === 20);
  check("total with mixed rates", t.total === 225, `got ${t.total}`);
}
{
  const t = computeTotals(doc([{ ...emptyItem("a"), quantity: 3, unitPrice: 0.1, discount: 0, tax: 0 }]));
  check("no float drift on 3 x 0.1", t.total === 0.3, `got ${t.total}`);
}
{
  const t = computeTotals(doc([{ ...emptyItem("a"), quantity: -5, unitPrice: -10, discount: 150, tax: -3 }]));
  check("negative input clamps to zero", t.total === 0, `got ${t.total}`);
}
{
  const t = computeTotals(doc([]));
  check("empty invoice totals zero", t.total === 0 && t.itemCount === 0);
}

/* ---------------------------------------------------------------- PDF safety */
group("pdf text safety");
check("keeps ASCII", pdfSafe("Invoice INV-0001") === "Invoice INV-0001");
check("keeps Latin-1 accents", pdfSafe("Café Zürich") === "Café Zürich");
check("keeps WinAnsi extras", pdfSafe("€100 — “quoted”") === "€100 — “quoted”");
check("transliterates rupee", pdfSafe("₹500") === "Rs500", `got ${pdfSafe("₹500")}`);
check("drops CJK rather than crashing", pdfSafe("Total 合計 100") === "Total  100", `got "${pdfSafe("Total 合計 100")}"`);
check("drops emoji", pdfSafe("Thanks 🎉") === "Thanks ", `got "${pdfSafe("Thanks 🎉")}"`);
check("isPdfSafe true for euro", isPdfSafe("€") === true);
check("isPdfSafe false for rupee", isPdfSafe("₹") === false);
check("empty string safe", pdfSafe("") === "");

{
  // 10 units wide per character keeps the expected wrap points obvious.
  const font = { widthOfTextAtSize: (t, s) => t.length * s };
  const lines = wrapText("aaa bbb ccc ddd", font, 1, 7);
  check("wraps on width", lines.length === 2 && lines[0] === "aaa bbb", JSON.stringify(lines));
  const long = wrapText("aaaaaaaaaaaaaaaaaaaa", font, 1, 5);
  check("hard-splits an over-long word", long.length === 4, JSON.stringify(long));
  const clipped = wrapText("aaa bbb ccc ddd eee", font, 1, 7, 1);
  check("respects maxLines", clipped.length === 1, JSON.stringify(clipped));
  check("preserves paragraph breaks", wrapText("a\nb", font, 1, 100).length === 2);
  check("blank input yields nothing", wrapText("   ", font, 1, 100).length === 0);
  check("truncateToWidth adds ellipsis", truncateToWidth("aaaaaaa", font, 1, 5).endsWith("..."));
}
{
  const c = hexToRgb("#11224a");
  check("hex to rgb", Math.round(c.r * 255) === 17 && Math.round(c.g * 255) === 34 && Math.round(c.b * 255) === 74);
  const s = hexToRgb("#fff");
  check("short hex expands", s.r === 1 && s.g === 1 && s.b === 1);
  check("garbage hex does not throw", typeof hexToRgb("nope").r === "number");
}

/* ------------------------------------------------------------------ barcodes */
group("barcode validation");
check("EAN-13 check digit", checkDigit("590123412345") === 7, `got ${checkDigit("590123412345")}`);
check("UPC-A check digit", checkDigit("03600029145") === 2, `got ${checkDigit("03600029145")}`);
check("EAN-8 check digit", checkDigit("9638507") === 4, `got ${checkDigit("9638507")}`);

{
  const v = validateBarcode("EAN13", "590123412345");
  check("EAN-13 appends check digit", v.ok && v.encoded === "5901234123457", v.encoded);
}
{
  const v = validateBarcode("EAN13", "5901234123457");
  check("EAN-13 accepts correct 13 digits", v.ok && v.encoded === "5901234123457");
}
{
  const v = validateBarcode("EAN13", "5901234123450");
  check("EAN-13 rejects wrong check digit", !v.ok && /should be 7/.test(v.error ?? ""), v.error);
}
{
  const v = validateBarcode("EAN13", "12345");
  check("EAN-13 rejects wrong length", !v.ok && /12 or 13 digits/.test(v.error ?? ""), v.error);
}
{
  const v = validateBarcode("EAN13", "59012341234A");
  check("EAN-13 rejects letters", !v.ok && /digits only/.test(v.error ?? ""));
}
check("ITF rejects odd length", !validateBarcode("ITF", "12345").ok);
check("ITF accepts even length", validateBarcode("ITF", "123456").ok);
{
  const v = validateBarcode("CODE39", "part-1234");
  check("Code 39 uppercases", v.ok && v.encoded === "PART-1234" && Boolean(v.note));
}
check("Code 39 rejects invalid chars", !validateBarcode("CODE39", "part_1234").ok);
check("Code 128 accepts ASCII", validateBarcode("CODE128", "SKU-4821-AB").ok);
check("Code 128 rejects non-ASCII", !validateBarcode("CODE128", "café").ok);
check("empty value rejected", !validateBarcode("CODE128", "   ").ok);

/* ------------------------------------------------------------------ passwords */
group("passphrase word list");
check("no duplicate words", new Set(PASSPHRASE_WORDS).size === PASSPHRASE_WORDS.length);
check("list is large enough to be useful", PASSPHRASE_WORDS.length >= 500, `${PASSPHRASE_WORDS.length} words`);
check("all words lowercase a-z", PASSPHRASE_WORDS.every((w) => /^[a-z]{2,10}$/.test(w)));
check("bits per word", BITS_PER_WORD > 9, BITS_PER_WORD.toFixed(2));
check("default 6 words + number is Strong (>=70 bits)", BITS_PER_WORD * 6 + Math.log2(9000) >= 70,
  `${(BITS_PER_WORD * 6 + Math.log2(9000)).toFixed(1)} bits`);

/* ------------------------------------------------------------------ registry */
group("tool registry and routes");
check("catalog has grown past the original 18", tools.length > 18, `${tools.length} tools`);
check("slugs unique", new Set(toolSlugs).size === tools.length, `${new Set(toolSlugs).size} unique of ${tools.length}`);
check("the dynamic tool route exists", existsSync(join(ROOT, "src/app/tools/[slug]/page.tsx")));
{
  // tool-registry.ts imports next/dynamic, so read it as text rather than importing.
  const registrySource = readFileSync(join(ROOT, "src/features/tool-registry.ts"), "utf8");
  const bespoke = [...registrySource.matchAll(/^\s{2}"([a-z0-9-]+)":\s*dynamic\(/gm)].map((m) => m[1]);
  const implemented = new Set([...bespoke, ...calculatorSlugs, ...textToolSlugs, ...designToolSlugs]);

  check("every tool resolves to a component", toolSlugs.every((s) => implemented.has(s)),
    toolSlugs.filter((s) => !implemented.has(s)).join(", "));
  check("no component without a catalog entry", [...implemented].every((s) => toolSlugs.includes(s)),
    [...implemented].filter((s) => !toolSlugs.includes(s)).join(", "));
}
check("every calculator slug has a definition", calculatorSlugs.every((s) => toolSlugs.includes(s)),
  calculatorSlugs.filter((s) => !toolSlugs.includes(s)).join(", "));
check("every tool has SEO copy", tools.every((t) => t.seoTitle && t.seoDescription.length > 60));
check("meta descriptions under 165 chars", tools.every((t) => t.seoDescription.length <= 165),
  tools.filter((t) => t.seoDescription.length > 165).map((t) => `${t.slug}:${t.seoDescription.length}`).join(", "));
check("every tool has at least two FAQs", tools.every((t) => t.faq.length >= 2),
  tools.filter((t) => t.faq.length < 2).map((t) => t.slug).join(", "));
check("optional feature lists are substantial when present",
  tools.every((t) => !t.features || t.features.length >= 5),
  tools.filter((t) => t.features && t.features.length < 5).map((t) => t.slug).join(", "));
check("optional how-to lists are substantial when present",
  tools.every((t) => !t.howTo || t.howTo.length >= 4),
  tools.filter((t) => t.howTo && t.howTo.length < 4).map((t) => t.slug).join(", "));
check("categories are valid", tools.every((t) => t.category in categories));
check("related slugs all resolve", tools.every((t) => (t.related ?? []).every((s) => toolSlugs.includes(s))));
check("relatedTools never returns self", tools.every((t) => relatedTools(t.slug).every((r) => r.slug !== t.slug)));
check("relatedTools returns 4", tools.every((t) => relatedTools(t.slug).length === 4));

group("search");
check('"compress photo" -> image compressor', searchTools("compress photo")[0]?.slug === "image-compressor",
  searchTools("compress photo")[0]?.slug);
check('"invoice" -> invoice generator', searchTools("invoice")[0]?.slug === "invoice-generator");
check('"merge pdf" -> pdf merger', searchTools("merge pdf")[0]?.slug === "pdf-merger",
  searchTools("merge pdf")[0]?.slug);
check('"qr" -> qr generator', searchTools("qr")[0]?.slug === "qr-code-generator");
check('"vat" -> vat calculator', searchTools("vat")[0]?.slug === "vat-tax-calculator");
check('"take home pay" -> salary', searchTools("take home pay")[0]?.slug === "salary-calculator",
  searchTools("take home pay")[0]?.slug);
check('"instagram size" -> social resizer', searchTools("instagram size")[0]?.slug === "social-media-image-resizer",
  searchTools("instagram size")[0]?.slug);
check("empty query returns nothing", searchTools("").length === 0);
check("nonsense returns nothing", searchTools("zzzqqq").length === 0);

group("blog");
check("post slugs unique", new Set(postSlugs).size === posts.length);
check("every post has a body", posts.every((p) => p.body.length > 3));
check("every post links only to real tools", posts.every((p) => p.tools.every((s) => toolSlugs.includes(s))));
check("every cta targets a real tool",
  posts.every((p) => p.body.filter((b) => b.type === "cta").every((b) => toolSlugs.includes(b.toolSlug))));
check("post dates parse", posts.every((p) => !Number.isNaN(Date.parse(p.date))));

/* -------------------------------------------------------------------- utils  */
group("utilities");
check("round2 fixes float drift", round2(0.1 + 0.2) === 0.3);
check("toNumber strips currency text", toNumber("$1,234.50") === 1234.5, String(toNumber("$1,234.50")));
check("toNumber falls back", toNumber("abc", 7) === 7);
check("toNumber handles NaN", toNumber(NaN, 3) === 3);
check("sanitizeFilename strips traversal", sanitizeFilename("../../etc/passwd") === "passwd",
  sanitizeFilename("../../etc/passwd"));
check("sanitizeFilename strips windows path", sanitizeFilename("C:\\temp\\x.pdf") === "x.pdf");
check("sanitizeFilename falls back when empty", sanitizeFilename("", "file") === "file");
check("sanitizeFilename removes leading dots", !sanitizeFilename(".htaccess").startsWith("."));
check("safeUrl blocks javascript:", safeUrl("javascript:alert(1)") === "", safeUrl("javascript:alert(1)"));
check("safeUrl blocks data:", safeUrl("data:text/html,<script>") === "");
check("safeUrl allows https", safeUrl("https://example.com") === "https://example.com");
check("safeUrl allows mailto", safeUrl("mailto:a@b.co") === "mailto:a@b.co");
check("safeUrl adds https to bare host", safeUrl("example.com") === "https://example.com");
check("escapeHtml escapes angle brackets", escapeHtml('<img src=x onerror="a">').includes("&lt;img"));
check("addDaysISO crosses month end", addDaysISO("2026-01-31", 1) === "2026-02-01", addDaysISO("2026-01-31", 1));
check("addDaysISO handles leap year", addDaysISO("2028-02-28", 1) === "2028-02-29");

group("currencies");
check("no duplicate codes", new Set(currencies.map((c) => c.code)).size === currencies.length);
check("all codes are 3 letters", currencies.every((c) => /^[A-Z]{3}$/.test(c.code)));
check("JPY has zero decimals", currencyDecimals("JPY") === 0);
check("USD has two decimals", currencyDecimals("USD") === 2);
check("formats USD", formatMoney(1234.5, "USD") === "$1,234.50", formatMoney(1234.5, "USD"));
check("formats JPY without decimals", formatMoney(1234, "JPY") === "¥1,234", formatMoney(1234, "JPY"));
check("unknown currency does not throw", typeof formatMoney(1, "ZZZ") === "string");


/* -------------------------------------------------------------- calculators */
group("calculator definitions");
check("every definition has fields and a compute function",
  calculatorSlugs.every((slug) => {
    const def = CALCULATOR_DEFS[slug];
    return Array.isArray(def.fields) && def.fields.length > 0 && typeof def.compute === "function";
  }));
check("no definition throws on its own defaults",
  calculatorSlugs.every((slug) => {
    const def = CALCULATOR_DEFS[slug];
    const values = {};
    if (def.modes) values[def.modes.key] = def.modes.options[0].value;
    for (const f of def.fields) values[f.key] = f.initial ?? "";
    try { runCalculator(def, values); return true; } catch { return false; }
  }),
  calculatorSlugs.filter((slug) => {
    const def = CALCULATOR_DEFS[slug];
    const values = {};
    if (def.modes) values[def.modes.key] = def.modes.options[0].value;
    for (const f of def.fields) values[f.key] = f.initial ?? "";
    try { runCalculator(def, values); return false; } catch { return true; }
  }).join(", "));
check("no definition throws on empty input",
  calculatorSlugs.every((slug) => {
    try { runCalculator(CALCULATOR_DEFS[slug], {}); return true; } catch { return false; }
  }),
  calculatorSlugs.filter((slug) => {
    try { runCalculator(CALCULATOR_DEFS[slug], {}); return false; } catch { return true; }
  }).join(", "));
check("no definition throws on zero input",
  calculatorSlugs.every((slug) => {
    const def = CALCULATOR_DEFS[slug];
    const values = {};
    if (def.modes) values[def.modes.key] = def.modes.options[0].value;
    for (const f of def.fields) values[f.key] = "0";
    try { runCalculator(def, values); return true; } catch { return false; }
  }));
check("every mode of every definition computes",
  calculatorSlugs.every((slug) => {
    const def = CALCULATOR_DEFS[slug];
    if (!def.modes) return true;
    return def.modes.options.every((opt) => {
      const values = { [def.modes.key]: opt.value };
      for (const f of def.fields) values[f.key] = f.initial ?? "";
      try { runCalculator(def, values); return true; } catch { return false; }
    });
  }));

group("calculator arithmetic");
const out = (slug, values, currency) =>
  runCalculator(CALCULATOR_DEFS[slug], values, currency);
const label = (r, name) => r.outputs.find((o) => o.label === name)?.value;

{
  const r = out("percentage-calculator", { mode: "of", percent: "15", base: "200" });
  check("15% of 200 = 30", label(r, "Result") === "30", label(r, "Result"));
}
{
  const r = out("percentage-calculator", { mode: "isWhatPercent", part: "30", whole: "200" });
  check("30 of 200 = 15%", label(r, "Percentage") === "15.00%", label(r, "Percentage"));
}
{
  const r = out("percentage-calculator", { mode: "isWhatPercent", part: "5", whole: "0" });
  check("divide by zero is caught", Boolean(r.warning));
}
{
  const r = out("percentage-change-calculator", { from: "120", to: "150" });
  check("120 to 150 is a 25% increase", label(r, "Increase") === "25.00%", label(r, "Increase"));
}
{
  const r = out("percentage-change-calculator", { from: "0", to: "50" });
  check("change from zero warns", Boolean(r.warning));
}
{
  const r = out("discount-calculator", { mode: "apply", price: "250", percent: "20" });
  check("20% off 250 = 200", label(r, "Sale price") === "$200.00", label(r, "Sale price"));
}
{
  const r = out("discount-calculator", { mode: "find", price: "250", sale: "200" });
  check("250 to 200 is 20% off", label(r, "Discount") === "20.00%", label(r, "Discount"));
}
{
  const r = out("markup-calculator", { cost: "60", markup: "50" });
  check("50% markup on 60 = 90", label(r, "Selling price") === "$90.00", label(r, "Selling price"));
  check("50% markup = 33.33% margin", label(r, "Equivalent margin") === "33.33%", label(r, "Equivalent margin"));
}
{
  const r = out("tip-calculator", { bill: "100", tip: "15", people: "2", round: "none" });
  check("15% tip on 100 = 15", label(r, "Tip") === "$15.00", label(r, "Tip"));
  check("split of 115 between 2 = 57.50", label(r, "Each person pays") === "$57.50", label(r, "Each person pays"));
}
{
  const r = out("average-calculator", { numbers: "12, 18, 7, 25, 18, 30" });
  check("mean of the sample", label(r, "Mean") === "18.3333", label(r, "Mean"));
  check("median of the sample", label(r, "Median") === "18", label(r, "Median"));
  check("mode of the sample", label(r, "Mode") === "18", label(r, "Mode"));
  check("sum of the sample", label(r, "Sum") === "110", label(r, "Sum"));
}
{
  const r = out("average-calculator", { numbers: "1, 2, 3" });
  check("no repeated value means no mode", label(r, "Mode") === "None", label(r, "Mode"));
}
{
  const r = out("ratio-calculator", { mode: "simplify", a: "16", b: "24" });
  check("16:24 simplifies to 2:3", label(r, "Simplified") === "2 : 3", label(r, "Simplified"));
}
{
  const r = out("ratio-calculator", { mode: "divide", a: "2", b: "3", amount: "1000" });
  check("1000 split 2:3 gives 400", label(r, "First share") === "400", label(r, "First share"));
  check("1000 split 2:3 gives 600", label(r, "Second share") === "600", label(r, "Second share"));
}
{
  const r = out("fraction-calculator", { op: "add", n1: "1", d1: "2", n2: "1", d2: "3" });
  check("1/2 + 1/3 = 5/6", label(r, "Result") === "5/6", label(r, "Result"));
}
{
  const r = out("fraction-calculator", { op: "div", n1: "1", d1: "2", n2: "1", d2: "4" });
  check("1/2 ÷ 1/4 = 2/1", label(r, "Result") === "2/1", label(r, "Result"));
}
{
  const r = out("fraction-calculator", { op: "add", n1: "1", d1: "0", n2: "1", d2: "3" });
  check("zero denominator warns", Boolean(r.warning));
}
{
  const r = out("simple-interest-calculator", { principal: "10000", rate: "5", years: "3" });
  check("simple interest 10000 at 5% for 3y = 1500", label(r, "Interest earned") === "$1,500.00", label(r, "Interest earned"));
}
{
  // 10000 at 12% compounded monthly for 1 year = 11268.25
  const r = out("compound-interest-calculator", { principal: "10000", rate: "12", years: "1", frequency: "12", deposit: "0" });
  check("compound 10000 at 12% monthly 1y", label(r, "Final balance") === "$11,268.25", label(r, "Final balance"));
}
{
  // 100000 at 6% over 30 years -> 599.55/month (standard mortgage check figure)
  const r = out("loan-calculator", { amount: "100000", rate: "6", years: "30" });
  check("loan payment matches the standard figure", label(r, "Monthly payment") === "$599.55", label(r, "Monthly payment"));
}
{
  const r = out("loan-calculator", { amount: "12000", rate: "0", years: "1" });
  check("zero-interest loan divides evenly", label(r, "Monthly payment") === "$1,000.00", label(r, "Monthly payment"));
}
{
  const r = out("roi-calculator", { cost: "10000", returned: "13500", years: "0" });
  check("ROI of 10000 -> 13500 is 35%", label(r, "ROI") === "35.00%", label(r, "ROI"));
}
{
  const r = out("roi-calculator", { cost: "100", returned: "121", years: "2" });
  check("CAGR of 100 -> 121 over 2y is 10%", label(r, "Annualised (CAGR)") === "10.00%", label(r, "Annualised (CAGR)"));
}
{
  const r = out("break-even-calculator", { fixed: "20000", price: "50", variable: "30" });
  check("break-even at 1000 units", label(r, "Break-even units") === "1,000", label(r, "Break-even units"));
}
{
  const r = out("break-even-calculator", { fixed: "20000", price: "30", variable: "30" });
  check("no contribution margin warns", Boolean(r.warning));
}
{
  const r = out("profit-calculator", { revenue: "120000", cogs: "54000", operating: "30000", other: "6000" });
  check("gross profit", label(r, "Gross profit") === "$66,000.00", label(r, "Gross profit"));
  check("net profit", label(r, "Net profit") === "$30,000.00", label(r, "Net profit"));
  check("gross margin", label(r, "Gross margin") === "55.00%", label(r, "Gross margin"));
}
{
  const r = out("overtime-calculator", { rate: "20", standard: "40", overtime: "6", multiplier: "1.5" });
  check("overtime at time and a half", label(r, "Overtime pay") === "$180.00", label(r, "Overtime pay"));
  check("overtime total pay", label(r, "Total pay") === "$980.00", label(r, "Total pay"));
}
{
  const r = out("commission-calculator", { mode: "tiered", sales: "50000", rate: "5", threshold: "20000" });
  check("threshold commission", label(r, "Commission") === "$1,500.00", label(r, "Commission"));
}
{
  const r = out("commission-calculator", { mode: "tiered", sales: "10000", rate: "5", threshold: "20000" });
  check("below threshold earns nothing", label(r, "Commission") === "$0.00", label(r, "Commission"));
}
{
  const r = out("roas-calculator", { revenue: "48000", spend: "12000", margin: "45" });
  check("ROAS 48000/12000 = 4x", label(r, "ROAS") === "4×", label(r, "ROAS"));
  check("break-even ROAS at 45% margin", label(r, "Break-even ROAS") === "2.22×", label(r, "Break-even ROAS"));
}
{
  const r = out("roas-calculator", { revenue: "20000", spend: "10000", margin: "20" });
  check("2x ROAS at 20% margin is flagged as a loss", Boolean(r.warning));
}
{
  const r = out("pricing-calculator", { unitCost: "18", fixed: "15000", volume: "1500", margin: "30" });
  // full cost = 18 + 10 = 28; price = 28 / 0.7 = 40
  check("price for a 30% margin", label(r, "Price to charge") === "$40.00", label(r, "Price to charge"));
}
{
  const r = out("customer-acquisition-cost-calculator",
    { spend: "40000", customers: "160", revenuePer: "90", margin: "70", lifetime: "24" });
  check("CAC = 250", label(r, "CAC") === "$250.00", label(r, "CAC"));
  // LTV = 90 * 24 * 0.7 = 1512 -> 1512/250 = 6.05
  check("LTV:CAC ratio", label(r, "LTV : CAC") === "6.05 : 1", label(r, "LTV : CAC"));
}
{
  const r = out("split-bill-calculator", { bill: "120", tax: "8", tip: "15", people: "4" });
  // 120 + 9.60 + 18 = 147.60 / 4 = 36.90
  check("split bill each share", label(r, "Each person pays") === "$36.90", label(r, "Each person pays"));
}
{
  const r = out("hourly-rate-calculator", { mode: "toHourly", salary: "60000", hours: "37.5", weeks: "46" });
  // 60000 / 1725 = 34.78
  check("salary to hourly", label(r, "Hourly rate") === "$34.78", label(r, "Hourly rate"));
}
{
  const r = out("cash-flow-calculator", { opening: "40000", inflow: "18000", outflow: "21000", growth: "0", months: "24" });
  // burn 3000/month on 40000 -> negative in month 14
  check("runway detected", label(r, "Runway") === "14 months", label(r, "Runway"));
}
{
  const r = out("currency-agnostic-check" in CALCULATOR_DEFS ? "percentage-calculator" : "discount-calculator",
    { mode: "apply", price: "100", percent: "10" }, "JPY");
  check("currency selection is respected", (label(r, "Sale price") ?? "").includes("¥"), label(r, "Sale price"));
}

/* ------------------------------------------------------------ unit converters */
group("unit converters");

const conv = (category, value, from, to) => convert(category, value, from, to);
const nearly = (name, actual, expected, tolerance = 1e-9) =>
  check(name, Math.abs(actual - expected) <= tolerance, `got ${actual} want ${expected}`);
const same = (name, actual, expected) =>
  check(name, Object.is(actual, expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);

/* Length — the 1959 international definitions. */
nearly("1 inch is 2.54 cm", conv(LENGTH, 1, "in", "cm"), 2.54);
nearly("1 foot is 0.3048 m", conv(LENGTH, 1, "ft", "m"), 0.3048);
nearly("1 mile is 1.609344 km", conv(LENGTH, 1, "mi", "km"), 1.609344);
nearly("1 mile is 5280 feet", conv(LENGTH, 1, "mi", "ft"), 5280, 1e-6);
nearly("1 nautical mile is 1852 m", conv(LENGTH, 1, "nmi", "m"), 1852);
nearly("100 cm is 39.3700787 in", conv(LENGTH, 100, "cm", "in"), 39.37007874015748, 1e-9);
nearly("1 yard is 3 feet", conv(LENGTH, 1, "yd", "ft"), 3, 1e-9);

/* Mass */
nearly("1 lb is 0.45359237 kg", conv(WEIGHT, 1, "lb", "kg"), 0.45359237);
nearly("1 kg is 2.2046226 lb", conv(WEIGHT, 1, "kg", "lb"), 2.2046226218487757, 1e-9);
nearly("1 stone is 14 lb", conv(WEIGHT, 1, "st", "lb"), 14, 1e-9);
nearly("1 lb is 16 oz", conv(WEIGHT, 1, "lb", "oz"), 16, 1e-9);
nearly("1 US ton is 2000 lb", conv(WEIGHT, 1, "ton_us", "lb"), 2000, 1e-9);
nearly("1 UK ton is 2240 lb", conv(WEIGHT, 1, "ton_uk", "lb"), 2240, 1e-9);
nearly("1 tonne is 1000 kg", conv(WEIGHT, 1, "t", "kg"), 1000, 1e-9);

/* Temperature — offsets as well as scale. */
nearly("0 C is 32 F", conv(TEMPERATURE, 0, "c", "f"), 32, 1e-9);
nearly("100 C is 212 F", conv(TEMPERATURE, 100, "c", "f"), 212, 1e-9);
nearly("37 C is 98.6 F", conv(TEMPERATURE, 37, "c", "f"), 98.6, 1e-9);
nearly("-40 C is -40 F", conv(TEMPERATURE, -40, "c", "f"), -40, 1e-9);
nearly("0 K is -273.15 C", conv(TEMPERATURE, 0, "k", "c"), -273.15, 1e-9);
nearly("absolute zero in Fahrenheit", conv(TEMPERATURE, 0, "k", "f"), -459.67, 1e-9);
nearly("0 R is 0 K", conv(TEMPERATURE, 0, "r", "k"), 0, 1e-9);
nearly("Fahrenheit round trip", conv(TEMPERATURE, conv(TEMPERATURE, 72, "f", "c"), "c", "f"), 72, 1e-9);

/* Area */
nearly("1 hectare is 10000 m2", conv(AREA, 1, "ha", "m2"), 10000, 1e-6);
nearly("1 acre is 43560 sq ft", conv(AREA, 1, "ac", "ft2"), 43560, 1e-6);
nearly("1 hectare is 2.4710538 acres", conv(AREA, 1, "ha", "ac"), 2.4710538146716534, 1e-9);
nearly("1 m2 is 10.7639 sq ft", conv(AREA, 1, "m2", "ft2"), 10.763910416709722, 1e-9);
nearly("1 sq mile is 640 acres", conv(AREA, 1, "mi2", "ac"), 640, 1e-6);

/* Volume — the US and UK measures must stay apart. */
nearly("1 US gallon is 3.785411784 L", conv(VOLUME, 1, "gal_us", "l"), 3.785411784, 1e-9);
nearly("1 UK gallon is 4.54609 L", conv(VOLUME, 1, "gal_uk", "l"), 4.54609, 1e-9);
nearly("1 UK pint is 568.26125 ml", conv(VOLUME, 1, "pt_uk", "ml"), 568.26125, 1e-6);
nearly("1 US pint is 473.176473 ml", conv(VOLUME, 1, "pt_us", "ml"), 473.176473, 1e-6);
nearly("1 cubic metre is 1000 L", conv(VOLUME, 1, "m3", "l"), 1000, 1e-9);
nearly("1 US gallon is 8 US pints", conv(VOLUME, 1, "gal_us", "pt_us"), 8, 1e-9);
check("UK and US pints differ", Math.abs(conv(VOLUME, 1, "pt_uk", "ml") - conv(VOLUME, 1, "pt_us", "ml")) > 90);

/* Speed */
nearly("100 km/h is 62.137 mph", conv(SPEED, 100, "kph", "mph"), 62.13711922373339, 1e-9);
nearly("1 knot is 1.852 km/h", conv(SPEED, 1, "kn", "kph"), 1.852, 1e-9);
nearly("1 m/s is 3.6 km/h", conv(SPEED, 1, "mps", "kph"), 3.6, 1e-9);
nearly("60 mph is 26.8224 m/s", conv(SPEED, 60, "mph", "mps"), 26.8224, 1e-9);

/* Data — the whole point is that the two families differ. */
nearly("1 kB is 1000 bytes", conv(DATA, 1, "kB", "B"), 1000, 1e-9);
nearly("1 KiB is 1024 bytes", conv(DATA, 1, "KiB", "B"), 1024, 1e-9);
nearly("1 GiB is 1073741824 bytes", conv(DATA, 1, "GiB", "B"), 1073741824, 1e-6);
nearly("1 byte is 8 bits", conv(DATA, 1, "B", "bit"), 8, 1e-9);
nearly("a 1 TB drive shows as 931.32 GiB", conv(DATA, 1, "TB", "GiB"), 931.3225746154785, 1e-6);
nearly("1 GB is 1000 MB", conv(DATA, 1, "GB", "MB"), 1000, 1e-9);

/* Time */
nearly("1 hour is 60 minutes", conv(TIME, 1, "h", "min"), 60, 1e-9);
nearly("1 day is 86400 seconds", conv(TIME, 1, "d", "s"), 86400, 1e-9);
nearly("1 week is 7 days", conv(TIME, 1, "wk", "d"), 7, 1e-9);
nearly("1 year is 365 days", conv(TIME, 1, "yr", "d"), 365, 1e-9);
nearly("1 second is 1000 ms", conv(TIME, 1, "s", "ms"), 1000, 1e-9);

/* Every unit in every family must survive a round trip, and converting a unit
   to itself must change nothing at all. */
for (const [name, category] of Object.entries(UNIT_CATEGORIES)) {
  let identityOk = true;
  let roundTripOk = true;
  let worst = 0;
  for (const from of category.units) {
    if (conv(category, 7.5, from.key, from.key) !== 7.5) identityOk = false;
    for (const to of category.units) {
      const there = conv(category, 7.5, from.key, to.key);
      const back = conv(category, there, to.key, from.key);
      const drift = Math.abs(back - 7.5);
      worst = Math.max(worst, drift);
      if (drift > 1e-6) roundTripOk = false;
    }
  }
  check(`${name}: converting a unit to itself changes nothing`, identityOk);
  check(`${name}: every pair round-trips`, roundTripOk, `worst drift ${worst}`);
  check(`${name}: every unit has a symbol and label`,
    category.units.every((u) => u.key && u.label && u.symbol));
  check(`${name}: unit keys are unique`,
    new Set(category.units.map((u) => u.key)).size === category.units.length);
}

/* Formatting has to cope with the whole range, from nanometres to petabytes. */
same("formats a whole number", formatUnitValue(1234567), "1,234,567");
same("formats zero", formatUnitValue(0), "0");
same("keeps small decimals", formatUnitValue(2.54), "2.54");
same("rounds to eight significant figures", formatUnitValue(39.37007874015748), "39.370079");
same("honours a custom precision", formatUnitValue(39.37007874015748, 12), "39.3700787402");
same("trims float noise", formatUnitValue(0.1 + 0.2), "0.3");
same("handles negatives", formatUnitValue(-40), "-40");
check("falls back to exponent notation when tiny", formatUnitValue(1e-12).includes("e"));
same("rejects infinity", formatUnitValue(Number.POSITIVE_INFINITY), "—");

/* The converters are wired into the shared calculator engine. */
{
  const r = out("length-converter", { value: "100", from: "cm", to: "in" });
  check("length converter converts 100 cm", r.outputs[0].value.startsWith("39.37"), r.outputs[0].value);
  check("length converter offers an unrounded value", r.outputs[1].value.startsWith("39.3700787"), r.outputs[1].value);
  check("length converter lists every unit", r.table.rows.length === LENGTH.units.length);
}
{
  const r = out("temperature-converter", { value: "100", from: "c", to: "f" });
  check("temperature converter says 212", r.outputs[0].value.startsWith("212"), r.outputs[0].value);
  check("temperature converter lists all four scales", r.table.rows.length === 4);
}
{
  const r = out("data-storage-converter", { value: "1", from: "TB", to: "GiB" });
  check("data converter explains the drive-size gap", r.outputs[0].value.startsWith("931.3"), r.outputs[0].value);
}
check("every converter survives an empty value",
  ["length-converter", "weight-converter", "temperature-converter", "area-converter",
   "volume-converter", "speed-converter", "data-storage-converter", "time-converter"].every((slug) => {
    try {
      const r = out(slug, {});
      return Array.isArray(r.outputs);
    } catch {
      return false;
    }
  }));

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(" -", f);
}
process.exit(failures.length ? 1 : 0);
