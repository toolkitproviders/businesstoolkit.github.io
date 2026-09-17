"use client";

import * as React from "react";
import { Crop, Download, RotateCcw } from "lucide-react";
import { Alert, Button, Field, Input, Select, Spinner, Stat } from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  ACCEPTED_IMAGE_TYPES,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  ImageProcessingError,
  loadImage,
  renderImage,
  type OutputFormat,
} from "./canvas";
import { downloadBlob, formatBytes, stripExtension, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Visual image cropper.
 *
 * The selection is held in source pixels, not screen pixels, so the numbers in
 * the boxes are the real ones and the result does not change if the window is
 * resized mid-crop. The image is decoded and re-encoded on the device; nothing
 * is uploaded.
 */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const RATIOS: { value: string; label: string; ratio: number | null }[] = [
  { value: "free", label: "Free", ratio: null },
  { value: "1:1", label: "Square — 1:1", ratio: 1 },
  { value: "4:3", label: "Standard — 4:3", ratio: 4 / 3 },
  { value: "3:2", label: "Photo — 3:2", ratio: 3 / 2 },
  { value: "16:9", label: "Widescreen — 16:9", ratio: 16 / 9 },
  { value: "9:16", label: "Story — 9:16", ratio: 9 / 16 },
  { value: "2:3", label: "Portrait — 2:3", ratio: 2 / 3 },
];

export function ImageCropper({ toolSlug }: { toolSlug: string }) {
  const [source, setSource] = React.useState<{ file: File; name: string; url: string; width: number; height: number } | null>(null);
  const [rect, setRect] = React.useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const [ratioKey, setRatioKey] = React.useState("free");
  const [format, setFormat] = React.useState<OutputFormat>("image/png");
  const [result, setResult] = React.useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const frameRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ mode: "draw" | "move"; startX: number; startY: number; origin: Rect } | null>(null);
  const cleanupRef = React.useRef<{ source?: string; result?: string }>({});

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      if (cleanupRef.current.source) URL.revokeObjectURL(cleanupRef.current.source);
      if (cleanupRef.current.result) URL.revokeObjectURL(cleanupRef.current.result);
    },
    [],
  );

  const ratio = RATIOS.find((r) => r.value === ratioKey)?.ratio ?? null;

  const load = React.useCallback(async (accepted: AcceptedFile[]) => {
    const item = accepted[0];
    if (!item) return;
    setError(null);
    try {
      const { bitmap } = await loadImage(item.file);
      const url = URL.createObjectURL(item.file);
      if (cleanupRef.current.source) URL.revokeObjectURL(cleanupRef.current.source);
      cleanupRef.current.source = url;
      setSource({ file: item.file, name: item.name, url, width: bitmap.width, height: bitmap.height });
      // Start with a centred selection covering 80% of the image.
      const w = Math.round(bitmap.width * 0.8);
      const h = Math.round(bitmap.height * 0.8);
      setRect({ x: Math.round((bitmap.width - w) / 2), y: Math.round((bitmap.height - h) / 2), width: w, height: h });
      setResult(null);
      bitmap.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be read.");
    }
  }, []);

  /** Screen pixels to source pixels, using the rendered size of the frame. */
  const scale = React.useCallback(() => {
    const frame = frameRef.current;
    if (!frame || !source) return 1;
    return source.width / frame.clientWidth;
  }, [source]);

  const clampRect = React.useCallback(
    (next: Rect): Rect => {
      if (!source) return next;
      let { x, y, width, height } = next;
      width = Math.max(1, Math.min(source.width, Math.round(width)));
      height = Math.max(1, Math.min(source.height, Math.round(height)));
      if (ratio) {
        // Honour the locked ratio by shrinking the longer side, never growing
        // past the image.
        if (width / height > ratio) width = Math.round(height * ratio);
        else height = Math.round(width / ratio);
      }
      x = Math.max(0, Math.min(source.width - width, Math.round(x)));
      y = Math.max(0, Math.min(source.height - height, Math.round(y)));
      return { x, y, width, height };
    },
    [ratio, source],
  );

  React.useEffect(() => {
    if (source) setRect((r) => clampRect(r));
  }, [clampRect, source]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!source) return;
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const s = scale();
    const px = (e.clientX - bounds.left) * s;
    const py = (e.clientY - bounds.top) * s;

    const inside =
      px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;

    dragRef.current = {
      mode: inside ? "move" : "draw",
      startX: px,
      startY: py,
      origin: { ...rect },
    };
    if (!inside) setRect(clampRect({ x: px, y: py, width: 1, height: 1 }));
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame || !source) return;
    const bounds = frame.getBoundingClientRect();
    const s = scale();
    const px = (e.clientX - bounds.left) * s;
    const py = (e.clientY - bounds.top) * s;

    if (drag.mode === "move") {
      setRect(
        clampRect({
          ...drag.origin,
          x: drag.origin.x + (px - drag.startX),
          y: drag.origin.y + (py - drag.startY),
        }),
      );
    } else {
      setRect(
        clampRect({
          x: Math.min(drag.startX, px),
          y: Math.min(drag.startY, py),
          width: Math.abs(px - drag.startX),
          height: Math.abs(py - drag.startY),
        }),
      );
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    frameRef.current?.releasePointerCapture(e.pointerId);
  };

  const crop = React.useCallback(async () => {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const { bitmap } = await loadImage(source.file);
      const rendered = await renderImage(bitmap, {
        width: rect.width,
        height: rect.height,
        format,
        quality: 0.92,
        crop: rect,
      });
      bitmap.close();
      if (cleanupRef.current.result) URL.revokeObjectURL(cleanupRef.current.result);
      const url = URL.createObjectURL(rendered.blob);
      cleanupRef.current.result = url;
      setResult({ blob: rendered.blob, url });
      track("tool_completed", { tool: toolSlug });
    } catch (err) {
      setError(err instanceof ImageProcessingError ? err.message : "That image could not be cropped.");
    } finally {
      setBusy(false);
    }
  }, [format, rect, source, toolSlug]);

  const percent = source ? Math.round(((rect.width * rect.height) / (source.width * source.height)) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToolPanel title="Your image" description="Drag on the image to draw a selection, then drag inside it to move it.">
        {!source && (
          <FileUploader
            accept={ACCEPTED_IMAGE_TYPES}
            acceptLabel="JPG, PNG, WebP, AVIF, GIF or BMP"
            onFiles={load}
          />
        )}

        {source && (
          <>
            <div
              ref={frameRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="relative w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]"
              style={{ aspectRatio: `${source.width} / ${source.height}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={source.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full object-contain"
              />
              <div className="pointer-events-none absolute inset-0 bg-navy-950/50" />
              {rect.width > 0 && (
                <div
                  className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
                  style={{
                    left: `${(rect.x / source.width) * 100}%`,
                    top: `${(rect.y / source.height) * 100}%`,
                    width: `${(rect.width / source.width) * 100}%`,
                    height: `${(rect.height / source.height) * 100}%`,
                    backgroundImage: `url(${JSON.stringify(source.url)})`,
                    backgroundSize: `${(source.width / rect.width) * 100}% ${(source.height / rect.height) * 100}%`,
                    backgroundPosition: `${-(rect.x / rect.width) * 100}% ${-(rect.y / rect.height) * 100}%`,
                  }}
                >
                  <span className="absolute -top-px left-1/3 h-full w-px bg-white/40" />
                  <span className="absolute -top-px left-2/3 h-full w-px bg-white/40" />
                  <span className="absolute -left-px top-1/3 h-px w-full bg-white/40" />
                  <span className="absolute -left-px top-2/3 h-px w-full bg-white/40" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRect(clampRect({ x: 0, y: 0, width: source.width, height: source.height }))}
              >
                Select everything
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (cleanupRef.current.source) URL.revokeObjectURL(cleanupRef.current.source);
                  cleanupRef.current.source = undefined;
                  setSource(null);
                  setResult(null);
                }}
              >
                <RotateCcw className="size-3.5" />
                Choose another image
              </Button>
            </div>
          </>
        )}

        {error && <Alert tone="error">{error}</Alert>}
      </ToolPanel>

      {source && (
        <ToolPanel title="Selection">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Aspect ratio" htmlFor={`${toolSlug}-ratio`} className="sm:col-span-2">
              <Select id={`${toolSlug}-ratio`} value={ratioKey} onChange={(e) => setRatioKey(e.target.value)}>
                {RATIOS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="X" htmlFor={`${toolSlug}-x`}>
              <Input
                id={`${toolSlug}-x`}
                type="number"
                value={rect.x}
                onChange={(e) => setRect(clampRect({ ...rect, x: toNumber(e.target.value) }))}
              />
            </Field>
            <Field label="Y" htmlFor={`${toolSlug}-y`}>
              <Input
                id={`${toolSlug}-y`}
                type="number"
                value={rect.y}
                onChange={(e) => setRect(clampRect({ ...rect, y: toNumber(e.target.value) }))}
              />
            </Field>
            <Field label="Width" htmlFor={`${toolSlug}-w`}>
              <Input
                id={`${toolSlug}-w`}
                type="number"
                value={rect.width}
                onChange={(e) => setRect(clampRect({ ...rect, width: toNumber(e.target.value, 1) }))}
              />
            </Field>
            <Field label="Height" htmlFor={`${toolSlug}-h`}>
              <Input
                id={`${toolSlug}-h`}
                type="number"
                value={rect.height}
                onChange={(e) => setRect(clampRect({ ...rect, height: toNumber(e.target.value, 1) }))}
              />
            </Field>

            <Field label="Save as" htmlFor={`${toolSlug}-format`} className="sm:col-span-2">
              <Select
                id={`${toolSlug}-format`}
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
              >
                <option value="image/png">PNG — lossless</option>
                <option value="image/jpeg">JPG — smaller</option>
                <option value="image/webp">WebP — smallest</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Crop size" value={`${rect.width} × ${rect.height}`} tone="accent" />
            <Stat label="Of the original" value={`${percent}%`} />
            <Stat
              label="Ratio"
              value={(rect.width / rect.height).toFixed(2).replace(/\.00$/, "") + ":1"}
            />
          </div>

          <Button onClick={crop} disabled={busy} className="w-full">
            {busy ? <Spinner /> : <Crop className="size-4" />}
            {busy ? "Cropping…" : "Crop image"}
          </Button>

          {result && (
            <>
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[repeating-conic-gradient(var(--bg-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="Cropped result" className="mx-auto max-h-64 object-contain" />
              </div>
              <Button
                onClick={() =>
                  downloadBlob(result.blob, `${stripExtension(source.name)}-cropped.${FORMAT_EXTENSIONS[format]}`)
                }
                className="w-full"
              >
                <Download className="size-4" />
                Download {FORMAT_LABELS[format]} · {formatBytes(result.blob.size)}
              </Button>
            </>
          )}

          <PrivacyNote>
            Your file is processed locally in your browser and is never uploaded to a server.
          </PrivacyNote>
        </ToolPanel>
      )}
    </div>
  );
}
