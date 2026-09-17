"use client";

import * as React from "react";
import { FileUp, X } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { cn, formatBytes, sanitizeFilename } from "@/lib/utils";
import { acceptsAnything, matchesAccept } from "./accept";

export interface AcceptedFile {
  id: string;
  file: File;
  /** Sanitised — always use this for display and download names. */
  name: string;
}

export interface FileUploaderProps {
  /** MIME types and/or extensions, e.g. ["application/pdf", ".pdf"]. */
  accept: string[];
  /** Human-readable list shown in the dropzone, e.g. "PDF". */
  acceptLabel: string;
  multiple?: boolean;
  /** Per-file cap in bytes. */
  maxSize?: number;
  maxFiles?: number;
  onFiles: (files: AcceptedFile[]) => void;
  className?: string;
  /** Replaces the default copy inside the dropzone. */
  children?: React.ReactNode;
  disabled?: boolean;
}

const DEFAULT_MAX = 100 * 1024 * 1024; // 100 MB

/**
 * Drag-and-drop + click-to-browse uploader with client-side validation.
 * Nothing is uploaded anywhere — the File objects are handed straight to the
 * calling tool, which processes them in the browser.
 */
export function FileUploader({
  accept,
  acceptLabel,
  multiple = false,
  maxSize = DEFAULT_MAX,
  maxFiles = 50,
  onFiles,
  className,
  children,
  disabled,
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const dragDepth = React.useRef(0);

  const handle = React.useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list);
      const problems: string[] = [];
      const ok: AcceptedFile[] = [];

      for (const file of incoming) {
        const safeName = sanitizeFilename(file.name, "file");
        if (!matchesAccept(file, accept)) {
          problems.push(`"${safeName}" is not a supported file type. Please upload ${acceptLabel}.`);
          continue;
        }
        if (file.size === 0) {
          problems.push(`"${safeName}" is empty.`);
          continue;
        }
        if (file.size > maxSize) {
          problems.push(
            `"${safeName}" is ${formatBytes(file.size)}, which exceeds the ${formatBytes(maxSize)} limit.`,
          );
          continue;
        }
        ok.push({
          id: `${Date.now().toString(36)}-${ok.length}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: safeName,
        });
      }

      const capped = multiple ? ok.slice(0, maxFiles) : ok.slice(0, 1);
      if (ok.length > capped.length) {
        problems.push(`Only the first ${maxFiles} files were added.`);
      }

      setErrors(problems);
      if (capped.length) onFiles(capped);
    },
    [accept, acceptLabel, maxSize, maxFiles, multiple, onFiles],
  );

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={`Upload ${acceptLabel}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!disabled) handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          disabled && "cursor-not-allowed opacity-60",
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]",
        )}
      >
        {children ?? (
          <>
            <div className="mb-3 rounded-full bg-[var(--surface)] p-3 shadow-card">
              <FileUp className="size-6 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <p className="font-medium text-[var(--fg)]">
              Drop {multiple ? "files" : "a file"} here, or click to browse
            </p>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {acceptLabel} · up to {formatBytes(maxSize)} each
            </p>
            <p className="mt-3 text-xs text-[var(--fg-subtle)]">
              Files are processed on your device and never uploaded.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={acceptsAnything(accept) || accept.length === 0 ? undefined : accept.join(",")}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            handle(e.target.files);
            // Reset so picking the same file twice still fires a change event.
            e.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 && (
        <Alert tone="error" className="mt-3" onDismiss={() => setErrors([])}>
          <ul className="space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}

/** Compact row used by the PDF and image tools to list queued files. */
export function FileRow({
  name,
  size,
  meta,
  onRemove,
  actions,
  leading,
  className,
}: {
  name: string;
  size?: number;
  meta?: React.ReactNode;
  onRemove?: () => void;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--fg)]" title={name}>
          {name}
        </p>
        <p className="tabular text-xs text-[var(--fg-subtle)]">
          {typeof size === "number" && formatBytes(size)}
          {typeof size === "number" && meta ? " · " : ""}
          {meta}
        </p>
      </div>
      {actions}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="size-8"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
