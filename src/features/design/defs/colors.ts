import { randomInt } from "@/lib/random";
import type { DesignResult, DesignToolDef } from "../types";
import {
  contrastRatio,
  formatCmyk,
  formatHsl,
  formatHsv,
  formatRgb,
  harmony,
  HARMONY_LABELS,
  hslToRgb,
  mix,
  nearestNamedColor,
  randomPleasantColor,
  readableTextColor,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
  shades,
  tints,
  wcagVerdict,
  type HarmonyName,
  type Rgb,
} from "../color";

/** Colour tools: converting, picking, palettes and contrast. */

const BLACK: Rgb = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };

const pct = (value: number) => `${value.toFixed(1)}%`;

function formatsOf(color: Rgb) {
  return [
    { label: "HEX", value: rgbToHex(color) },
    { label: "HEX + alpha", value: rgbToHex(color, true) },
    { label: "RGB", value: formatRgb(color) },
    { label: "HSL", value: formatHsl(color) },
    { label: "HSV", value: formatHsv(color) },
    { label: "CMYK", value: formatCmyk(color) },
  ];
}

/* ------------------------------------------------------- colour converter -- */

export const colorConverter: DesignToolDef = {
  controlsTitle: "Your colour",
  controlsDescription: "Type a hex, rgb(), hsl() or a CSS colour name.",
  resultTitle: "Every format",
  fields: [
    { key: "value", label: "Colour", type: "color", initial: "#2563eb", wide: true },
  ],
  compute: (_values, h) => {
    if (!h.colorValid("value")) {
      return { error: "That is not a colour this browser can read. Try #2563eb, rgb(37 99 235) or “navy”." };
    }
    const color = h.color("value");
    const hsl = rgbToHsl(color);
    const near = nearestNamedColor(color);
    const luminance = relativeLuminance(color);

    return {
      preview: { kind: "box", style: { backgroundColor: rgbToHex(color, true), width: "100%", height: "7rem", borderRadius: "0.5rem" } },
      rows: formatsOf(color),
      stats: [
        { label: "Luminance", value: luminance.toFixed(4), sub: "0 is black, 1 is white" },
        {
          label: "On white",
          value: `${contrastRatio(color, WHITE).toFixed(2)}:1`,
          tone: contrastRatio(color, WHITE) >= 4.5 ? "success" : "warning",
        },
        {
          label: "On black",
          value: `${contrastRatio(color, BLACK).toFixed(2)}:1`,
          tone: contrastRatio(color, BLACK) >= 4.5 ? "success" : "warning",
        },
      ],
      swatches: [
        ...shades(color, 2).reverse().map((c, i) => ({ label: `Darker ${i + 1}`, color: rgbToHex(c) })),
        { label: "Your colour", color: rgbToHex(color) },
        ...tints(color, 2).map((c, i) => ({ label: `Lighter ${i + 1}`, color: rgbToHex(c) })),
      ],
      note:
        near.distance < 24
          ? `Close to the CSS keyword “${near.name}” (${near.hex}).`
          : `Hue ${hsl.h}°, saturation ${pct(hsl.s)}, lightness ${pct(hsl.l)}.`,
      code: [
        {
          label: "CSS custom property",
          value: `:root {\n  --brand: ${rgbToHex(color)};\n  --brand-rgb: ${color.r} ${color.g} ${color.b};\n}`,
          extension: "css",
        },
      ],
    } satisfies DesignResult;
  },
  notes: [
    { label: "HEX", formula: "#RRGGBB — two hex digits per channel, 00 to FF" },
    { label: "HSL", formula: "hue 0–360°, saturation and lightness 0–100%", note: "Easier to adjust by hand than RGB." },
    { label: "CMYK", formula: "Subtractive ink percentages, for print rather than screens" },
  ],
};

/* ---------------------------------------------------------- colour picker -- */

export const colorPicker: DesignToolDef = {
  controlsTitle: "Pick a colour",
  controlsDescription:
    "Use the swatch to open your system picker, or the pipette to lift a colour from anywhere on screen.",
  resultTitle: "Your colour",
  fields: [{ key: "value", label: "Colour", type: "color", initial: "#14b8a6", wide: true }],
  compute: (_values, h) => {
    const color = h.color("value");
    const hex = rgbToHex(color);
    const text = readableTextColor(color);

    return {
      preview: {
        kind: "box",
        style: {
          backgroundColor: hex,
          width: "100%",
          height: "9rem",
          borderRadius: "0.5rem",
          color: text,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "1.25rem",
          fontWeight: 600,
        },
        label: hex,
      },
      rows: [
        { label: "HEX", value: hex },
        { label: "RGB", value: formatRgb(color) },
        { label: "HSL", value: formatHsl(color) },
        { label: "Readable text", value: text },
      ],
      stats: [
        {
          label: "Text on this",
          value: text === "#000000" ? "Black" : "White",
          sub: `${contrastRatio(color, text === "#000000" ? BLACK : WHITE).toFixed(2)}:1 contrast`,
          tone: "accent",
        },
      ],
      note:
        "The pipette button appears in browsers that support the EyeDropper API — Chrome and Edge today.",
      code: [
        {
          label: "CSS",
          value: `background-color: ${hex};\ncolor: ${text};`,
          extension: "css",
        },
      ],
    } satisfies DesignResult;
  },
};

/* -------------------------------------------------------- palette builder -- */

const HARMONIES: HarmonyName[] = [
  "complementary",
  "analogous",
  "triadic",
  "tetradic",
  "split",
  "monochromatic",
  "shades",
];

export const colorPaletteGenerator: DesignToolDef = {
  controlsTitle: "Palette",
  controlsDescription: "Pick a base colour and a relationship, and the rest follows.",
  resultTitle: "Your palette",
  fields: [
    { key: "base", label: "Base colour", type: "color", initial: "#2563eb", wide: true },
    {
      key: "harmony",
      label: "Relationship",
      type: "select",
      initial: "analogous",
      wide: true,
      options: HARMONIES.map((value) => ({ value, label: HARMONY_LABELS[value] })),
    },
  ],
  compute: (_values, h) => {
    if (!h.colorValid("base")) return { error: "Enter a colour to build a palette from." };
    const base = h.color("base");
    const name = (h.str("harmony") || "analogous") as HarmonyName;
    const colors = harmony(base, name);
    const hexes = colors.map((c) => rgbToHex(c));

    // Harmonies do not always put the base first — analogous, for instance,
    // centres it — so the label follows the colour rather than the position.
    const baseHex = rgbToHex(base);
    return {
      swatches: colors.map((c, i) => {
        const hex = rgbToHex(c);
        return {
          label: hex === baseHex ? "Base" : `Colour ${i + 1}`,
          color: hex,
          sub: `${rgbToHsl(c).h}°`,
        };
      }),
      note: HARMONY_LABELS[name],
      code: [
        {
          label: "CSS custom properties",
          value: `:root {\n${hexes.map((hex, i) => `  --colour-${i + 1}: ${hex};`).join("\n")}\n}`,
          extension: "css",
        },
        { label: "Hex list", value: hexes.join("\n"), extension: "txt" },
      ],
    } satisfies DesignResult;
  },
  notes: [
    { label: "Complementary", formula: "hue + 180°", note: "Maximum contrast — good for a single accent." },
    { label: "Analogous", formula: "hue ± 30° and ± 60°", note: "Calm and cohesive; pick one to dominate." },
    { label: "Triadic", formula: "hue, +120°, +240°", note: "Vivid and balanced. Use two sparingly." },
  ],
};

/* ---------------------------------------------------------- tints/shades -- */

/** The step positions of a 50–950 scale, as design systems normally number it. */
const SCALE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const colorShadesGenerator: DesignToolDef = {
  controlsTitle: "Base colour",
  controlsDescription: "Builds a full 50–950 scale around the colour you choose.",
  resultTitle: "Your scale",
  fields: [
    { key: "base", label: "Base colour", type: "color", initial: "#0ea5e9", wide: true },
    {
      key: "mode",
      label: "Scale",
      type: "select",
      initial: "scale",
      wide: true,
      options: [
        { value: "scale", label: "50–950 design-system scale" },
        { value: "tints", label: "Tints only — towards white" },
        { value: "shades", label: "Shades only — towards black" },
      ],
    },
  ],
  compute: (_values, h) => {
    if (!h.colorValid("base")) return { error: "Enter a colour to build a scale from." };
    const base = h.color("base");
    const mode = h.str("mode") || "scale";

    if (mode === "tints" || mode === "shades") {
      const list = mode === "tints" ? tints(base, 9) : shades(base, 9);
      const ordered = mode === "tints" ? [base, ...list] : [base, ...list];
      return {
        swatches: ordered.map((c, i) => ({
          label: i === 0 ? "Base" : `${mode === "tints" ? "Tint" : "Shade"} ${i}`,
          color: rgbToHex(c),
          sub: `${rgbToHsl(c).l.toFixed(0)}% light`,
        })),
        code: [
          { label: "Hex list", value: ordered.map((c) => rgbToHex(c)).join("\n"), extension: "txt" },
        ],
      } satisfies DesignResult;
    }

    // 500 is the base; lighter steps mix towards white and darker towards black.
    const entries = SCALE_STOPS.map((stop) => {
      if (stop === 500) return { stop, color: base };
      const color =
        stop < 500
          ? mix(base, WHITE, (500 - stop) / 500)
          : mix(base, BLACK, (stop - 500) / 500);
      return { stop, color };
    });

    return {
      swatches: entries.map(({ stop, color }) => ({
        label: String(stop),
        color: rgbToHex(color),
        sub: stop === 500 ? "base" : undefined,
      })),
      code: [
        {
          label: "CSS custom properties",
          value: `:root {\n${entries.map(({ stop, color }) => `  --brand-${stop}: ${rgbToHex(color)};`).join("\n")}\n}`,
          extension: "css",
        },
        {
          label: "Tailwind theme",
          value: `@theme {\n${entries.map(({ stop, color }) => `  --color-brand-${stop}: ${rgbToHex(color)};`).join("\n")}\n}`,
          extension: "css",
        },
      ],
      note: "500 is your colour. Lighter steps mix towards white, darker steps towards black.",
    } satisfies DesignResult;
  },
};

/* --------------------------------------------------------- random colours -- */

export const randomColorGenerator: DesignToolDef = {
  controlsTitle: "Options",
  resultTitle: "Random colours",
  deferred: true,
  generate: { label: "Generate new colours" },
  fields: [
    { key: "count", label: "How many", type: "number", initial: "12", min: 1, max: 60 },
    {
      key: "style",
      label: "Style",
      type: "select",
      initial: "pleasant",
      options: [
        { value: "pleasant", label: "Usable — mid saturation and lightness" },
        { value: "any", label: "Anything — the full RGB space" },
        { value: "pastel", label: "Pastel — soft and light" },
        { value: "dark", label: "Dark — deep and rich" },
        { value: "grey", label: "Greyscale" },
      ],
    },
  ],
  compute: (_values, h) => {
    const count = Math.min(60, Math.max(1, h.num("count", 12)));
    const style = h.str("style") || "pleasant";

    const make = (): Rgb => {
      switch (style) {
        case "any":
          return { r: randomInt(256), g: randomInt(256), b: randomInt(256), a: 1 };
        case "pastel":
          return hslToRgb({ h: randomInt(360), s: 55 + randomInt(30), l: 78 + randomInt(10), a: 1 });
        case "dark":
          return hslToRgb({ h: randomInt(360), s: 45 + randomInt(40), l: 16 + randomInt(18), a: 1 });
        case "grey": {
          const level = randomInt(256);
          return { r: level, g: level, b: level, a: 1 };
        }
        default:
          return randomPleasantColor(randomInt);
      }
    };

    const colors = Array.from({ length: count }, make);
    return {
      swatches: colors.map((c) => ({
        label: `${rgbToHsl(c).h}°`,
        color: rgbToHex(c),
      })),
      code: [{ label: "Hex list", value: colors.map((c) => rgbToHex(c)).join("\n"), extension: "txt" }],
      note: "Click any swatch to copy its hex. Colours come from your browser's cryptographic random number generator.",
    } satisfies DesignResult;
  },
};

/* -------------------------------------------------------- contrast checker -- */

export const contrastChecker: DesignToolDef = {
  controlsTitle: "Two colours",
  controlsDescription: "Check text against its background before you ship it.",
  resultTitle: "Contrast",
  fields: [
    { key: "fg", label: "Text colour", type: "color", initial: "#6b7280" },
    { key: "bg", label: "Background", type: "color", initial: "#ffffff" },
  ],
  compute: (_values, h) => {
    if (!h.colorValid("fg") || !h.colorValid("bg")) {
      return { error: "Enter two colours to compare." };
    }
    const fg = h.color("fg");
    const bg = h.color("bg");
    const v = wcagVerdict(fg, bg);
    const ratio = `${v.ratio.toFixed(2)}:1`;
    const mark = (ok: boolean) => (ok ? "Pass" : "Fail");

    // Walk the text colour towards black or white until it clears AA.
    let suggestion: string | undefined;
    if (!v.aaNormal) {
      const target = relativeLuminance(bg) > 0.5 ? BLACK : WHITE;
      for (let step = 1; step <= 20; step++) {
        const candidate = mix(fg, target, step / 20);
        if (contrastRatio(candidate, bg) >= 4.5) {
          suggestion = rgbToHex(candidate);
          break;
        }
      }
    }

    return {
      preview: { kind: "text", foreground: rgbToHex(fg, true), background: rgbToHex(bg, true) },
      stats: [
        {
          label: "Contrast ratio",
          value: ratio,
          sub: v.aaaNormal ? "Excellent" : v.aaNormal ? "Good" : v.aaLarge ? "Large text only" : "Too low",
          tone: v.aaaNormal ? "success" : v.aaNormal ? "success" : v.aaLarge ? "warning" : "error",
        },
      ],
      rows: [
        { label: "AA body", value: `${mark(v.aaNormal)} — needs 4.5:1` },
        { label: "AA large", value: `${mark(v.aaLarge)} — needs 3:1` },
        { label: "AAA body", value: `${mark(v.aaaNormal)} — needs 7:1` },
        { label: "AAA large", value: `${mark(v.aaaLarge)} — needs 4.5:1` },
        { label: "UI and icons", value: `${mark(v.uiComponents)} — needs 3:1` },
      ],
      warning: !v.aaLarge
        ? "This combination fails every WCAG threshold. It will be hard to read for many people."
        : !v.aaNormal
          ? "Large text only. Body copy at this contrast fails WCAG AA."
          : undefined,
      note: suggestion
        ? `Nearest passing text colour: ${suggestion}. It keeps your hue but clears AA at 4.5:1.`
        : "Large text means 18pt, or 14pt bold, and above.",
      code: [
        {
          label: "CSS",
          value: `color: ${rgbToHex(fg, true)};\nbackground-color: ${rgbToHex(bg, true)};`,
          extension: "css",
        },
      ],
    } satisfies DesignResult;
  },
  notes: [
    {
      label: "Contrast ratio",
      formula: "(L1 + 0.05) ÷ (L2 + 0.05)",
      note: "L is relative luminance. The result runs from 1:1 to 21:1.",
    },
    { label: "WCAG AA", formula: "4.5:1 body text, 3:1 large text and UI" },
    { label: "WCAG AAA", formula: "7:1 body text, 4.5:1 large text" },
  ],
};
