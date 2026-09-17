"use client";

import * as React from "react";
import { Download, FileArchive, ImageDown } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Input,
  Progress,
  SegmentedControl,
  Slider,
  Spinner,
  Stat,
} from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  canvasToBlob,
  inspectPdf,
  MAX_PDF_BYTES,
  openForRender,
  parsePageRanges,
  PDF_ACCEPT,
  PdfError,
} from "./core";
import { isFormatSupported, zipFiles, type OutputFormat } from "@/features/images/canvas";
import { downloadBlob, formatBytes, stripExtension } from "@/lib/utils";
import { track } from "@/lib/analytics";

type PageMode = "all" | "range";

const FORMATS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

interface Output {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export function PdfToImage({ toolSlug }: { toolSlug: string }) {
  const [doc, setDoc] = React.useState<{ name: string; bytes: Uint8Array; pageCount: number } | null>(
    null,
  );
  const [format, setFormat] = React.useState<OutputFormat>("image/png");
  const [scale, setScale] = React.useState(2);
  const [quality, setQuality] = React.useState(92);
  const [pageMode, setPageMode] = React.useState<PageMode>("all");
  const [rangeInput, setRangeInput] = React.useState("1-5");
  const [outputs, setOutputs] = React.useState<Output[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const outputsRef = React.useRef<Output[]>([]);
  outputsRef.current = outputs;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      for (const o of outputsRef.current) URL.revokeObjectURL(o.url);
    },
    [],
  );

  const onFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const item = accepted[0];
    if (!item) return;
    setError(null);
    for (const o of outputsRef.current) URL.revokeObjectURL(o.url);
    setOutputs([]);
    try {
      const info = await inspectPdf(item.file, item.name);
      setDoc({ name: item.name, bytes: info.bytes, pageCount: info.pageCount });
      setRangeInput(`1-${Math.min(5, info.pageCount)}`);
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "That PDF could not be opened.");
    }
  }, []);

  const parsed = React.useMemo(
    () => (doc ? parsePageRanges(rangeInput, doc.pageCount) : { ranges: [], errors: [] }),
    [rangeInput, doc],
  );

  const selectedPages = React.useMemo(() => {
    if (!doc) return [];
    if (pageMode === "all") return Array.from({ length: doc.pageCount }, (_, i) => i + 1);
    const set = new Set<number>();
    for (const range of parsed.ranges) for (const i of range.indices) set.add(i + 1);
    return [...set].sort((a, b) => a - b);
  }, [doc, pageMode, parsed]);

  const convert = async () => {
    if (!doc || selectedPages.length === 0) return;
    setBusy(true);
    setError(null);
    setProgress(0);

    if (!(await isFormatSupported(format))) {
      setError(
        `Your browser cannot encode ${FORMATS.find((f) => f.value === format)?.label}. Try PNG or JPG.`,
      );
      setBusy(false);
      return;
    }

    for (const o of outputsRef.current) URL.revokeObjectURL(o.url);
    setOutputs([]);

    let handle;
    try {
      handle = await openForRender(doc.bytes, doc.name);
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "That PDF could not be rendered.");
      setBusy(false);
      return;
    }

    const produced: Output[] = [];
    try {
      for (const [index, page] of selectedPages.entries()) {
        const rendered = await handle.renderPage(page, scale);
        const blob = await canvasToBlob(
          rendered.canvas,
          format,
          format === "image/png" ? undefined : quality / 100,
        );
        produced.push({
          pageNumber: page,
          blob,
          url: URL.createObjectURL(blob),
          width: rendered.width,
          height: rendered.height,
        });
        rendered.canvas.width = 0;
        rendered.canvas.height = 0;
        setProgress(((index + 1) / selectedPages.length) * 100);
        // Yield so the progress bar actually paints on long documents.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      setOutputs(produced);
      track("tool_completed", { tool: toolSlug, count: produced.length });
    } catch (err) {
      for (const o of produced) URL.revokeObjectURL(o.url);
      setError(
        err instanceof PdfError
          ? err.message
          : "Conversion failed. Try a lower resolution — very large pages can exhaust browser memory.",
      );
    } finally {
      await handle.destroy();
      setBusy(false);
      setProgress(0);
    }
  };

  const ext = FORMATS.find((f) => f.value === format)?.ext ?? "png";

  const downloadOne = (output: Output) => {
    if (!doc) return;
    const pad = String(doc.pageCount).length;
    downloadBlob(
      output.blob,
      `${stripExtension(doc.name)}-page-${String(output.pageNumber).padStart(pad, "0")}.${ext}`,
    );
    track("download_clicked", { tool: toolSlug });
  };

  const downloadAll = async () => {
    if (!doc || outputs.length === 0) return;
    setBusy(true);
    try {
      const pad = String(doc.pageCount).length;
      const blob = await zipFiles(
        outputs.map((o) => ({
          name: `${stripExtension(doc.name)}-page-${String(o.pageNumber).padStart(pad, "0")}.${ext}`,
          blob: o.blob,
        })),
      );
      downloadBlob(blob, `${stripExtension(doc.name)}-images.zip`);
      track("download_clicked", { tool: toolSlug, format: "zip" });
    } catch {
      setError("The ZIP could not be created. Try downloading the images individually.");
    } finally {
      setBusy(false);
    }
  };

  if (!doc) {
    return (
      <div className="space-y-4">
        <FileUploader
          accept={PDF_ACCEPT}
          acceptLabel="a PDF file"
          maxSize={MAX_PDF_BYTES}
          onFiles={onFiles}
        />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    );
  }

  const totalSize = outputs.reduce((sum, o) => sum + o.blob.size, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <ToolPanel title="Settings" description={`${doc.name} · ${doc.pageCount} pages`}>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--fg)]">Image format</p>
            <SegmentedControl<OutputFormat>
              ariaLabel="Image format"
              value={format}
              onChange={setFormat}
              options={FORMATS.map((f) => ({ value: f.value, label: f.label }))}
            />
            <p className="mt-2 text-xs text-[var(--fg-subtle)]">
              {format === "image/png"
                ? "Lossless — best for text, diagrams and anything that must stay crisp."
                : format === "image/jpeg"
                  ? "Smaller files, best for photographic pages."
                  : "Smaller than JPG at the same quality, with modern browser support."}
            </p>
          </div>

          <Slider
            label="Resolution"
            suffix="×"
            min={1}
            max={4}
            step={0.5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
          <p className="-mt-1 text-xs text-[var(--fg-subtle)]">
            Roughly {Math.round(72 * scale)} DPI.{" "}
            {scale >= 3 ? "Print quality — slower and memory-hungry." : "Good for screen use."}
          </p>

          {format !== "image/png" && (
            <Slider
              label="Quality"
              suffix="%"
              min={30}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--fg)]">Pages</p>
            <SegmentedControl<PageMode>
              ariaLabel="Page selection"
              value={pageMode}
              onChange={setPageMode}
              options={[
                { value: "all", label: `All ${doc.pageCount}` },
                { value: "range", label: "Specific pages" },
              ]}
            />
          </div>

          {pageMode === "range" && (
            <Field label="Page numbers or ranges" htmlFor="p2i-range">
              <Input
                id="p2i-range"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="1-5, 8, 11-20"
                invalid={parsed.errors.length > 0}
              />
            </Field>
          )}

          {parsed.errors.length > 0 && pageMode === "range" && (
            <Alert tone="error">
              <ul className="space-y-0.5">
                {parsed.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Button
            onClick={convert}
            disabled={busy || selectedPages.length === 0}
            className="w-full"
          >
            {busy ? <Spinner /> : <ImageDown />}
            {busy
              ? "Converting…"
              : `Convert ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}`}
          </Button>

          {busy && progress > 0 && <Progress value={progress} label="Rendering pages" />}
          {error && <Alert tone="error">{error}</Alert>}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => {
              for (const o of outputsRef.current) URL.revokeObjectURL(o.url);
              setOutputs([]);
              setDoc(null);
            }}
          >
            Choose a different PDF
          </Button>

          <PrivacyNote />
        </ToolPanel>
      </div>

      <ToolPanel
        title={outputs.length > 0 ? `Images (${outputs.length})` : "Output"}
        footer={
          outputs.length > 1 ? (
            <Button variant="outline" size="sm" onClick={downloadAll} disabled={busy}>
              <FileArchive className="size-3.5" />
              Download all as ZIP
            </Button>
          ) : undefined
        }
      >
        {outputs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
            <ImageDown className="mx-auto size-8 text-[var(--fg-subtle)]" aria-hidden="true" />
            <p className="mt-3 font-medium">No images yet</p>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Choose your settings and press Convert.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Images" value={outputs.length} tone="accent" />
              <Stat label="Total size" value={formatBytes(totalSize)} />
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {outputs.map((output) => (
                <li
                  key={output.pageNumber}
                  className="overflow-hidden rounded-lg border border-[var(--border)]"
                >
                  <div className="flex items-center justify-center bg-[var(--bg-muted)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={output.url}
                      alt={`Page ${output.pageNumber}`}
                      className="max-h-48 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Page {output.pageNumber}</p>
                      <p className="tabular text-xs text-[var(--fg-subtle)]">
                        {output.width}×{output.height} · {formatBytes(output.blob.size)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0"
                      onClick={() => downloadOne(output)}
                      aria-label={`Download page ${output.pageNumber}`}
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </ToolPanel>
    </div>
  );
}
