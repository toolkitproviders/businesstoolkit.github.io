import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { calculatorSlugs } from "@/features/calculators/defs";
import { textToolSlugs } from "@/features/text/defs";
import { designToolSlugs } from "@/features/design/defs";

/**
 * Slug → tool component.
 *
 * Every entry is a `next/dynamic` import so each tool ships its own chunk —
 * without this, the single `/tools/[slug]` route would bundle every tool on
 * the site into one download. Server rendering stays on, so the markup search
 * engines see is unchanged.
 *
 * Calculators, text tools and design tools each resolve to one shared
 * component driven by their definition, which is why adding one of those needs
 * no entry here.
 */

export type ToolComponent = ComponentType<{ toolSlug: string }>;

const CalculatorTool = dynamic(() =>
  import("@/features/calculators/calculator-tool").then((m) => m.CalculatorTool),
);

const TextToolPage = dynamic(() =>
  import("@/features/text/text-tool").then((m) => m.TextToolPage),
);

const DesignToolPage = dynamic(() =>
  import("@/features/design/design-tool").then((m) => m.DesignToolPage),
);

const BESPOKE: Record<string, ToolComponent> = {
  "invoice-generator": dynamic(() =>
    import("@/features/documents/tools").then((m) => m.InvoiceTool),
  ),
  "quotation-generator": dynamic(() =>
    import("@/features/documents/tools").then((m) => m.QuotationTool),
  ),
  "pdf-invoice-maker": dynamic(() =>
    import("@/features/documents/tools").then((m) => m.PdfInvoiceTool),
  ),

  "profit-margin-calculator": dynamic(() =>
    import("@/features/calculators/profit-margin").then((m) => m.ProfitMarginCalculator),
  ),
  "vat-tax-calculator": dynamic(() =>
    import("@/features/calculators/vat-tax").then((m) => m.VatTaxCalculator),
  ),
  "salary-calculator": dynamic(() =>
    import("@/features/calculators/salary").then((m) => m.SalaryCalculator),
  ),
  "currency-converter": dynamic(() =>
    import("@/features/calculators/currency-converter").then((m) => m.CurrencyConverter),
  ),

  "pdf-merger": dynamic(() => import("@/features/pdf/merger").then((m) => m.PdfMerger)),
  "pdf-splitter": dynamic(() => import("@/features/pdf/splitter").then((m) => m.PdfSplitter)),
  "pdf-to-image": dynamic(() => import("@/features/pdf/to-image").then((m) => m.PdfToImage)),

  "image-compressor": dynamic(() =>
    import("@/features/images/compressor").then((m) => m.ImageCompressor),
  ),
  "image-resizer": dynamic(() => import("@/features/images/resizer").then((m) => m.ImageResizer)),
  "social-media-image-resizer": dynamic(() =>
    import("@/features/images/social-resizer").then((m) => m.SocialImageResizer),
  ),
  // One converter component serves every "X to Y" route; the slug picks the
  // formats on offer.
  "image-converter": dynamic(() => import("@/features/images/converter").then((m) => m.ImageConverter)),
  "jpg-to-png-converter": dynamic(() => import("@/features/images/converter").then((m) => m.ImageConverter)),
  "png-to-jpg-converter": dynamic(() => import("@/features/images/converter").then((m) => m.ImageConverter)),
  "webp-converter": dynamic(() => import("@/features/images/converter").then((m) => m.ImageConverter)),
  "image-to-webp-converter": dynamic(() => import("@/features/images/converter").then((m) => m.ImageConverter)),
  "image-cropper": dynamic(() => import("@/features/images/cropper").then((m) => m.ImageCropper)),
  "image-to-base64": dynamic(() => import("@/features/images/base64").then((m) => m.ImageBase64)),
  "image-dimensions-checker": dynamic(() => import("@/features/images/info").then((m) => m.ImageInfoViewer)),
  "file-information-viewer": dynamic(() => import("@/features/files/file-info").then((m) => m.FileInfoViewer)),

  "countdown-timer": dynamic(() => import("@/features/datetime/timers").then((m) => m.CountdownTimer)),
  "stopwatch": dynamic(() => import("@/features/datetime/timers").then((m) => m.Stopwatch)),
  "pomodoro-timer": dynamic(() => import("@/features/datetime/timers").then((m) => m.PomodoroTimer)),
  "world-clock": dynamic(() => import("@/features/datetime/timers").then((m) => m.WorldClock)),

  // One checklist component serves the to-do list and the checklist maker, and
  // one planner serves the daily and weekly views; the slug picks the variant.
  "todo-list": dynamic(() => import("@/features/productivity/checklist").then((m) => m.ChecklistTool)),
  "checklist-maker": dynamic(() => import("@/features/productivity/checklist").then((m) => m.ChecklistTool)),
  "notes": dynamic(() => import("@/features/productivity/notes").then((m) => m.NotesTool)),
  "daily-planner": dynamic(() => import("@/features/productivity/planner").then((m) => m.PlannerTool)),
  "weekly-planner": dynamic(() => import("@/features/productivity/planner").then((m) => m.PlannerTool)),
  "kanban-board": dynamic(() => import("@/features/productivity/kanban").then((m) => m.KanbanBoard)),
  "habit-tracker": dynamic(() => import("@/features/productivity/habits").then((m) => m.HabitTracker)),

  "qr-code-generator": dynamic(() =>
    import("@/features/generators/qr-code").then((m) => m.QrCodeGenerator),
  ),
  "password-generator": dynamic(() =>
    import("@/features/generators/password").then((m) => m.PasswordGenerator),
  ),
  "barcode-generator": dynamic(() =>
    import("@/features/generators/barcode").then((m) => m.BarcodeGenerator),
  ),
  "business-name-generator": dynamic(() =>
    import("@/features/generators/business-name").then((m) => m.BusinessNameGenerator),
  ),
  "email-signature-generator": dynamic(() =>
    import("@/features/generators/email-signature").then((m) => m.EmailSignatureGenerator),
  ),
};

export function getToolComponent(slug: string): ToolComponent | null {
  if (BESPOKE[slug]) return BESPOKE[slug];
  if (calculatorSlugs.includes(slug)) return CalculatorTool;
  if (textToolSlugs.includes(slug)) return TextToolPage;
  if (designToolSlugs.includes(slug)) return DesignToolPage;
  return null;
}

/** Slugs that resolve to a component — used by the registry test. */
export const implementedSlugs = [
  ...Object.keys(BESPOKE),
  ...calculatorSlugs,
  ...textToolSlugs,
  ...designToolSlugs,
];
