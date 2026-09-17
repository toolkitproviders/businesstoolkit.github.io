/**
 * Colour maths.
 *
 * Deliberately free of JSX and of any browser API, so every conversion and
 * contrast figure below is exercised directly by the Node test suite. The
 * formulas are the published ones: sRGB relative luminance and contrast ratio
 * come from WCAG 2.2, and the HSL/HSV/CMYK conversions are the standard ones.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0–1. Opaque unless the input carried an alpha channel. */
  a: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export interface Cmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** The CSS colour keywords people actually type. */
export const NAMED_COLORS: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", cyan: "#00ffff", aqua: "#00ffff", magenta: "#ff00ff", fuchsia: "#ff00ff",
  gray: "#808080", grey: "#808080", silver: "#c0c0c0", maroon: "#800000", olive: "#808000",
  lime: "#00ff00", teal: "#008080", navy: "#000080", purple: "#800080", orange: "#ffa500",
  pink: "#ffc0cb", brown: "#a52a2a", gold: "#ffd700", indigo: "#4b0082", violet: "#ee82ee",
  beige: "#f5f5dc", ivory: "#fffff0", khaki: "#f0e68c", coral: "#ff7f50", salmon: "#fa8072",
  crimson: "#dc143c", tomato: "#ff6347", turquoise: "#40e0d0", lavender: "#e6e6fa",
  plum: "#dda0dd", orchid: "#da70d6", tan: "#d2b48c", chocolate: "#d2691e", slategray: "#708090",
  steelblue: "#4682b4", skyblue: "#87ceeb", royalblue: "#4169e1", seagreen: "#2e8b57",
  forestgreen: "#228b22", midnightblue: "#191970", transparent: "#00000000",
};

/**
 * Accepts anything a person is likely to paste: #abc, #aabbcc, #aabbccdd,
 * rgb()/rgba(), hsl()/hsla(), a CSS keyword, or six bare hex digits.
 * Returns null rather than guessing when it cannot read the value.
 */
export function parseColor(input: string): Rgb | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const named = NAMED_COLORS[value];
  if (named) return parseColor(named);

  const hex = value.startsWith("#") ? value.slice(1) : /^[0-9a-f]{3,8}$/.test(value) ? value : null;
  if (hex !== null) {
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    const expand = (s: string) => Number.parseInt(s.length === 1 ? s + s : s, 16);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: expand(hex[0]),
        g: expand(hex[1]),
        b: expand(hex[2]),
        a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: expand(hex.slice(0, 2)),
        g: expand(hex.slice(2, 4)),
        b: expand(hex.slice(4, 6)),
        a: hex.length === 8 ? expand(hex.slice(6, 8)) / 255 : 1,
      };
    }
    return null;
  }

  const rgbMatch = /^rgba?\(([^)]+)\)$/.exec(value);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/u).filter(Boolean).map(Number.parseFloat);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
    return {
      r: clamp(Math.round(parts[0]), 0, 255),
      g: clamp(Math.round(parts[1]), 0, 255),
      b: clamp(Math.round(parts[2]), 0, 255),
      a: parts.length > 3 && Number.isFinite(parts[3]) ? clamp(parts[3], 0, 1) : 1,
    };
  }

  const hslMatch = /^hsla?\(([^)]+)\)$/.exec(value);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[\s,/]+/u).filter(Boolean).map((p) => Number.parseFloat(p));
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
    const rgb = hslToRgb({
      h: parts[0],
      s: clamp(parts[1], 0, 100),
      l: clamp(parts[2], 0, 100),
      a: parts.length > 3 && Number.isFinite(parts[3]) ? clamp(parts[3], 0, 1) : 1,
    });
    return rgb;
  }

  return null;
}

export function rgbToHex({ r, g, b, a }: Rgb, withAlpha = false): string {
  const part = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  const base = `#${part(r)}${part(g)}${part(b)}`;
  return withAlpha && a < 1 ? `${base}${part(a * 255)}` : base;
}

export function rgbToHsl({ r, g, b, a }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1), a };
}

export function hslToRgb({ h, s, l, a = 1 }: Hsl): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = ln - c / 2;

  const [r1, g1, b1] =
    hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
    : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c]
    : hue < 300 ? [x, 0, c]
    : [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  };
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: round(h, 1), s: round((max === 0 ? 0 : delta / max) * 100, 1), v: round(max * 100, 1) };
}

export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);

  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  return {
    c: round(((1 - rn - k) / (1 - k)) * 100, 1),
    m: round(((1 - gn - k) / (1 - k)) * 100, 1),
    y: round(((1 - bn - k) / (1 - k)) * 100, 1),
    k: round(k * 100, 1),
  };
}

/* -------------------------------------------------------------- contrast -- */

/** sRGB relative luminance, exactly as WCAG 2.2 defines it. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface WcagVerdict {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  /** Also the bar for icons, form borders and other non-text elements. */
  uiComponents: boolean;
}

export function wcagVerdict(foreground: Rgb, background: Rgb): WcagVerdict {
  const ratio = contrastRatio(foreground, background);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    uiComponents: ratio >= 3,
  };
}

/** Black or white, whichever is easier to read on the given background. */
export function readableTextColor(background: Rgb): string {
  const onBlack = contrastRatio(background, { r: 0, g: 0, b: 0, a: 1 });
  const onWhite = contrastRatio(background, { r: 255, g: 255, b: 255, a: 1 });
  return onBlack >= onWhite ? "#000000" : "#ffffff";
}

/* ----------------------------------------------------------- adjustments -- */

export function adjustLightness(color: Rgb, delta: number): Rgb {
  const hsl = rgbToHsl(color);
  return hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 100) });
}

export function adjustSaturation(color: Rgb, delta: number): Rgb {
  const hsl = rgbToHsl(color);
  return hslToRgb({ ...hsl, s: clamp(hsl.s + delta, 0, 100) });
}

export function rotateHue(color: Rgb, degrees: number): Rgb {
  const hsl = rgbToHsl(color);
  return hslToRgb({ ...hsl, h: hsl.h + degrees });
}

/** Linear blend in sRGB. `amount` 0 returns `a`, 1 returns `b`. */
export function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  const t = clamp(amount, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: a.a + (b.a - a.a) * t,
  };
}

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgb = { r: 0, g: 0, b: 0, a: 1 };

/** Lighter versions, mixed towards white. */
export function tints(color: Rgb, steps: number): Rgb[] {
  return Array.from({ length: steps }, (_v, i) => mix(color, WHITE, ((i + 1) / (steps + 1))));
}

/** Darker versions, mixed towards black. */
export function shades(color: Rgb, steps: number): Rgb[] {
  return Array.from({ length: steps }, (_v, i) => mix(color, BLACK, ((i + 1) / (steps + 1))));
}

/* ------------------------------------------------------------- harmonies -- */

export type HarmonyName =
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic"
  | "split"
  | "monochromatic"
  | "shades";

export const HARMONY_LABELS: Record<HarmonyName, string> = {
  complementary: "Complementary — the opposite hue",
  analogous: "Analogous — neighbouring hues",
  triadic: "Triadic — three evenly spaced hues",
  tetradic: "Tetradic — two complementary pairs",
  split: "Split complementary — either side of the opposite",
  monochromatic: "Monochromatic — one hue, varying lightness",
  shades: "Tints and shades — towards white and black",
};

export function harmony(color: Rgb, name: HarmonyName): Rgb[] {
  switch (name) {
    case "complementary":
      return [color, rotateHue(color, 180)];
    case "analogous":
      return [rotateHue(color, -60), rotateHue(color, -30), color, rotateHue(color, 30), rotateHue(color, 60)];
    case "triadic":
      return [color, rotateHue(color, 120), rotateHue(color, 240)];
    case "tetradic":
      return [color, rotateHue(color, 90), rotateHue(color, 180), rotateHue(color, 270)];
    case "split":
      return [color, rotateHue(color, 150), rotateHue(color, 210)];
    case "monochromatic": {
      const hsl = rgbToHsl(color);
      return [15, 30, 50, 70, 85].map((l) => hslToRgb({ ...hsl, l }));
    }
    case "shades":
      return [...shades(color, 3).reverse(), color, ...tints(color, 3)];
  }
}

/* ------------------------------------------------------------ formatting -- */

export function formatRgb({ r, g, b, a }: Rgb): string {
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${round(a, 3)})` : `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl(color: Rgb): string {
  const { h, s, l, a } = rgbToHsl(color);
  return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${round(a, 3)})` : `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatHsv(color: Rgb): string {
  const { h, s, v } = rgbToHsv(color);
  return `hsv(${h}, ${s}%, ${v}%)`;
}

export function formatCmyk(color: Rgb): string {
  const { c, m, y, k } = rgbToCmyk(color);
  return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}

/** The nearest CSS keyword, when one is close enough to be worth mentioning. */
export function nearestNamedColor(color: Rgb): { name: string; hex: string; distance: number } {
  let best = { name: "black", hex: "#000000", distance: Number.POSITIVE_INFINITY };
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    if (name === "transparent") continue;
    const other = parseColor(hex);
    if (!other) continue;
    // Plain Euclidean distance in sRGB: good enough to name a colour.
    const distance = Math.sqrt(
      (color.r - other.r) ** 2 + (color.g - other.g) ** 2 + (color.b - other.b) ** 2,
    );
    if (distance < best.distance) best = { name, hex, distance };
  }
  return best;
}

/** A random colour with usable saturation and lightness, not muddy noise. */
export function randomPleasantColor(rand: (max: number) => number): Rgb {
  return hslToRgb({
    h: rand(360),
    s: 45 + rand(45),
    l: 35 + rand(35),
    a: 1,
  });
}
