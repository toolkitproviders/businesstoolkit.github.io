/**
 * Text, encoding and developer-tool tests.
 *
 * These transforms are pure functions over strings, so every assertion below
 * checks an exact expected output rather than "it produced something".
 */
import { TEXT_TOOL_DEFS, textToolSlugs } from "../src/features/text/defs/index.ts";
import { runTextTool } from "../src/features/text/types.ts";
import { analyse, countSentences, countParagraphs, formatDuration } from "../src/features/text/defs/counters.ts";
import { toTitleCase, toSentenceCase, escapeRegExp } from "../src/features/text/defs/transform.ts";
import { base64Encode, base64Decode, md5, crc32 } from "../src/features/text/defs/dev-data.ts";
import { minifyCss, formatSql, tokeniseSql, minifyMarkup, formatXml } from "../src/features/text/defs/dev-code.ts";
import {
  parseCron, describeCron, nextCronRuns, diffLines,
  encodeHtmlEntities, decodeHtmlEntities,
} from "../src/features/text/defs/dev-misc.ts";
import { esc, safeHttpUrl } from "../src/features/text/defs/seo.ts";
import { tools, toolSlugs } from "../src/lib/tools.ts";

let pass = 0;
const failures = [];
const check = (name, cond, extra = "") => {
  if (cond) pass += 1;
  else {
    failures.push(`${name} ${extra}`);
    console.log("  FAIL", name, extra);
  }
};
const eq = (name, actual, expected) =>
  check(name, Object.is(actual, expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
const group = (title) => console.log(`\n${title}`);

const run = (slug, input, values = {}) => runTextTool(TEXT_TOOL_DEFS[slug], input, values);
const out = async (slug, input, values = {}) => (await run(slug, input, values)).output;

/* ------------------------------------------------------------- counting -- */
group("counting");
{
  const text = "Hello world. This is a test!\n\nA second paragraph here.";
  const c = analyse(text);
  eq("words", c.words, 10);
  eq("sentences", countSentences(text), 3);
  eq("paragraphs", countParagraphs(text), 2);
  eq("characters", c.characters, text.length);
  eq("characters without spaces", c.charactersNoSpaces, text.replace(/\s/g, "").length);
  eq("empty text has no words", analyse("").words, 0);
  eq("empty text has no lines", analyse("").lines, 0);
  eq("unique words ignores case", analyse("Cat cat CAT dog").uniqueWords, 2);
}
eq("duration under a minute", formatDuration(45), "45 sec");
eq("duration with minutes", formatDuration(100), "1 min 40 sec");
eq("duration on the minute", formatDuration(120), "2 min");

{
  // 238 words at 238 wpm is exactly one minute.
  const words = Array.from({ length: 238 }, () => "word").join(" ");
  const r = await run("reading-time-calculator", words);
  eq("238 words reads in 1 min", r.stats[0].value, "1 min");
}
{
  const r = await run("character-counter", "x".repeat(300), { limit: "x" });
  eq("280-char limit exceeded by 20", r.stats[0].value, "-20");
  check("over-limit warns", r.warning?.includes("20 characters over"));
}
{
  const r = await run("word-frequency-counter", "the cat sat on the mat the cat", { stop: "", min: "1", top: "50" });
  eq("most frequent word", r.stats[2].value, "the");
  eq("stopwords kept when unticked", r.table.rows[0][1], "3");
  const filtered = await run("word-frequency-counter", "the cat sat on the mat the cat", { stop: "1", min: "1", top: "50" });
  eq("stopwords dropped", filtered.table.rows[0][0], "cat");
}

/* ------------------------------------------------------------- case ----- */
group("case conversion");
eq("title case", toTitleCase("the quick brown fox"), "The Quick Brown Fox");
eq("title case keeps small words low", toTitleCase("a tale of two cities now"), "A Tale of Two Cities Now");
eq("sentence case", toSentenceCase("HELLO THERE. HOW ARE YOU?"), "Hello there. How are you?");
eq("camelCase", await out("case-converter", "hello world again", { case: "camel" }), "helloWorldAgain");
eq("PascalCase", await out("case-converter", "hello world", { case: "pascal" }), "HelloWorld");
eq("snake_case", await out("case-converter", "Hello World", { case: "snake" }), "hello_world");
eq("kebab-case", await out("case-converter", "Hello World", { case: "kebab" }), "hello-world");
eq("CONSTANT_CASE", await out("case-converter", "hello world", { case: "constant" }), "HELLO_WORLD");
eq("camelCase splits existing camel", await out("case-converter", "helloWorldHere", { case: "snake" }), "hello_world_here");
eq("upper", await out("case-converter", "aBc", { case: "upper" }), "ABC");
eq("inverse", await out("case-converter", "aBc", { case: "inverse" }), "AbC");

/* ---------------------------------------------------------- whitespace -- */
group("whitespace and lines");
eq("collapse spaces", await out("remove-extra-spaces", "a    b   c"), "a b c");
eq("trim lines", await out("remove-extra-spaces", "  a  \n  b  "), "a\nb");
eq("remove all spaces", await out("remove-extra-spaces", "a b\tc", { all: "1" }), "abc");
eq("join lines", await out("remove-extra-spaces", "a\nb\nc", { breaks: "1" }), "a b c");

eq("dedupe keeps first", await out("remove-duplicate-lines", "a\nb\nA\nc\nb"), "a\nb\nc");
eq("dedupe case sensitive", await out("remove-duplicate-lines", "a\nA\na", { case: "1" }), "a\nA");
eq("dedupe keeps last", await out("remove-duplicate-lines", "a\nb\na", { keep: "last" }), "b\na");
eq("only unique lines", await out("remove-duplicate-lines", "a\nb\na\nc", { keep: "unique" }), "b\nc");
eq("only duplicated lines", await out("remove-duplicate-lines", "a\nb\na\nc", { keep: "dupes" }), "a");

eq("sort A-Z", await out("sort-lines", "banana\nApple\ncherry"), "Apple\nbanana\ncherry");
eq("sort Z-A", await out("sort-lines", "a\nc\nb", { order: "za" }), "c\nb\na");
eq("sort numerically", await out("sort-lines", "item 10\nitem 2\nitem 1", { order: "num-asc" }), "item 1\nitem 2\nitem 10");
eq("sort by length", await out("sort-lines", "ccc\na\nbb", { order: "len-asc" }), "a\nbb\nccc");
eq("reverse order", await out("sort-lines", "a\nb\nc", { order: "reverse" }), "c\nb\na");
{
  const shuffled = await out("sort-lines", "a\nb\nc\nd\ne", { order: "shuffle" });
  eq("shuffle keeps every line", shuffled.split("\n").sort().join(""), "abcde");
}

eq("reverse characters", await out("reverse-text", "Hello"), "olleH");
eq("reverse word order", await out("reverse-text", "one two three", { mode: "words" }), "three two one");
eq("reverse each word", await out("reverse-text", "one two", { mode: "each-word" }), "eno owt");
eq("reverse handles emoji", await out("reverse-text", "ab😀"), "😀ba");
check("palindrome detected", (await run("reverse-text", "Never odd or even")).note?.includes("palindrome"));

/* ------------------------------------------------------ find & replace -- */
group("find and replace");
eq("escapeRegExp", escapeRegExp("a.b*c"), "a\\.b\\*c");
eq("plain replace", await out("find-and-replace", "cat cat", { find: "cat", replace: "dog" }), "dog dog");
eq("first only", await out("find-and-replace", "cat cat", { find: "cat", replace: "dog", first: "1" }), "dog cat");
eq("whole words only", await out("find-and-replace", "cat category", { find: "cat", replace: "dog", word: "1" }), "dog category");
eq("case sensitive", await out("find-and-replace", "Cat cat", { find: "cat", replace: "dog", case: "1" }), "Cat dog");
eq("regex with groups", await out("find-and-replace", "2026-03-14", { find: "(\\d+)-(\\d+)-(\\d+)", replace: "$3/$2/$1", regex: "1" }), "14/03/2026");
check("invalid regex reports", (await run("find-and-replace", "x", { find: "(", regex: "1" })).error?.length > 0);
eq("dot is literal without regex", await out("find-and-replace", "a.b axb", { find: ".", replace: "-" }), "a-b axb");

/* ------------------------------------------------------------ cleaning -- */
group("cleaning and extracting");
eq("strip html", (await out("text-cleaner", "<p>Hello <b>you</b></p>")).trim(), "Hello you");
eq("drop script bodies", (await out("text-cleaner", "<script>alert(1)</script>Hi")).trim(), "Hi");
eq("smart quotes", await out("text-cleaner", "“Hi” — yes", { html: "", smart: "1", spaces: "1" }), '"Hi" - yes');
eq("strip accents", await out("text-cleaner", "café", { html: "", accents: "1", smart: "", spaces: "" }), "cafe");
eq("remove numbers", await out("text-cleaner", "a1b22c", { html: "", numbers: "1", smart: "", spaces: "" }), "abc");
eq("remove punctuation", await out("text-cleaner", "a,b.c!", { html: "", punct: "1", smart: "", spaces: "" }), "abc");

eq("extract emails", await out("text-extractor", "a@b.com and c@d.co.uk", { what: "emails", unique: "1", separator: "newline" }), "a@b.com\nc@d.co.uk");
eq("extract urls", await out("text-extractor", "see https://a.com/x and www.b.com", { what: "urls", unique: "1", separator: "newline" }), "https://a.com/x\nwww.b.com");
eq("extract ips", await out("text-extractor", "from 10.0.0.1 to 192.168.1.20", { what: "ips", unique: "1", separator: "newline" }), "10.0.0.1\n192.168.1.20");
eq("extract dedupes", await out("text-extractor", "a@b.com a@b.com", { what: "emails", unique: "1", separator: "comma" }), "a@b.com");

/* ---------------------------------------------------------------- slug -- */
group("slugs and lorem");
eq("basic slug", await out("slug-generator", "10 Ways to Improve Cash Flow!"), "10-ways-to-improve-cash-flow");
eq("slug strips accents", await out("slug-generator", "Café Crème"), "cafe-creme");
eq("slug drops stop words", await out("slug-generator", "The Best of the Year", { stop: "1" }), "best-year");
eq("slug underscore separator", await out("slug-generator", "a b c", { separator: "_" }), "a_b_c");
eq("slug drops numbers when asked", await out("slug-generator", "top 10 tips", { numbers: "" }), "top-tips");
{
  const long = await out("slug-generator", Array.from({ length: 40 }, () => "word").join(" "), { max: "30" });
  check("slug respects max length", long.length <= 30, `got ${long.length}`);
  check("slug does not end mid-word", !long.endsWith("-"), long);
}
{
  const r = await run("lorem-ipsum-generator", "", { unit: "paragraphs", count: "2", classic: "1" });
  check("lorem starts classically", r.output.startsWith("Lorem ipsum dolor sit amet"));
  eq("lorem paragraph count", r.output.split("\n\n").length, 2);
  const html = await run("lorem-ipsum-generator", "", { unit: "paragraphs", count: "2", classic: "1", html: "1" });
  check("lorem html wraps", html.output.startsWith("<p>") && html.output.endsWith("</p>"));
  const words = await run("lorem-ipsum-generator", "", { unit: "words", count: "7", classic: "1" });
  eq("lorem word count", words.output.split(" ").length, 7);
}

/* ---------------------------------------------------------------- JSON -- */
group("JSON");
eq("format json", await out("json-formatter", '{"a":1}', { indent: "2" }), '{\n  "a": 1\n}');
eq("format with tabs", await out("json-formatter", '{"a":1}', { indent: "tab" }), '{\n\t"a": 1\n}');
eq("sort keys", await out("json-formatter", '{"b":1,"a":2}', { indent: "2", sort: "1" }), '{\n  "a": 2,\n  "b": 1\n}');
eq("minify json", await out("json-minifier", '{\n  "a": [1, 2]\n}'), '{"a":[1,2]}');
check("invalid json points at the problem", /line 1|Near/.test((await run("json-formatter", '{"a":}')).error ?? ""));
{
  const valid = await run("json-validator", '{"a":{"b":[1,2]}}');
  eq("validator says valid", valid.stats[0].value, "Valid");
  eq("validator counts keys", valid.stats[2].value, "2");
  eq("validator reports depth", valid.stats[4].value, "3");
  const bad = await run("json-validator", "{oops}");
  eq("validator says invalid", bad.stats[0].value, "Invalid");
}

/* -------------------------------------------------------------- Base64 -- */
group("Base64 and URLs");
eq("base64 encode", base64Encode("Hello"), "SGVsbG8=");
eq("base64 decode", base64Decode("SGVsbG8="), "Hello");
eq("base64 round trip with unicode", base64Decode(base64Encode("héllo 😀")), "héllo 😀");
eq("base64 url-safe has no padding", base64Encode("??>", true).includes("="), false);
eq("base64 decodes url-safe", base64Decode(base64Encode("subjects?_d=1", true)), "subjects?_d=1");
eq("tool encodes", await out("base64-encoder-decoder", "Hello", { mode: "encode" }), "SGVsbG8=");
eq("tool decodes", await out("base64-encoder-decoder", "SGVsbG8=", { mode: "decode" }), "Hello");
check("bad base64 reports", (await run("base64-encoder-decoder", "!!!!", { mode: "decode" })).error?.length > 0);

eq("url encode component", await out("url-encoder-decoder", "a b&c", { mode: "encode", component: "component" }), "a%20b%26c");
eq("url encode form", await out("url-encoder-decoder", "a b", { mode: "encode", component: "form" }), "a+b");
eq("url encode whole", await out("url-encoder-decoder", "https://a.com/x y", { mode: "encode", component: "full" }), "https://a.com/x%20y");
eq("url decode", await out("url-encoder-decoder", "a%20b%26c", { mode: "decode", component: "component" }), "a b&c");
{
  const r = await run("url-parser", "https://shop.example.com:8443/uk/x?a=1&b=2#top");
  eq("parser host", r.stats[0].value, "shop.example.com");
  eq("parser param count", r.stats[1].value, "2");
  eq("parser query output", r.output, "a = 1\nb = 2");
  check("parser rejects rubbish", (await run("url-parser", "http://")).error?.length > 0);
}

/* --------------------------------------------------------------- hashes -- */
group("hashes");
// Published RFC 1321 / RFC 3174 test vectors.
eq("md5 of empty string", md5(""), "d41d8cd98f00b204e9800998ecf8427e");
eq("md5 abc", md5("abc"), "900150983cd24fb0d6963f7d28e17f72");
eq("md5 message digest", md5("message digest"), "f96b697d7cb7938d525a2f31aaf161d0");
eq("md5 alphabet", md5("abcdefghijklmnopqrstuvwxyz"), "c3fcd3d76192e4007dfb496cca67e13b");
eq("md5 long", md5("12345678901234567890123456789012345678901234567890123456789012345678901234567890"), "57edf4a22be3c955ac49da2e2107b67a");
eq("md5 handles unicode", md5("é").length, 32);
eq("crc32 of 123456789", crc32("123456789"), "cbf43926");
eq("crc32 of empty", crc32(""), "00000000");
{
  const r = await run("hash-generator", "abc");
  const rows = Object.fromEntries(r.table.rows);
  eq("sha1 abc", rows["SHA-1"], "a9993e364706816aba3e25717850c26c9cd0d89d");
  eq("sha256 abc", rows["SHA-256"], "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  eq("md5 row", rows["MD5"], "900150983cd24fb0d6963f7d28e17f72");
}

/* ----------------------------------------------------------------- UUID -- */
group("identifiers");
{
  const r = await run("uuid-generator", "", { version: "4", count: "20", hyphens: "1" });
  const ids = r.output.split("\n");
  eq("generated 20", ids.length, 20);
  check("all v4 shaped", ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
  check("all unique", new Set(ids).size === 20);
  const v7 = await run("uuid-generator", "", { version: "7", count: "5", hyphens: "1" });
  const seven = v7.output.split("\n");
  check("all v7 shaped", seven.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
  check("v7 sorts by time", [...seven].sort().join() === seven.join());
  const nohyphen = await run("uuid-generator", "", { version: "4", count: "1", hyphens: "" });
  eq("hyphens removable", nohyphen.output.length, 32);
}
{
  const r = await run("random-string-generator", "", { length: "16", count: "10", lower: "1", upper: "1", digits: "1" });
  const list = r.output.split("\n");
  eq("count", list.length, 10);
  check("length honoured", list.every((s) => s.length === 16));
  check("charset honoured", list.every((s) => /^[a-zA-Z0-9]+$/.test(s)));
  const hex = await run("random-string-generator", "", { length: "8", count: "3", hexonly: "1" });
  check("hex only", hex.output.split("\n").every((s) => /^[0-9a-f]{8}$/.test(s)));
  check("empty charset reports an error", (await run("random-string-generator", "", { length: "8", count: "1", lower: "", upper: "", digits: "", symbols: "" })).error?.length > 0);
}

/* ------------------------------------------------------------ timestamps -- */
group("timestamps");
{
  const r = await run("timestamp-converter", "1767225600", { mode: "to-date", unit: "s" });
  eq("seconds round trip", r.stats[0].value, "1767225600");
  check("iso shown", r.output.includes("2026-01-01T00:00:00.000Z"));
  const ms = await run("timestamp-converter", "1767225600000", { mode: "to-date", unit: "auto" });
  eq("milliseconds detected", ms.stats[0].value, "1767225600");
  check("bad input reports", (await run("timestamp-converter", "not a number", { mode: "to-date", unit: "auto" })).error?.length > 0);
}

/* ------------------------------------------------------------------ JWT -- */
group("JWT");
{
  const header = base64Encode(JSON.stringify({ alg: "HS256", typ: "JWT" }), true);
  const payload = base64Encode(JSON.stringify({ sub: "1234", exp: 1767225600, name: "Ada" }), true);
  const r = await run("jwt-decoder", `${header}.${payload}.sig`);
  eq("algorithm read", r.stats[0].value, "HS256");
  check("payload decoded", r.output.includes('"name": "Ada"'));
  check("rejects a non-token", (await run("jwt-decoder", "notatoken")).error?.length > 0);
}

/* ---------------------------------------------------------------- regex -- */
group("regex tester");
{
  const r = await run("regex-tester", "a1 b22 c333", { pattern: "\\d+", g: "1", u: "1" });
  eq("match count", r.stats[0].value, "3");
  eq("matches listed", r.output, "1\n22\n333");
  const groups = await run("regex-tester", "2026-03-14", { pattern: "(\\d{4})-(\\d{2})", g: "1", u: "1" });
  check("groups captured", groups.table.rows[0][2].includes("$1=2026"));
  check("invalid pattern reports", (await run("regex-tester", "x", { pattern: "(", g: "1" })).error?.length > 0);
  const zero = await run("regex-tester", "abc", { pattern: "x*", g: "1", u: "1" });
  check("zero-length matches terminate", zero.stats[0].value === "3" || zero.stats[0].value === "4");
}

/* ----------------------------------------------------------------- cron -- */
group("cron");
{
  const weekdays = parseCron("0 9 * * 1-5");
  eq("weekday hours", weekdays.hour.values.join(), "9");
  eq("weekday days", weekdays.dayOfWeek.values.join(), "1,2,3,4,5");
  check("description reads well", describeCron(weekdays).includes("Monday"));

  eq("step expands", parseCron("*/15 * * * *").minute.values.join(), "0,15,30,45");
  eq("alias expands", parseCron("@daily").hour.values.join(), "0");
  eq("names work", parseCron("0 0 * JAN MON").month.values.join(), "1");
  eq("sunday 7 maps to 0", parseCron("0 0 * * 7").dayOfWeek.values.join(), "0");

  const runs = nextCronRuns(parseCron("0 9 * * 1-5"), new Date("2026-03-14T00:00:00"), 3);
  eq("skips the weekend", runs[0].getDay(), 1);
  eq("fires at 9am", runs[0].getHours(), 9);
  eq("consecutive weekdays", runs.map((d) => d.getDay()).join(), "1,2,3");

  const monthly = nextCronRuns(parseCron("0 3 1 * *"), new Date("2026-03-14T00:00:00"), 2);
  eq("first of the month", monthly.map((d) => d.getDate()).join(), "1,1");

  let threw = false;
  try { parseCron("0 9 * *"); } catch { threw = true; }
  check("too few fields throws", threw);
  threw = false;
  try { parseCron("99 9 * * *"); } catch { threw = true; }
  check("out of range throws", threw);
}

/* ----------------------------------------------------------------- diff -- */
group("diff");
{
  const d = diffLines(["a", "b", "c"], ["a", "x", "c"]);
  eq("diff length", d.length, 4);
  eq("diff shape", d.map((x) => x.tone).join(), "same,remove,add,same");
  eq("identical files have no changes", diffLines(["a"], ["a"]).filter((x) => x.tone !== "same").length, 0);
  eq("pure insert", diffLines(["a", "c"], ["a", "b", "c"]).filter((x) => x.tone === "add").length, 1);
  const r = await run("text-diff-checker", "a\nb", { other: "a\nc", trim: "1", context: "1" });
  eq("tool added count", r.stats[0].value, "+1");
  eq("tool removed count", r.stats[1].value, "-1");
}

/* -------------------------------------------------------------- entities -- */
group("HTML entities");
eq("minimal encode", encodeHtmlEntities('<a href="x">&', "minimal"), "&lt;a href=&quot;x&quot;&gt;&amp;");
eq("named encode", encodeHtmlEntities("© 50%", "named"), "&copy; 50%");
eq("numeric encode", encodeHtmlEntities("<©", "numeric"), "&#60;&#169;");
eq("decode named", decodeHtmlEntities("&lt;b&gt;&amp;&copy;"), "<b>&©");
eq("decode numeric", decodeHtmlEntities("&#60;&#x3E;"), "<>");
eq("round trip", decodeHtmlEntities(encodeHtmlEntities("<p>Tom & Jerry</p>", "minimal")), "<p>Tom & Jerry</p>");
eq("unknown entity left alone", decodeHtmlEntities("&notreal;"), "&notreal;");

/* ------------------------------------------------------------------ CSS -- */
group("CSS, XML, SQL");
eq("minify css", minifyCss("a { color : red ; }"), "a{color:red}");
eq("css comments removed", minifyCss("/* hi */a{b:c}"), "a{b:c}");
eq("css preserves strings", minifyCss('a{content:"x  y"}'), 'a{content:"x  y"}');
eq("css media query", minifyCss("@media (max-width: 640px) { a { b: c } }"), "@media (max-width:640px){a{b:c}}");
eq("css important", minifyCss("a{b:c !important}"), "a{b:c!important}");

eq("minify xml", minifyMarkup("<a>\n  <b>1</b>\n</a>"), "<a><b>1</b></a>");
eq("xml comments dropped", minifyMarkup("<a><!-- x --><b/></a>"), "<a><b/></a>");
{
  const formatted = formatXml("<a><b>1</b><c/></a>");
  eq("xml indented", formatted, "<a>\n  <b>1</b>\n  <c/>\n</a>");
  eq("declaration kept", formatXml('<?xml version="1.0"?><a/>'), '<?xml version="1.0"?>\n<a/>');
  eq("attributes with > survive", formatXml('<a t="x>y"><b/></a>'), '<a t="x>y">\n  <b/>\n</a>');
}

{
  const sql = formatSql("select a, b from t where x = 1 and y = 2");
  check("sql uppercases keywords", sql.startsWith("SELECT"));
  check("sql breaks on FROM", sql.includes("\nFROM"));
  check("sql indents AND", sql.includes("\n  AND"));
  eq("sql keeps string contents", formatSql("select * from t where a = 'from where and'").includes("'from where and'"), true);
  eq("sql lowercase option", formatSql("SELECT a FROM t", false).startsWith("select"), true);
  eq("sql tokeniser handles doubled quotes", tokeniseSql("select 'it''s'").filter((t) => t.type === "string")[0].value, "'it''s'");
}

/* ------------------------------------------------- prettier and terser -- */
group("library-backed formatters");
{
  const js = await out("javascript-formatter", "const a={b:1,c:[1,2,3]};function x(){return a}", { width: "80", indent: "2", semi: "1" });
  eq("javascript formatted", js, "const a = { b: 1, c: [1, 2, 3] };\nfunction x() {\n  return a;\n}\n");
  const noSemi = await out("javascript-formatter", "const a = 1", { width: "80", indent: "2", semi: "" });
  eq("semicolons optional", noSemi, "const a = 1\n");
  check("invalid javascript reports", (await run("javascript-formatter", "function (", { width: "80", indent: "2" })).error?.length > 0);

  const css = await out("css-formatter", "a{color:red;background:blue}", { indent: "2" });
  eq("css formatted", css, "a {\n  color: red;\n  background: blue;\n}\n");

  // Prettier keeps short elements on one line, so use a document that must wrap.
  const html = await out("html-formatter", "<!doctype html><html><body><header><h1>Invoice 1042</h1></header><table><tr><td>Espresso</td><td>12</td></tr></table></body></html>", { width: "80", indent: "2" });
  check("html indented over several lines", html.split("\n").length > 5, JSON.stringify(html));
  check("html indentation applied", html.includes("\n  <body>") || html.includes("\n  <head>"), JSON.stringify(html));
  const again = await out("html-formatter", html, { width: "80", indent: "2" });
  eq("html formatting is stable", again, html);

  const min = await run("javascript-minifier", "function hello(name){ const greeting = 'hi ' + name; return greeting } console.log(hello('x'))", { mangle: "1", compress: "1" });
  check("javascript minified", min.output.length > 0 && min.output.length < 70, min.output);
  check("minifier renames locals", !min.output.includes("greeting"), min.output);
  check("broken javascript reports", (await run("javascript-minifier", "function (", { mangle: "1" })).error?.length > 0);
}

/* ------------------------------------------------------------------ SEO -- */
group("SEO generators");
eq("escapes the five HTML characters", esc(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
eq("adds a missing protocol", safeHttpUrl("example.com/x"), "https://example.com/x");
eq("keeps http", safeHttpUrl("http://example.com"), "http://example.com");
eq("rejects javascript URLs", safeHttpUrl("javascript:alert(1)"), "");
eq("rejects data URLs", safeHttpUrl("data:text/html,<script>"), "");
eq("empty stays empty", safeHttpUrl("   "), "");

{
  const r = await run("meta-tag-generator", "", {
    title: "My Page", description: "A description that is long enough to be useful to a reader.",
    url: "https://example.com/p", robots: "index, follow", viewport: "1", charset: "1",
  });
  check("meta includes a title tag", r.output.includes("<title>My Page</title>"));
  check("meta includes the description", r.output.includes('name="description"'));
  check("meta includes the canonical", r.output.includes('<link rel="canonical" href="https://example.com/p" />'));
  eq("meta preview is a SERP", r.preview.kind, "serp");
  eq("meta preview title", r.preview.title, "My Page");

  const injected = await run("meta-tag-generator", "", { title: 'Evil" onload="x', description: "d".repeat(80) });
  check("meta escapes a quote in the title", !injected.output.includes('Evil" onload='), injected.output.slice(0, 120));
  check("meta escapes into an entity", injected.output.includes("&quot;"));

  const longTitle = await run("meta-tag-generator", "", { title: "x".repeat(80), description: "d".repeat(80) });
  check("meta warns about a long title", (longTitle.warning ?? "").includes("80 characters"));
}
{
  const r = await run("open-graph-generator", "", {
    title: "Title", description: "Desc", url: "https://example.com", image: "https://example.com/og.png",
    type: "website", twitter: "1", siteName: "Site", locale: "en_GB",
  });
  check("og title tag", r.output.includes('<meta property="og:title" content="Title" />'));
  check("og image dimensions are added", r.output.includes('og:image:width" content="1200"'));
  check("twitter block included", r.output.includes('name="twitter:card" content="summary_large_image"'));
  eq("og preview is a social card", r.preview.kind, "social");
  const noImage = await run("open-graph-generator", "", { title: "T", description: "D", url: "https://example.com", image: "", twitter: "" });
  check("og warns when there is no image", Boolean(noImage.warning));
  check("og omits the image tag entirely", !noImage.output.includes("og:image"));
}
{
  const r = await run("twitter-card-generator", "", { card: "summary", title: "T", description: "D", site: "businesstoolkit", creator: "", image: "" });
  check("twitter adds the @ to a handle", r.output.includes('content="@businesstoolkit"'), r.output);
  check("twitter omits an empty creator", !r.output.includes("twitter:creator"));
}
{
  const block = await run("robots-txt-generator", "", { preset: "block" });
  check("block preset disallows everything", block.output.includes("User-agent: *\nDisallow: /"), block.output);
  check("block preset warns", Boolean(block.warning));

  const allow = await run("robots-txt-generator", "", { preset: "allow", sitemap: "https://example.com/sitemap.xml" });
  check("allow preset permits everything", allow.output.includes("Disallow:\n"), allow.output);
  check("sitemap line added", allow.output.includes("Sitemap: https://example.com/sitemap.xml"));

  const ai = await run("robots-txt-generator", "", { preset: "ai" });
  check("ai preset blocks GPTBot", ai.output.includes("User-agent: GPTBot"));
  check("ai preset blocks ClaudeBot", ai.output.includes("User-agent: ClaudeBot"));

  const custom = await run("robots-txt-generator", "admin\n/cart", { preset: "custom", agent: "*", sitemap: "" });
  check("paths get a leading slash", custom.output.includes("Disallow: /admin"), custom.output);
  check("existing slashes are kept", custom.output.includes("Disallow: /cart"));
}
{
  const r = await run("sitemap-generator", "https://example.com/\nhttps://example.com/about\nhttps://example.com/about", {
    changefreq: "weekly", priority: "0.8", lastmod: "2026-01-31", homeFirst: "1",
  });
  check("sitemap declares the namespace", r.output.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  eq("sitemap dedupes", r.stats[0].value, "2");
  eq("sitemap counts the duplicate", r.stats[1].value, "1");
  check("sitemap gives the root priority 1.0", r.output.includes("<priority>1.0</priority>"));
  check("sitemap includes lastmod", r.output.includes("<lastmod>2026-01-31</lastmod>"));
  const hostile = await run("sitemap-generator", "javascript:alert(1)", {});
  check("sitemap drops a javascript URL", !(hostile.output ?? "").includes("javascript"), hostile.output ?? hostile.note);
}
{
  const r = await run("utm-link-builder", "", {
    url: "https://example.com/pricing", source: "Newsletter", medium: "Email", campaign: "Spring_Sale", lower: "1",
  });
  eq("utm link", r.output, "https://example.com/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale");
  const cased = await run("utm-link-builder", "", { url: "https://example.com", source: "Newsletter", medium: "Email", campaign: "X", lower: "" });
  check("casing preserved when asked", cased.output.includes("utm_source=Newsletter"), cased.output);
  const missing = await run("utm-link-builder", "", { url: "https://example.com", source: "", medium: "", campaign: "" });
  check("utm warns about missing parameters", (missing.warning ?? "").includes("source"));
}
{
  const r = await run("keyword-density-checker", "invoice generator free invoice generator online invoice", {
    length: "1", top: "30", stop: "1", focus: "invoice",
  });
  check("density finds the focus keyword", r.stats[2].value !== "0.00%", r.stats[2].value);
  const phrases = await run("keyword-density-checker", "invoice generator free invoice generator online", {
    length: "2", top: "30", stop: "", focus: "invoice generator",
  });
  eq("two-word phrase counted twice", phrases.table.rows[0][1], "2");
  const stuffed = await run("keyword-density-checker", "seo seo seo seo seo something", { length: "1", top: "10", stop: "1", focus: "seo" });
  check("density warns about stuffing", (stuffed.warning ?? "").includes("stuffing"));
  const absent = await run("keyword-density-checker", "nothing relevant here at all", { length: "1", top: "10", stop: "1", focus: "missing" });
  check("density flags an absent keyword", (absent.warning ?? "").includes("does not appear"));
}
{
  const r = await run("canonical-tag-generator", "", { url: "example.com/pricing", header: "1" });
  check("canonical adds the protocol", r.output.includes('href="https://example.com/pricing"'));
  check("canonical header form", r.output.includes('Link: <https://example.com/pricing>; rel="canonical"'));
  const evil = await run("canonical-tag-generator", "", { url: "javascript:alert(1)" });
  check("canonical refuses a javascript URL", !(evil.output ?? "").includes("javascript"), evil.output ?? evil.note);
}
{
  const r = await run("hreflang-tag-generator", "en-GB https://example.com/\nfr-FR https://example.com/fr/", {
    xdefault: "https://example.com/",
  });
  check("hreflang tag for en-GB", r.output.includes('hreflang="en-GB" href="https://example.com/"'));
  check("hreflang includes x-default", r.output.includes('hreflang="x-default"'));
  eq("hreflang counts languages", r.stats[0].value, "2");
  const bad = await run("hreflang-tag-generator", "nonsense-line-without-a-url", { xdefault: "" });
  check("hreflang flags a bad line", Boolean(bad.warning) || Boolean(bad.note));
}
{
  const faq = await run("schema-markup-generator", "Q: Is it free?\nA: Yes it is.", { type: "FAQPage" });
  const json = faq.output.replace(/^<script[^>]*>\n/, "").replace(/\n<\/script>$/, "");
  const parsed = JSON.parse(json);
  eq("faq schema type", parsed["@type"], "FAQPage");
  eq("faq question count", parsed.mainEntity.length, 1);
  eq("faq question text", parsed.mainEntity[0].name, "Is it free?");
  eq("faq answer text", parsed.mainEntity[0].acceptedAnswer.text, "Yes it is.");

  const product = await run("schema-markup-generator", "", {
    type: "Product", name: "Espresso blend", price: "18.50", currency: "GBP", url: "https://example.com/p", sku: "ESP",
  });
  const productJson = JSON.parse(product.output.replace(/^<script[^>]*>\n/, "").replace(/\n<\/script>$/, ""));
  eq("product schema type", productJson["@type"], "Product");
  eq("product price", productJson.offers.price, "18.50");
  eq("product currency", productJson.offers.priceCurrency, "GBP");

  const org = await run("schema-markup-generator", "", { type: "Organization", name: "Acme", url: "https://acme.test", phone: "+44 20 7946 0958" });
  const orgJson = JSON.parse(org.output.replace(/^<script[^>]*>\n/, "").replace(/\n<\/script>$/, ""));
  eq("organization contact point", orgJson.contactPoint.telephone, "+44 20 7946 0958");

  const empty = await run("schema-markup-generator", "no pairs here", { type: "FAQPage" });
  check("faq schema reports missing pairs", Boolean(empty.error));

  const local = await run("schema-markup-generator", "", {
    type: "LocalBusiness", name: "Harbour Coffee", street: "12 Harbour Road", city: "Bristol", postcode: "BS1 4XX", country: "GB",
  });
  const localJson = JSON.parse(local.output.replace(/^<script[^>]*>\n/, "").replace(/\n<\/script>$/, ""));
  eq("local business address", localJson.address.addressLocality, "Bristol");
}

/* -------------------------------------------------------------- registry -- */
group("registry");
check("every text tool slug is in the catalog",
  textToolSlugs.every((s) => toolSlugs.includes(s)),
  textToolSlugs.filter((s) => !toolSlugs.includes(s)).join(", "));
check("every text/developer catalog entry has a definition",
  tools.filter((t) => ["text", "developer"].includes(t.category)).every((t) => textToolSlugs.includes(t.slug)),
  tools.filter((t) => ["text", "developer"].includes(t.category) && !textToolSlugs.includes(t.slug)).map((t) => t.slug).join(", "));

/* A tool that is not marked `deferred` renders during the server pass, so it
   must be synchronous and give the same answer every time. */
for (const slug of textToolSlugs) {
  const def = TEXT_TOOL_DEFS[slug];
  if (def.deferred) continue;
  const sample = "Alpha beta 42.\nGamma delta, epsilon!\n\nZeta.";
  const first = runTextTool(def, sample);
  check(`${slug} is synchronous`, !(first instanceof Promise));
  const second = runTextTool(def, sample);
  check(
    `${slug} is deterministic`,
    JSON.stringify(first) === JSON.stringify(second),
    "two runs disagreed, so it cannot be server-rendered — mark it deferred",
  );
}

/* And the reverse: anything asynchronous must be marked, or the server would
   render an empty result that never fills in. */
for (const slug of textToolSlugs) {
  const def = TEXT_TOOL_DEFS[slug];
  const produced = runTextTool(def, "x = 1;");
  if (produced instanceof Promise) {
    await produced.catch(() => {});
    check(`${slug} is marked deferred because it is async`, Boolean(def.deferred));
  }
}

/* Every definition must survive empty input and its own defaults. */
for (const slug of textToolSlugs) {
  const def = TEXT_TOOL_DEFS[slug];
  let ok = true;
  try {
    const r = await runTextTool(def, "");
    ok = r && typeof r === "object";
  } catch (err) {
    ok = false;
    console.log("   ", slug, err.message);
  }
  check(`${slug} handles empty input`, ok);
}
for (const slug of textToolSlugs) {
  const def = TEXT_TOOL_DEFS[slug];
  let ok = true;
  try {
    await runTextTool(def, "The quick brown fox.\nLine two, with 42 numbers & <tags>.\n\nA paragraph.");
  } catch (err) {
    ok = false;
    console.log("   ", slug, err.message);
  }
  check(`${slug} handles ordinary text`, ok);
}
check("every text tool has a sensible option set",
  textToolSlugs.every((s) => (TEXT_TOOL_DEFS[s].options ?? []).every((o) => o.key && o.label && o.type)));

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
