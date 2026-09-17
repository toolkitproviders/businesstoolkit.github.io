"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { computeTotals, docLabels, emptyItem, type BusinessDoc, type LineItem, type Party } from "./types";
import { currencies, formatMoney } from "@/lib/currencies";
import { cn, toNumber, uid } from "@/lib/utils";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export interface EditorProps {
  doc: BusinessDoc;
  onChange: (next: BusinessDoc) => void;
}

export function DocumentEditor({ doc, onChange }: EditorProps) {
  const labels = docLabels(doc.kind);
  const totals = computeTotals(doc);

  const set = <K extends keyof BusinessDoc>(key: K, value: BusinessDoc[K]) =>
    onChange({ ...doc, [key]: value });

  const setParty = (side: "from" | "to", key: keyof Party, value: string) =>
    onChange({ ...doc, [side]: { ...doc[side], [key]: value } });

  const setItem = (id: string, patch: Partial<LineItem>) =>
    onChange({
      ...doc,
      items: doc.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  const addItem = () => onChange({ ...doc, items: [...doc.items, emptyItem(uid("li"))] });

  const removeItem = (id: string) =>
    onChange({ ...doc, items: doc.items.filter((item) => item.id !== id) });

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...doc.items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...doc, items: next });
  };

  /** Applies one tax rate to every line — the common case for VAT. */
  const applyTaxToAll = (rate: number) =>
    onChange({ ...doc, items: doc.items.map((item) => ({ ...item, tax: rate })) });

  return (
    <div className="space-y-5">
      <Section title="Your business" description="Appears at the top of the document.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="from-company" className="sm:col-span-2">
            <Input
              id="from-company"
              value={doc.from.company}
              onChange={(e) => setParty("from", "company", e.target.value)}
              placeholder="Acme Studio Ltd"
              autoComplete="organization"
            />
          </Field>
          <Field label="Contact name" htmlFor="from-name">
            <Input
              id="from-name"
              value={doc.from.name}
              onChange={(e) => setParty("from", "name", e.target.value)}
              placeholder="Jordan Ellis"
            />
          </Field>
          <Field label="Email" htmlFor="from-email">
            <Input
              id="from-email"
              type="email"
              value={doc.from.email}
              onChange={(e) => setParty("from", "email", e.target.value)}
              placeholder="billing@acme.studio"
              autoComplete="email"
            />
          </Field>
          <Field label="Address" htmlFor="from-address" className="sm:col-span-2">
            <Textarea
              id="from-address"
              rows={2}
              value={doc.from.address}
              onChange={(e) => setParty("from", "address", e.target.value)}
              placeholder={"12 Rivergate\nManchester M1 2WD"}
            />
          </Field>
          <Field label="Phone" htmlFor="from-phone">
            <Input
              id="from-phone"
              type="tel"
              value={doc.from.phone}
              onChange={(e) => setParty("from", "phone", e.target.value)}
              placeholder="+44 161 496 0000"
            />
          </Field>
          <Field label="Website" htmlFor="from-website">
            <Input
              id="from-website"
              value={doc.from.website}
              onChange={(e) => setParty("from", "website", e.target.value)}
              placeholder="acme.studio"
            />
          </Field>
          <Field label="Tax / VAT number" htmlFor="from-tax" className="sm:col-span-2">
            <Input
              id="from-tax"
              value={doc.from.taxId}
              onChange={(e) => setParty("from", "taxId", e.target.value)}
              placeholder="GB123456789"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Logo"
            hint="PNG or JPG, up to 2 MB."
            value={doc.logo}
            onChange={(value) => set("logo", value)}
          />
          <ImageField
            label="Signature"
            hint="A transparent PNG works best."
            value={doc.signature}
            onChange={(value) => set("signature", value)}
          />
        </div>
      </Section>

      <Section title="Customer" description={`Who this ${doc.kind === "invoice" ? "invoice" : "quotation"} is for.`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" htmlFor="to-name">
            <Input
              id="to-name"
              value={doc.to.name}
              onChange={(e) => setParty("to", "name", e.target.value)}
              placeholder="Riley Chen"
            />
          </Field>
          <Field label="Company" htmlFor="to-company">
            <Input
              id="to-company"
              value={doc.to.company}
              onChange={(e) => setParty("to", "company", e.target.value)}
              placeholder="Northwind Trading"
            />
          </Field>
          <Field label="Address" htmlFor="to-address" className="sm:col-span-2">
            <Textarea
              id="to-address"
              rows={2}
              value={doc.to.address}
              onChange={(e) => setParty("to", "address", e.target.value)}
              placeholder={"400 Harbour Road\nLiverpool L3 4BQ"}
            />
          </Field>
          <Field label="Email" htmlFor="to-email">
            <Input
              id="to-email"
              type="email"
              value={doc.to.email}
              onChange={(e) => setParty("to", "email", e.target.value)}
              placeholder="accounts@northwind.co"
            />
          </Field>
          <Field label="Phone" htmlFor="to-phone">
            <Input
              id="to-phone"
              type="tel"
              value={doc.to.phone}
              onChange={(e) => setParty("to", "phone", e.target.value)}
            />
          </Field>
          <Field label="Customer tax / VAT number" htmlFor="to-tax" className="sm:col-span-2">
            <Input
              id="to-tax"
              value={doc.to.taxId}
              onChange={(e) => setParty("to", "taxId", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title={`${doc.kind === "invoice" ? "Invoice" : "Quotation"} details`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={labels.numberLabel} htmlFor="doc-number" required>
            <Input
              id="doc-number"
              value={doc.number}
              onChange={(e) => set("number", e.target.value)}
              placeholder={doc.kind === "invoice" ? "INV-0001" : "QTE-0001"}
            />
          </Field>
          <Field label="Reference / PO number" htmlFor="doc-ref">
            <Input
              id="doc-ref"
              value={doc.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="PO-88421"
            />
          </Field>
          <Field label={labels.dateLabel} htmlFor="doc-date">
            <Input
              id="doc-date"
              type="date"
              value={doc.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label={labels.dueLabel} htmlFor="doc-due">
            <Input
              id="doc-due"
              type="date"
              value={doc.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </Field>
          <Field label="Currency" htmlFor="doc-currency">
            <Select
              id="doc-currency"
              value={doc.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment terms" htmlFor="doc-terms">
            <Input
              id="doc-terms"
              value={doc.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)}
              placeholder="Net 30"
              list="payment-terms"
            />
            <datalist id="payment-terms">
              <option value="Due on receipt" />
              <option value="Net 7" />
              <option value="Net 14" />
              <option value="Net 30" />
              <option value="Net 60" />
              <option value="50% upfront, 50% on delivery" />
            </datalist>
          </Field>
        </div>
      </Section>

      {/* -------------------------------------------------------- items -- */}
      <Section
        title="Items"
        description="Quantity × unit price, less any discount, plus tax."
        action={
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--fg-muted)]" htmlFor="apply-tax">
              Tax all
            </label>
            <Input
              id="apply-tax"
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue=""
              placeholder="%"
              className="h-8 w-20 text-xs"
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value !== "") applyTaxToAll(toNumber(value));
              }}
            />
          </div>
        }
      >
        <div className="space-y-3">
          {doc.items.map((item, index) => {
            const line = totals.lines[item.id];
            return (
              <div
                key={item.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-medium text-[var(--fg-subtle)]">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-2.5">
                    <Input
                      aria-label={`Item ${index + 1} name`}
                      value={item.name}
                      onChange={(e) => setItem(item.id, { name: e.target.value })}
                      placeholder="Product or service"
                    />
                    <Input
                      aria-label={`Item ${index + 1} description`}
                      value={item.description}
                      onChange={(e) => setItem(item.id, { description: e.target.value })}
                      placeholder="Optional description"
                      className="h-9 text-[13px]"
                    />

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <NumField
                        label="Qty"
                        value={item.quantity}
                        min={0}
                        step="1"
                        onChange={(v) => setItem(item.id, { quantity: v })}
                      />
                      <NumField
                        label="Unit price"
                        value={item.unitPrice}
                        min={0}
                        step="0.01"
                        onChange={(v) => setItem(item.id, { unitPrice: v })}
                      />
                      <NumField
                        label="Discount %"
                        value={item.discount}
                        min={0}
                        max={100}
                        step="0.1"
                        onChange={(v) => setItem(item.id, { discount: v })}
                      />
                      <NumField
                        label="Tax %"
                        value={item.tax}
                        min={0}
                        step="0.1"
                        onChange={(v) => setItem(item.id, { tax: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
                      <span className="text-xs text-[var(--fg-subtle)]">
                        {line && line.discountAmount > 0 && (
                          <>Less {formatMoney(line.discountAmount, doc.currency)} discount · </>
                        )}
                        {line && line.taxAmount > 0 && (
                          <>Tax {formatMoney(line.taxAmount, doc.currency)} · </>
                        )}
                        Line total
                      </span>
                      <span className="tabular text-sm font-semibold text-[var(--fg)]">
                        {formatMoney(line?.total ?? 0, doc.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Move item ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Move item ${index + 1} down`}
                      disabled={index === doc.items.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[var(--error)]"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" onClick={addItem} className="w-full">
          <Plus />
          Add item
        </Button>
      </Section>

      <Section title="Notes and terms">
        <Field
          label="Notes"
          htmlFor="doc-notes"
          hint="Thanks, delivery details, or anything the customer should know."
        >
          <Textarea
            id="doc-notes"
            value={doc.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Thank you for your business."
          />
        </Field>
        <Field label="Payment instructions" htmlFor="doc-payment">
          <Textarea
            id="doc-payment"
            value={doc.paymentInstructions}
            onChange={(e) => set("paymentInstructions", e.target.value)}
            placeholder={"Bank: Example Bank\nAccount: 12345678\nSort code: 00-00-00"}
          />
        </Field>
        <Field label="Terms and conditions" htmlFor="doc-tc">
          <Textarea
            id="doc-tc"
            value={doc.terms}
            onChange={(e) => set("terms", e.target.value)}
            placeholder="Late payments may incur interest at 8% above base rate."
          />
        </Field>
        <Field label="Signature name" htmlFor="doc-signame">
          <Input
            id="doc-signame"
            value={doc.signatureName}
            onChange={(e) => set("signatureName", e.target.value)}
            placeholder="Jordan Ellis, Director"
          />
        </Field>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------- pieces --- */

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--fg)]">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </Card>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-[var(--fg-subtle)]">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(toNumber(e.target.value))}
        className="h-9 text-sm"
      />
    </div>
  );
}

function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string>();

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is over 2 MB. Please choose a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setError("That image could not be read. Try a different file.");
    reader.readAsDataURL(file);
  };

  return (
    <Field label={label} hint={error ? undefined : hint} error={error}>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 w-20 object-contain" />
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="ml-auto">
            <X className="size-3.5" />
            Remove
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-[58px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] text-sm text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg)]"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Upload {label.toLowerCase()}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </Field>
  );
}

/** Exported for the settings row shared by the invoice and quote tools. */
export function DocumentStyleControls({ doc, onChange }: EditorProps) {
  const set = <K extends keyof BusinessDoc>(key: K, value: BusinessDoc[K]) =>
    onChange({ ...doc, [key]: value });

  const templates: { id: BusinessDoc["template"]; label: string }[] = [
    { id: "classic", label: "Classic" },
    { id: "modern", label: "Modern" },
    { id: "minimal", label: "Minimal" },
    { id: "bold", label: "Bold" },
  ];

  const presetColors = ["#11224a", "#18818a", "#b45309", "#7c3aed", "#be123c", "#0f172a"];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--fg)]">Template</p>
        <div className="grid grid-cols-4 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set("template", t.id)}
              aria-pressed={doc.template === t.id}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                doc.template === t.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--fg)]">Accent colour</p>
        <div className="flex flex-wrap items-center gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("accent", color)}
              aria-label={`Use accent colour ${color}`}
              aria-pressed={doc.accent === color}
              className={cn(
                "size-7 rounded-full border-2 transition-transform",
                doc.accent === color
                  ? "scale-110 border-[var(--fg)]"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={doc.accent}
            onChange={(e) => set("accent", e.target.value)}
            aria-label="Custom accent colour"
            className="h-7 w-10 cursor-pointer rounded border border-[var(--border-strong)] bg-transparent"
          />
        </div>
      </div>

      <Checkbox
        label="US Letter page size"
        description="Off uses A4, the international default."
        checked={doc.pageSize === "letter"}
        onChange={(e) => set("pageSize", e.target.checked ? "letter" : "a4")}
      />
    </div>
  );
}
