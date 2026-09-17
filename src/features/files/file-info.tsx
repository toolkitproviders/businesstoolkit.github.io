"use client";

import * as React from "react";
import { FileSearch, Trash2 } from "lucide-react";
import { Alert, Button, Spinner, Stat } from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { CopyButton, PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  detectFileType,
  extensionMatches,
  hexPreview,
  looksLikeText,
  type DetectedType,
} from "@/lib/file-signatures";
import { formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * File information viewer.
 *
 * Reads the first bytes of a file to work out what it really is, rather than
 * trusting the extension or the type the browser reports. Everything happens
 * on the device — the file is read with FileReader and never uploaded.
 */

interface Report {
  id: string;
  name: string;
  size: number;
  declaredType: string;
  lastModified: number;
  detected: DetectedType | null;
  extensionOk: boolean | null;
  text: boolean;
  hex: string;
  sha256: string;
  error?: string;
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function FileInfoViewer({ toolSlug }: { toolSlug: string }) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  const inspect = React.useCallback(
    async (accepted: AcceptedFile[]) => {
      setBusy(true);
      const created: Report[] = [];

      for (const item of accepted) {
        try {
          const buffer = await item.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const detected = detectFileType(bytes);
          created.push({
            id: item.id,
            name: item.name,
            size: item.file.size,
            declaredType: item.file.type || "not reported",
            lastModified: item.file.lastModified,
            detected,
            extensionOk: extensionMatches(item.name, detected),
            text: !detected && looksLikeText(bytes),
            hex: hexPreview(bytes),
            sha256: await sha256(buffer),
          });
        } catch (error) {
          created.push({
            id: item.id,
            name: item.name,
            size: item.file.size,
            declaredType: item.file.type || "not reported",
            lastModified: item.file.lastModified,
            detected: null,
            extensionOk: null,
            text: false,
            hex: "",
            sha256: "",
            error: error instanceof Error ? error.message : "That file could not be read.",
          });
        }
      }

      setReports((prev) => [...prev, ...created]);
      setBusy(false);
      track("tool_completed", { tool: toolSlug });
    },
    [toolSlug],
  );

  return (
    <div className="space-y-6">
      <ToolPanel
        title="Your files"
        description="Any file type. The contents are read in your browser to work out what the file really is."
      >
        <FileUploader
          accept={["*"]}
          acceptLabel="any file"
          multiple
          maxFiles={20}
          maxSize={512 * 1024 * 1024}
          onFiles={inspect}
          disabled={busy}
        />

        {busy && (
          <p className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
            <Spinner /> Reading and hashing…
          </p>
        )}

        {reports.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setReports([])}>
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        )}

        <PrivacyNote>
          Your file is processed locally in your browser. Nothing is uploaded, and the hash is
          computed on your own device.
        </PrivacyNote>
      </ToolPanel>

      {reports.map((report) => (
        <ToolPanel key={report.id} title={report.name}>
          {report.error ? (
            <Alert tone="error">{report.error}</Alert>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Size" value={formatBytes(report.size)} sub={`${report.size.toLocaleString("en-US")} bytes`} tone="accent" />
                <Stat
                  label="Actually a"
                  value={report.detected ? report.detected.mime.split("/")[1].toUpperCase() : report.text ? "TEXT" : "UNKNOWN"}
                  sub={report.detected?.label ?? (report.text ? "Plain text or source code" : "No known signature")}
                />
                <Stat
                  label="Extension"
                  value={report.extensionOk === null ? "Not checked" : report.extensionOk ? "Matches" : "Does not match"}
                  tone={report.extensionOk === false ? "warning" : report.extensionOk ? "success" : "neutral"}
                />
              </div>

              <dl className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
                <Row label="Name" value={report.name} />
                <Row label="Reported type" value={report.declaredType} />
                <Row
                  label="Detected type"
                  value={report.detected ? `${report.detected.label} (${report.detected.mime})` : report.text ? "Plain text" : "Unrecognised"}
                />
                <Row label="Modified" value={new Date(report.lastModified).toLocaleString()} />
                <Row label="First 16 bytes" value={report.hex} mono />
                <Row label="SHA-256" value={report.sha256} mono />
              </dl>

              {report.extensionOk === false && (
                <Alert tone="warning" title="The extension does not match the contents">
                  The bytes say this is a {report.detected?.label.toLowerCase()}, but the file is
                  named <strong>{report.name}</strong>. That is often harmless — a screenshot saved
                  with the wrong extension — but it is also how a file gets opened by the wrong
                  program. Rename it to .{report.detected?.extensions[0]} if it should be one.
                </Alert>
              )}

              {!report.detected && !report.text && (
                <Alert tone="info">
                  No known signature matched the first bytes. That does not mean the file is
                  broken — plenty of formats have no magic number at all.
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <CopyButton value={report.sha256} label="Copy SHA-256" />
                <CopyButton
                  value={[
                    `Name: ${report.name}`,
                    `Size: ${report.size} bytes (${formatBytes(report.size)})`,
                    `Reported type: ${report.declaredType}`,
                    `Detected type: ${report.detected?.label ?? (report.text ? "Plain text" : "Unrecognised")}`,
                    `Modified: ${new Date(report.lastModified).toISOString()}`,
                    `First 16 bytes: ${report.hex}`,
                    `SHA-256: ${report.sha256}`,
                  ].join("\n")}
                  label="Copy full report"
                />
              </div>
            </>
          )}
        </ToolPanel>
      ))}

      {reports.length === 0 && !busy && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
          <FileSearch className="mb-3 size-6 text-[var(--fg-subtle)]" aria-hidden="true" />
          <p className="font-medium text-[var(--fg)]">Nothing inspected yet</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--fg-muted)]">
            Drop a file above to see its real type, its size in bytes, when it was last modified
            and its SHA-256 checksum.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "min-w-0 flex-1 break-all font-mono text-[13px] text-[var(--fg)]"
            : "min-w-0 flex-1 break-words text-sm text-[var(--fg)]"
        }
      >
        {value}
      </dd>
    </div>
  );
}
