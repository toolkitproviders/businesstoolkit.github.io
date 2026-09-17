"use client";

import * as React from "react";
import { CheckCheck, FileArchive, Scissors, SquareDashed } from "lucide-react";
import {
  Alert,
  Button,
  Field,
  Input,
  Progress,
  SegmentedControl,
  Spinner,
  Stat,
} from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  extractPages,
  inspectPdf,
  MAX_PDF_BYTES,
  openForRender,
  parsePageRanges,
  PDF_ACCEPT,
  PdfError,
  pdfBlob,
} from "./core";
import { zipFiles } from "@/features/images/canvas";
import { cn, downloadBlob, formatBytes, stripExtension } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Mode = "select" | "ranges" | "every";

interface Thumb {
  pageNumber: number;
  url: string;
}

export function PdfSplitter({ toolSlug }: { toolSlug: string }) {
  const [doc, setDoc] = React.useState<{ name: string; size: number; bytes: Uint8Array; pageCount: number } | null>(
    null,
  );
  const [thumbs, setThumbs] = React.useState<Thumb[]>([]);
  const [thumbProgress, setThumbProgress] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [mode, setMode] = React.useState<Mode>("select");
  const [rangeInput, setRangeInput] = React.useState("1-5, 6-10");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const thumbsRef = React.useRef<Thumb[]>([]);
  thumbsRef.current = thumbs;
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      cancelledRef.current = true;
      for (const t of thumbsRef.current) URL.revokeObjectURL(t.url);
    },
    [],
  );

  const onFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    const item = accepted[0];
    if (!item) return;
    setError(null);
    setStatus(null);
    setSelected(new Set());
    for (const t of thumbsRef.current) URL.revokeObjectURL(t.url);
    setThumbs([]);
    setThumbProgress(0);

    try {
      const info = await inspectPdf(item.file, item.name);
      setDoc({ name: item.name, size: item.file.size, bytes: info.bytes, pageCount: info.pageCount });
      void renderThumbnails(info.bytes, item.name, info.pageCount);
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "That PDF could not be opened.");
    }
  }, []);

  /** Renders page thumbnails progressively so long documents stay responsive. */
  const renderThumbnails = async (bytes: Uint8Array, name: string, pageCount: number) => {
    cancelledRef.current = false;
    let handle;
    try {
      handle = await openForRender(bytes, name);
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "Page previews could not be generated.");
      return;
    }

    for (let page = 1; page <= pageCount; page += 1) {
      if (cancelledRef.current) break;
      try {
        const rendered = await handle.renderPage(page, 0.4);
        const blob = await new Promise<Blob | null>((resolve) =>
          rendered.canvas.toBlob(resolve, "image/jpeg", 0.7),
        );
        if (blob && !cancelledRef.current) {
          setThumbs((prev) => [...prev, { pageNumber: page, url: URL.createObjectURL(blob) }]);
        }
        // Free the backing store immediately; these add up on long documents.
        rendered.canvas.width = 0;
        rendered.canvas.height = 0;
      } catch {
        // A single unrenderable page should not stop the rest.
      }
      setThumbProgress((page / pageCount) * 100);
    }

    await handle.destroy();
  };

  const toggle = (page: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });

  const selectAll = () =>
    setSelected(new Set(Array.from({ length: doc?.pageCount ?? 0 }, (_, i) => i + 1)));

  const parsed = React.useMemo(
    () => (doc ? parsePageRanges(rangeInput, doc.pageCount) : { ranges: [], errors: [] }),
    [rangeInput, doc],
  );

  const extractSelection = async () => {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const indices = [...selected].sort((a, b) => a - b).map((p) => p - 1);
      const bytes = await extractPages(doc.bytes, indices, doc.name);
      downloadBlob(pdfBlob(bytes), `${stripExtension(doc.name)}-pages.pdf`);
      setStatus(`Extracted ${indices.length} page${indices.length === 1 ? "" : "s"}.`);
      track("tool_completed", { tool: toolSlug, count: indices.length });
      track("download_clicked", { tool: toolSlug });
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "Those pages could not be extracted.");
    } finally {
      setBusy(false);
    }
  };

  const splitByRanges = async () => {
    if (!doc) return;
    if (parsed.ranges.length === 0) {
      setError("Enter at least one valid page range, for example 1-5, 6-10.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const files: { name: string; blob: Blob }[] = [];
      for (const range of parsed.ranges) {
        const bytes = await extractPages(doc.bytes, range.indices, doc.name);
        files.push({
          name: `${stripExtension(doc.name)}-${range.label}.pdf`,
          blob: pdfBlob(bytes),
        });
      }
      if (files.length === 1) {
        downloadBlob(files[0].blob, files[0].name);
      } else {
        downloadBlob(await zipFiles(files), `${stripExtension(doc.name)}-split.zip`);
      }
      setStatus(`Created ${files.length} document${files.length === 1 ? "" : "s"}.`);
      track("tool_completed", { tool: toolSlug, count: files.length });
      track("download_clicked", { tool: toolSlug });
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "The PDF could not be split.");
    } finally {
      setBusy(false);
    }
  };

  const splitEveryPage = async () => {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const files: { name: string; blob: Blob }[] = [];
      const pad = String(doc.pageCount).length;
      for (let page = 1; page <= doc.pageCount; page += 1) {
        const bytes = await extractPages(doc.bytes, [page - 1], doc.name);
        files.push({
          name: `${stripExtension(doc.name)}-page-${String(page).padStart(pad, "0")}.pdf`,
          blob: pdfBlob(bytes),
        });
      }
      downloadBlob(await zipFiles(files), `${stripExtension(doc.name)}-pages.zip`);
      setStatus(`Split into ${files.length} single-page PDFs.`);
      track("tool_completed", { tool: toolSlug, count: files.length });
      track("download_clicked", { tool: toolSlug, format: "zip" });
    } catch (err) {
      setError(err instanceof PdfError ? err.message : "The PDF could not be split.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    cancelledRef.current = true;
    for (const t of thumbsRef.current) URL.revokeObjectURL(t.url);
    setThumbs([]);
    setDoc(null);
    setSelected(new Set());
    setError(null);
    setStatus(null);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <ToolPanel
        title={`${doc.name} — ${doc.pageCount} pages`}
        description={
          mode === "select"
            ? "Click pages to select them."
            : "Page previews are shown for reference."
        }
        footer={
          thumbProgress < 100 && thumbs.length < doc.pageCount ? (
            <Progress value={thumbProgress} label="Rendering page previews" />
          ) : (
            <p className="text-xs text-[var(--fg-subtle)]">
              {formatBytes(doc.size)} · previews rendered locally
            </p>
          )
        }
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: doc.pageCount }, (_, i) => i + 1).map((page) => {
            const thumb = thumbs.find((t) => t.pageNumber === page);
            const isSelected = selected.has(page);
            return (
              <button
                key={page}
                type="button"
                onClick={() => mode === "select" && toggle(page)}
                aria-pressed={mode === "select" ? isSelected : undefined}
                disabled={mode !== "select"}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 bg-[var(--bg-muted)] transition-all",
                  mode !== "select" && "cursor-default",
                  isSelected && mode === "select"
                    ? "border-[var(--accent)] shadow-lift"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="flex aspect-[1/1.414] items-center justify-center">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb.url}
                      alt={`Page ${page}`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <SquareDashed className="size-6 text-[var(--fg-subtle)]" aria-hidden="true" />
                  )}
                </div>
                <span
                  className={cn(
                    "absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    isSelected && mode === "select"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)]/90 text-[var(--fg-muted)]",
                  )}
                >
                  {page}
                </span>
                {isSelected && mode === "select" && (
                  <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] p-0.5">
                    <CheckCheck className="size-3 text-white" aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ToolPanel>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <ToolPanel title="How to split">
          <SegmentedControl<Mode>
            ariaLabel="Split mode"
            value={mode}
            onChange={(next) => {
              setMode(next);
              setError(null);
            }}
            options={[
              { value: "select", label: "Select" },
              { value: "ranges", label: "Ranges" },
              { value: "every", label: "Every page" },
            ]}
          />

          {mode === "select" && (
            <>
              <div className="flex items-center justify-between">
                <Stat label="Selected" value={`${selected.size} / ${doc.pageCount}`} className="flex-1" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
                  Select all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
              <Button
                onClick={extractSelection}
                disabled={selected.size === 0 || busy}
                className="w-full"
              >
                {busy ? <Spinner /> : <Scissors />}
                {busy ? "Extracting…" : `Extract ${selected.size} page${selected.size === 1 ? "" : "s"}`}
              </Button>
              <p className="text-xs text-[var(--fg-subtle)]">
                To delete pages, select the ones you want to keep and extract those.
              </p>
            </>
          )}

          {mode === "ranges" && (
            <>
              <Field
                label="Page ranges"
                htmlFor="ps-ranges"
                hint="Comma-separated. Each range becomes its own PDF."
              >
                <Input
                  id="ps-ranges"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="1-5, 6-10, 11-20"
                  invalid={parsed.errors.length > 0}
                />
              </Field>

              {parsed.errors.length > 0 && (
                <Alert tone="error">
                  <ul className="space-y-0.5">
                    {parsed.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {parsed.ranges.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                  <p className="text-xs font-medium text-[var(--fg-muted)]">
                    Will create {parsed.ranges.length} document
                    {parsed.ranges.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--fg-subtle)]">
                    {parsed.ranges.map((r) => (
                      <li key={r.label}>
                        Pages {r.label} — {r.indices.length} page
                        {r.indices.length === 1 ? "" : "s"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={splitByRanges}
                disabled={busy || parsed.ranges.length === 0}
                className="w-full"
              >
                {busy ? <Spinner /> : <Scissors />}
                {busy ? "Splitting…" : "Split by ranges"}
              </Button>
            </>
          )}

          {mode === "every" && (
            <>
              <Alert tone="info">
                Creates {doc.pageCount} separate PDFs — one per page — and downloads them as a
                single ZIP.
              </Alert>
              <Button onClick={splitEveryPage} disabled={busy} className="w-full">
                {busy ? <Spinner /> : <FileArchive />}
                {busy ? "Splitting…" : `Split into ${doc.pageCount} files`}
              </Button>
            </>
          )}

          {error && <Alert tone="error">{error}</Alert>}
          {status && <Alert tone="success">{status}</Alert>}

          <Button variant="ghost" size="sm" onClick={reset} className="w-full" disabled={busy}>
            Choose a different PDF
          </Button>

          <PrivacyNote />
        </ToolPanel>
      </div>
    </div>
  );
}
