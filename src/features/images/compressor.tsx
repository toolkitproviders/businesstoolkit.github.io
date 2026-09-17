"use client";

import * as React from "react";
import { Download, FileArchive, ImageIcon, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  Progress,
  SegmentedControl,
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
  renderImage,
  zipFiles,
  type OutputFormat,
} from "./canvas";
import { cn, downloadBlob, formatBytes, stripExtension, toNumber } from "@/lib/utils";
import { track } from "@/lib/analytics";

type FormatChoice = "original" | OutputFormat;

interface Job {
  id: string;
  name: string;
  file: File;
  originalSize: number;
  width: number;
  height: number;
  originalUrl: string;
  result?: { blob: Blob; url: string; width: number; height: number };
  error?: string;
  busy: boolean;
}

const MAX_FILE = 25 * 1024 * 1024;

export function ImageCompressor({ toolSlug }: { toolSlug: string }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [quality, setQuality] = React.useState(80);
  const [format, setFormat] = React.useState<FormatChoice>("original");
  const [limitWidth, setLimitWidth] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState("1920");
  const [processing, setProcessing] = React.useState(false);
  const [zipping, setZipping] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState(0);
  const [compareId, setCompareId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const jobsRef = React.useRef<Job[]>([]);
  jobsRef.current = jobs;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  // Object URLs are per-job; release them when the component goes away.
  React.useEffect(
    () => () => {
      for (const job of jobsRef.current) {
        URL.revokeObjectURL(job.originalUrl);
        if (job.result) URL.revokeObjectURL(job.result.url);
      }
    },
    [],
  );

  const addFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const created: Job[] = [];
    for (const item of accepted) {
      try {
        const { bitmap, width, height } = await loadImage(item.file);
        bitmap.close();
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          originalSize: item.file.size,
          width,
          height,
          originalUrl: URL.createObjectURL(item.file),
          busy: false,
        });
      } catch (error) {
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          originalSize: item.file.size,
          width: 0,
          height: 0,
          originalUrl: "",
          busy: false,
          error:
            error instanceof ImageProcessingError
              ? error.message
              : "That image could not be read.",
        });
      }
    }
    setJobs((prev) => [...prev, ...created]);
  }, []);

  const removeJob = (id: string) => {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id);
      if (job) {
        URL.revokeObjectURL(job.originalUrl);
        if (job.result) URL.revokeObjectURL(job.result.url);
      }
      return prev.filter((j) => j.id !== id);
    });
    setCompareId((current) => (current === id ? null : current));
  };

  const clearAll = () => {
    for (const job of jobs) {
      URL.revokeObjectURL(job.originalUrl);
      if (job.result) URL.revokeObjectURL(job.result.url);
    }
    setJobs([]);
    setCompareId(null);
    setNotice(null);
  };

  const resolveFormat = (file: File): OutputFormat => {
    if (format !== "original") return format;
    const type = file.type.toLowerCase();
    if (type === "image/png") return "image/png";
    if (type === "image/webp") return "image/webp";
    if (type === "image/avif") return "image/avif";
    return "image/jpeg";
  };

  const compressAll = async () => {
    const pending = jobs.filter((j) => !j.error);
    if (pending.length === 0) return;

    setProcessing(true);
    setNotice(null);

    // Check encoder support once, up front, so we fail loudly not silently.
    if (format !== "original") {
      const supported = await isFormatSupported(format);
      if (!supported) {
        setNotice(
          `Your browser cannot encode ${FORMAT_LABELS[format]}. Choose WebP or JPG instead.`,
        );
        setProcessing(false);
        return;
      }
    }

    for (const job of pending) {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, busy: true } : j)));
      try {
        const { bitmap, width, height } = await loadImage(job.file);
        const cap = limitWidth ? Math.max(16, toNumber(maxWidth, 1920)) : Infinity;
        const scale = Math.min(1, cap / width);
        const targetFormat = resolveFormat(job.file);

        const result = await renderImage(bitmap, {
          width: Math.round(width * scale),
          height: Math.round(height * scale),
          format: targetFormat,
          quality: quality / 100,
        });
        bitmap.close();

        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== job.id) return j;
            if (j.result) URL.revokeObjectURL(j.result.url);
            return {
              ...j,
              busy: false,
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
                  busy: false,
                  error:
                    error instanceof ImageProcessingError
                      ? error.message
                      : "This image could not be compressed.",
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
    const ext = FORMAT_EXTENSIONS[resolveFormat(job.file)];
    downloadBlob(job.result.blob, `${stripExtension(job.name)}-compressed.${ext}`);
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
          name: `${stripExtension(job.name)}-compressed.${FORMAT_EXTENSIONS[resolveFormat(job.file)]}`,
          blob: job.result!.blob,
        })),
        setZipProgress,
      );
      downloadBlob(blob, "compressed-images.zip");
      track("download_clicked", { tool: toolSlug, format: "zip" });
    } catch {
      setNotice("The ZIP could not be created. Try downloading the images individually.");
    } finally {
      setZipping(false);
    }
  };

  const done = jobs.filter((j) => j.result);
  const totalOriginal = done.reduce((sum, j) => sum + j.originalSize, 0);
  const totalCompressed = done.reduce((sum, j) => sum + (j.result?.blob.size ?? 0), 0);
  const savedPercent =
    totalOriginal > 0 ? ((totalOriginal - totalCompressed) / totalOriginal) * 100 : 0;

  const compareJob = jobs.find((j) => j.id === compareId) ?? done[0];

  return (
    <div className="space-y-6">
      <FileUploader
        accept={ACCEPTED_IMAGE_TYPES}
        acceptLabel="JPG, PNG, WebP or AVIF"
        multiple
        maxSize={MAX_FILE}
        maxFiles={40}
        onFiles={addFiles}
      />

      {jobs.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <ToolPanel title="Compression settings">
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--fg)]">Output format</p>
                <SegmentedControl<FormatChoice>
                  ariaLabel="Output format"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: "original", label: "Keep" },
                    { value: "image/jpeg", label: "JPG" },
                    { value: "image/webp", label: "WebP" },
                    { value: "image/avif", label: "AVIF" },
                  ]}
                />
                <p className="mt-2 text-xs text-[var(--fg-subtle)]">
                  {format === "original"
                    ? "Each image keeps its own format. PNGs stay lossless."
                    : format === "image/avif"
                      ? "Smallest files, but slower to encode and not supported everywhere."
                      : format === "image/webp"
                        ? "The best default for the web — smaller than JPG at the same quality."
                        : "Universally supported. Best for photographs."}
                </p>
              </div>

              <Slider
                label="Quality"
                suffix="%"
                min={10}
                max={100}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <p className="-mt-1 text-xs text-[var(--fg-subtle)]">
                {quality >= 90
                  ? "Near-original. Larger files with little visible gain."
                  : quality >= 75
                    ? "The sweet spot — big savings, no visible difference."
                    : quality >= 60
                      ? "Noticeably smaller. Fine for thumbnails and backgrounds."
                      : "Heavy compression. Expect visible artefacts."}
              </p>

              <Checkbox
                label="Limit maximum width"
                description="Resizing first is usually the biggest saving."
                checked={limitWidth}
                onChange={(e) => setLimitWidth(e.target.checked)}
              />
              {limitWidth && (
                <Field label="Maximum width" htmlFor="ic-maxw">
                  <Input
                    id="ic-maxw"
                    type="number"
                    min={16}
                    max={10000}
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value)}
                  />
                </Field>
              )}

              <Button onClick={compressAll} disabled={processing} className="w-full">
                {processing ? <Spinner /> : <ImageIcon />}
                {processing ? "Compressing…" : `Compress ${jobs.length} image${jobs.length === 1 ? "" : "s"}`}
              </Button>

              {notice && <Alert tone="error">{notice}</Alert>}
              <PrivacyNote />
            </ToolPanel>

            {done.length > 0 && (
              <ToolPanel title="Savings">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Original" value={formatBytes(totalOriginal)} />
                  <Stat label="Compressed" value={formatBytes(totalCompressed)} tone="accent" />
                  <Stat
                    label="Saved"
                    value={`${savedPercent.toFixed(1)}%`}
                    tone={savedPercent > 0 ? "success" : "warning"}
                    sub={formatBytes(Math.max(0, totalOriginal - totalCompressed))}
                  />
                </div>
                {savedPercent <= 0 && (
                  <Alert tone="warning">
                    The output is no smaller than the original — the source is already well
                    compressed. Try a lower quality, or limit the width.
                  </Alert>
                )}
                {done.length > 1 && (
                  <>
                    <Button variant="outline" onClick={downloadZip} disabled={zipping} className="w-full">
                      {zipping ? <Spinner /> : <FileArchive />}
                      {zipping ? "Building ZIP…" : `Download all as ZIP (${done.length})`}
                    </Button>
                    {zipping && <Progress value={zipProgress} label="Compressing archive" />}
                  </>
                )}
              </ToolPanel>
            )}
          </div>

          <div className="space-y-4">
            {compareJob?.result && (
              <ToolPanel title="Before and after" description="Compare at full size before you download.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <figure>
                    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compareJob.originalUrl}
                        alt="Original"
                        className="mx-auto max-h-64 w-auto object-contain"
                      />
                    </div>
                    <figcaption className="mt-2 text-center text-xs text-[var(--fg-muted)]">
                      Original · {formatBytes(compareJob.originalSize)} · {compareJob.width}×
                      {compareJob.height}
                    </figcaption>
                  </figure>
                  <figure>
                    <div className="overflow-hidden rounded-lg border border-[var(--accent)] bg-[var(--bg-muted)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compareJob.result.url}
                        alt="Compressed"
                        className="mx-auto max-h-64 w-auto object-contain"
                      />
                    </div>
                    <figcaption className="mt-2 text-center text-xs text-[var(--accent)]">
                      Compressed · {formatBytes(compareJob.result.blob.size)} ·{" "}
                      {compareJob.result.width}×{compareJob.result.height}
                    </figcaption>
                  </figure>
                </div>
              </ToolPanel>
            )}

            <ToolPanel
              title={`Images (${jobs.length})`}
              footer={
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <Trash2 className="size-3.5" />
                  Clear all
                </Button>
              }
            >
              <ul className="space-y-2">
                {jobs.map((job) => {
                  const saved =
                    job.result && job.originalSize > 0
                      ? ((job.originalSize - job.result.blob.size) / job.originalSize) * 100
                      : null;
                  return (
                    <li key={job.id}>
                      <FileRow
                        name={job.name}
                        size={job.originalSize}
                        meta={
                          job.error ? (
                            <span className="text-[var(--error)]">{job.error}</span>
                          ) : job.busy ? (
                            "Compressing…"
                          ) : job.result ? (
                            <span>
                              → {formatBytes(job.result.blob.size)}{" "}
                              <span
                                className={cn(
                                  "font-medium",
                                  (saved ?? 0) > 0 ? "text-[var(--success)]" : "text-[var(--warning)]",
                                )}
                              >
                                ({saved !== null && saved > 0 ? "−" : "+"}
                                {Math.abs(saved ?? 0).toFixed(1)}%)
                              </span>
                            </span>
                          ) : (
                            `${job.width}×${job.height}`
                          )
                        }
                        leading={
                          job.originalUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={job.result?.url ?? job.originalUrl}
                              alt=""
                              className="size-10 shrink-0 rounded object-cover"
                            />
                          ) : undefined
                        }
                        actions={
                          job.result ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCompareId(job.id)}
                                aria-label={`Compare ${job.name}`}
                              >
                                Compare
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                onClick={() => downloadOne(job)}
                                aria-label={`Download ${job.name}`}
                              >
                                <Download className="size-4" />
                              </Button>
                            </div>
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
        </div>
      )}
    </div>
  );
}
