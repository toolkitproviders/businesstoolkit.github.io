/**
 * Tool metadata shape and the category set.
 *
 * Split out from `tools.ts` so individual catalog files can import the types
 * without a circular dependency back onto the combined `tools` array.
 */

export type ToolCategory =
  | "calculators"
  | "finance"
  | "business"
  | "datetime"
  | "text"
  | "units"
  | "files"
  | "images"
  | "generators"
  | "developer"
  | "design"
  | "seo"
  | "productivity";

export interface FaqItem {
  q: string;
  a: string;
}

export interface Tool {
  /** URL segment: /tools/<slug> */
  slug: string;
  name: string;
  /** One line shown on cards and in search results. */
  tagline: string;
  /** Long-form intro, shown under the H1. */
  description: string;
  category: ToolCategory;
  /** Key into the icon map in components/tools/tool-icon.tsx. */
  icon: string;
  /** Extra search terms so "compress photo" finds the Image Compressor. */
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  /**
   * Optional. Omitted for simple tools where the on-page formula notes and
   * results already explain everything — padding a bullet list adds nothing
   * for a reader or a search engine.
   */
  features?: string[];
  howTo?: string[];
  faq: FaqItem[];
  /** Overrides the default "other tools in this category" related list. */
  related?: string[];
  /** Everything runs in the browser; no data leaves the device. */
  privateByDefault?: boolean;
  popular?: boolean;
}

export const categories: Record<
  ToolCategory,
  { label: string; slug: string; description: string }
> = {
  calculators: {
    label: "Calculators",
    slug: "calculators",
    description: "Percentages, ratios, discounts, tips and everyday maths.",
  },
  finance: {
    label: "Finance",
    slug: "finance",
    description: "Margins, interest, loans, tax, payroll and cash flow.",
  },
  business: {
    label: "Business",
    slug: "business",
    description: "Invoices, quotes, receipts and the documents that run a company.",
  },
  datetime: {
    label: "Date & Time",
    slug: "datetime",
    description: "Date differences, working days, timers and time zones.",
  },
  text: {
    label: "Text",
    slug: "text",
    description: "Counting, cleaning, converting and reformatting text.",
  },
  units: {
    label: "Unit Converters",
    slug: "units",
    description: "Length, weight, temperature, area, volume, speed, data and time.",
  },
  files: {
    label: "Files",
    slug: "files",
    description: "PDF, CSV and JSON tools that run entirely in your browser.",
  },
  images: {
    label: "Images",
    slug: "images",
    description: "Compress, resize, crop and convert images without uploading them.",
  },
  generators: {
    label: "Generators",
    slug: "generators",
    description: "QR codes, barcodes, passwords, names and signatures.",
  },
  developer: {
    label: "Developer",
    slug: "developer",
    description: "Formatters, encoders, converters and validators.",
  },
  design: {
    label: "Design",
    slug: "design",
    description: "Colour conversion, palettes, gradients and CSS helpers.",
  },
  seo: {
    label: "SEO & Web",
    slug: "seo",
    description: "Meta tags, Open Graph, robots.txt and UTM links.",
  },
  productivity: {
    label: "Productivity",
    slug: "productivity",
    description: "Lists, notes, planners and focus timers, saved in your browser.",
  },
};

export const categoryOrder: ToolCategory[] = [
  "calculators",
  "finance",
  "business",
  "datetime",
  "text",
  "units",
  "files",
  "images",
  "generators",
  "developer",
  "design",
  "seo",
  "productivity",
];
