"use client";

import * as React from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { Alert, Button, Checkbox, Field, SegmentedControl, Spinner, Stat, Textarea } from "@/components/ui";
import { FileUploader, type AcceptedFile } from "@/components/tools/file-uploader";
import { CopyButton, PrivacyNote, ToolPanel } from "@/components/tools/shared";
import { ACCEPTED_IMAGE_TYPES, loadImage } from "./canvas";
import { downloadBlob, formatBytes, stripExtension } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Image to data URI and back.
 *
 * The file is read with FileReader and encoded in the page; the decode path
 * checks the declared type is genuinely an image before it renders anything,
 * so a data URI that claims to be a PNG but carries markup cannot be shown.
 */

type Mode = "encode" | "decode";

const IMAGE_MIME = /^image\/(png|jpeg|jpg|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon|svg\+xml)$/i;

export function ImageBase64({ toolSlug }: { toolSlug: string }) {
  const [mode, setMode] = React.useState<Mode>("encode");

  // Encode side
  const [encoded, setEncoded] = React.useState<{ name: string; dataUri: string; size: number; width: number; height: number; type: string } | null>(null);
  const [asCss, setAsCss] = React.useState(false);
  const [asImgTag, setAsImgTag] = React.useState(false);

  // Decode side
  const [input, setInput] = React.useState("");
  const [decoded, setDecoded] = React.useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const decodedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      if (decodedRef.current) URL.revokeObjectURL(decodedRef.current);
    },
    [],
  );

  const encode = React.useCallback(async (accepted: AcceptedFile[]) => {
    const item = accepted[0];
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      const { bitmap } = await loadImage(item.file);
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("That file could not be read."));
        reader.readAsDataURL(item.file);
      });
      setEncoded({
        name: item.name,
        dataUri,
        size: item.file.size,
        width: bitmap.width,
        height: bitmap.height,
        type: item.file.type || "image/unknown",
      });
      bitmap.close();
      track("tool_completed", { tool: toolSlug });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be encoded.");
    } finally {
      setBusy(false);
    }
  }, [toolSlug]);

  const decode = React.useCallback(async () => {
    const raw = input.trim();
    if (!raw) return;
    setBusy(true);
    setError(null);
    try {
      // Accept a bare Base64 payload as well as a full data URI.
      const match = /^data:([^;,]+)(;base64)?,(.*)$/su.exec(raw);
      const declaredType = match ? match[1] : "image/png";
      const payload = match ? match[3] : raw.replace(/\s+/gu, "");

      if (!IMAGE_MIME.test(declaredType)) {
        throw new Error(
          `That data URI says it is "${declaredType}", which is not an image type. Only image data URIs are decoded here.`,
        );
      }

      const binary = atob(payload.replace(/-/gu, "+").replace(/_/gu, "/").replace(/\s+/gu, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: declaredType });

      // Decoding it proves it really is an image, whatever the type claimed.
      const { bitmap } = await loadImage(blob);
      if (decodedRef.current) URL.revokeObjectURL(decodedRef.current);
      const url = URL.createObjectURL(blob);
      decodedRef.current = url;
      setDecoded({ blob, url, width: bitmap.width, height: bitmap.height });
      bitmap.close();
      track("tool_completed", { tool: toolSlug });
    } catch (err) {
      setDecoded(null);
      setError(
        err instanceof Error
          ? err.message
          : "That is not a valid image data URI. Check it was copied in full.",
      );
    } finally {
      setBusy(false);
    }
  }, [input, toolSlug]);

  const output = React.useMemo(() => {
    if (!encoded) return "";
    if (asCss) return `background-image: url("${encoded.dataUri}");`;
    if (asImgTag) return `<img src="${encoded.dataUri}" alt="" width="${encoded.width}" height="${encoded.height}" />`;
    return encoded.dataUri;
  }, [asCss, asImgTag, encoded]);

  const overhead = encoded ? Math.round((encoded.dataUri.length / encoded.size - 1) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToolPanel title="Direction">
        <SegmentedControl
          ariaLabel="Direction"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setError(null);
          }}
          options={[
            { value: "encode", label: "Image to Base64" },
            { value: "decode", label: "Base64 to image" },
          ]}
        />
      </ToolPanel>

      {mode === "encode" ? (
        <ToolPanel title="Your image" description="The file is read in your browser and turned into a data URI.">
          <FileUploader
            accept={ACCEPTED_IMAGE_TYPES}
            acceptLabel="JPG, PNG, WebP, AVIF, GIF or BMP"
            maxSize={4 * 1024 * 1024}
            onFiles={encode}
            disabled={busy}
          />

          {busy && (
            <p className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
              <Spinner /> Encoding…
            </p>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          {encoded && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Dimensions" value={`${encoded.width} × ${encoded.height}`} tone="accent" />
                <Stat label="File size" value={formatBytes(encoded.size)} />
                <Stat
                  label="Encoded size"
                  value={formatBytes(encoded.dataUri.length)}
                  sub={`+${overhead}% overhead`}
                  tone={overhead > 40 ? "warning" : "neutral"}
                />
              </div>

              <div className="space-y-2">
                <Checkbox
                  label="Wrap as a CSS background-image"
                  checked={asCss}
                  onChange={(e) => {
                    setAsCss(e.target.checked);
                    if (e.target.checked) setAsImgTag(false);
                  }}
                />
                <Checkbox
                  label="Wrap as an HTML img tag"
                  checked={asImgTag}
                  onChange={(e) => {
                    setAsImgTag(e.target.checked);
                    if (e.target.checked) setAsCss(false);
                  }}
                />
              </div>

              <Field label="Data URI" htmlFor={`${toolSlug}-out`}>
                <Textarea
                  id={`${toolSlug}-out`}
                  readOnly
                  rows={8}
                  value={output}
                  className="bg-[var(--bg-subtle)] font-mono text-[12px] leading-relaxed"
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <CopyButton value={output} label="Copy data URI" />
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadBlob(
                      new Blob([output], { type: "text/plain" }),
                      `${stripExtension(encoded.name)}-base64.txt`,
                    )
                  }
                >
                  <Download className="size-3.5" />
                  Download as text
                </Button>
              </div>

              {encoded.size > 100 * 1024 && (
                <Alert tone="warning">
                  Base64 makes a file about a third larger and it cannot be cached separately from
                  the page. Above roughly 10 KB an ordinary image file is almost always the better
                  choice.
                </Alert>
              )}
            </>
          )}

          <PrivacyNote>
            Your image is processed locally in your browser and is never uploaded to a server.
          </PrivacyNote>
        </ToolPanel>
      ) : (
        <ToolPanel title="Your Base64" description="Paste a data URI, or just the Base64 payload.">
          <Field label="Base64 or data URI" htmlFor={`${toolSlug}-in`}>
            <Textarea
              id={`${toolSlug}-in`}
              rows={8}
              spellCheck={false}
              value={input}
              placeholder="data:image/png;base64,iVBORw0KGgo…"
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-[12px] leading-relaxed"
            />
          </Field>

          <Button onClick={decode} disabled={busy || !input.trim()} className="w-full">
            {busy ? <Spinner /> : <ImageIcon className="size-4" />}
            {busy ? "Decoding…" : "Decode to an image"}
          </Button>

          {error && <Alert tone="error">{error}</Alert>}

          {decoded && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Dimensions" value={`${decoded.width} × ${decoded.height}`} tone="accent" />
                <Stat label="File size" value={formatBytes(decoded.blob.size)} />
                <Stat label="Type" value={decoded.blob.type.replace("image/", "").toUpperCase()} />
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[repeating-conic-gradient(var(--bg-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={decoded.url} alt="Decoded result" className="mx-auto max-h-72 object-contain" />
              </div>
              <Button
                onClick={() =>
                  downloadBlob(decoded.blob, `decoded.${decoded.blob.type.split("/")[1]?.replace("+xml", "") || "png"}`)
                }
                className="w-full"
              >
                <Download className="size-4" />
                Download image
              </Button>
            </>
          )}

          <PrivacyNote>
            Decoding happens in your browser. Nothing you paste is sent to a server.
          </PrivacyNote>
        </ToolPanel>
      )}
    </div>
  );
}
