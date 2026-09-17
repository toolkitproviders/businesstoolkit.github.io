export const siteConfig = {
  name: "BusinessToolKit",
  shortName: "BusinessToolKit",
  // Deliberately without a count — the catalog grows and the title should not drift.
  tagline: "Every Business Tool. One Simple Website.",
  description:
    "Create invoices, quotations, PDFs, images, QR codes, barcodes, calculations, and more — completely online. Free business tools, no signup required.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_US",
  twitter: "@businesstoolkit",
  contactEmail: "toolkitproviders@gmail.com",
  /**
   * Where a donation goes. Kept here rather than inline in the page so there
   * is exactly one copy of the numbers to check and change.
   *
   * These are published on a public page: anyone who visits can read them.
   */
  donations: {
    provider: "ElevatePay",
    accountName: "BusinessToolKit",
    accountNumber: "900100364590",
    routingNumber: "02160672",
    currency: "USD",
  },
  social: [
    { label: "X", href: "https://x.com/businesstoolkit" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/businesstoolkit" },
    { label: "GitHub", href: "https://github.com/businesstoolkit" },
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
