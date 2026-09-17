"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  Select,
  Slider,
} from "@/components/ui";
import { CopyButton, PrivacyNote, ToolPanel } from "@/components/tools/shared";
import { downloadBlob, downloadText } from "@/lib/utils";
import { track } from "@/lib/analytics";
import {
  BARCODE_FORMATS as FORMATS,
  validateBarcode as validate,
  type BarcodeFormat as Format,
} from "./barcode-formats";

type JsBarcodeFn = typeof import("jsbarcode");

let jsBarcodePromise: Promise<JsBarcodeFn> | null = null;

/**
 * Loads jsbarcode once and caches it.
 *
 * The package is CommonJS with `module.exports = JsBarcode` — a bare function
 * and no `.default` — so accept either shape rather than silently ending up
 * with `undefined` and an empty barcode.
 */
function loadJsBarcode(): Promise<JsBarcodeFn> {
  if (!jsBarcodePromise) {
    jsBarcodePromise = import("jsbarcode").then((mod) => {
      const fn = (typeof mod === "function" ? mod : (mod as { default?: unknown }).default) as
        | JsBarcodeFn
        | undefined;
      if (typeof fn !== "function") {
        jsBarcodePromise = null; // Allow a retry on the next render.
        throw new Error("Barcode library failed to load");
      }
      return fn;
    });
  }
  return jsBarcodePromise;
}

export function BarcodeGenerator({ toolSlug }: { toolSlug: string }) {
  const [format, setFormat] = React.useState<Format>("CODE128");
  const [value, setValue] = React.useState("SKU-4821-AB");
  const [barWidth, setBarWidth] = React.useState(2);
  const [height, setHeight] = React.useState(100);
  const [margin, setMargin] = React.useState(10);
  const [showText, setShowText] = React.useState(true);
  const [fontSize, setFontSize] = React.useState(18);
  const [lineColor, setLineColor] = React.useState("#000000");
  const [background, setBackground] = React.useState("#ffffff");
  const [renderError, setRenderError] = React.useState<string | null>(null);

  const svgRef = React.useRef<SVGSVGElement>(null);
  const spec = FORMATS.find((f) => f.value === format) ?? FORMATS[0];
  const validation = validate(format, value);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    if (!validation.ok) {
      svg.innerHTML = "";
      setRenderError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const JsBarcode = await loadJsBarcode();

        // Draw even if this effect run was superseded. The write targets the
        // element that is still mounted, and skipping it is how the canvas
        // ended up blank under React's double-invoked development effects —
        // the first run resolved after its own cleanup and bailed out.
        const target = svgRef.current;
        if (!target) return;

        JsBarcode(target, validation.encoded, {
          format,
          width: barWidth,
          height,
          margin,
          displayValue: showText,
          fontSize,
          lineColor,
          background,
          font: "monospace",
          textMargin: 4,
          valid: (isValid: boolean) => {
            if (!isValid && !cancelled) {
              setRenderError("This value could not be encoded in the selected format.");
            }
          },
        });

        if (!cancelled) setRenderError(null);
      } catch {
        if (!cancelled) {
          setRenderError("The barcode could not be rendered. Try a different value or format.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    format,
    validation.ok,
    validation.encoded,
    barWidth,
    height,
    margin,
    showText,
    fontSize,
    lineColor,
    background,
  ]);

  const svgMarkup = () => {
    const svg = svgRef.current;
    if (!svg) return "";
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  };

  const downloadSvg = () => {
    const markup = svgMarkup();
    if (!markup) return;
    downloadText(markup, `barcode-${validation.encoded}.svg`, "image/svg+xml");
    track("download_clicked", { tool: toolSlug, format: "svg" });
  };

  const downloadPng = async () => {
    const markup = svgMarkup();
    if (!markup) return;
    try {
      const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });

      // Render at 3x for a crisp, print-usable raster.
      const canvas = document.createElement("canvas");
      canvas.width = (image.width || 300) * 3;
      canvas.height = (image.height || 150) * 3;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!png) throw new Error("encode failed");
      downloadBlob(png, `barcode-${validation.encoded}.png`);
      track("download_clicked", { tool: toolSlug, format: "png" });
    } catch {
      setRenderError("The PNG could not be created. You can still download the SVG.");
    }
  };

  const print = () => {
    const markup = svgMarkup();
    if (!markup) return;
    const w = window.open("", "_blank", "width=600,height=400");
    if (!w) return;
    w.document.write(
      `<title>Barcode ${validation.encoded}</title><body style="margin:0;display:grid;place-items:center;height:100vh">${markup}</body>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      <div className="space-y-4">
        <ToolPanel title="Barcode">
          <Field label="Format" htmlFor="bc-format" hint={spec.description}>
            <Select
              id="bc-format"
              value={format}
              onChange={(e) => {
                const next = e.target.value as Format;
                setFormat(next);
                setValue(FORMATS.find((f) => f.value === next)?.sample ?? "");
              }}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Value"
            htmlFor="bc-value"
            error={validation.ok ? undefined : validation.error}
            hint={validation.note}
          >
            <Input
              id="bc-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={spec.placeholder}
              invalid={!validation.ok}
              className="font-mono"
            />
          </Field>

          {validation.ok && validation.encoded !== value.trim() && (
            <Alert tone="info">
              Encoded as <strong className="font-mono">{validation.encoded}</strong>
            </Alert>
          )}
        </ToolPanel>

        <ToolPanel title="Appearance">
          <Slider
            label="Bar width"
            suffix="px"
            min={1}
            max={5}
            step={0.5}
            value={barWidth}
            onChange={(e) => setBarWidth(Number(e.target.value))}
          />
          <Slider
            label="Height"
            suffix="px"
            min={30}
            max={250}
            step={5}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
          <Slider
            label="Margin"
            suffix="px"
            min={0}
            max={40}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
          />

          <Checkbox
            label="Show the value below the bars"
            description="Lets a person read the code if a scanner fails."
            checked={showText}
            onChange={(e) => setShowText(e.target.checked)}
          />
          {showText && (
            <Slider
              label="Text size"
              suffix="px"
              min={10}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bar colour" htmlFor="bc-line">
              <div className="flex gap-2">
                <input
                  id="bc-line"
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                />
                <Input
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label="Background" htmlFor="bc-bg">
              <div className="flex gap-2">
                <input
                  id="bc-bg"
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                />
                <Input
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
          </div>

          <Alert tone="info">
            Black bars on a white background scan most reliably. Coloured bars work in print but
            reduce the contrast scanners depend on.
          </Alert>
        </ToolPanel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <ToolPanel title="Preview">
          <div
            className="flex min-h-48 items-center justify-center overflow-auto rounded-lg border border-[var(--border)] p-4"
            style={{ backgroundColor: background }}
          >
            {validation.ok ? (
              <svg ref={svgRef} role="img" aria-label={`Barcode for ${validation.encoded}`} />
            ) : (
              <p className="px-6 text-center text-sm text-[var(--fg-muted)]">
                {validation.error}
              </p>
            )}
          </div>

          {renderError && <Alert tone="error">{renderError}</Alert>}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={downloadPng} disabled={!validation.ok}>
              <Download />
              PNG
            </Button>
            <Button variant="outline" onClick={downloadSvg} disabled={!validation.ok}>
              <Download />
              SVG
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={print} disabled={!validation.ok}>
              <Printer />
              Print
            </Button>
            <CopyButton
              value={validation.encoded}
              label="Copy value"
              variant="outline"
              size="md"
            />
          </div>

          <Alert tone="warning" title="Selling at retail?">
            This tool encodes numbers — it does not issue them. Retail barcodes must use a number
            legitimately assigned to you by GS1.
          </Alert>

          <PrivacyNote>
            Rendered in your browser. Nothing you type is sent anywhere.
          </PrivacyNote>
        </ToolPanel>
      </div>
    </div>
  );
}
