"use client";

import * as React from "react";
import { Download, FileArchive, Trash2 } from "lucide-react";
import { Alert, Button, Field, Select, Slider, Spinner, Stat } from "@/components/ui";
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
import { downloadBlob, formatBytes, stripExtension, uid } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * One converter serving every "X to Y" route.
 *
 * The slug decides which formats are on offer and what the page calls itself;
 * the conversion is identical in every case, which is why there is one
 * component rather than five near-copies drifting apart.
 *
 * Everything runs on the device — files are decoded with createImageBitmap and
 * re-encoded through canvas, and nothing is uploaded.
 */

interface Profile {
  /** Formats the visitor may pick between. One entry means it is fixed. */
  targets: OutputFormat[];
  accept: string[];
  acceptLabel: string;
  /** Extra line under the dropzone. */
  hint?: string;
}

const ANY_IMAGE = ACCEPTED_IMAGE_TYPES;

const PROFILES: Record<string, Profile> = {
  "image-converter": {
    targets: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    accept: ANY_IMAGE,
    acceptLabel: "JPG, PNG, WebP, AVIF, GIF or BMP",
  },
  "jpg-to-png-converter": {
    targets: ["image/png"],
    accept: ["image/jpeg", ".jpg", ".jpeg"],
    acceptLabel: "JPG",
    hint: "PNG is lossless, so the result will usually be larger than the JPG you started with.",
  },
  "png-to-jpg-converter": {
    targets: ["image/jpeg"],
    accept: ["image/png", ".png"],
    acceptLabel: "PNG",
    hint: "JPG has no transparency. Anything see-through is painted onto the background colour below.",
  },
  "webp-converter": {
    targets: ["image/png", "image/jpeg"],
    accept: ["image/webp", ".webp"],
    acceptLabel: "WebP",
    hint: "Converts WebP to PNG or JPG for software that cannot read WebP.",
  },
  "image-to-webp-converter": {
    targets: ["image/webp"],
    accept: ANY_IMAGE,
    acceptLabel: "JPG, PNG, AVIF, GIF or BMP",
    hint: "WebP is typically 25–35% smaller than JPG at the same visual quality.",
  },
};

interface Job {
  id: string;
  name: string;
  file: File;
  width: number;
  height: number;
  originalSize: number;
  result?: { blob: Blob; url: string };
  error?: string;
}

export function ImageConverter({ toolSlug }: { toolSlug: string }) {
  const profile = PROFILES[toolSlug] ?? PROFILES["image-converter"];

  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [format, setFormat] = React.useState<OutputFormat>(profile.targets[0]);
  const [quality, setQuality] = React.useState(88);
  const [background, setBackground] = React.useState("#ffffff");
  const [busy, setBusy] = React.useState(false);
  const [zipping, setZipping] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const jobsRef = React.useRef<Job[]>([]);
  jobsRef.current = jobs;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  // Object URLs are only freed on unmount, so previews stay valid until then.
  React.useEffect(
    () => () => {
      for (const job of jobsRef.current) if (job.result) URL.revokeObjectURL(job.result.url);
    },
    [],
  );

  const lossless = format === "image/png";

  const addFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const created: Job[] = [];
    for (const item of accepted) {
      try {
        const { bitmap } = await loadImage(item.file);
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          width: bitmap.width,
          height: bitmap.height,
          originalSize: item.file.size,
        });
        bitmap.close();
      } catch (error) {
        created.push({
          id: item.id,
          name: item.name,
          file: item.file,
          width: 0,
          height: 0,
          originalSize: item.file.size,
          error: error instanceof Error ? error.message : "That image could not be read.",
        });
      }
    }
    setJobs((prev) => [...prev, ...created]);
  }, []);

  const convert = React.useCallback(async () => {
    setBusy(true);
    setNotice(null);

    if (!(await isFormatSupported(format))) {
      setNotice(
        `This browser cannot save ${FORMAT_LABELS[format]} images. Pick another format — WebP and JPG work everywhere.`,
      );
      setBusy(false);
      return;
    }

    const next: Job[] = [];
    for (const job of jobsRef.current) {
      if (job.error) {
        next.push(job);
        continue;
      }
      try {
        const { bitmap } = await loadImage(job.file);
        const rendered = await renderImage(bitmap, {
          width: bitmap.width,
          height: bitmap.height,
          format,
          quality: quality / 100,
          background: format === "image/jpeg" ? background : undefined,
        });
        bitmap.close();
        if (job.result) URL.revokeObjectURL(job.result.url);
        next.push({ ...job, result: { blob: rendered.blob, url: URL.createObjectURL(rendered.blob) } });
      } catch (error) {
        next.push({
          ...job,
          result: undefined,
          error:
            error instanceof ImageProcessingError
              ? error.message
              : "That image could not be converted.",
        });
      }
    }

    setJobs(next);
    setBusy(false);
    track("tool_completed", { tool: toolSlug });
  }, [background, format, quality, toolSlug]);

  const outputName = (job: Job) => `${stripExtension(job.name)}.${FORMAT_EXTENSIONS[format]}`;

  const done = jobs.filter((j) => j.result);
  const totalBefore = done.reduce((sum, j) => sum + j.originalSize, 0);
  const totalAfter = done.reduce((sum, j) => sum + (j.result?.blob.size ?? 0), 0);

  return (
    <div className="space-y-6">
      <ToolPanel
        title="Your images"
        description={profile.hint ?? "Add as many as you like — they are converted one after another on your device."}
      >
        <FileUploader
          accept={profile.accept}
          acceptLabel={profile.acceptLabel}
          multiple
          maxFiles={40}
          onFiles={addFiles}
          disabled={busy}
        />

        {jobs.length > 0 && (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <FileRow
                key={job.id}
                name={job.name}
                size={job.originalSize}
                meta={
                  job.error ? (
                    <span className="text-[var(--error)]">{job.error}</span>
                  ) : (
                    `${job.width} × ${job.height}`
                  )
                }
                onRemove={() => {
                  if (job.result) URL.revokeObjectURL(job.result.url);
                  setJobs((prev) => prev.filter((j) => j.id !== job.id));
                }}
                actions={
                  job.result ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBlob(job.result!.blob, outputName(job))}
                    >
                      <Download className="size-3.5" />
                      {formatBytes(job.result.blob.size)}
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </ul>
        )}

        {jobs.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              for (const job of jobs) if (job.result) URL.revokeObjectURL(job.result.url);
              setJobs([]);
            }}
          >
            <Trash2 className="size-3.5" />
            Remove all
          </Button>
        )}
      </ToolPanel>

      <ToolPanel title="Output">
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.targets.length > 1 && (
            <Field label="Convert to" htmlFor={`${toolSlug}-format`}>
              <Select
                id={`${toolSlug}-format`}
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
              >
                {profile.targets.map((target) => (
                  <option key={target} value={target}>
                    {FORMAT_LABELS[target]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {format === "image/jpeg" && (
            <Field
              label="Background behind transparency"
              htmlFor={`${toolSlug}-bg`}
              hint="JPG cannot store transparency."
            >
              <div className="flex gap-2">
                <label
                  className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--border-strong)]"
                  style={{ backgroundColor: background }}
                >
                  <span className="sr-only">Pick a background colour</span>
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
                <output className="flex h-10 flex-1 items-center rounded-lg border border-[var(--border-strong)] px-3 font-mono text-sm">
                  {background}
                </output>
              </div>
            </Field>
          )}

          {!lossless && (
            <div className="sm:col-span-2">
              <Slider
                label="Quality"
                value={quality}
                suffix="%"
                min={40}
                max={100}
                step="1"
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                85–92% is usually indistinguishable from the original at a fraction of the size.
              </p>
            </div>
          )}

          {lossless && (
            <p className="text-sm text-[var(--fg-muted)] sm:col-span-2">
              PNG is lossless, so there is no quality setting — every pixel is preserved exactly.
            </p>
          )}
        </div>

        <Button onClick={convert} disabled={busy || jobs.length === 0} className="w-full">
          {busy ? <Spinner /> : <Download className="size-4" />}
          {busy
            ? "Converting…"
            : `Convert ${jobs.length || ""} image${jobs.length === 1 ? "" : "s"} to ${FORMAT_LABELS[format]}`}
        </Button>

        {notice && <Alert tone="warning">{notice}</Alert>}

        {done.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Converted" value={String(done.length)} tone="accent" />
              <Stat label="Before" value={formatBytes(totalBefore)} />
              <Stat
                label="After"
                value={formatBytes(totalAfter)}
                sub={
                  totalBefore > 0
                    ? `${totalAfter <= totalBefore ? "−" : "+"}${Math.abs(
                        Math.round(((totalBefore - totalAfter) / totalBefore) * 100),
                      )}%`
                    : undefined
                }
                tone={totalAfter <= totalBefore ? "success" : "warning"}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {done.length === 1 && (
                <Button onClick={() => downloadBlob(done[0].result!.blob, outputName(done[0]))}>
                  <Download className="size-4" />
                  Download {FORMAT_LABELS[format]}
                </Button>
              )}
              {done.length > 1 && (
                <Button
                  disabled={zipping}
                  onClick={async () => {
                    setZipping(true);
                    try {
                      const zip = await zipFiles(
                        done.map((job) => ({ name: outputName(job), blob: job.result!.blob })),
                      );
                      downloadBlob(zip, `converted-images-${uid("")}.zip`.replace("_", ""));
                      track("download_clicked", { tool: toolSlug });
                    } finally {
                      setZipping(false);
                    }
                  }}
                >
                  {zipping ? <Spinner /> : <FileArchive className="size-4" />}
                  {zipping ? "Zipping…" : `Download all ${done.length} as a ZIP`}
                </Button>
              )}
            </div>

            {totalAfter > totalBefore && (
              <Alert tone="info">
                The converted files are larger than the originals. That is expected when converting
                a compressed format such as JPG into a lossless one such as PNG.
              </Alert>
            )}
          </>
        )}

        <PrivacyNote>
          Your images are processed locally in your browser and are never uploaded to a server.
        </PrivacyNote>
      </ToolPanel>
    </div>
  );
}
