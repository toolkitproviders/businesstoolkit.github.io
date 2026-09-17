"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Combine, FileText, GripVertical, Trash2 } from "lucide-react";
import { Alert, Button, EmptyState, Progress, Spinner, Stat } from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import { inspectPdf, MAX_PDF_BYTES, mergePdfs, PDF_ACCEPT, PdfError, pdfBlob } from "./core";
import { cn, downloadBlob, formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface Entry {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  bytes: Uint8Array;
}

export function PdfMerger({ toolSlug }: { toolSlug: string }) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const addFiles = React.useCallback(async (accepted: AcceptedFile[]) => {
    setLoading(true);
    const added: Entry[] = [];
    const problems: string[] = [];

    for (const item of accepted) {
      try {
        const info = await inspectPdf(item.file, item.name);
        added.push({
          id: item.id,
          name: item.name,
          size: item.file.size,
          pageCount: info.pageCount,
          bytes: info.bytes,
        });
      } catch (error) {
        problems.push(
          error instanceof PdfError ? error.message : `"${item.name}" could not be opened.`,
        );
      }
    }

    setEntries((prev) => [...prev, ...added]);
    setErrors(problems);
    setLoading(false);
  }, []);

  const move = (index: number, direction: -1 | 1) => {
    setEntries((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reorder = (from: number, to: number) => {
    setEntries((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const merge = async () => {
    setMerging(true);
    setErrors([]);
    setProgress(0);
    try {
      const bytes = await mergePdfs(
        entries.map((e) => ({ name: e.name, bytes: e.bytes })),
        (done, total) => setProgress((done / total) * 100),
      );
      downloadBlob(pdfBlob(bytes), "merged.pdf");
      track("tool_completed", { tool: toolSlug, count: entries.length });
      track("download_clicked", { tool: toolSlug });
    } catch (error) {
      setErrors([
        error instanceof PdfError
          ? error.message
          : "The PDFs could not be merged. Please check the files and try again.",
      ]);
    } finally {
      setMerging(false);
      setProgress(0);
    }
  };

  const totalPages = entries.reduce((sum, e) => sum + e.pageCount, 0);
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

  return (
    <div className="space-y-6">
      <FileUploader
        accept={PDF_ACCEPT}
        acceptLabel="PDF files"
        multiple
        maxSize={MAX_PDF_BYTES}
        maxFiles={30}
        onFiles={addFiles}
        disabled={loading || merging}
      />

      {errors.length > 0 && (
        <Alert tone="error" title="Some files could not be used" onDismiss={() => setErrors([])}>
          <ul className="space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
          <Spinner />
          Reading PDFs…
        </div>
      )}

      {entries.length === 0 && !loading ? (
        <EmptyState
          icon={<FileText className="size-8" />}
          title="No PDFs added yet"
          description="Add two or more PDFs and drag them into the order you want them combined."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <ToolPanel
            title={`Files (${entries.length})`}
            description="Drag to reorder — the merged PDF follows this order top to bottom."
          >
            <ul className="space-y-2">
              {entries.map((entry, index) => (
                <li
                  key={entry.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorder(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-[var(--surface)] p-3 transition-colors",
                    dragIndex === index && "opacity-50",
                    overIndex === index && dragIndex !== index
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)]",
                  )}
                >
                  <GripVertical
                    className="size-4 shrink-0 cursor-grab text-[var(--fg-subtle)]"
                    aria-hidden="true"
                  />
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-muted)] text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={entry.name}>
                      {entry.name}
                    </p>
                    <p className="tabular text-xs text-[var(--fg-subtle)]">
                      {entry.pageCount} page{entry.pageCount === 1 ? "" : "s"} ·{" "}
                      {formatBytes(entry.size)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Move ${entry.name} up`}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === entries.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Move ${entry.name} down`}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-[var(--error)]"
                      onClick={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                      aria-label={`Remove ${entry.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ToolPanel>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <ToolPanel title="Merge">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Files" value={entries.length} />
                <Stat label="Total pages" value={totalPages} tone="accent" />
              </div>
              <p className="text-xs text-[var(--fg-subtle)]">
                Combined source size {formatBytes(totalSize)}. Merging does not re-compress, so the
                output will be roughly this size.
              </p>

              <Button
                onClick={merge}
                disabled={entries.length < 2 || merging}
                className="w-full"
              >
                {merging ? <Spinner /> : <Combine />}
                {merging ? "Merging…" : "Merge PDFs"}
              </Button>

              {entries.length === 1 && (
                <Alert tone="info">Add at least one more PDF to merge.</Alert>
              )}
              {merging && <Progress value={progress} label="Combining documents" />}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEntries([])}
                className="w-full"
                disabled={merging}
              >
                <Trash2 className="size-3.5" />
                Clear all
              </Button>

              <PrivacyNote>
                Merging happens entirely in this browser tab. Disconnect from the internet and it
                still works — that is the proof nothing is uploaded.
              </PrivacyNote>
            </ToolPanel>
          </div>
        </div>
      )}
    </div>
  );
}
