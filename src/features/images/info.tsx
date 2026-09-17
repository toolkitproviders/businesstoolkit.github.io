"use client";

import * as React from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { Alert, Button, Spinner, Stat } from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { CopyButton, PrivacyNote, ToolPanel } from "@/components/tools/shared";
import { ACCEPTED_IMAGE_TYPES, loadImage } from "./canvas";
import { detectFileType } from "@/lib/file-signatures";
import { aspectRatioLabel, formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Image dimensions and file size checker.
 *
 * Decodes each image on the device to report its true pixel size — which is
 * often not what the filename or the CMS claims — alongside the aspect ratio,
 * megapixels and the bytes it spends per pixel.
 */

interface Report {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
  declaredType: string;
  detectedType: string;
  error?: string;
}

const COMMON_USES: { label: string; width: number; height: number }[] = [
  { label: "Full HD screen", width: 1920, height: 1080 },
  { label: "Open Graph share card", width: 1200, height: 630 },
  { label: "Instagram square", width: 1080, height: 1080 },
  { label: "A4 at 300 dpi", width: 2480, height: 3508 },
];

export function ImageInfoViewer({ toolSlug }: { toolSlug: string }) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [busy, setBusy] = React.useState(false);
  const reportsRef = React.useRef<Report[]>([]);
  reportsRef.current = reports;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      for (const report of reportsRef.current) URL.revokeObjectURL(report.url);
    },
    [],
  );

  const inspect = React.useCallback(
    async (accepted: AcceptedFile[]) => {
      setBusy(true);
      const created: Report[] = [];

      for (const item of accepted) {
        const url = URL.createObjectURL(item.file);
        try {
          const { bitmap } = await loadImage(item.file);
          const head = new Uint8Array(await item.file.slice(0, 32).arrayBuffer());
          created.push({
            id: item.id,
            name: item.name,
            url,
            width: bitmap.width,
            height: bitmap.height,
            size: item.file.size,
            declaredType: item.file.type || "not reported",
            detectedType: detectFileType(head)?.label ?? "Unrecognised",
          });
          bitmap.close();
        } catch (error) {
          created.push({
            id: item.id,
            name: item.name,
            url,
            width: 0,
            height: 0,
            size: item.file.size,
            declaredType: item.file.type || "not reported",
            detectedType: "Unrecognised",
            error: error instanceof Error ? error.message : "That image could not be read.",
          });
        }
      }

      setReports((prev) => [...prev, ...created]);
      setBusy(false);
    },
    [],
  );

  return (
    <div className="space-y-6">
      <ToolPanel
        title="Your images"
        description="Add as many as you like. Each one is decoded in your browser to read its true size."
      >
        <FileUploader
          accept={ACCEPTED_IMAGE_TYPES}
          acceptLabel="JPG, PNG, WebP, AVIF, GIF or BMP"
          multiple
          maxFiles={30}
          onFiles={inspect}
          disabled={busy}
        />

        {busy && (
          <p className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
            <Spinner /> Reading…
          </p>
        )}

        {reports.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              for (const report of reports) URL.revokeObjectURL(report.url);
              setReports([]);
            }}
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        )}

        <PrivacyNote>
          Your images are processed locally in your browser and are never uploaded to a server.
        </PrivacyNote>
      </ToolPanel>

      {reports.length > 1 && (
        <ToolPanel title="All images">
          <div className="thin-scroll overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-[var(--bg-subtle)]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--fg-muted)]">File</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--fg-muted)]">Dimensions</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--fg-muted)]">Ratio</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--fg-muted)]">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-[16rem] truncate px-3 py-1.5">{r.name}</td>
                    <td className="tabular px-3 py-1.5 text-right">
                      {r.error ? "—" : `${r.width} × ${r.height}`}
                    </td>
                    <td className="tabular px-3 py-1.5 text-right">
                      {r.error ? "—" : aspectRatioLabel(r.width, r.height)}
                    </td>
                    <td className="tabular px-3 py-1.5 text-right">{formatBytes(r.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CopyButton
            value={reports
              .map((r) => `${r.name}\t${r.error ? "" : `${r.width}x${r.height}`}\t${r.size}`)
              .join("\n")}
            label="Copy as a table"
          />
        </ToolPanel>
      )}

      {reports.map((report) => {
        const megapixels = (report.width * report.height) / 1_000_000;
        const bytesPerPixel = report.width && report.height ? report.size / (report.width * report.height) : 0;
        const orientation =
          report.width === report.height ? "Square" : report.width > report.height ? "Landscape" : "Portrait";
        const match = COMMON_USES.find((u) => u.width === report.width && u.height === report.height);

        return (
          <ToolPanel key={report.id} title={report.name}>
            {report.error ? (
              <Alert tone="error">{report.error}</Alert>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[repeating-conic-gradient(var(--bg-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.url} alt="" className="mx-auto max-h-56 object-contain" />
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <Stat label="Dimensions" value={`${report.width} × ${report.height}`} tone="accent" sub="pixels" />
                  <Stat label="Aspect ratio" value={aspectRatioLabel(report.width, report.height)} sub={orientation} />
                  <Stat label="Megapixels" value={megapixels.toFixed(2)} />
                  <Stat label="File size" value={formatBytes(report.size)} sub={`${report.size.toLocaleString("en-US")} bytes`} />
                  <Stat
                    label="Bytes per pixel"
                    value={bytesPerPixel.toFixed(2)}
                    sub={bytesPerPixel > 3 ? "barely compressed" : bytesPerPixel < 0.3 ? "heavily compressed" : "typical"}
                    tone={bytesPerPixel > 3 ? "warning" : "neutral"}
                  />
                  <Stat label="Format" value={report.detectedType.replace(" image", "")} sub={report.declaredType} />
                </div>

                {match && <Alert tone="info">Exactly the right size for a {match.label.toLowerCase()}.</Alert>}

                {bytesPerPixel > 3 && (
                  <Alert tone="warning">
                    This image spends {bytesPerPixel.toFixed(1)} bytes on every pixel, which
                    suggests it is barely compressed. The Image Compressor will usually cut it
                    substantially with no visible difference.
                  </Alert>
                )}

                {report.width > 3000 && (
                  <Alert tone="info">
                    At {report.width} pixels wide this is larger than any screen will display. For
                    the web, 1600–2000 pixels is normally plenty.
                  </Alert>
                )}

                <CopyButton value={`${report.width} × ${report.height}`} label="Copy dimensions" />
              </>
            )}
          </ToolPanel>
        );
      })}

      {reports.length === 0 && !busy && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
          <ImageIcon className="mb-3 size-6 text-[var(--fg-subtle)]" aria-hidden="true" />
          <p className="font-medium text-[var(--fg)]">Nothing added yet</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--fg-muted)]">
            Drop an image above to see its exact pixel dimensions, aspect ratio, megapixels and
            file size.
          </p>
        </div>
      )}
    </div>
  );
}
