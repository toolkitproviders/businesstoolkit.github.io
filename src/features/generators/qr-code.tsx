"use client";

import * as React from "react";
import { Download, ImagePlus, Printer, X } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Textarea,
} from "@/components/ui";
import { PrivacyNote, ToolPanel } from "@/components/tools/shared";
import { downloadBlob, downloadText } from "@/lib/utils";
import { track } from "@/lib/analytics";

type QrType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard" | "geo";
type ErrorLevel = "L" | "M" | "Q" | "H";

const TYPES: { value: QrType; label: string }[] = [
  { value: "url", label: "URL" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "Contact" },
  { value: "geo", label: "Location" },
];

interface Fields {
  url: string;
  text: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsNumber: string;
  smsMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  vcardFirst: string;
  vcardLast: string;
  vcardOrg: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardUrl: string;
  geoLat: string;
  geoLng: string;
}

const INITIAL: Fields = {
  url: "https://example.com",
  text: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  smsNumber: "",
  smsMessage: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  vcardFirst: "",
  vcardLast: "",
  vcardOrg: "",
  vcardTitle: "",
  vcardPhone: "",
  vcardEmail: "",
  vcardUrl: "",
  geoLat: "",
  geoLng: "",
};

/** Escapes the characters that are structural in the Wi-Fi and vCard formats. */
function escapeField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function buildPayload(type: QrType, f: Fields): string {
  switch (type) {
    case "url": {
      const trimmed = f.url.trim();
      if (!trimmed) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }
    case "text":
      return f.text;
    case "email": {
      if (!f.emailTo.trim()) return "";
      const params = new URLSearchParams();
      if (f.emailSubject.trim()) params.set("subject", f.emailSubject);
      if (f.emailBody.trim()) params.set("body", f.emailBody);
      const query = params.toString();
      return `mailto:${f.emailTo.trim()}${query ? `?${query}` : ""}`;
    }
    case "phone":
      return f.phone.trim() ? `tel:${f.phone.replace(/\s+/g, "")}` : "";
    case "sms":
      if (!f.smsNumber.trim()) return "";
      return `SMSTO:${f.smsNumber.replace(/\s+/g, "")}:${f.smsMessage}`;
    case "wifi": {
      if (!f.wifiSsid.trim()) return "";
      const parts = [
        `T:${f.wifiSecurity}`,
        `S:${escapeField(f.wifiSsid)}`,
        f.wifiSecurity !== "nopass" ? `P:${escapeField(f.wifiPassword)}` : "",
        f.wifiHidden ? "H:true" : "",
      ].filter(Boolean);
      return `WIFI:${parts.join(";")};;`;
    }
    case "vcard": {
      if (!f.vcardFirst.trim() && !f.vcardLast.trim()) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeField(f.vcardLast)};${escapeField(f.vcardFirst)};;;`,
        `FN:${escapeField(`${f.vcardFirst} ${f.vcardLast}`.trim())}`,
        f.vcardOrg.trim() && `ORG:${escapeField(f.vcardOrg)}`,
        f.vcardTitle.trim() && `TITLE:${escapeField(f.vcardTitle)}`,
        f.vcardPhone.trim() && `TEL;TYPE=WORK,VOICE:${f.vcardPhone}`,
        f.vcardEmail.trim() && `EMAIL;TYPE=WORK:${f.vcardEmail}`,
        f.vcardUrl.trim() && `URL:${f.vcardUrl}`,
        "END:VCARD",
      ].filter(Boolean);
      return lines.join("\n");
    }
    case "geo": {
      const lat = Number.parseFloat(f.geoLat);
      const lng = Number.parseFloat(f.geoLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
      return `geo:${lat},${lng}`;
    }
  }
}

/** WCAG-style contrast ratio — a low-contrast QR code often fails to scan. */
function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string) => {
    const clean = hex.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const channels = [0, 2, 4].map((i) => {
      const value = Number.parseInt(full.slice(i, i + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = luminance(hexA);
  const b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function QrCodeGenerator({ toolSlug }: { toolSlug: string }) {
  const [type, setType] = React.useState<QrType>("url");
  const [fields, setFields] = React.useState<Fields>(INITIAL);
  const [foreground, setForeground] = React.useState("#11224a");
  const [background, setBackground] = React.useState("#ffffff");
  const [size, setSize] = React.useState(512);
  const [margin, setMargin] = React.useState(2);
  const [level, setLevel] = React.useState<ErrorLevel>("M");
  const [logo, setLogo] = React.useState<string | null>(null);
  const [pngUrl, setPngUrl] = React.useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const pngUrlRef = React.useRef<string | null>(null);
  pngUrlRef.current = pngUrl;

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(
    () => () => {
      if (pngUrlRef.current) URL.revokeObjectURL(pngUrlRef.current);
    },
    [],
  );

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const payload = buildPayload(type, fields);
  // A logo covers part of the pattern, so redundancy has to go up to compensate.
  const effectiveLevel: ErrorLevel = logo ? "H" : level;
  const contrast = contrastRatio(foreground, background);

  /* Regenerate whenever anything that affects the code changes. */
  React.useEffect(() => {
    let cancelled = false;

    if (!payload) {
      setPngUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSvgMarkup("");
      setError(null);
      return;
    }

    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const QRCode = (await import("qrcode")).default;

        const canvas = document.createElement("canvas");
        await QRCode.toCanvas(canvas, payload, {
          errorCorrectionLevel: effectiveLevel,
          margin,
          width: size,
          color: { dark: foreground, light: background },
        });

        if (logo) {
          await drawLogo(canvas, logo, background);
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );

        const svg = await QRCode.toString(payload, {
          type: "svg",
          errorCorrectionLevel: effectiveLevel,
          margin,
          width: size,
          color: { dark: foreground, light: background },
        });

        if (cancelled) return;

        setPngUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blob ? URL.createObjectURL(blob) : null;
        });
        setSvgMarkup(svg);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        setError(
          /too big|overflow|data/i.test(message)
            ? "That content is too long to fit in a QR code. Shorten it, or lower the error-correction level."
            : "This QR code could not be generated. Please check your input.",
        );
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payload, effectiveLevel, margin, size, foreground, background, logo]);

  const downloadPng = () => {
    if (!pngUrl) return;
    fetch(pngUrl)
      .then((r) => r.blob())
      .then((blob) => {
        downloadBlob(blob, `qr-code-${type}.png`);
        track("download_clicked", { tool: toolSlug, format: "png" });
      })
      .catch(() => setError("The PNG could not be prepared for download."));
  };

  const downloadSvg = () => {
    if (!svgMarkup) return;
    downloadText(svgMarkup, `qr-code-${type}.svg`, "image/svg+xml");
    track("download_clicked", { tool: toolSlug, format: "svg" });
  };

  const print = () => {
    if (!pngUrl) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    w.document.write(
      `<title>QR code</title><body style="margin:0;display:grid;place-items:center;height:100vh"><img src="${pngUrl}" style="max-width:90%"></body>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please choose a PNG, JPG or WebP logo.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("That logo is over 1 MB. Please choose a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setError("That logo could not be read.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="space-y-4">
        <ToolPanel title="Content" description="Pick what the code should contain.">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                aria-pressed={type === t.value}
                className={
                  type === t.value
                    ? "rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
                    : "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {type === "url" && (
            <Field label="Website address" htmlFor="qr-url">
              <Input
                id="qr-url"
                value={fields.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="example.com"
              />
            </Field>
          )}

          {type === "text" && (
            <Field label="Text" htmlFor="qr-text" hint="Any plain text, up to a few hundred characters.">
              <Textarea
                id="qr-text"
                rows={4}
                value={fields.text}
                onChange={(e) => set("text", e.target.value)}
              />
            </Field>
          )}

          {type === "email" && (
            <div className="space-y-4">
              <Field label="Send to" htmlFor="qr-email">
                <Input
                  id="qr-email"
                  type="email"
                  value={fields.emailTo}
                  onChange={(e) => set("emailTo", e.target.value)}
                  placeholder="hello@example.com"
                />
              </Field>
              <Field label="Subject" htmlFor="qr-subject">
                <Input
                  id="qr-subject"
                  value={fields.emailSubject}
                  onChange={(e) => set("emailSubject", e.target.value)}
                />
              </Field>
              <Field label="Message" htmlFor="qr-body">
                <Textarea
                  id="qr-body"
                  value={fields.emailBody}
                  onChange={(e) => set("emailBody", e.target.value)}
                />
              </Field>
            </div>
          )}

          {type === "phone" && (
            <Field label="Phone number" htmlFor="qr-phone" hint="Include the country code.">
              <Input
                id="qr-phone"
                type="tel"
                value={fields.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+44 7700 900000"
              />
            </Field>
          )}

          {type === "sms" && (
            <div className="space-y-4">
              <Field label="Phone number" htmlFor="qr-sms-num">
                <Input
                  id="qr-sms-num"
                  type="tel"
                  value={fields.smsNumber}
                  onChange={(e) => set("smsNumber", e.target.value)}
                  placeholder="+44 7700 900000"
                />
              </Field>
              <Field label="Message" htmlFor="qr-sms-msg">
                <Textarea
                  id="qr-sms-msg"
                  value={fields.smsMessage}
                  onChange={(e) => set("smsMessage", e.target.value)}
                />
              </Field>
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-4">
              <Field label="Network name (SSID)" htmlFor="qr-ssid">
                <Input
                  id="qr-ssid"
                  value={fields.wifiSsid}
                  onChange={(e) => set("wifiSsid", e.target.value)}
                  placeholder="Office Wi-Fi"
                />
              </Field>
              <Field label="Security" htmlFor="qr-sec">
                <Select
                  id="qr-sec"
                  value={fields.wifiSecurity}
                  onChange={(e) => set("wifiSecurity", e.target.value as Fields["wifiSecurity"])}
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP (legacy)</option>
                  <option value="nopass">Open — no password</option>
                </Select>
              </Field>
              {fields.wifiSecurity !== "nopass" && (
                <Field
                  label="Password"
                  htmlFor="qr-wifi-pass"
                  hint="Anyone who scans this code can join the network."
                >
                  <Input
                    id="qr-wifi-pass"
                    value={fields.wifiPassword}
                    onChange={(e) => set("wifiPassword", e.target.value)}
                  />
                </Field>
              )}
              <Checkbox
                label="Hidden network"
                checked={fields.wifiHidden}
                onChange={(e) => set("wifiHidden", e.target.checked)}
              />
            </div>
          )}

          {type === "vcard" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="qr-vc-first">
                <Input
                  id="qr-vc-first"
                  value={fields.vcardFirst}
                  onChange={(e) => set("vcardFirst", e.target.value)}
                />
              </Field>
              <Field label="Last name" htmlFor="qr-vc-last">
                <Input
                  id="qr-vc-last"
                  value={fields.vcardLast}
                  onChange={(e) => set("vcardLast", e.target.value)}
                />
              </Field>
              <Field label="Company" htmlFor="qr-vc-org">
                <Input
                  id="qr-vc-org"
                  value={fields.vcardOrg}
                  onChange={(e) => set("vcardOrg", e.target.value)}
                />
              </Field>
              <Field label="Job title" htmlFor="qr-vc-title">
                <Input
                  id="qr-vc-title"
                  value={fields.vcardTitle}
                  onChange={(e) => set("vcardTitle", e.target.value)}
                />
              </Field>
              <Field label="Phone" htmlFor="qr-vc-phone">
                <Input
                  id="qr-vc-phone"
                  type="tel"
                  value={fields.vcardPhone}
                  onChange={(e) => set("vcardPhone", e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="qr-vc-email">
                <Input
                  id="qr-vc-email"
                  type="email"
                  value={fields.vcardEmail}
                  onChange={(e) => set("vcardEmail", e.target.value)}
                />
              </Field>
              <Field label="Website" htmlFor="qr-vc-url" className="sm:col-span-2">
                <Input
                  id="qr-vc-url"
                  value={fields.vcardUrl}
                  onChange={(e) => set("vcardUrl", e.target.value)}
                />
              </Field>
            </div>
          )}

          {type === "geo" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude" htmlFor="qr-lat">
                <Input
                  id="qr-lat"
                  type="number"
                  step="any"
                  value={fields.geoLat}
                  onChange={(e) => set("geoLat", e.target.value)}
                  placeholder="53.4808"
                />
              </Field>
              <Field label="Longitude" htmlFor="qr-lng">
                <Input
                  id="qr-lng"
                  type="number"
                  step="any"
                  value={fields.geoLng}
                  onChange={(e) => set("geoLng", e.target.value)}
                  placeholder="-2.2426"
                />
              </Field>
            </div>
          )}
        </ToolPanel>

        <ToolPanel title="Appearance">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code colour" htmlFor="qr-fg">
              <div className="flex gap-2">
                <input
                  id="qr-fg"
                  type="color"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                />
                <Input
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label="Background colour" htmlFor="qr-bg">
              <div className="flex gap-2">
                <input
                  id="qr-bg"
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

          {contrast < 3 && (
            <Alert tone="warning" title="Low contrast">
              These colours have a contrast ratio of {contrast.toFixed(1)}:1. Many scanners need at
              least 3:1 — make the code darker or the background lighter.
            </Alert>
          )}

          <Slider
            label="Size"
            suffix="px"
            min={128}
            max={1024}
            step={32}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <Slider
            label="Margin (quiet zone)"
            suffix=" modules"
            min={0}
            max={8}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
          />
          {margin < 2 && (
            <Alert tone="warning">
              A quiet zone of at least 2 modules is recommended — without it some scanners cannot
              find the code.
            </Alert>
          )}

          <Field
            label="Error correction"
            htmlFor="qr-level"
            hint={
              logo
                ? "Forced to High because a logo covers part of the pattern."
                : "Higher levels survive damage but make the code denser."
            }
          >
            <SegmentedControl<ErrorLevel>
              ariaLabel="Error correction level"
              value={effectiveLevel}
              onChange={setLevel}
              options={[
                { value: "L", label: "Low 7%" },
                { value: "M", label: "Med 15%" },
                { value: "Q", label: "Quart 25%" },
                { value: "H", label: "High 30%" },
              ]}
            />
          </Field>

          <Field label="Centre logo" hint="Optional. Keep it small so the code still scans.">
            {logo ? (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="size-10 object-contain" />
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setLogo(null)}>
                  <X className="size-3.5" />
                  Remove
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] text-sm text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg)]"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                Upload logo
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                pickLogo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Field>
        </ToolPanel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <ToolPanel title="Your QR code">
          <div className="flex aspect-square items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-4">
            {!payload ? (
              <p className="px-6 text-center text-sm text-[var(--fg-muted)]">
                Fill in the fields on the left and your QR code will appear here.
              </p>
            ) : busy && !pngUrl ? (
              <Spinner />
            ) : pngUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngUrl}
                alt="Generated QR code"
                className="h-full w-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            ) : null}
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={downloadPng} disabled={!pngUrl}>
              <Download />
              PNG
            </Button>
            <Button variant="outline" onClick={downloadSvg} disabled={!svgMarkup}>
              <Download />
              SVG
            </Button>
          </div>
          <Button variant="outline" onClick={print} disabled={!pngUrl} className="w-full">
            <Printer />
            Print
          </Button>

          {payload && (
            <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
              <summary className="cursor-pointer text-xs font-medium text-[var(--fg-muted)]">
                Encoded data ({payload.length} characters)
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-[var(--fg-subtle)]">
                {payload}
              </pre>
            </details>
          )}

          <PrivacyNote>
            Generated in your browser. The code encodes your data directly — there is no redirect
            through our servers, so it will never expire or stop working.
          </PrivacyNote>
        </ToolPanel>
      </div>
    </div>
  );
}

/** Draws the logo into the centre with a padded plate so modules stay readable. */
async function drawLogo(
  canvas: HTMLCanvasElement,
  dataUrl: string,
  background: string,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
  if (!image) return;

  // 22% of the code — level H tolerates roughly 30% loss, leaving headroom.
  const box = canvas.width * 0.22;
  const pad = box * 0.12;
  const x = (canvas.width - box) / 2;
  const y = (canvas.height - box) / 2;

  ctx.fillStyle = background;
  ctx.fillRect(x - pad, y - pad, box + pad * 2, box + pad * 2);

  const scale = Math.min(box / image.width, box / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}
