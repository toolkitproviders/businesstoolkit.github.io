"use client";

import { DocumentTool } from "./document-tool";

/**
 * Thin wrappers so the shared document engine can be reached from the tool
 * registry, which maps a slug to a component taking only `toolSlug`.
 */

export function InvoiceTool({ toolSlug }: { toolSlug: string }) {
  return <DocumentTool kind="invoice" toolSlug={toolSlug} />;
}

export function QuotationTool({ toolSlug }: { toolSlug: string }) {
  return <DocumentTool kind="quote" toolSlug={toolSlug} />;
}

export function PdfInvoiceTool({ toolSlug }: { toolSlug: string }) {
  // Same engine, opened on the template/design tab.
  return <DocumentTool kind="invoice" toolSlug={toolSlug} variant="pdf" />;
}
