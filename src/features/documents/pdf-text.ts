/**
 * Text safety for pdf-lib's standard (non-embedded) fonts.
 *
 * Helvetica and friends use WinAnsi encoding. Handing them a character outside
 * that set — a rupee sign, a CJK glyph, an emoji in a note — makes pdf-lib
 * throw, which would turn "Download PDF" into an unexplained failure. Every
 * string that reaches the PDF goes through `pdfSafe` first.
 */

// The CP1252-only code points that sit above ASCII/Latin-1.
const WIN_ANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

function isWinAnsi(codePoint: number): boolean {
  if (codePoint >= 0x20 && codePoint <= 0x7e) return true;
  if (codePoint >= 0xa0 && codePoint <= 0xff) return true;
  return WIN_ANSI_EXTRAS.has(codePoint);
}

/** Readable stand-ins for symbols WinAnsi has no glyph for. */
const TRANSLITERATE: Record<string, string> = {
  "₹": "Rs", "₨": "Rs", "৳": "Tk", "₩": "W", "₪": "ILS", "₺": "TL", "₽": "RUB",
  "₴": "UAH", "₦": "NGN", "₵": "GHS", "₱": "PHP", "₫": "VND", "฿": "THB",
  "₸": "KZT", "₼": "AZN", "₾": "GEL", "֏": "AMD", "៛": "KHR", "₭": "LAK",
  "₮": "MNT", "₲": "PYG", "₡": "CRC", "؋": "AFN", "د.إ": "AED",
  "…": "...", "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "≠": "!=",
  " ": " ", " ": " ", " ": " ", "​": "",
};

/**
 * Returns a string every standard PDF font can render. Unknown characters are
 * transliterated where there is a sensible equivalent and dropped otherwise —
 * dropping is deliberate, since a page full of "?" looks broken to a client.
 */
export function pdfSafe(input: string): string {
  if (!input) return "";
  let text = input;
  for (const [from, to] of Object.entries(TRANSLITERATE)) {
    if (text.includes(from)) text = text.split(from).join(to);
  }

  let out = "";
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0x0a || cp === 0x0d) {
      out += "\n";
    } else if (isWinAnsi(cp)) {
      out += char;
    }
    // Anything left is silently dropped.
  }
  return out;
}

export function isPdfSafe(input: string): boolean {
  for (const char of input) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (!isWinAnsi(cp)) return false;
  }
  return true;
}

export interface FontLike {
  widthOfTextAtSize(text: string, size: number): number;
}

/**
 * Greedy word wrap against real glyph widths. Words longer than the available
 * width (a URL, a long product code) are hard-split so nothing overflows the
 * column.
 */
export function wrapText(
  text: string,
  font: FontLike,
  size: number,
  maxWidth: number,
  maxLines = Infinity,
): string[] {
  const safe = pdfSafe(text);
  if (!safe.trim()) return [];

  const lines: string[] = [];

  for (const paragraph of safe.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
        current = "";
      }
      // The word alone may still be too wide — break it by character.
      let chunk = "";
      for (const char of word) {
        if (font.widthOfTextAtSize(chunk + char, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      current = chunk;
    }
    if (current) lines.push(current);
  }

  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  const last = clipped[maxLines - 1];
  clipped[maxLines - 1] = truncateToWidth(`${last}…`, font, size, maxWidth);
  return clipped;
}

export function truncateToWidth(
  text: string,
  font: FontLike,
  size: number,
  maxWidth: number,
): string {
  const safe = pdfSafe(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let out = safe;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

/** #1b3268 / #1b3268aa / #fff -> pdf-lib rgb components in 0..1. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.slice(0, 6).padEnd(6, "0");
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
}
