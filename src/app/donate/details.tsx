"use client";

import { CopyButton } from "@/components/tools/shared";
import { siteConfig } from "@/lib/site";

/**
 * The transfer details, with a copy button on each field.
 *
 * Typing a long account number by hand is where donations go wrong, so every
 * value is one click away from the clipboard.
 */

const FIELDS: { label: string; value: string; hint?: string }[] = [
  { label: "Account name", value: siteConfig.donations.accountName },
  {
    label: "Account number",
    value: siteConfig.donations.accountNumber,
    hint: `Held with ${siteConfig.donations.provider}`,
  },
  {
    label: "ACH / ABA routing number",
    value: siteConfig.donations.routingNumber,
    hint: "Use this for a US bank transfer",
  },
  { label: "Currency", value: siteConfig.donations.currency },
];

export function DonationDetails() {
  return (
    <dl className="divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
      {FIELDS.map((field) => (
        <div key={field.label} className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
              {field.label}
            </dt>
            <dd className="mt-0.5 break-all font-mono text-[15px] font-semibold text-[var(--fg)]">
              {field.value}
            </dd>
            {field.hint && (
              <dd className="mt-0.5 text-xs text-[var(--fg-muted)]">{field.hint}</dd>
            )}
          </div>
          <CopyButton value={field.value} label="Copy" />
        </div>
      ))}
    </dl>
  );
}
