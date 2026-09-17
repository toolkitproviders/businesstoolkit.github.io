/**
 * Client-side image processing.
 *
 * Everything here runs on the user's device using createImageBitmap + canvas —
 * no image is ever uploaded. Encoding goes through `canvas.toBlob`, so the
 * formats actually available depend on the browser; `isFormatSupported` probes
 * rather than assuming, and callers surface a clear message instead of
 * silently handing back a PNG.
 */

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
};

export const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
];

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export class ImageProcessingError extends Error {}

/** Decodes a file into an ImageBitmap, with a clear error for unreadable files. */
export async function loadImage(file: File | Blob): Promise<LoadedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height) {
      throw new ImageProcessingError("That image has no dimensions.");
    }
    return { bitmap, width: bitmap.width, height: bitmap.height };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError(
      "That file could not be read as an image. It may be corrupt or in an unsupported format.",
    );
  }
}

const supportCache = new Map<OutputFormat, boolean>();

/** True if this browser can actually encode to `format`. */
export async function isFormatSupported(format: OutputFormat): Promise<boolean> {
  const cached = supportCache.get(format);
  if (cached !== undefined) return cached;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, format, 0.8),
    );
    // Browsers silently fall back to PNG for formats they cannot encode.
    const ok = Boolean(blob) && blob!.type === format;
    supportCache.set(format, ok);
    return ok;
  } catch {
    supportCache.set(format, false);
    return false;
  }
}

export interface RenderOptions {
  width: number;
  height: number;
  format: OutputFormat;
  /** 0–1. Ignored for PNG, which is lossless. */
  quality?: number;
  /** Painted behind the image — matters when converting transparency to JPG. */
  background?: string;
  /** How the source is placed inside the target box. */
  fit?: "stretch" | "cover" | "contain";
  /** For "cover": 0 = top/left, 0.5 = centre, 1 = bottom/right. */
  focusX?: number;
  focusY?: number;
  /**
   * Source rectangle to take the pixels from, in source pixels. Defaults to
   * the whole image. When set, the fit modes do not apply — the rectangle is
   * drawn to fill the target exactly.
   */
  crop?: { x: number; y: number; width: number; height: number };
}

export interface RenderResult {
  blob: Blob;
  width: number;
  height: number;
  format: OutputFormat;
}

/**
 * Draws a bitmap into a canvas of the requested size and encodes it.
 * Downscaling is done in halving steps, which avoids the aliasing a single
 * large downscale produces in every browser's default resampler.
 */
export async function renderImage(
  source: ImageBitmap,
  options: RenderOptions,
): Promise<RenderResult> {
  const targetWidth = Math.max(1, Math.round(options.width));
  const targetHeight = Math.max(1, Math.round(options.height));

  if (targetWidth * targetHeight > 80_000_000) {
    throw new ImageProcessingError(
      "Those dimensions are too large to process in the browser. Try a smaller size.",
    );
  }

  const fit = options.crop ? "crop" : (options.fit ?? "stretch");

  // Progressive halving for large downscales.
  let current: ImageBitmap | HTMLCanvasElement = source;
  let currentWidth = source.width;
  let currentHeight = source.height;

  if (fit === "stretch") {
    while (currentWidth > targetWidth * 2 && currentHeight > targetHeight * 2) {
      const stepWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
      const stepHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));
      const step = document.createElement("canvas");
      step.width = stepWidth;
      step.height = stepHeight;
      const stepCtx = step.getContext("2d");
      if (!stepCtx) break;
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = "high";
      stepCtx.drawImage(current, 0, 0, stepWidth, stepHeight);
      current = step;
      currentWidth = stepWidth;
      currentHeight = stepHeight;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageProcessingError("Your browser could not create a drawing surface.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // JPEG has no alpha channel; without a fill, transparency renders black.
  const needsBackground = options.format === "image/jpeg" || Boolean(options.background);
  if (needsBackground) {
    ctx.fillStyle = options.background ?? "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (fit === "crop" && options.crop) {
    // Clamp to the image so a selection dragged past the edge cannot ask the
    // canvas for pixels that do not exist.
    const sx = Math.max(0, Math.min(source.width - 1, Math.round(options.crop.x)));
    const sy = Math.max(0, Math.min(source.height - 1, Math.round(options.crop.y)));
    const sw = Math.max(1, Math.min(source.width - sx, Math.round(options.crop.width)));
    const sh = Math.max(1, Math.min(source.height - sy, Math.round(options.crop.height)));
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  } else if (fit === "cover") {
    const scale = Math.max(targetWidth / currentWidth, targetHeight / currentHeight);
    const drawWidth = currentWidth * scale;
    const drawHeight = currentHeight * scale;
    const focusX = options.focusX ?? 0.5;
    const focusY = options.focusY ?? 0.5;
    ctx.drawImage(
      current,
      (targetWidth - drawWidth) * focusX,
      (targetHeight - drawHeight) * focusY,
      drawWidth,
      drawHeight,
    );
  } else if (fit === "contain") {
    const scale = Math.min(targetWidth / currentWidth, targetHeight / currentHeight);
    const drawWidth = currentWidth * scale;
    const drawHeight = currentHeight * scale;
    ctx.drawImage(
      current,
      (targetWidth - drawWidth) / 2,
      (targetHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  } else {
    ctx.drawImage(current, 0, 0, targetWidth, targetHeight);
  }

  const quality = options.format === "image/png" ? undefined : clamp01(options.quality ?? 0.82);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, options.format, quality),
  );

  if (!blob) {
    throw new ImageProcessingError(
      `Your browser could not produce a ${FORMAT_LABELS[options.format]} image. Try a different format.`,
    );
  }

  if (blob.type !== options.format) {
    throw new ImageProcessingError(
      `Your browser cannot encode ${FORMAT_LABELS[options.format]}. Try WebP or JPG instead.`,
    );
  }

  return { blob, width: targetWidth, height: targetHeight, format: options.format };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.82;
  return Math.min(1, Math.max(0.01, value));
}

/** Keeps width/height in proportion when the aspect ratio is locked. */
export function lockedDimension(
  changed: "width" | "height",
  value: number,
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number } {
  const ratio = naturalWidth / naturalHeight;
  if (changed === "width") {
    return { width: Math.max(1, value), height: Math.max(1, Math.round(value / ratio)) };
  }
  return { width: Math.max(1, Math.round(value * ratio)), height: Math.max(1, value) };
}

/** Builds a ZIP of processed files, loading JSZip only when needed. */
export async function zipFiles(
  files: { name: string; blob: Blob }[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  // De-duplicate names so two "photo.jpg" inputs don't overwrite each other.
  const used = new Map<string, number>();
  for (const file of files) {
    const count = used.get(file.name) ?? 0;
    used.set(file.name, count + 1);
    const name = count === 0 ? file.name : insertSuffix(file.name, `-${count + 1}`);
    zip.file(name, file.blob);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" }, (meta) =>
    onProgress?.(meta.percent),
  );
}

function insertSuffix(filename: string, suffix: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return `${filename}${suffix}`;
  return `${filename.slice(0, dot)}${suffix}${filename.slice(dot)}`;
}
