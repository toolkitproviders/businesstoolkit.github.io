import { round2, toNumber } from "@/lib/utils";

export type DocKind = "invoice" | "quote";
export type TemplateId = "classic" | "modern" | "minimal" | "bold";
export type PageSize = "a4" | "letter";

export interface Party {
  name: string;
  company: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
}

export interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Percentage off this line. */
  discount: number;
  /** Tax rate applied to this line after discount. */
  tax: number;
}

export interface BusinessDoc {
  kind: DocKind;
  template: TemplateId;
  pageSize: PageSize;
  accent: string;

  /** Data URLs — held in memory and in local storage only. */
  logo: string | null;
  signature: string | null;

  from: Party;
  to: Party;

  number: string;
  date: string;
  /** Due date for invoices, expiry date for quotes. */
  dueDate: string;
  currency: string;
  paymentTerms: string;
  reference: string;

  items: LineItem[];

  notes: string;
  paymentInstructions: string;
  terms: string;
  signatureName: string;
}

export interface LineTotals {
  gross: number;
  discountAmount: number;
  net: number;
  taxAmount: number;
  total: number;
}

export interface DocTotals {
  lines: Record<string, LineTotals>;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  /** Tax broken down by rate, so an invoice can show "VAT 20%" separately. */
  taxByRate: { rate: number; amount: number }[];
  total: number;
  itemCount: number;
}

export function emptyParty(): Party {
  return { name: "", company: "", address: "", email: "", phone: "", website: "", taxId: "" };
}

export function emptyItem(id: string): LineItem {
  return { id, name: "", description: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 };
}

/**
 * All money maths for both invoices and quotations.
 *
 * Rounded to 2dp at each step, matching how accounting software treats line
 * totals — summing unrounded values then rounding once produces totals that
 * disagree with the printed lines by a cent.
 */
export function computeTotals(doc: BusinessDoc): DocTotals {
  const lines: Record<string, LineTotals> = {};
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const taxBuckets = new Map<number, number>();

  for (const item of doc.items) {
    const quantity = Math.max(0, toNumber(item.quantity));
    const unitPrice = Math.max(0, toNumber(item.unitPrice));
    const discountPct = Math.min(100, Math.max(0, toNumber(item.discount)));
    const taxPct = Math.max(0, toNumber(item.tax));

    const gross = round2(quantity * unitPrice);
    const discountAmount = round2(gross * (discountPct / 100));
    const net = round2(gross - discountAmount);
    const taxAmount = round2(net * (taxPct / 100));
    const total = round2(net + taxAmount);

    lines[item.id] = { gross, discountAmount, net, taxAmount, total };

    subtotal = round2(subtotal + gross);
    discountTotal = round2(discountTotal + discountAmount);
    taxTotal = round2(taxTotal + taxAmount);

    if (taxAmount > 0) {
      taxBuckets.set(taxPct, round2((taxBuckets.get(taxPct) ?? 0) + taxAmount));
    }
  }

  return {
    lines,
    subtotal,
    discountTotal,
    taxTotal,
    taxByRate: [...taxBuckets.entries()]
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => a.rate - b.rate),
    total: round2(subtotal - discountTotal + taxTotal),
    itemCount: doc.items.length,
  };
}

/** Labels that differ between the two document kinds. */
export function docLabels(kind: DocKind) {
  return kind === "invoice"
    ? {
        title: "INVOICE",
        numberLabel: "Invoice number",
        dateLabel: "Invoice date",
        dueLabel: "Due date",
        totalLabel: "Amount due",
        partyLabel: "Bill to",
        filePrefix: "invoice",
      }
    : {
        title: "QUOTATION",
        numberLabel: "Quote number",
        dateLabel: "Quote date",
        dueLabel: "Valid until",
        totalLabel: "Quote total",
        partyLabel: "Quote for",
        filePrefix: "quotation",
      };
}
