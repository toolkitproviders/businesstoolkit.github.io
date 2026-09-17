"use client";

import * as React from "react";
import { Check, Code2, Copy, Download, ImagePlus, X } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  SegmentedControl,
  Select,
  Slider,
} from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { cn, copyHtml, downloadText, escapeHtml, safeUrl } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Layout = "stacked" | "side" | "compact" | "minimal";

interface Signature {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
  photo: string;
  logo: string;
  linkedin: string;
  x: string;
  instagram: string;
  facebook: string;
  github: string;
  layout: Layout;
  font: string;
  fontSize: number;
  accent: string;
  textColor: string;
  showDivider: boolean;
  showIcons: boolean;
  spacing: number;
  disclaimer: string;
}

const INITIAL: Signature = {
  fullName: "Jordan Ellis",
  jobTitle: "Founder & Creative Director",
  company: "Acme Studio",
  phone: "+44 161 496 0000",
  mobile: "",
  email: "jordan@acme.studio",
  website: "acme.studio",
  address: "12 Rivergate, Manchester M1 2WD",
  photo: "",
  logo: "",
  linkedin: "",
  x: "",
  instagram: "",
  facebook: "",
  github: "",
  layout: "side",
  font: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  accent: "#11224a",
  textColor: "#333333",
  showDivider: true,
  showIcons: true,
  spacing: 6,
  disclaimer: "",
};

const FONTS = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif", label: "Tahoma" },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet MS" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
];

const SOCIALS: { key: keyof Signature; label: string; placeholder: string }[] = [
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/jordanellis" },
  { key: "x", label: "X", placeholder: "x.com/jordanellis" },
  { key: "instagram", label: "Instagram", placeholder: "instagram.com/acmestudio" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/acmestudio" },
  { key: "github", label: "GitHub", placeholder: "github.com/jordanellis" },
];

/**
 * Builds table-based HTML with inline styles.
 *
 * Email clients — Outlook especially — ignore <style> blocks, flexbox, grid and
 * most modern CSS, so the output deliberately stays within the subset that has
 * rendered consistently for twenty years. Every user value is escaped, and
 * every URL passes through `safeUrl`, so a pasted `javascript:` string can
 * never become a live link.
 */
function buildHtml(s: Signature): string {
  const e = escapeHtml;
  const font = s.font;
  const size = s.fontSize;
  const small = Math.max(10, size - 2);
  const gap = s.spacing;

  const link = (href: string, label: string, color = s.accent, bold = false) =>
    `<a href="${e(safeUrl(href))}" style="color:${e(color)};text-decoration:none;${bold ? "font-weight:bold;" : ""}">${e(label)}</a>`;

  const contactRows: string[] = [];

  if (s.phone.trim()) {
    contactRows.push(
      `<tr><td style="padding:0 0 ${gap / 2}px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
        `${s.showIcons ? `<span style="color:${e(s.accent)};">&#9742;</span>&nbsp;` : "<strong>T</strong>&nbsp;"}` +
        link(`tel:${s.phone.replace(/[^\d+]/g, "")}`, s.phone, s.textColor) +
        `</td></tr>`,
    );
  }
  if (s.mobile.trim()) {
    contactRows.push(
      `<tr><td style="padding:0 0 ${gap / 2}px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
        `${s.showIcons ? `<span style="color:${e(s.accent)};">&#128241;</span>&nbsp;` : "<strong>M</strong>&nbsp;"}` +
        link(`tel:${s.mobile.replace(/[^\d+]/g, "")}`, s.mobile, s.textColor) +
        `</td></tr>`,
    );
  }
  if (s.email.trim()) {
    contactRows.push(
      `<tr><td style="padding:0 0 ${gap / 2}px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
        `${s.showIcons ? `<span style="color:${e(s.accent)};">&#9993;</span>&nbsp;` : "<strong>E</strong>&nbsp;"}` +
        link(`mailto:${s.email}`, s.email) +
        `</td></tr>`,
    );
  }
  if (s.website.trim()) {
    contactRows.push(
      `<tr><td style="padding:0 0 ${gap / 2}px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
        `${s.showIcons ? `<span style="color:${e(s.accent)};">&#127760;</span>&nbsp;` : "<strong>W</strong>&nbsp;"}` +
        link(s.website, s.website.replace(/^https?:\/\//, "")) +
        `</td></tr>`,
    );
  }
  if (s.address.trim()) {
    contactRows.push(
      `<tr><td style="padding:0 0 ${gap / 2}px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
        `${s.showIcons ? `<span style="color:${e(s.accent)};">&#128205;</span>&nbsp;` : "<strong>A</strong>&nbsp;"}` +
        `${e(s.address)}</td></tr>`,
    );
  }

  const socialLinks = SOCIALS.map(({ key, label }) => {
    const value = String(s[key] ?? "").trim();
    return value ? link(value, label, s.accent, true) : "";
  }).filter(Boolean);

  const socialRow = socialLinks.length
    ? `<tr><td style="padding:${gap}px 0 0 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">` +
      socialLinks.join(`<span style="color:#cccccc;">&nbsp;|&nbsp;</span>`) +
      `</td></tr>`
    : "";

  const identity =
    `<tr><td style="padding:0 0 2px 0;font-family:${font};font-size:${size + 3}px;font-weight:bold;color:${e(s.accent)};">${e(s.fullName)}</td></tr>` +
    (s.jobTitle.trim()
      ? `<tr><td style="padding:0 0 2px 0;font-family:${font};font-size:${small}px;color:${e(s.textColor)};">${e(s.jobTitle)}</td></tr>`
      : "") +
    (s.company.trim()
      ? `<tr><td style="padding:0 0 ${gap}px 0;font-family:${font};font-size:${size}px;font-weight:bold;color:${e(s.textColor)};">${e(s.company)}</td></tr>`
      : "");

  const divider = s.showDivider
    ? `<tr><td style="padding:${gap}px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-top:1px solid ${e(s.accent)};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>`
    : "";

  const logoRow = s.logo
    ? `<tr><td style="padding:${gap}px 0 0 0;"><img src="${e(s.logo)}" alt="${e(s.company)}" height="34" style="display:block;border:0;max-height:34px;"></td></tr>`
    : "";

  const disclaimerRow = s.disclaimer?.trim()
    ? `<tr><td style="padding:${gap}px 0 0 0;font-family:${font};font-size:${Math.max(9, small - 2)}px;color:#888888;line-height:1.4;">${e(s.disclaimer)}</td></tr>`
    : "";

  const details = `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${identity}${divider}${contactRows.join("")}${socialRow}${logoRow}${disclaimerRow}</table>`;

  const photoCell = s.photo
    ? `<td valign="top" style="padding:0 ${gap * 2}px 0 0;"><img src="${e(s.photo)}" alt="${e(s.fullName)}" width="76" height="76" style="display:block;border:0;border-radius:${s.layout === "minimal" ? "4px" : "38px"};object-fit:cover;"></td>`
    : "";

  if (s.layout === "minimal") {
    const parts = [
      `<strong style="color:${e(s.accent)};">${e(s.fullName)}</strong>`,
      s.jobTitle.trim() && e(s.jobTitle),
      s.company.trim() && `<strong>${e(s.company)}</strong>`,
    ].filter(Boolean);
    const contact = [
      s.email.trim() && link(`mailto:${s.email}`, s.email),
      s.phone.trim() && link(`tel:${s.phone.replace(/[^\d+]/g, "")}`, s.phone, s.textColor),
      s.website.trim() && link(s.website, s.website.replace(/^https?:\/\//, "")),
    ].filter(Boolean);

    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:${font};font-size:${small}px;color:${e(s.textColor)};line-height:1.5;">` +
      `<tr><td style="padding:0 0 2px 0;">${parts.join(`<span style="color:#bbbbbb;"> &middot; </span>`)}</td></tr>` +
      (contact.length
        ? `<tr><td>${contact.join(`<span style="color:#bbbbbb;"> &middot; </span>`)}</td></tr>`
        : "") +
      (disclaimerRow ? `${disclaimerRow}` : "") +
      `</table>`
    );
  }

  if (s.layout === "stacked") {
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="line-height:1.45;">` +
      (s.photo
        ? `<tr><td style="padding:0 0 ${gap}px 0;"><img src="${e(s.photo)}" alt="${e(s.fullName)}" width="76" height="76" style="display:block;border:0;border-radius:38px;object-fit:cover;"></td></tr>`
        : "") +
      `<tr><td>${details}</td></tr></table>`
    );
  }

  if (s.layout === "compact") {
    return (
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="line-height:1.45;"><tr>` +
      photoCell +
      `<td valign="middle">${details}</td></tr></table>`
    );
  }

  // side: photo left, vertical accent rule, details right
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="line-height:1.45;"><tr>` +
    photoCell +
    (s.photo
      ? `<td valign="top" style="border-left:2px solid ${e(s.accent)};padding:0 0 0 ${gap * 2}px;">${details}</td>`
      : `<td valign="top">${details}</td>`) +
    `</tr></table>`
  );
}

function buildPlainText(s: Signature): string {
  return [
    s.fullName,
    s.jobTitle,
    s.company,
    s.phone && `T: ${s.phone}`,
    s.mobile && `M: ${s.mobile}`,
    s.email && `E: ${s.email}`,
    s.website && `W: ${s.website}`,
    s.address,
    s.disclaimer,
  ]
    .filter(Boolean)
    .join("\n");
}

export function EmailSignatureGenerator({ toolSlug }: { toolSlug: string }) {
  const [sig, setSig] = React.useState<Signature>(INITIAL);
  const [copied, setCopied] = React.useState<"rich" | "html" | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const photoRef = React.useRef<HTMLInputElement>(null);
  const logoRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    track("tool_opened", { tool: toolSlug });
  }, [toolSlug]);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const set = <K extends keyof Signature>(key: K, value: Signature[K]) =>
    setSig((prev) => ({ ...prev, [key]: value }));

  const html = React.useMemo(() => buildHtml(sig), [sig]);

  const pickImage = (file: File | undefined, key: "photo" | "logo") => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setNotice("Please choose a PNG, JPG, GIF or WebP image.");
      return;
    }
    if (file.size > 300 * 1024) {
      setNotice(
        "Keep images under 300 KB. Embedded images bloat every email you send — hosting the file and pasting its URL is better.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set(key, typeof reader.result === "string" ? reader.result : "");
      setNotice(null);
    };
    reader.onerror = () => setNotice("That image could not be read.");
    reader.readAsDataURL(file);
  };

  const copyRich = async () => {
    const ok = await copyHtml(html, buildPlainText(sig));
    if (ok) {
      setCopied("rich");
      track("tool_completed", { tool: toolSlug, format: "rich" });
    } else {
      setNotice("Copying failed. Use Copy HTML and paste it into your client's HTML editor.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <ToolPanel title="Your details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="es-name" required>
              <Input
                id="es-name"
                value={sig.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Field>
            <Field label="Job title" htmlFor="es-title">
              <Input
                id="es-title"
                value={sig.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
              />
            </Field>
            <Field label="Company" htmlFor="es-company" className="sm:col-span-2">
              <Input
                id="es-company"
                value={sig.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="es-phone">
              <Input
                id="es-phone"
                type="tel"
                value={sig.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Mobile" htmlFor="es-mobile">
              <Input
                id="es-mobile"
                type="tel"
                value={sig.mobile}
                onChange={(e) => set("mobile", e.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="es-email">
              <Input
                id="es-email"
                type="email"
                value={sig.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Website" htmlFor="es-web">
              <Input
                id="es-web"
                value={sig.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="Address" htmlFor="es-address" className="sm:col-span-2">
              <Input
                id="es-address"
                value={sig.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
        </ToolPanel>

        <ToolPanel title="Images">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageSlot
              label="Profile photo"
              value={sig.photo}
              onPick={() => photoRef.current?.click()}
              onClear={() => set("photo", "")}
            />
            <ImageSlot
              label="Company logo"
              value={sig.logo}
              onPick={() => logoRef.current?.click()}
              onClear={() => set("logo", "")}
            />
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              pickImage(e.target.files?.[0], "photo");
              e.target.value = "";
            }}
          />
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              pickImage(e.target.files?.[0], "logo");
              e.target.value = "";
            }}
          />
          <Alert tone="info">
            Uploaded images are embedded for the preview. For a signature you send every day, host
            the image at a public URL and paste that instead — embedded images inflate every
            message and some clients block them.
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Photo URL" htmlFor="es-photo-url">
              <Input
                id="es-photo-url"
                value={sig.photo.startsWith("data:") ? "" : sig.photo}
                onChange={(e) => set("photo", e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </Field>
            <Field label="Logo URL" htmlFor="es-logo-url">
              <Input
                id="es-logo-url"
                value={sig.logo.startsWith("data:") ? "" : sig.logo}
                onChange={(e) => set("logo", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </Field>
          </div>
        </ToolPanel>

        <ToolPanel title="Social links">
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map(({ key, label, placeholder }) => (
              <Field key={key} label={label} htmlFor={`es-${key}`}>
                <Input
                  id={`es-${key}`}
                  value={String(sig[key] ?? "")}
                  onChange={(e) => set(key, e.target.value as Signature[typeof key])}
                  placeholder={placeholder}
                />
              </Field>
            ))}
          </div>
        </ToolPanel>

        <ToolPanel title="Design">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--fg)]">Layout</p>
            <SegmentedControl<Layout>
              ariaLabel="Signature layout"
              value={sig.layout}
              onChange={(v) => set("layout", v)}
              options={[
                { value: "side", label: "Side" },
                { value: "stacked", label: "Stacked" },
                { value: "compact", label: "Compact" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
          </div>

          <Field label="Font" htmlFor="es-font" hint="Only web-safe fonts render reliably in email.">
            <Select id="es-font" value={sig.font} onChange={(e) => set("font", e.target.value)}>
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>

          <Slider
            label="Font size"
            suffix="px"
            min={10}
            max={20}
            value={sig.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
          />
          <Slider
            label="Spacing"
            suffix="px"
            min={2}
            max={16}
            value={sig.spacing}
            onChange={(e) => set("spacing", Number(e.target.value))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Accent colour" htmlFor="es-accent">
              <div className="flex gap-2">
                <input
                  id="es-accent"
                  type="color"
                  value={sig.accent}
                  onChange={(e) => set("accent", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                />
                <Input
                  value={sig.accent}
                  onChange={(e) => set("accent", e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label="Text colour" htmlFor="es-text">
              <div className="flex gap-2">
                <input
                  id="es-text"
                  type="color"
                  value={sig.textColor}
                  onChange={(e) => set("textColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-transparent"
                />
                <Input
                  value={sig.textColor}
                  onChange={(e) => set("textColor", e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
          </div>

          <Checkbox
            label="Show divider line"
            checked={sig.showDivider}
            onChange={(e) => set("showDivider", e.target.checked)}
          />
          <Checkbox
            label="Show contact icons"
            description="Unicode symbols, which render everywhere. Image icons often get blocked."
            checked={sig.showIcons}
            onChange={(e) => set("showIcons", e.target.checked)}
          />

          <Field label="Legal disclaimer" htmlFor="es-disclaimer" hint="Optional small print.">
            <Input
              id="es-disclaimer"
              value={sig.disclaimer}
              onChange={(e) => set("disclaimer", e.target.value)}
              placeholder="This email and any attachments are confidential."
            />
          </Field>
        </ToolPanel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <ToolPanel title="Live preview" description="Shown at the size it will appear in an email.">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white p-6">
            {/*
              Rendered markup is built by buildHtml from this component's own
              state, with every user value escaped and every URL validated.
            */}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          {notice && <Alert tone="warning" onDismiss={() => setNotice(null)}>{notice}</Alert>}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={copyRich}>
              {copied === "rich" ? <Check /> : <Copy />}
              {copied === "rich" ? "Copied" : "Copy signature"}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(html).catch(() => {});
                setCopied("html");
              }}
            >
              {copied === "html" ? <Check /> : <Code2 />}
              {copied === "html" ? "Copied" : "Copy HTML"}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              downloadText(
                `<!doctype html><html><head><meta charset="utf-8"><title>Email signature</title></head><body>${html}</body></html>`,
                "email-signature.html",
                "text/html",
              );
              track("download_clicked", { tool: toolSlug });
            }}
          >
            <Download />
            Download HTML file
          </Button>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <h3 className="text-sm font-semibold">How to install it</h3>
            <dl className="mt-2.5 space-y-2 text-xs text-[var(--fg-muted)]">
              <div>
                <dt className="font-medium text-[var(--fg)]">Gmail</dt>
                <dd>
                  Copy signature → Settings → See all settings → General → Signature → paste.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--fg)]">Outlook (desktop)</dt>
                <dd>Copy signature → File → Options → Mail → Signatures → paste.</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--fg)]">Apple Mail</dt>
                <dd>
                  Settings → Signatures → create one → paste, and untick &ldquo;Always match my
                  default message font&rdquo;.
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--fg-subtle)]">
              Use <strong>Copy signature</strong> for all three — <strong>Copy HTML</strong> is for
              clients that take raw markup, such as a webmail HTML editor or a CRM template.
            </p>
          </div>
        </ToolPanel>

        <details className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium">View generated HTML</summary>
          <pre className="thin-scroll mt-3 max-h-72 overflow-auto rounded-lg bg-[var(--bg-muted)] p-3 font-mono text-[11px] leading-relaxed">
            {html}
          </pre>
        </details>
      </div>
    </div>
  );
}

function ImageSlot({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <Field label={label}>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-10 rounded object-cover" />
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
            <X className="size-3.5" />
            Remove
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "flex h-[54px] w-full items-center justify-center gap-2 rounded-lg border border-dashed",
            "border-[var(--border-strong)] bg-[var(--bg-subtle)] text-sm text-[var(--fg-muted)]",
            "hover:border-[var(--accent)] hover:text-[var(--fg)]",
          )}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Upload
        </button>
      )}
    </Field>
  );
}
