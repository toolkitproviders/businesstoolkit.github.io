"use client";

import * as React from "react";
import { Crop, Download, Maximize } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  SegmentedControl,
  Slider,
  Spinner,
  Tabs,
} from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  ACCEPTED_IMAGE_TYPES,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  ImageProcessingError,
  isFormatSupported,
  loadImage,
  renderImage,
  type OutputFormat,
} from "./canvas";
import { platformPresets } from "./presets";
import { cn, downloadBlob, formatBytes, stripExtension } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Fit = "cover" | "contain";

export function SocialImageResizer({ toolSlug }: { toolSlug: string }) {
  const [file, setFile] = React.useState<{ file: File; name: string } | null>(null);
  const [bitmap, setBitmap] = React.useState<ImageBitmap | null>(null);
  const [platform, setPlatform] = React.useState(platformPresets[0].id);
  const [presetId, setPresetId] = React.useState(platformPresets[0].presets[0].id);
  const [fit, setFit] = React.useState<Fit>("cover");
  const [background, setBackground] = React.useState("#ffffff");
  const [focusX, setFocusX] = React.useState(50);
  const [focusY, setFocusY] = React.useState(50);
  const [format, setFormat] = React.useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = React.useState(90);
  const [result, setResult] = React.useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const resultRef = React.useRef<{ blob: Blob; url: string } | null>(null);
  resultRef.current = result;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    },
    [],
  );

  const group = platformPresets.find((p) => p.id === platform) ?? platformPresets[0];
  const preset = group.presets.find((p) => p.id === presetId) ?? group.presets[0];

  const onFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const item = accepted[0];
    if (!item) return;
    setError(null);
    try {
      const loaded = await loadImage(item.file);
      setBitmap((prev) => {
        prev?.close();
        return loaded.bitmap;
      });
      setFile({ file: item.file, name: item.name });
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
    } catch (err) {
      setError(err instanceof ImageProcessingError ? err.message : "That image could not be read.");
    }
  }, []);

  /* Live preview on a canvas, redrawn whenever any setting changes. */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;

    // Cap the on-screen canvas so a 4K export doesn't allocate 4K of preview.
    const scale = Math.min(1, 560 / preset.width);
    const w = Math.max(1, Math.round(preset.width * scale));
    const h = Math.max(1, Math.round(preset.height * scale));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);

    if (fit === "cover") {
      const s = Math.max(w / bitmap.width, h / bitmap.height);
      const dw = bitmap.width * s;
      const dh = bitmap.height * s;
      ctx.drawImage(bitmap, (w - dw) * (focusX / 100), (h - dh) * (focusY / 100), dw, dh);
    } else {
      const s = Math.min(w / bitmap.width, h / bitmap.height);
      const dw = bitmap.width * s;
      const dh = bitmap.height * s;
      ctx.drawImage(bitmap, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
  }, [bitmap, preset, fit, background, focusX, focusY]);

  const generate = async () => {
    if (!bitmap || !file) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await isFormatSupported(format))) {
        setError(`Your browser cannot encode ${FORMAT_LABELS[format]}. Try WebP or JPG.`);
        return;
      }
      const rendered = await renderImage(bitmap, {
        width: preset.width,
        height: preset.height,
        format,
        quality: quality / 100,
        background,
        fit,
        focusX: focusX / 100,
        focusY: focusY / 100,
      });
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob: rendered.blob, url: URL.createObjectURL(rendered.blob) };
      });
      track("tool_completed", { tool: toolSlug, format: FORMAT_EXTENSIONS[format] });
    } catch (err) {
      setError(
        err instanceof ImageProcessingError ? err.message : "That image could not be processed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    downloadBlob(
      result.blob,
      `${stripExtension(file.name)}-${platform}-${preset.width}x${preset.height}.${FORMAT_EXTENSIONS[format]}`,
    );
    track("download_clicked", { tool: toolSlug });
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileUploader
          accept={ACCEPTED_IMAGE_TYPES}
          acceptLabel="JPG, PNG, WebP or AVIF"
          maxSize={25 * 1024 * 1024}
          onFiles={onFiles}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <ToolPanel title="Platform">
              <Tabs
                value={platform}
                onChange={(next) => {
                  setPlatform(next);
                  const g = platformPresets.find((p) => p.id === next);
                  if (g) setPresetId(g.presets[0].id);
                }}
                tabs={platformPresets.map((p) => ({ value: p.id, label: p.label }))}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                {group.presets.map((p) => {
                  const active = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg-subtle)]",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          active ? "text-[var(--accent)]" : "text-[var(--fg)]",
                        )}
                      >
                        {p.label}
                      </span>
                      <span className="tabular block text-xs text-[var(--fg-muted)]">
                        {p.width} × {p.height}
                        {p.note && ` · ${p.note}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ToolPanel>

            <ToolPanel title="Framing">
              <SegmentedControl<Fit>
                ariaLabel="Fit mode"
                value={fit}
                onChange={setFit}
                options={[
                  { value: "cover", label: "Cover", icon: <Crop className="size-4" /> },
                  { value: "contain", label: "Contain", icon: <Maximize className="size-4" /> },
                ]}
              />
              <p className="text-xs text-[var(--fg-subtle)]">
                {fit === "cover"
                  ? "Fills the frame completely and crops whatever overflows."
                  : "Fits the whole image inside the frame and pads the rest."}
              </p>

              {fit === "cover" && (
                <>
                  <Slider
                    label="Horizontal position"
                    suffix="%"
                    min={0}
                    max={100}
                    value={focusX}
                    onChange={(e) => setFocusX(Number(e.target.value))}
                  />
                  <Slider
                    label="Vertical position"
                    suffix="%"
                    min={0}
                    max={100}
                    value={focusY}
                    onChange={(e) => setFocusY(Number(e.target.value))}
                  />
                </>
              )}

              <Field label="Background colour" htmlFor="sr-bg" hint="Fills padding and any transparency.">
                <div className="flex gap-2">
                  <input
                    id="sr-bg"
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                  />
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {["#ffffff", "#000000", "#11224a", "#18818a", "#f1f5f9"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBackground(c)}
                        aria-label={`Use background ${c}`}
                        className="size-7 rounded-full border border-[var(--border-strong)]"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </Field>
            </ToolPanel>

            <ToolPanel title="Export">
              <SegmentedControl<OutputFormat>
                ariaLabel="Output format"
                value={format}
                onChange={setFormat}
                options={[
                  { value: "image/jpeg", label: "JPG" },
                  { value: "image/png", label: "PNG" },
                  { value: "image/webp", label: "WebP" },
                ]}
              />
              {format !== "image/png" && (
                <Slider
                  label="Quality"
                  suffix="%"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              )}

              <Button onClick={generate} disabled={busy} className="w-full">
                {busy ? <Spinner /> : <Crop />}
                {busy ? "Rendering…" : `Create ${preset.width}×${preset.height} image`}
              </Button>

              {result && (
                <Button variant="accent" onClick={download} className="w-full">
                  <Download />
                  Download ({formatBytes(result.blob.size)})
                </Button>
              )}

              {error && <Alert tone="error">{error}</Alert>}
              <PrivacyNote />
            </ToolPanel>

            <Button
              variant="ghost"
              onClick={() => {
                bitmap?.close();
                setBitmap(null);
                setFile(null);
                setResult((prev) => {
                  if (prev) URL.revokeObjectURL(prev.url);
                  return null;
                });
              }}
            >
              Choose a different image
            </Button>
          </div>

          <ToolPanel
            title="Preview"
            description={`${group.label} · ${preset.label} · ${preset.width} × ${preset.height}px${preset.note ? ` (${preset.note})` : ""}`}
          >
            <div className="flex justify-center rounded-lg bg-[var(--bg-muted)] p-4">
              <canvas
                ref={canvasRef}
                className="max-h-[520px] max-w-full rounded border border-[var(--border)] shadow-card"
                aria-label={`Preview of ${preset.label} at ${preset.width} by ${preset.height} pixels`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta label="Source" value={`${bitmap?.width ?? 0}×${bitmap?.height ?? 0}`} />
              <Meta label="Output" value={`${preset.width}×${preset.height}`} />
              <Meta label="Fit" value={fit === "cover" ? "Cover (crop)" : "Contain (pad)"} />
              <Meta
                label="File"
                value={result ? formatBytes(result.blob.size) : "Not generated"}
              />
            </div>

            <Alert tone="info">
              Keep important content inside the middle 80% — covers and banners crop differently on
              mobile than on desktop.
            </Alert>
          </ToolPanel>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
      <p className="text-xs text-[var(--fg-subtle)]">{label}</p>
      <p className="tabular mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
