"use client";

import * as React from "react";
import { computeTotals, docLabels, type BusinessDoc } from "./types";
import { formatMoney } from "@/lib/currencies";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Live on-screen preview. Deliberately mirrors the PDF layout closely so what
 * people approve on screen is what lands in the downloaded file, but it is
 * plain HTML — the PDF is generated separately by `pdf.ts`.
 *
 * Scaled to fit its container with a CSS transform; `.print-area` lets the
 * browser Print button produce a clean page with no site chrome.
 */
export function DocumentPreview({
  doc,
  className,
}: {
  doc: BusinessDoc;
  className?: string;
}) {
  const totals = computeTotals(doc);
  const labels = docLabels(doc.kind);
  const accent = doc.accent || "#11224a";

  const money = (value: number) => formatMoney(value, doc.currency);

  const banner = doc.template === "bold";
  const stripe = doc.template === "modern";
  const filledHead = doc.template === "modern" || doc.template === "bold";
  const ruled = doc.template === "classic";

  const issuer = doc.from.company || doc.from.name;

  return (
    <div
      className={cn(
        "print-area mx-auto w-full origin-top bg-white text-[#0f172a] shadow-card",
        className,
      )}
      style={{ aspectRatio: doc.pageSize === "a4" ? "210 / 297" : "8.5 / 11" }}
    >
      {/* Container queries keep type proportional at any preview width. */}
      <div className="@container h-full w-full overflow-hidden">
        <div className="flex h-full flex-col p-[5.5%] text-[clamp(6px,1.35cqw,11px)] leading-snug">
          {banner && (
            <div
              className="-mx-[5.5%] -mt-[5.5%] mb-[4%] px-[5.5%] py-[3.5%]"
              style={{ backgroundColor: accent }}
            >
              <p className="text-[2.6em] font-bold tracking-tight text-white">{labels.title}</p>
              {issuer && <p className="mt-[0.3em] text-[1.15em] font-semibold text-white/90">{issuer}</p>}
            </div>
          )}

          {doc.template === "modern" && (
            <div className="-mx-[5.5%] -mt-[5.5%] mb-[4%] h-[0.8%]" style={{ backgroundColor: accent }} />
          )}

          {/* Header */}
          <header className="flex items-start justify-between gap-[3%]">
            <div className="min-w-0">
              {!banner && (
                <p
                  className={cn(
                    "font-bold tracking-tight",
                    doc.template === "minimal" ? "text-[2em]" : "text-[2.5em]",
                  )}
                  style={{ color: accent }}
                >
                  {doc.template === "minimal"
                    ? labels.title.charAt(0) + labels.title.slice(1).toLowerCase()
                    : labels.title}
                </p>
              )}
              {!banner && issuer && (
                <p className="mt-[0.4em] text-[1.15em] font-semibold">{issuer}</p>
              )}
            </div>
            {doc.logo && (
              // Data URL from the user's own upload, rendered locally only.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.logo}
                alt=""
                className="max-h-[4.5em] max-w-[30%] shrink-0 object-contain"
              />
            )}
          </header>

          {/* Parties + meta */}
          <div className="mt-[4%] flex gap-[4%]">
            <div className="flex min-w-0 flex-1 flex-col gap-[1.2em]">
              <PartyBlock
                heading="From"
                lines={[
                  doc.from.company,
                  doc.from.name,
                  doc.from.address,
                  doc.from.email,
                  doc.from.phone,
                  doc.from.website,
                  doc.from.taxId && `Tax ID: ${doc.from.taxId}`,
                ]}
              />
              <PartyBlock
                heading={labels.partyLabel}
                lines={[
                  doc.to.company,
                  doc.to.name,
                  doc.to.address,
                  doc.to.email,
                  doc.to.phone,
                  doc.to.taxId && `Tax ID: ${doc.to.taxId}`,
                ]}
              />
            </div>

            <div className="w-[42%] shrink-0">
              <dl className="space-y-[0.5em]">
                <MetaRow label={labels.numberLabel} value={doc.number} />
                <MetaRow label={labels.dateLabel} value={doc.date && formatDate(doc.date)} />
                <MetaRow label={labels.dueLabel} value={doc.dueDate && formatDate(doc.dueDate)} />
                <MetaRow label="Payment terms" value={doc.paymentTerms} />
                <MetaRow label="Reference" value={doc.reference} />
              </dl>
              <div
                className="mt-[1em] px-[0.9em] py-[0.7em]"
                style={{
                  backgroundColor: filledHead ? accent : "#f4f7fb",
                  color: filledHead ? "#fff" : "inherit",
                }}
              >
                <p className="text-[0.85em] opacity-80">{labels.totalLabel}</p>
                <p
                  className="tabular text-[1.7em] font-bold"
                  style={{ color: filledHead ? "#fff" : accent }}
                >
                  {money(totals.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <table className="mt-[4%] w-full border-collapse text-left">
            <thead>
              <tr
                style={{
                  backgroundColor: filledHead ? accent : "transparent",
                  color: filledHead ? "#fff" : "#64748b",
                  borderBottom: filledHead ? "none" : `1.5px solid ${accent}`,
                }}
              >
                <Th className="w-[46%] pl-[0.7em]">Description</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Unit price</Th>
                <Th className="text-right">Disc</Th>
                <Th className="text-right">Tax</Th>
                <Th className="pr-[0.7em] text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {doc.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-[1.5em] text-center text-[0.95em] text-[#94a3b8]">
                    No items yet — add your first line item.
                  </td>
                </tr>
              ) : (
                doc.items.map((item, i) => {
                  const line = totals.lines[item.id];
                  return (
                    <tr
                      key={item.id}
                      style={{
                        backgroundColor: stripe && i % 2 === 1 ? "#f8fafc" : undefined,
                        borderBottom: ruled ? "0.5px solid #e2e8f0" : undefined,
                      }}
                    >
                      <td className="py-[0.55em] pl-[0.7em] pr-[0.4em] align-top">
                        <p className="font-semibold">{item.name || "Item"}</p>
                        {item.description && (
                          <p className="mt-[0.15em] text-[0.88em] text-[#64748b]">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <Td>{formatQty(item.quantity)}</Td>
                      <Td>{money(item.unitPrice)}</Td>
                      <Td muted>{item.discount ? `${trimNum(item.discount)}%` : "—"}</Td>
                      <Td muted>{item.tax ? `${trimNum(item.tax)}%` : "—"}</Td>
                      <td className="tabular py-[0.55em] pr-[0.7em] text-right align-top font-semibold">
                        {money(line?.gross ?? 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-[2.5%] flex justify-end">
            <dl className="w-[48%] space-y-[0.4em]">
              <TotalRow label="Subtotal" value={money(totals.subtotal)} />
              {totals.discountTotal > 0 && (
                <TotalRow label="Discount" value={`-${money(totals.discountTotal)}`} />
              )}
              {totals.taxByRate.map((bucket) => (
                <TotalRow
                  key={bucket.rate}
                  label={`Tax (${trimNum(bucket.rate)}%)`}
                  value={money(bucket.amount)}
                />
              ))}
              <div className="pt-[0.4em]" style={{ borderTop: `1.5px solid ${accent}` }}>
                <div className="flex items-baseline justify-between">
                  <dt className="text-[1.1em] font-bold">{labels.totalLabel}</dt>
                  <dd className="tabular text-[1.35em] font-bold" style={{ color: accent }}>
                    {money(totals.total)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Notes + signature */}
          <div className="mt-auto flex items-end justify-between gap-[4%] pt-[4%]">
            <div className="min-w-0 flex-1 space-y-[0.9em]">
              <NoteBlock heading="Notes" body={doc.notes} accent={accent} />
              <NoteBlock
                heading="Payment instructions"
                body={doc.paymentInstructions}
                accent={accent}
              />
              <NoteBlock heading="Terms and conditions" body={doc.terms} accent={accent} />
            </div>

            {(doc.signature || doc.signatureName) && (
              <div className="w-[32%] shrink-0 text-right">
                {doc.signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.signature}
                    alt=""
                    className="ml-auto max-h-[3.4em] object-contain"
                  />
                )}
                <div className="mt-[0.3em] border-t border-[#cbd5e1] pt-[0.3em]">
                  <p className="text-[0.88em] text-[#64748b]">
                    {doc.signatureName || "Authorised signature"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyBlock({ heading, lines }: { heading: string; lines: (string | false | undefined)[] }) {
  const present = lines.filter((l): l is string => Boolean(l && l.trim()));
  return (
    <div className="min-w-0">
      <p className="text-[0.8em] font-semibold uppercase tracking-wide text-[#64748b]">{heading}</p>
      {present.length === 0 ? (
        <p className="mt-[0.25em] text-[#94a3b8]">—</p>
      ) : (
        present.map((line, i) => (
          <p
            key={i}
            className={cn("mt-[0.15em] whitespace-pre-line break-words", i === 0 && "font-semibold")}
          >
            {line}
          </p>
        ))
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value?: string | false }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-[1em]">
      <dt className="text-[0.85em] text-[#64748b]">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#64748b]">{label}</dt>
      <dd className="tabular font-semibold">{value}</dd>
    </div>
  );
}

function NoteBlock({ heading, body, accent }: { heading: string; body: string; accent: string }) {
  if (!body.trim()) return null;
  return (
    <div>
      <p className="text-[0.82em] font-semibold" style={{ color: accent }}>
        {heading}
      </p>
      <p className="mt-[0.15em] whitespace-pre-line text-[0.9em] leading-relaxed text-[#475569]">
        {body}
      </p>
    </div>
  );
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th className={cn("py-[0.5em] text-[0.82em] font-semibold uppercase tracking-wide", className)}>
      {children}
    </th>
  );
}

function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td
      className={cn("tabular py-[0.55em] pr-[0.4em] text-right align-top", muted && "text-[#64748b]")}
    >
      {children}
    </td>
  );
}

function formatQty(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function trimNum(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
