/**
 * Browser-side PDF helpers.
 *
 * pdf-lib (structure: merge, split) and pdfjs-dist (rendering: thumbnails,
 * image export) are both imported dynamically, so neither is downloaded until
 * the user actually acts. Nothing is uploaded — every operation happens on the
 * bytes already sitting in the page.
 */

export class PdfError extends Error {}

export const PDF_ACCEPT = ["application/pdf", ".pdf"];
export const MAX_PDF_BYTES = 100 * 1024 * 1024;

async function readBytes(file: File): Promise<Uint8Array> {
  try {
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new PdfError("That file could not be read from disk.");
  }
}

/** Human-readable reasons instead of pdf-lib's internal error text. */
function describeLoadError(error: unknown, name: string): PdfError {
  const message = error instanceof Error ? error.message : "";
  if (/encrypt/i.test(message)) {
    return new PdfError(
      `"${name}" is password-protected. Remove the password before using this tool.`,
    );
  }
  if (/parse|invalid|header/i.test(message)) {
    return new PdfError(`"${name}" is not a valid PDF, or the file is damaged.`);
  }
  return new PdfError(`"${name}" could not be opened.`);
}

export interface PdfInfo {
  pageCount: number;
  bytes: Uint8Array;
}

/** Loads a PDF and reports its page count, validating it in the process. */
export async function inspectPdf(file: File, name: string): Promise<PdfInfo> {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await readBytes(file);
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return { pageCount: doc.getPageCount(), bytes };
  } catch (error) {
    throw describeLoadError(error, name);
  }
}

/** Merges several PDFs in the given order into one document. */
export async function mergePdfs(
  files: { name: string; bytes: Uint8Array }[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new PdfError("Add at least two PDFs to merge.");
  }
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();

  for (const [index, file] of files.entries()) {
    let source;
    try {
      source = await PDFDocument.load(file.bytes, { ignoreEncryption: false });
    } catch (error) {
      throw describeLoadError(error, file.name);
    }
    const pages = await out.copyPages(source, source.getPageIndices());
    for (const page of pages) out.addPage(page);
    onProgress?.(index + 1, files.length);
  }

  out.setProducer("BusinessToolKit");
  out.setCreator("BusinessToolKit PDF Merger");
  return out.save();
}

/** Extracts a set of zero-based page indices into a new PDF. */
export async function extractPages(
  bytes: Uint8Array,
  indices: number[],
  name: string,
): Promise<Uint8Array> {
  if (indices.length === 0) {
    throw new PdfError("Select at least one page.");
  }
  const { PDFDocument } = await import("pdf-lib");
  let source;
  try {
    source = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (error) {
    throw describeLoadError(error, name);
  }

  const total = source.getPageCount();
  const valid = indices.filter((i) => Number.isInteger(i) && i >= 0 && i < total);
  if (valid.length === 0) {
    throw new PdfError(`This PDF has ${total} pages, and none of the selected pages exist.`);
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, valid);
  for (const page of copied) out.addPage(page);
  out.setProducer("BusinessToolKit");
  return out.save();
}

/**
 * Parses "1-5, 8, 11-20" into zero-based index arrays, one per range.
 * Returns the ranges it understood plus any fragments it could not parse, so
 * the UI can tell the user exactly what was wrong rather than failing silently.
 */
export function parsePageRanges(
  input: string,
  pageCount: number,
): { ranges: { label: string; indices: number[] }[]; errors: string[] } {
  const ranges: { label: string; indices: number[] }[] = [];
  const errors: string[] = [];

  for (const part of input.split(",").map((p) => p.trim()).filter(Boolean)) {
    const span = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    const single = part.match(/^(\d+)$/);

    if (span) {
      const start = Number(span[1]);
      const end = Number(span[2]);
      if (start < 1 || end < 1) {
        errors.push(`"${part}" — page numbers start at 1.`);
        continue;
      }
      if (start > pageCount || end > pageCount) {
        errors.push(`"${part}" — this PDF only has ${pageCount} pages.`);
        continue;
      }
      const [from, to] = start <= end ? [start, end] : [end, start];
      const indices: number[] = [];
      for (let i = from; i <= to; i += 1) indices.push(i - 1);
      ranges.push({ label: `${from}-${to}`, indices });
    } else if (single) {
      const page = Number(single[1]);
      if (page < 1 || page > pageCount) {
        errors.push(`"${part}" — this PDF only has ${pageCount} pages.`);
        continue;
      }
      ranges.push({ label: String(page), indices: [page - 1] });
    } else {
      errors.push(`"${part}" isn't a page or a range. Use formats like 3 or 1-5.`);
    }
  }

  return { ranges, errors };
}

/* --------------------------------------------------------------- rendering -- */

type PdfJsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJsModule> | null = null;

/**
 * Loads pdf.js and points it at a worker bundled with the app, so rendering
 * stays local and never reaches out to a CDN.
 */
async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export interface RenderedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface PdfRenderHandle {
  pageCount: number;
  renderPage(pageNumber: number, scale: number): Promise<RenderedPage>;
  destroy(): Promise<void>;
}

/** Opens a PDF for rendering. Always call `destroy()` when finished. */
export async function openForRender(bytes: Uint8Array, name: string): Promise<PdfRenderHandle> {
  const pdfjs = await getPdfJs();
  let doc;
  try {
    // pdf.js transfers the buffer, so hand it a copy the caller still owns.
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    doc = await pdfjs.getDocument({ data: copy, isEvalSupported: false }).promise;
  } catch (error) {
    throw describeLoadError(error, name);
  }

  return {
    pageCount: doc.numPages,
    async renderPage(pageNumber: number, scale: number) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new PdfError("Your browser could not create a drawing surface.");

      await page.render({ canvasContext: context, viewport }).promise;
      page.cleanup();
      return { pageNumber, canvas, width: canvas.width, height: canvas.height };
    },
    async destroy() {
      await doc.destroy();
    },
  };
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
  if (!blob) throw new PdfError("That page could not be converted to an image.");
  return blob;
}

/** Wraps bytes in a Blob with a buffer the Blob fully owns. */
export function pdfBlob(bytes: Uint8Array): Blob {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "application/pdf" });
}
