"use client";

import * as React from "react";
import { Download, FileArchive, Link, Link2Off, Scaling, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Input,
  Progress,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Stat,
} from "@/components/ui";
import { FileUploader, FileRow, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  ACCEPTED_IMAGE_TYPES,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  ImageProcessingError,
  isFormatSupported,
  loadImage,
  lockedDimension,
  renderImage,
  zipFiles,
  type OutputFormat,
} from "./canvas";
import { generalPresets } from "./presets";
import { downloadBlob, formatBytes, stripExtension, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Mode = "pixels" | "percent";

interface Job {
  id: string;
  name: string;
  file: File;
  width: number;
  height: number;
  originalSize: number;
  previewUrl: string;
  result?: { blob: Blob; url: string; width: number; height: number };
  error?: string;
}

export function ImageResizer({ toolSlug }: { toolSlug: string }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [mode, setMode] = React.useState<Mode>("pixels");
  const [width, setWidth] = React.useState("1200");
  const [height, setHeight] = React.useState("800");
  const [percent, setPercent] = React.useState(50);
  const [lockRatio, setLockRatio] = React.useState(true);
  const [format, setFormat] = React.useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = React.useState(85);
  const [processing, setProcessing] = React.useState(false);
  const [zipping, setZipping] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);

  const jobsRef = React.useRef<Job[]>([]);
  jobsRef.current = jobs;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      for (const job of jobsRef.current) {
        URL.revokeObjectURL(job.previewUrl);
        if (job.result) URL.revokeObjectURL(job.result.url);
      }
    },
    [],
  );

  const first = jobs.find((j) => !j.error);

  const addFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const created: Job[] = [];
    for (const item of accepted) {
      try {
        const { bitmap, width: w, height: h } = await loadImage(item.file);
        bitmap.close();
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          width: w,
          height: h,
          originalSize: item.file.size,
          previewUrl: URL.createObjectURL(item.file),
        });
      } catch (error) {
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          width: 0,
          height: 0,
          originalSize: item.file.size,
          previewUrl: "",
          error: error instanceof ImageProcessingError ? error.message : "Unreadable image.",
        });
      }
    }
    setJobs((prev) => {
      const next = [...prev, ...created];
      // Seed the dimension fields from the first image added.
      const seed = created.find((c) => !c.error);
      if (prev.length === 0 && seed) {
        setWidth(String(seed.width));
        setHeight(String(seed.height));
      }
      return next;
    });
  }, []);

  const applyPreset = (presetId: string) => {
    const preset = generalPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setMode("pixels");
    setLockRatio(false);
    setWidth(String(preset.width));
    setHeight(String(preset.height));
  };

  const onWidthChange = (value: string) => {
    setWidth(value);
    if (lockRatio && first) {
      const next = lockedDimension("width", toNumber(value, 1), first.width, first.height);
      setHeight(String(next.height));
    }
  };

  const onHeightChange = (value: string) => {
    setHeight(value);
    if (lockRatio && first) {
      const next = lockedDimension("height", toNumber(value, 1), first.width, first.height);
      setWidth(String(next.width));
    }
  };

  const targetFor = (job: Job) => {
    if (mode === "percent") {
      const scale = Math.max(1, percent) / 100;
      return { width: Math.round(job.width * scale), height: Math.round(job.height * scale) };
    }
    const w = Math.max(1, toNumber(width, 1));
    const h = Math.max(1, toNumber(height, 1));
    if (!lockRatio) return { width: w, height: h };
    // With the ratio locked, fit inside the box rather than distorting.
    const scale = Math.min(w / job.width, h / job.height);
    return {
      width: Math.max(1, Math.round(job.width * scale)),
      height: Math.max(1, Math.round(job.height * scale)),
    };
  };

  const upscaling = React.useMemo(() => {
    if (mode === "percent") return percent > 100;
    return jobs.some((job) => {
      if (job.error) return false;
      const t = targetFor(job);
      return t.width > job.width || t.height > job.height;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, mode, percent, width, height, lockRatio]);

  const resizeAll = async () => {
    const pending = jobs.filter((j) => !j.error);
    if (pending.length === 0) return;

    setProcessing(true);
    setNotice(null);

    if (!(await isFormatSupported(format))) {
      setNotice(`Your browser cannot encode ${FORMAT_LABELS[format]}. Try WebP or JPG.`);
      setProcessing(false);
      return;
    }

    for (const job of pending) {
      try {
        const { bitmap } = await loadImage(job.file);
        const target = targetFor(job);
        const result = await renderImage(bitmap, {
          width: target.width,
          height: target.height,
          format,
          quality: quality / 100,
        });
        bitmap.close();

        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== job.id) return j;
            if (j.result) URL.revokeObjectURL(j.result.url);
            return {
              ...j,
              error: undefined,
              result: {
                blob: result.blob,
                url: URL.createObjectURL(result.blob),
                width: result.width,
                height: result.height,
              },
            };
          }),
        );
      } catch (error) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  error:
                    error instanceof ImageProcessingError
                      ? error.message
                      : "This image could not be resized.",
                }
              : j,
          ),
        );
      }
    }

    setProcessing(false);
    track("tool_completed", { tool: toolSlug, count: pending.length });
  };

  const downloadOne = (job: Job) => {
    if (!job.result) return;
    downloadBlob(
      job.result.blob,
      `${stripExtension(job.name)}-${job.result.width}x${job.result.height}.${FORMAT_EXTENSIONS[format]}`,
    );
    track("download_clicked", { tool: toolSlug });
  };

  const downloadZip = async () => {
    const ready = jobs.filter((j) => j.result);
    if (ready.length === 0) return;
    setZipping(true);
    setZipProgress(0);
    try {
      const blob = await zipFiles(
        ready.map((job) => ({
          name: `${stripExtension(job.name)}-${job.result!.width}x${job.result!.height}.${FORMAT_EXTENSIONS[format]}`,
          blob: job.result!.blob,
        })),
        setZipProgress,
      );
      downloadBlob(blob, "resized-images.zip");
      track("download_clicked", { tool: toolSlug, format: "zip" });
    } catch {
      setNotice("The ZIP could not be created. Try downloading the images individually.");
    } finally {
      setZipping(false);
    }
  };

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id);
      if (job) {
        URL.revokeObjectURL(job.previewUrl);
        if (job.result) URL.revokeObjectURL(job.result.url);
      }
      return prev.filter((j) => j.id !== id);
    });
  };

  const done = jobs.filter((j) => j.result);

  return (
    <div className="space-y-6">
      <FileUploader
        accept={ACCEPTED_IMAGE_TYPES}
        acceptLabel="JPG, PNG, WebP or AVIF"
        multiple
        maxSize={25 * 1024 * 1024}
        maxFiles={40}
        onFiles={addFiles}
      />

      {jobs.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <ToolPanel title="Size">
              <SegmentedControl<Mode>
                ariaLabel="Resize mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "pixels", label: "Pixels" },
                  { value: "percent", label: "Percentage" },
                ]}
              />

              {mode === "pixels" ? (
                <>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <Field label="Width" htmlFor="ir-w">
                      <Input
                        id="ir-w"
                        type="number"
                        min={1}
                        max={10000}
                        value={width}
                        onChange={(e) => onWidthChange(e.target.value)}
                      />
                    </Field>
                    <Button
                      variant={lockRatio ? "accent" : "outline"}
                      size="icon"
                      className="mb-0.5"
                      onClick={() => setLockRatio((v) => !v)}
                      aria-pressed={lockRatio}
                      aria-label={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                      title={lockRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                    >
                      {lockRatio ? <Link className="size-4" /> : <Link2Off className="size-4" />}
                    </Button>
                    <Field label="Height" htmlFor="ir-h">
                      <Input
                        id="ir-h"
                        type="number"
                        min={1}
                        max={10000}
                        value={height}
                        onChange={(e) => onHeightChange(e.target.value)}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-[var(--fg-subtle)]">
                    {lockRatio
                      ? "Aspect ratio locked — images fit inside these dimensions without distortion."
                      : "Aspect ratio unlocked — images are stretched to exactly these dimensions."}
                  </p>

                  <Field label="Preset" htmlFor="ir-preset">
                    <Select
                      id="ir-preset"
                      defaultValue=""
                      onChange={(e) => e.target.value && applyPreset(e.target.value)}
                    >
                      <option value="">Choose a preset…</option>
                      {generalPresets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} — {p.width}×{p.height}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : (
                <Slider
                  label="Scale"
                  suffix="%"
                  min={5}
                  max={200}
                  step={5}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                />
              )}

              {upscaling && (
                <Alert tone="warning">
                  You are enlarging beyond the original resolution. The extra pixels have to be
                  invented, so the result will look softer than the source.
                </Alert>
              )}
            </ToolPanel>

            <ToolPanel title="Output">
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
              {format === "image/png" && (
                <p className="text-xs text-[var(--fg-subtle)]">
                  PNG is lossless, so there is no quality setting. Files will be larger.
                </p>
              )}

              <Button onClick={resizeAll} disabled={processing} className="w-full">
                {processing ? <Spinner /> : <Scaling />}
                {processing ? "Resizing…" : `Resize ${jobs.length} image${jobs.length === 1 ? "" : "s"}`}
              </Button>

              {notice && <Alert tone="error">{notice}</Alert>}
              <PrivacyNote />
            </ToolPanel>

            {done.length > 1 && (
              <ToolPanel title="Download">
                <Button variant="outline" onClick={downloadZip} disabled={zipping} className="w-full">
                  {zipping ? <Spinner /> : <FileArchive />}
                  {zipping ? "Building ZIP…" : `Download all as ZIP (${done.length})`}
                </Button>
                {zipping && <Progress value={zipProgress} label="Compressing archive" />}
              </ToolPanel>
            )}
          </div>

          <ToolPanel
            title={`Images (${jobs.length})`}
            footer={
              <Button variant="ghost" size="sm" onClick={() => jobs.forEach((j) => removeJob(j.id))}>
                <Trash2 className="size-3.5" />
                Clear all
              </Button>
            }
          >
            {done.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Resized"
                  value={`${done.length} / ${jobs.length}`}
                  tone="success"
                />
                <Stat
                  label="Total output"
                  value={formatBytes(done.reduce((s, j) => s + (j.result?.blob.size ?? 0), 0))}
                />
              </div>
            )}

            <ul className="space-y-2">
              {jobs.map((job) => {
                const target = job.error ? null : targetFor(job);
                return (
                  <li key={job.id}>
                    <FileRow
                      name={job.name}
                      size={job.originalSize}
                      meta={
                        job.error ? (
                          <span className="text-[var(--error)]">{job.error}</span>
                        ) : job.result ? (
                          <span className="text-[var(--success)]">
                            {job.width}×{job.height} → {job.result.width}×{job.result.height} ·{" "}
                            {formatBytes(job.result.blob.size)}
                          </span>
                        ) : (
                          `${job.width}×${job.height} → ${target?.width}×${target?.height}`
                        )
                      }
                      leading={
                        job.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.result?.url ?? job.previewUrl}
                            alt=""
                            className="size-10 shrink-0 rounded object-cover"
                          />
                        ) : undefined
                      }
                      actions={
                        job.result ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => downloadOne(job)}
                            aria-label={`Download ${job.name}`}
                          >
                            <Download className="size-4" />
                          </Button>
                        ) : undefined
                      }
                      onRemove={() => removeJob(job.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </ToolPanel>
        </div>
      )}
    </div>
  );
}
