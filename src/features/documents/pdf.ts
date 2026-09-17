/**
 * Vector PDF renderer for invoices and quotations.
 *
 * pdf-lib is imported dynamically by the caller so the ~400 KB library is only
 * fetched when someone actually clicks Download PDF — the tool page itself
 * stays light.
 */

import type { PDFDocument, PDFFont, PDFPage, RGB } from "pdf-lib";
import { computeTotals, docLabels, type BusinessDoc, type TemplateId } from "./types";
import { currencyDecimals, currencySymbol } from "@/lib/currencies";
import { formatDate } from "@/lib/utils";
import { hexToRgb, isPdfSafe, pdfSafe, truncateToWidth, wrapText } from "./pdf-text";

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const MARGIN = 46;
const FONT_SIZE = 9.5;
const LINE_GAP = 13;

interface TemplateStyle {
  /** Solid colour banner across the top. */
  banner: boolean;
  bannerHeight: number;
  /** Fill the table header row with the accent colour. */
  filledTableHead: boolean;
  /** Zebra-stripe the item rows. */
  zebra: boolean;
  rule: boolean;
  titleSize: number;
  uppercaseTitle: boolean;
}

const TEMPLATES: Record<TemplateId, TemplateStyle> = {
  classic: {
    banner: false, bannerHeight: 0, filledTableHead: false,
    zebra: false, rule: true, titleSize: 26, uppercaseTitle: true,
  },
  modern: {
    banner: true, bannerHeight: 8, filledTableHead: true,
    zebra: true, rule: false, titleSize: 24, uppercaseTitle: true,
  },
  minimal: {
    banner: false, bannerHeight: 0, filledTableHead: false,
    zebra: false, rule: false, titleSize: 20, uppercaseTitle: false,
  },
  bold: {
    banner: true, bannerHeight: 88, filledTableHead: true,
    zebra: true, rule: false, titleSize: 28, uppercaseTitle: true,
  },
};

/**
 * Money for the PDF. Tries the real currency symbol and falls back to the ISO
 * code when the symbol has no glyph in a standard PDF font.
 */
function pdfMoney(amount: number, code: string): string {
  const decimals = currencyDecimals(code);
  const value = (Number.isFinite(amount) ? amount : 0).toFixed(decimals);
  const grouped = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = currencySymbol(code);
  return isPdfSafe(symbol) ? `${symbol}${grouped}` : `${code} ${grouped}`;
}

export interface PdfResult {
  bytes: Uint8Array;
  filename: string;
}

export async function renderDocumentPdf(doc: BusinessDoc): Promise<PdfResult> {
  // Dynamic import keeps pdf-lib out of the initial page bundle.
  const { PDFDocument: PDFDoc, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDoc.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const style = TEMPLATES[doc.template] ?? TEMPLATES.classic;
  const labels = docLabels(doc.kind);
  const totals = computeTotals(doc);
  const size = PAGE_SIZES[doc.pageSize] ?? PAGE_SIZES.a4;

  const accentRgbValues = hexToRgb(doc.accent || "#11224a");
  const accent = rgb(accentRgbValues.r, accentRgbValues.g, accentRgbValues.b);
  const ink = rgb(0.08, 0.1, 0.16);
  const muted = rgb(0.42, 0.46, 0.55);
  const hairline = rgb(0.85, 0.87, 0.9);
  const zebraFill = rgb(0.968, 0.973, 0.98);
  const white = rgb(1, 1, 1);

  const contentWidth = size.width - MARGIN * 2;

  const logo = await embedImage(pdf, doc.logo);
  const signature = await embedImage(pdf, doc.signature);

  const pages: PDFPage[] = [];
  let page = pdf.addPage([size.width, size.height]);
  pages.push(page);
  let y = size.height - MARGIN;

  const text = (
    value: string,
    x: number,
    yPos: number,
    opts: { font?: PDFFont; size?: number; color?: RGB } = {},
  ) => {
    page.drawText(pdfSafe(value), {
      x,
      y: yPos,
      size: opts.size ?? FONT_SIZE,
      font: opts.font ?? regular,
      color: opts.color ?? ink,
    });
  };

  const textRight = (
    value: string,
    right: number,
    yPos: number,
    opts: { font?: PDFFont; size?: number; color?: RGB } = {},
  ) => {
    const font = opts.font ?? regular;
    const fontSize = opts.size ?? FONT_SIZE;
    const safe = pdfSafe(value);
    text(safe, right - font.widthOfTextAtSize(safe, fontSize), yPos, opts);
  };

  /* ------------------------------------------------------------ header -- */

  if (style.banner) {
    page.drawRectangle({
      x: 0,
      y: size.height - style.bannerHeight,
      width: size.width,
      height: style.bannerHeight,
      color: accent,
    });
    if (style.bannerHeight > 40) y = size.height - style.bannerHeight - 22;
  }

  const onBanner = style.bannerHeight > 40;
  const headerTop = onBanner ? size.height - 30 : y;
  const headerColor = onBanner ? white : ink;

  // Title block (left)
  const title = style.uppercaseTitle ? labels.title : labels.title.charAt(0) + labels.title.slice(1).toLowerCase();
  text(title, MARGIN, headerTop - style.titleSize + 6, {
    font: bold,
    size: style.titleSize,
    color: onBanner ? white : accent,
  });

  // Logo (right)
  let logoBottom = headerTop;
  if (logo) {
    const maxW = 130;
    const maxH = 52;
    const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo.image, {
      x: size.width - MARGIN - w,
      y: headerTop - h + 4,
      width: w,
      height: h,
    });
    logoBottom = headerTop - h;
  }

  y = Math.min(headerTop - style.titleSize - 10, logoBottom - 12);

  // Issuer name under the title
  const issuerName = doc.from.company || doc.from.name;
  if (issuerName) {
    text(issuerName, MARGIN, y, { font: bold, size: 11.5, color: headerColor });
    y -= 14;
  }

  if (onBanner) y = Math.min(y, size.height - style.bannerHeight - 24);

  /* ------------------------------------------------ meta + party blocks -- */

  const metaTop = y - 6;
  const colWidth = (contentWidth - 24) / 2;

  // Left: from / to
  let leftY = metaTop;
  leftY = drawParty(
    "From",
    [
      doc.from.company,
      doc.from.name,
      doc.from.address,
      doc.from.email,
      doc.from.phone,
      doc.from.website,
      doc.from.taxId ? `Tax ID: ${doc.from.taxId}` : "",
    ],
    MARGIN,
    leftY,
    colWidth,
  );

  leftY -= 10;
  leftY = drawParty(
    labels.partyLabel,
    [
      doc.to.company,
      doc.to.name,
      doc.to.address,
      doc.to.email,
      doc.to.phone,
      doc.to.taxId ? `Tax ID: ${doc.to.taxId}` : "",
    ],
    MARGIN,
    leftY,
    colWidth,
  );

  // Right: document metadata
  const metaX = MARGIN + colWidth + 24;
  let rightY = metaTop;
  const metaRows: [string, string][] = [
    [labels.numberLabel, doc.number],
    [labels.dateLabel, doc.date ? formatDate(doc.date) : ""],
    [labels.dueLabel, doc.dueDate ? formatDate(doc.dueDate) : ""],
    ["Payment terms", doc.paymentTerms],
    ["Reference", doc.reference],
  ].filter(([, value]) => Boolean(value && value.trim())) as [string, string][];

  for (const [label, value] of metaRows) {
    text(label, metaX, rightY, { size: 8, color: muted });
    textRight(value, size.width - MARGIN, rightY, { font: bold, size: 9.5 });
    rightY -= 15;
  }

  // Amount-due highlight
  rightY -= 4;
  const highlightH = 34;
  page.drawRectangle({
    x: metaX,
    y: rightY - highlightH + 10,
    width: size.width - MARGIN - metaX,
    height: highlightH,
    color: style.filledTableHead ? accent : rgb(0.957, 0.969, 0.984),
  });
  text(labels.totalLabel, metaX + 10, rightY - 2, {
    size: 8,
    color: style.filledTableHead ? white : muted,
  });
  textRight(pdfMoney(totals.total, doc.currency), size.width - MARGIN - 10, rightY - 17, {
    font: bold,
    size: 14,
    color: style.filledTableHead ? white : accent,
  });
  rightY -= highlightH + 6;

  y = Math.min(leftY, rightY) - 18;

  /* ------------------------------------------------------- items table -- */

  // Column layout: description flexes, numeric columns are fixed.
  const colAmount = size.width - MARGIN;
  const colTax = colAmount - 74;
  const colDisc = colTax - 44;
  const colPrice = colDisc - 44;
  const colQty = colPrice - 74;
  const descWidth = colQty - MARGIN - 44;

  const drawTableHead = () => {
    const headH = 22;
    if (style.filledTableHead) {
      page.drawRectangle({
        x: MARGIN, y: y - headH + 7, width: contentWidth, height: headH, color: accent,
      });
    } else {
      page.drawLine({
        start: { x: MARGIN, y: y - 5 },
        end: { x: colAmount, y: y - 5 },
        thickness: 0.8,
        color: accent,
      });
    }
    const c = style.filledTableHead ? white : muted;
    const f = bold;
    text("Description", MARGIN + (style.filledTableHead ? 8 : 0), y, { font: f, size: 8, color: c });
    textRight("Qty", colQty, y, { font: f, size: 8, color: c });
    textRight("Unit price", colPrice, y, { font: f, size: 8, color: c });
    textRight("Disc", colDisc, y, { font: f, size: 8, color: c });
    textRight("Tax", colTax, y, { font: f, size: 8, color: c });
    textRight("Amount", colAmount - (style.filledTableHead ? 8 : 0), y, { font: f, size: 8, color: c });
    y -= style.filledTableHead ? 24 : 14;
  };

  const newPage = () => {
    page = pdf.addPage([size.width, size.height]);
    pages.push(page);
    y = size.height - MARGIN;
    drawTableHead();
  };

  drawTableHead();

  let zebraIndex = 0;
  for (const item of doc.items) {
    const line = totals.lines[item.id];
    if (!line) continue;

    const nameLines = wrapText(item.name || "Item", bold, FONT_SIZE, descWidth, 2);
    const descLines = item.description
      ? wrapText(item.description, regular, 8.5, descWidth, 3)
      : [];
    const rowHeight = Math.max(
      18,
      nameLines.length * LINE_GAP + descLines.length * 11 + 8,
    );

    if (y - rowHeight < MARGIN + 150) newPage();

    if (style.zebra && zebraIndex % 2 === 1) {
      page.drawRectangle({
        x: MARGIN, y: y - rowHeight + 10, width: contentWidth, height: rowHeight, color: zebraFill,
      });
    }

    const pad = style.filledTableHead ? 8 : 0;
    let rowY = y;
    for (const nameLine of nameLines) {
      text(nameLine, MARGIN + pad, rowY, { font: bold });
      rowY -= LINE_GAP;
    }
    for (const descLine of descLines) {
      text(descLine, MARGIN + pad, rowY, { size: 8.5, color: muted });
      rowY -= 11;
    }

    // Numeric columns align to the first line of the row.
    textRight(formatQty(item.quantity), colQty, y);
    textRight(pdfMoney(item.unitPrice, doc.currency), colPrice, y);
    textRight(item.discount ? `${trimNum(item.discount)}%` : "—", colDisc, y, { color: muted });
    textRight(item.tax ? `${trimNum(item.tax)}%` : "—", colTax, y, { color: muted });
    // Pre-discount, pre-tax so this column sums to the Subtotal row below.
    textRight(pdfMoney(line.gross, doc.currency), colAmount - pad, y, { font: bold });

    y -= rowHeight;

    if (style.rule) {
      page.drawLine({
        start: { x: MARGIN, y: y + 8 },
        end: { x: colAmount, y: y + 8 },
        thickness: 0.4,
        color: hairline,
      });
    }
    zebraIndex += 1;
  }

  /* ------------------------------------------------------------ totals -- */

  if (y < MARGIN + 170) newPageWithoutTable();

  y -= 8;
  const totalsLeft = size.width - MARGIN - 220;

  const totalRow = (label: string, value: string, opts: { strong?: boolean } = {}) => {
    text(label, totalsLeft, y, {
      size: opts.strong ? 11 : 9.5,
      font: opts.strong ? bold : regular,
      color: opts.strong ? ink : muted,
    });
    textRight(value, colAmount, y, {
      size: opts.strong ? 13 : 9.5,
      font: bold,
      color: opts.strong ? accent : ink,
    });
    y -= opts.strong ? 20 : 15;
  };

  totalRow("Subtotal", pdfMoney(totals.subtotal, doc.currency));
  if (totals.discountTotal > 0) {
    totalRow("Discount", `-${pdfMoney(totals.discountTotal, doc.currency)}`);
  }
  for (const bucket of totals.taxByRate) {
    totalRow(`Tax (${trimNum(bucket.rate)}%)`, pdfMoney(bucket.amount, doc.currency));
  }

  page.drawLine({
    start: { x: totalsLeft, y: y + 8 },
    end: { x: colAmount, y: y + 8 },
    thickness: 0.8,
    color: accent,
  });
  y -= 6;
  totalRow(labels.totalLabel, pdfMoney(totals.total, doc.currency), { strong: true });

  /* -------------------------------------------------- notes and footer -- */

  y -= 10;
  const blockWidth = contentWidth - 200;

  const block = (heading: string, body: string) => {
    if (!body.trim()) return;
    const lines = wrapText(body, regular, 8.8, blockWidth);
    if (y - (lines.length * 11 + 22) < MARGIN + 60) newPageWithoutTable();
    text(heading, MARGIN, y, { font: bold, size: 8.5, color: accent });
    y -= 13;
    for (const line of lines) {
      text(line, MARGIN, y, { size: 8.8, color: muted });
      y -= 11;
    }
    y -= 9;
  };

  block("Notes", doc.notes);
  block("Payment instructions", doc.paymentInstructions);
  block("Terms and conditions", doc.terms);

  // Signature, bottom right of the final page.
  if (signature || doc.signatureName) {
    const sigY = Math.max(y, MARGIN + 54);
    const sigRight = size.width - MARGIN;
    const sigWidth = 150;
    if (signature) {
      const scale = Math.min(sigWidth / signature.width, 42 / signature.height, 1);
      page.drawImage(signature.image, {
        x: sigRight - signature.width * scale,
        y: sigY - 4,
        width: signature.width * scale,
        height: signature.height * scale,
      });
    }
    page.drawLine({
      start: { x: sigRight - sigWidth, y: sigY - 10 },
      end: { x: sigRight, y: sigY - 10 },
      thickness: 0.6,
      color: hairline,
    });
    if (doc.signatureName) {
      textRight(doc.signatureName, sigRight, sigY - 22, { size: 8.5, color: muted });
    }
  }

  // Page numbers on every page, added last so the count is known.
  pages.forEach((p, i) => {
    const label = `Page ${i + 1} of ${pages.length}`;
    const width = regular.widthOfTextAtSize(label, 7.5);
    p.drawText(label, {
      x: size.width - MARGIN - width,
      y: MARGIN - 18,
      size: 7.5,
      font: regular,
      color: muted,
    });
    const footer = pdfSafe(
      [doc.from.company || doc.from.name, doc.from.email].filter(Boolean).join("  ·  "),
    );
    if (footer) {
      p.drawText(truncateToWidth(footer, regular, 7.5, contentWidth - 90), {
        x: MARGIN,
        y: MARGIN - 18,
        size: 7.5,
        font: regular,
        color: muted,
      });
    }
  });

  const bytes = await pdf.save();
  const safeNumber = (doc.number || "document").replace(/[^A-Za-z0-9._-]/g, "-");
  return { bytes, filename: `${labels.filePrefix}-${safeNumber}.pdf` };

  /* ------------------------------------------------------------ helpers -- */

  function newPageWithoutTable() {
    page = pdf.addPage([size.width, size.height]);
    pages.push(page);
    y = size.height - MARGIN;
  }

  function drawParty(heading: string, values: string[], x: number, startY: number, width: number) {
    let cursor = startY;
    text(heading.toUpperCase(), x, cursor, { font: bold, size: 7.5, color: muted });
    cursor -= 13;
    const present = values.filter((v) => v && v.trim());
    if (present.length === 0) {
      text("—", x, cursor, { color: muted });
      return cursor - LINE_GAP;
    }
    present.forEach((value, index) => {
      const lines = wrapText(value, regular, FONT_SIZE, width);
      for (const line of lines) {
        text(line, x, cursor, { font: index === 0 ? bold : regular });
        cursor -= 12;
      }
    });
    return cursor;
  }
}

async function embedImage(
  pdf: PDFDocument,
  dataUrl: string | null,
): Promise<{ image: Awaited<ReturnType<PDFDocument["embedPng"]>>; width: number; height: number } | null> {
  if (!dataUrl) return null;
  try {
    const isPng = dataUrl.startsWith("data:image/png");
    const isJpg = /^data:image\/jpe?g/.test(dataUrl);
    if (!isPng && !isJpg) return null;

    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  } catch {
    // A corrupt or unsupported image should never block the whole PDF.
    return null;
  }
}

function formatQty(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function trimNum(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
