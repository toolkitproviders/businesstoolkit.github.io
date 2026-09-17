/**
 * Colour maths and the design tools.
 *
 * The conversions and contrast figures below are checked against published
 * values rather than against whatever the code happens to produce.
 */
import {
  parseColor, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, rgbToCmyk,
  relativeLuminance, contrastRatio, wcagVerdict, readableTextColor,
  mix, tints, shades, harmony, rotateHue, formatRgb, formatHsl,
  nearestNamedColor,
} from "../src/features/design/color.ts";
import { DESIGN_TOOL_DEFS, designToolSlugs } from "../src/features/design/defs/index.ts";
import { runDesignTool } from "../src/features/design/types.ts";
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
const near = (name, actual, expected, tolerance = 0.01) =>
  check(name, Math.abs(actual - expected) <= tolerance, `got ${actual} want ~${expected}`);
const group = (title) => console.log(`\n${title}`);

const BLACK = { r: 0, g: 0, b: 0, a: 1 };
const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const RED = { r: 255, g: 0, b: 0, a: 1 };

/* --------------------------------------------------------------- parsing -- */
group("parsing");
eq("three-digit hex expands", JSON.stringify(parseColor("#fff")), JSON.stringify(WHITE));
eq("six-digit hex", JSON.stringify(parseColor("#1a2b3c")), JSON.stringify({ r: 26, g: 43, b: 60, a: 1 }));
eq("hex without a hash", JSON.stringify(parseColor("1a2b3c")), JSON.stringify({ r: 26, g: 43, b: 60, a: 1 }));
eq("uppercase hex", JSON.stringify(parseColor("#FF0000")), JSON.stringify(RED));
eq("eight-digit hex reads alpha", parseColor("#ff000080").a.toFixed(2), "0.50");
eq("four-digit hex reads alpha", parseColor("#f008").a.toFixed(2), "0.53");
eq("rgb()", JSON.stringify(parseColor("rgb(255, 0, 0)")), JSON.stringify(RED));
eq("rgb() with spaces only", JSON.stringify(parseColor("rgb(255 0 0)")), JSON.stringify(RED));
eq("rgba()", parseColor("rgba(0, 0, 0, 0.5)").a, 0.5);
eq("hsl() red", JSON.stringify(parseColor("hsl(0, 100%, 50%)")), JSON.stringify(RED));
eq("hsl() green", JSON.stringify(parseColor("hsl(120, 100%, 25.1%)")), JSON.stringify({ r: 0, g: 128, b: 0, a: 1 }));
eq("named colour", JSON.stringify(parseColor("navy")), JSON.stringify({ r: 0, g: 0, b: 128, a: 1 }));
eq("named colour is case insensitive", JSON.stringify(parseColor("  NAVY ")), JSON.stringify({ r: 0, g: 0, b: 128, a: 1 }));
eq("rubbish returns null", parseColor("not a colour"), null);
eq("empty returns null", parseColor(""), null);
eq("five-digit hex returns null", parseColor("#12345"), null);
eq("hex with a stray letter returns null", parseColor("#12zz34"), null);

/* ----------------------------------------------------------- conversions -- */
group("conversions");
eq("rgb to hex", rgbToHex({ r: 26, g: 43, b: 60, a: 1 }), "#1a2b3c");
eq("rgb to hex pads single digits", rgbToHex({ r: 0, g: 8, b: 15, a: 1 }), "#00080f");
eq("hex keeps alpha when asked", rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 }, true), "#ff000080");
eq("hex drops alpha when opaque", rgbToHex({ r: 255, g: 0, b: 0, a: 1 }, true), "#ff0000");

{
  const hsl = rgbToHsl(RED);
  eq("red hue", hsl.h, 0);
  eq("red saturation", hsl.s, 100);
  eq("red lightness", hsl.l, 50);
}
{
  const hsl = rgbToHsl({ r: 0, g: 128, b: 0, a: 1 });
  eq("green hue", hsl.h, 120);
  near("green lightness", hsl.l, 25.1, 0.15);
}
{
  const grey = rgbToHsl({ r: 128, g: 128, b: 128, a: 1 });
  eq("grey has no saturation", grey.s, 0);
}
eq("hsl round trip", rgbToHex(hslToRgb(rgbToHsl({ r: 37, g: 99, b: 235, a: 1 }))), "#2563eb");
{
  const hsv = rgbToHsv(RED);
  eq("red hsv", `${hsv.h},${hsv.s},${hsv.v}`, "0,100,100");
}
{
  const cmyk = rgbToCmyk(RED);
  eq("red cmyk", `${cmyk.c},${cmyk.m},${cmyk.y},${cmyk.k}`, "0,100,100,0");
  const black = rgbToCmyk(BLACK);
  eq("black cmyk", `${black.c},${black.m},${black.y},${black.k}`, "0,0,0,100");
  const white = rgbToCmyk(WHITE);
  eq("white cmyk", `${white.c},${white.m},${white.y},${white.k}`, "0,0,0,0");
}
eq("formatRgb", formatRgb(RED), "rgb(255, 0, 0)");
eq("formatRgb with alpha", formatRgb({ ...RED, a: 0.5 }), "rgba(255, 0, 0, 0.5)");
eq("formatHsl", formatHsl(RED), "hsl(0, 100%, 50%)");

/* -------------------------------------------------------------- contrast -- */
group("contrast");
eq("white luminance", relativeLuminance(WHITE), 1);
eq("black luminance", relativeLuminance(BLACK), 0);
near("red luminance", relativeLuminance(RED), 0.2126, 0.0001);
near("black on white is 21", contrastRatio(BLACK, WHITE), 21, 0.001);
near("contrast is symmetric", contrastRatio(WHITE, BLACK), 21, 0.001);
eq("a colour against itself is 1", contrastRatio(RED, RED).toFixed(2), "1.00");
near("red on white", contrastRatio(RED, WHITE), 3.998, 0.01);
near("blue on white", contrastRatio({ r: 0, g: 0, b: 255, a: 1 }, WHITE), 8.592, 0.01);
{
  const v = wcagVerdict(BLACK, WHITE);
  check("black on white passes AAA", v.aaaNormal && v.aaNormal && v.uiComponents);
  const bad = wcagVerdict({ r: 200, g: 200, b: 200, a: 1 }, WHITE);
  check("light grey on white fails everything", !bad.aaLarge && !bad.aaNormal);
  const mid = wcagVerdict({ r: 117, g: 117, b: 117, a: 1 }, WHITE);
  check("mid grey passes AA body but not AAA", mid.aaNormal && !mid.aaaNormal, `${mid.ratio.toFixed(2)}`);
}
eq("readable text on white", readableTextColor(WHITE), "#000000");
eq("readable text on black", readableTextColor(BLACK), "#ffffff");
eq("readable text on navy", readableTextColor({ r: 10, g: 22, b: 49, a: 1 }), "#ffffff");

/* ----------------------------------------------------------- adjustments -- */
group("adjustments and harmonies");
eq("mixing black and white halfway", rgbToHex(mix(BLACK, WHITE, 0.5)), "#808080");
eq("mixing with 0 returns the first", rgbToHex(mix(RED, WHITE, 0)), "#ff0000");
eq("mixing with 1 returns the second", rgbToHex(mix(RED, WHITE, 1)), "#ffffff");
eq("tints count", tints(RED, 4).length, 4);
eq("shades count", shades(RED, 4).length, 4);
check("tints get lighter", rgbToHsl(tints(RED, 3)[2]).l > rgbToHsl(tints(RED, 3)[0]).l);
check("shades get darker", rgbToHsl(shades(RED, 3)[2]).l < rgbToHsl(shades(RED, 3)[0]).l);
eq("rotating red by 180 gives cyan", rgbToHex(rotateHue(RED, 180)), "#00ffff");
eq("rotating by 360 is a no-op", rgbToHex(rotateHue(RED, 360)), "#ff0000");
eq("complementary has two colours", harmony(RED, "complementary").length, 2);
eq("triadic has three", harmony(RED, "triadic").length, 3);
eq("tetradic has four", harmony(RED, "tetradic").length, 4);
eq("analogous has five", harmony(RED, "analogous").length, 5);
{
  const triad = harmony(RED, "triadic").map((c) => rgbToHsl(c).h);
  eq("triadic hues are 120 apart", triad.join(), "0,120,240");
}
eq("nearest name for pure red", nearestNamedColor(RED).name, "red");
eq("nearest name for near-white", nearestNamedColor({ r: 253, g: 253, b: 253, a: 1 }).name, "white");

/* ------------------------------------------------------------ design defs -- */
group("design tools");
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["color-converter"], { value: "#2563eb" });
  const rows = Object.fromEntries(r.rows.map((x) => [x.label, x.value]));
  eq("converter hex", rows.HEX, "#2563eb");
  eq("converter rgb", rows.RGB, "rgb(37, 99, 235)");
  check("converter offers a CSS variable block", r.code[0].value.includes("--brand: #2563eb"));
  check("converter rejects rubbish", Boolean(runDesignTool(DESIGN_TOOL_DEFS["color-converter"], { value: "zzz" }).error));
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["contrast-checker"], { fg: "#000000", bg: "#ffffff" });
  eq("contrast tool ratio", r.stats[0].value, "21.00:1");
  check("contrast tool lists all five levels", r.rows.length === 5);
  check("contrast tool passes AAA", r.rows[2].value.startsWith("Pass"));
  const failing = runDesignTool(DESIGN_TOOL_DEFS["contrast-checker"], { fg: "#cccccc", bg: "#ffffff" });
  check("contrast tool warns on a failure", Boolean(failing.warning));
  check("contrast tool suggests a fix", (failing.note ?? "").includes("#"), failing.note);
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["color-palette-generator"], { base: "#ff0000", harmony: "complementary" });
  eq("palette size", r.swatches.length, 2);
  eq("palette keeps the base first", r.swatches[0].color, "#ff0000");
  eq("palette complement", r.swatches[1].color, "#00ffff");
  eq("complementary labels the base", r.swatches[0].label, "Base");
}
{
  // Analogous centres the base colour, so the label must follow the colour.
  const r = runDesignTool(DESIGN_TOOL_DEFS["color-palette-generator"], { base: "#2563eb", harmony: "analogous" });
  eq("analogous has five swatches", r.swatches.length, 5);
  eq("analogous labels the middle swatch as the base", r.swatches[2].label, "Base");
  eq("analogous base colour is unchanged", r.swatches[2].color, "#2563eb");
  check("no other swatch claims to be the base", r.swatches.filter((s) => s.label === "Base").length === 1);
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["color-shades-generator"], { base: "#0ea5e9", mode: "scale" });
  eq("scale has eleven steps", r.swatches.length, 11);
  eq("scale midpoint is the base", r.swatches[5].color, "#0ea5e9");
  eq("scale starts pale", r.swatches[0].label, "50");
  check("scale gets darker", rgbToHsl(parseColor(r.swatches[10].color)).l < rgbToHsl(parseColor(r.swatches[0].color)).l);
  check("scale offers a Tailwind block", r.code.some((c) => c.value.includes("--color-brand-500")));
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["gradient-generator"], {
    type: "linear", angle: "90", c1: "#ff0000", p1: "0", c2: "#0000ff", p2: "100", third: "",
  });
  eq("gradient css", r.code[0].value, "background: linear-gradient(90deg, #ff0000 0%, #0000ff 100%);");
  const radial = runDesignTool(DESIGN_TOOL_DEFS["gradient-generator"], {
    type: "radial", shape: "circle", c1: "#ff0000", p1: "0", c2: "#0000ff", p2: "100", third: "",
  });
  check("radial gradient css", radial.code[0].value.includes("radial-gradient(circle at center"));
  const three = runDesignTool(DESIGN_TOOL_DEFS["gradient-generator"], {
    type: "linear", angle: "45", c1: "#ff0000", p1: "0", c2: "#0000ff", p2: "100", third: "1", c3: "#00ff00", p3: "50",
  });
  check("third stop lands in the middle", three.code[0].value.includes("#00ff00 50%, #0000ff 100%"), three.code[0].value);
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["box-shadow-generator"], {
    x: "0", y: "8", blur: "24", spread: "-4", color: "#000000", opacity: "20", inset: "",
  });
  eq("box shadow css", r.code[0].value, "box-shadow: 0px 8px 24px -4px rgba(0, 0, 0, 0.2);");
  const inset = runDesignTool(DESIGN_TOOL_DEFS["box-shadow-generator"], {
    x: "0", y: "2", blur: "4", spread: "0", color: "#000000", opacity: "100", inset: "1",
  });
  check("inset keyword comes first", inset.code[0].value.startsWith("box-shadow: inset 0px 2px"), inset.code[0].value);
  check("full opacity uses hex", inset.code[0].value.includes("#000000"));
}
{
  const linked = runDesignTool(DESIGN_TOOL_DEFS["border-radius-generator"], { linked: "1", unit: "px", all: "12" });
  eq("linked radius", linked.code[0].value, "border-radius: 12px;");
  const corners = runDesignTool(DESIGN_TOOL_DEFS["border-radius-generator"], {
    linked: "", unit: "px", tl: "24", tr: "4", br: "24", bl: "4",
  });
  eq("four corners clockwise", corners.code[0].value, "border-radius: 24px 4px 24px 4px;");
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["button-generator"], { label: "Buy <now>", bg: "#0a1631", fg: "#ffffff" });
  const html = r.code.find((c) => c.label === "HTML").value;
  check("button label is escaped", html.includes("Buy &lt;now&gt;"), html);
  check("button css has a hover state", r.code[0].value.includes(".button:hover"));
  const lowContrast = runDesignTool(DESIGN_TOOL_DEFS["button-generator"], { bg: "#ffffff", fg: "#ffffff" });
  check("button warns about unreadable text", Boolean(lowContrast.warning));
}
{
  const r = runDesignTool(DESIGN_TOOL_DEFS["random-color-generator"], { count: "8", style: "pleasant" });
  eq("random colour count", r.swatches.length, 8);
  check("random colours are valid hex", r.swatches.every((s) => /^#[0-9a-f]{6}$/.test(s.color)));
  const grey = runDesignTool(DESIGN_TOOL_DEFS["random-color-generator"], { count: "6", style: "grey" });
  check("greyscale really is grey", grey.swatches.every((s) => {
    const c = parseColor(s.color);
    return c.r === c.g && c.g === c.b;
  }));
}

/* Every definition must survive its own defaults, and the ones that are not
   marked deferred have to be deterministic so they can be server-rendered. */
for (const slug of designToolSlugs) {
  const def = DESIGN_TOOL_DEFS[slug];
  let ok = true;
  try {
    const r = runDesignTool(def);
    ok = r && typeof r === "object";
  } catch (err) {
    ok = false;
    console.log("   ", slug, err.message);
  }
  check(`${slug} runs with its defaults`, ok);

  if (!def.deferred) {
    check(
      `${slug} is deterministic`,
      JSON.stringify(runDesignTool(def)) === JSON.stringify(runDesignTool(def)),
      "two runs disagreed, so it cannot be server-rendered — mark it deferred",
    );
  }
}

/* An unreadable colour must never crash a tool, only be reported. */
for (const slug of designToolSlugs) {
  const def = DESIGN_TOOL_DEFS[slug];
  const values = {};
  for (const field of def.fields) if (field.type === "color") values[field.key] = "not-a-colour";
  let ok = true;
  try {
    runDesignTool(def, values);
  } catch (err) {
    ok = false;
    console.log("   ", slug, err.message);
  }
  check(`${slug} survives an unreadable colour`, ok);
}

/* -------------------------------------------------------------- registry -- */
group("registry");
check("every design slug is in the catalog",
  designToolSlugs.every((s) => toolSlugs.includes(s)),
  designToolSlugs.filter((s) => !toolSlugs.includes(s)).join(", "));
check("every design catalog entry has a definition",
  tools.filter((t) => t.category === "design").every((t) => designToolSlugs.includes(t.slug)),
  tools.filter((t) => t.category === "design" && !designToolSlugs.includes(t.slug)).map((t) => t.slug).join(", "));

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
