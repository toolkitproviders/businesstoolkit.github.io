/**
 * The single source of truth for every tool on the site.
 *
 * Navigation, the homepage grid, global search, `sitemap.ts`, breadcrumbs,
 * JSON-LD, related-tool links and each tool page's copy are all generated from
 * this registry — adding a new tool means adding one entry here plus a route.
 */

export type { Tool, FaqItem, ToolCategory } from "@/lib/tool-types";
import type { Tool, ToolCategory } from "@/lib/tool-types";
import { categories, categoryOrder } from "@/lib/tool-types";
import { calculatorTools } from "@/lib/catalog/calculators";
import { textTools } from "@/lib/catalog/text";
import { developerTools } from "@/lib/catalog/developer";
import { unitTools } from "@/lib/catalog/units";
import { designTools } from "@/lib/catalog/design";
import { seoTools } from "@/lib/catalog/seo";
import { fileTools } from "@/lib/catalog/files";
import { imageTools } from "@/lib/catalog/images";
import { randomTools } from "@/lib/catalog/random";
import { datetimeTools } from "@/lib/catalog/datetime";
import { productivityTools } from "@/lib/catalog/productivity";

export { categories, categoryOrder };

const baseTools: Tool[] = [
  // ------------------------------------------------------------------ business
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    tagline: "Build a professional invoice and download it as a PDF in minutes.",
    description:
      "Create branded, itemised invoices with automatic subtotals, per-line discounts and tax, then download a print-ready PDF — free, with no signup and no watermark.",
    category: "business",
    icon: "receipt",
    keywords: [
      "invoice", "bill", "billing", "make invoice", "create invoice", "invoice maker",
      "invoice template", "freelance invoice", "tax invoice", "send bill",
    ],
    seoTitle: "Free Invoice Generator — Create & Download PDF Invoices Online",
    seoDescription:
      "Create professional invoices online for free. Add your logo, line items, discounts and tax, preview live, then download a print-ready PDF. No signup, no watermark.",
    features: [
      "Live preview that updates as you type",
      "Add your logo, signature, notes, payment instructions and terms",
      "Per-line quantity, unit price, discount and tax rate",
      "Automatic subtotal, discount, tax and grand total",
      "Reorder or remove line items with one click",
      "Any currency, plus custom tax rates and payment terms",
      "Four professional templates",
      "Download PDF, print, or save locally to reuse later",
    ],
    howTo: [
      "Fill in your business details and upload your logo.",
      "Add your customer's name and address.",
      "Set the invoice number, dates, currency and payment terms.",
      "Add each product or service with quantity, price, discount and tax.",
      "Check the live preview, then click Download PDF.",
    ],
    faq: [
      {
        q: "Is the invoice generator really free?",
        a: "Yes, and permanently. You can create, preview, print and download unlimited PDF invoices with no watermark, no trial and no account. There is no paid tier to upgrade to.",
      },
      {
        q: "Where is my invoice data stored?",
        a: "Everything runs in your browser. Invoices are only saved if you press Save, and they are written to your own browser's local storage — never uploaded to our servers.",
      },
      {
        q: "Can I add VAT or sales tax?",
        a: "Yes. Set a tax rate per line item, or apply the same rate to every line. The tax total is calculated automatically and shown as its own row on the invoice.",
      },
      {
        q: "Does it support my currency?",
        a: "You can pick from every major world currency, and the symbol and formatting update everywhere on the invoice, including the PDF.",
      },
      {
        q: "Can I turn an invoice into a quotation?",
        a: "Yes — and the reverse. The Quotation Generator has a one-click Convert to Invoice button that carries every line item across.",
      },
    ],
    related: ["quotation-generator", "pdf-invoice-maker", "vat-tax-calculator", "profit-margin-calculator"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "quotation-generator",
    name: "Quotation Generator",
    tagline: "Send polished quotes and convert them to invoices in one click.",
    description:
      "Produce professional quotations and estimates with live totals, expiry dates and terms — then convert an accepted quote into an invoice without retyping anything.",
    category: "business",
    icon: "file-signature",
    keywords: [
      "quotation", "quote", "estimate", "proposal", "bid", "quote generator",
      "estimate maker", "price quote", "sales quote",
    ],
    seoTitle: "Free Quotation Generator — Create Professional Quotes & Estimates",
    seoDescription:
      "Create and download professional quotations free. Add line items, discounts and tax, set an expiry date, then convert an accepted quote into an invoice.",
    features: [
      "Same editor as the invoice tool, tuned for quotes",
      "Quote number, issue date and expiry date",
      "Line-level discount and tax",
      "Automatic subtotal, discount, tax and total",
      "Validity period and acceptance terms",
      "One-click Convert to Invoice",
      "Download PDF, print, save or share",
    ],
    howTo: [
      "Enter your company and customer details.",
      "Set the quote number, date and expiry date.",
      "List the products or services you are quoting for.",
      "Add notes and terms explaining what is included.",
      "Download the PDF, and convert it to an invoice once accepted.",
    ],
    faq: [
      {
        q: "What is the difference between a quotation and an invoice?",
        a: "A quotation is an offer: it tells a customer what work will cost before they commit, and it expires. An invoice is a demand for payment issued after the work is agreed or delivered.",
      },
      {
        q: "How do I convert a quote to an invoice?",
        a: "Open the quote and press Convert to Invoice. Every line item, customer detail and total is carried across, and you get a fresh invoice number and due date.",
      },
      {
        q: "Can I set how long a quote is valid?",
        a: "Yes. Set an expiry date and the validity period is printed on the quotation so the customer knows the deadline.",
      },
    ],
    related: ["invoice-generator", "pdf-invoice-maker", "profit-margin-calculator", "vat-tax-calculator"],
    privateByDefault: true,
  },
  {
    slug: "profit-margin-calculator",
    name: "Profit Margin Calculator",
    tagline: "Work out gross profit, margin and markup from cost and price.",
    description:
      "Enter your cost price, selling price and quantity to instantly see gross profit, profit margin, markup percentage, total revenue and total cost — with the formulas explained.",
    category: "finance",
    icon: "trending-up",
    keywords: [
      "profit margin", "margin calculator", "markup", "gross profit", "profit",
      "margin vs markup", "pricing", "revenue calculator", "break even",
    ],
    seoTitle: "Profit Margin Calculator — Gross Profit, Margin & Markup",
    seoDescription:
      "Free profit margin calculator. Enter cost and selling price to get gross profit, profit margin %, markup %, total revenue and total cost, with formulas explained.",
    features: [
      "Gross profit per unit and in total",
      "Profit margin percentage",
      "Markup percentage",
      "Total revenue and total cost",
      "Reverse mode: find the price you need for a target margin",
      "Plain-English formula explanations",
      "Visual breakdown of cost versus profit",
    ],
    howTo: [
      "Enter the cost price — what the item costs you.",
      "Enter the selling price — what the customer pays.",
      "Set the quantity to see totals as well as per-unit figures.",
      "Read off the margin, markup and profit in the results panel.",
      "Switch to target-margin mode to work backwards to a price.",
    ],
    faq: [
      {
        q: "What is the difference between margin and markup?",
        a: "Margin is profit as a share of the selling price; markup is profit as a share of the cost. An item costing 60 and sold for 100 has a 40% margin but a 66.7% markup — the same profit, two different denominators.",
      },
      {
        q: "How do I calculate profit margin?",
        a: "Profit margin = (selling price − cost price) ÷ selling price × 100. The calculator shows the arithmetic alongside your result.",
      },
      {
        q: "What is a good profit margin?",
        a: "It varies enormously by industry — grocery retail often runs under 5%, while software can exceed 70%. Compare against typical figures for your own sector rather than a universal benchmark.",
      },
    ],
    related: ["vat-tax-calculator", "salary-calculator", "currency-converter", "invoice-generator"],
    privateByDefault: true,
  },
  {
    slug: "vat-tax-calculator",
    name: "VAT / Tax Calculator",
    tagline: "Add or remove VAT and sales tax at any rate.",
    description:
      "Add tax to a net figure or strip it out of a gross figure at any rate, with presets for common VAT and sales-tax rates around the world.",
    category: "finance",
    icon: "percent",
    keywords: [
      "vat", "tax", "sales tax", "gst", "vat calculator", "add vat", "remove vat",
      "reverse vat", "net to gross", "gross to net", "tax calculator",
    ],
    seoTitle: "VAT & Sales Tax Calculator — Add or Remove Tax at Any Rate",
    seoDescription:
      "Free VAT and sales tax calculator. Add tax to a net amount or remove it from a gross amount at any rate, with presets for common country rates.",
    features: [
      "Add tax to a net amount",
      "Remove tax from a gross amount (reverse VAT)",
      "Country presets for common VAT, GST and sales-tax rates",
      "Custom rates to any number of decimal places",
      "Clear net, tax and gross breakdown",
      "Copy any figure with one click",
    ],
    howTo: [
      "Choose whether you are adding tax or removing it.",
      "Enter the amount.",
      "Pick a country preset or type a custom rate.",
      "Read the net amount, tax amount and gross amount.",
    ],
    faq: [
      {
        q: "How do I remove VAT from a price?",
        a: "Divide the gross price by (1 + rate ÷ 100). At 20% VAT, a gross price of 120 becomes 120 ÷ 1.20 = 100 net, with 20 of tax. Switch the tool to Remove tax and it does this for you.",
      },
      {
        q: "Are the country rates guaranteed to be current?",
        a: "No. The presets are a convenience, not tax advice — rates change and many countries apply reduced or zero rates to specific goods. Always confirm the rate that applies to your transaction.",
      },
      {
        q: "Can I use a custom rate?",
        a: "Yes. Type any rate, including fractional rates such as 8.25%.",
      },
    ],
    related: ["profit-margin-calculator", "salary-calculator", "invoice-generator", "currency-converter"],
    privateByDefault: true,
  },
  {
    slug: "salary-calculator",
    name: "Salary Calculator",
    tagline: "Turn a gross salary into take-home pay per year, month, week or day.",
    description:
      "Break a gross salary down into net pay after tax, pension, insurance and other deductions, shown annually, monthly, weekly, daily and hourly.",
    category: "finance",
    icon: "wallet",
    keywords: [
      "salary", "take home pay", "net pay", "payroll", "wage calculator",
      "gross to net", "annual salary", "hourly rate", "paycheck",
    ],
    seoTitle: "Salary Calculator — Gross to Net Take-Home Pay",
    seoDescription:
      "Free salary calculator. Convert gross salary to net take-home pay after tax, pension and other deductions, broken down by year, month, week, day and hour.",
    features: [
      "Any pay frequency: annual, monthly, weekly, daily or hourly",
      "Income tax as a percentage or a fixed amount",
      "Pension or retirement contributions",
      "Insurance and other custom deductions",
      "Net pay shown across every period at once",
      "Effective deduction rate",
      "Visual breakdown of where the money goes",
    ],
    howTo: [
      "Enter your gross salary and choose how often it is paid.",
      "Add your income tax rate or amount.",
      "Add pension, insurance and any other deductions.",
      "Read your net pay per year, month, week, day and hour.",
    ],
    faq: [
      {
        q: "Does this calculate my exact tax bill?",
        a: "No. It applies the rates and deductions you enter — it does not model progressive tax bands, allowances or local rules for any specific country. Use it for planning and treat a payslip or an accountant as authoritative.",
      },
      {
        q: "How is hourly pay worked out?",
        a: "From the working hours per week and weeks per year you set — 37.5 hours over 52 weeks by default. Adjust both to match your contract.",
      },
      {
        q: "What counts as a deduction?",
        a: "Anything taken off gross pay before it reaches you: income tax, social contributions, pension, health insurance, student loan repayments or salary-sacrifice schemes.",
      },
    ],
    related: ["profit-margin-calculator", "vat-tax-calculator", "currency-converter", "invoice-generator"],
    privateByDefault: true,
  },
  {
    slug: "currency-converter",
    name: "Currency Converter",
    tagline: "Convert between 160+ currencies at live exchange rates.",
    description:
      "Convert any amount between more than 160 world currencies using live reference rates, with a searchable picker, one-click swap and the rate timestamp always on screen.",
    category: "finance",
    icon: "arrow-left-right",
    keywords: [
      "currency", "exchange rate", "convert currency", "forex", "usd to eur",
      "money converter", "fx", "exchange", "conversion rate",
    ],
    seoTitle: "Currency Converter — Live Exchange Rates for 160+ Currencies",
    seoDescription:
      "Free currency converter using live exchange rates. Convert between 160+ world currencies, search any currency and see when rates were last updated.",
    features: [
      "More than 160 currencies",
      "Searchable currency picker with country names",
      "One-click swap",
      "Live mid-market reference rates",
      "Rate and last-updated timestamp always shown",
      "Quick-convert amount shortcuts",
      "Rates cached server-side to stay fast and within API limits",
    ],
    howTo: [
      "Enter the amount you want to convert.",
      "Pick the currency you are converting from.",
      "Pick the currency you are converting to.",
      "Read the converted amount and the exchange rate used.",
    ],
    faq: [
      {
        q: "Where do the exchange rates come from?",
        a: "From a public exchange-rate API, fetched by our server and cached for an hour. The provider is configured behind a service layer, so it can be swapped without changing the tool.",
      },
      {
        q: "Are these the rates my bank will give me?",
        a: "No. These are mid-market reference rates. Banks, cards and money-transfer services add a spread and fees, so your actual rate will be less favourable.",
      },
      {
        q: "How often do rates update?",
        a: "The underlying feed updates daily, and our cache refreshes hourly. The exact timestamp for the rates you are seeing is shown under the result.",
      },
    ],
    related: ["profit-margin-calculator", "vat-tax-calculator", "invoice-generator", "salary-calculator"],
  },

  // ----------------------------------------------------------------- documents
  {
    slug: "pdf-invoice-maker",
    name: "PDF Invoice Maker",
    tagline: "Turn invoice data into a print-ready PDF with your branding.",
    description:
      "A template-first PDF invoice builder: pick a layout, drop in your logo and signature, import existing invoice data, and export a crisp vector PDF ready for print or email.",
    category: "business",
    icon: "file-text",
    keywords: [
      "pdf invoice", "invoice pdf", "make pdf invoice", "print invoice",
      "invoice template pdf", "download invoice", "billing pdf",
    ],
    seoTitle: "PDF Invoice Maker — Create Print-Ready PDF Invoices Free",
    seoDescription:
      "Create high-quality PDF invoices online. Choose a template, add your logo, signature and payment details, import existing invoice data and export a print-ready PDF.",
    features: [
      "Four print-ready templates",
      "Import invoice data from a saved invoice or a JSON file",
      "Logo and signature upload",
      "Payment and tax details block",
      "True vector PDF — text stays sharp at any zoom",
      "A4 and US Letter page sizes",
      "Generated entirely in your browser",
    ],
    howTo: [
      "Choose a template.",
      "Import existing invoice data, or enter it directly.",
      "Upload your logo and signature.",
      "Add payment and tax information.",
      "Export the print-ready PDF.",
    ],
    faq: [
      {
        q: "How is this different from the Invoice Generator?",
        a: "Same document engine, different emphasis. The Invoice Generator is built for composing an invoice from scratch; the PDF Invoice Maker is built around templates, page setup and importing data you already have.",
      },
      {
        q: "Is the PDF good enough to print?",
        a: "Yes. Text and rules are drawn as vectors rather than rasterised, so the file stays sharp at any size, and you can choose A4 or US Letter.",
      },
      {
        q: "Are my invoices uploaded to a server?",
        a: "No. The PDF is built in your browser with pdf-lib; nothing is transmitted.",
      },
    ],
    related: ["invoice-generator", "quotation-generator", "pdf-merger", "pdf-splitter"],
    privateByDefault: true,
  },
  {
    slug: "pdf-merger",
    name: "PDF Merger",
    tagline: "Combine several PDFs into one, in the order you choose.",
    description:
      "Drop in multiple PDF files, drag them into the order you want, and merge them into a single document — entirely in your browser, so nothing is uploaded.",
    category: "files",
    icon: "combine",
    keywords: [
      "merge pdf", "combine pdf", "join pdf", "pdf merger", "concatenate pdf",
      "merge documents", "put pdfs together",
    ],
    seoTitle: "Merge PDF Files Online Free — Combine PDFs in Your Browser",
    seoDescription:
      "Merge multiple PDF files into one free online. Drag to reorder, see page counts and file sizes, and download the combined PDF. Files never leave your browser.",
    features: [
      "Drag and drop multiple PDFs at once",
      "Reorder files by dragging, or with the arrow buttons",
      "Page count and file size per document",
      "Remove any file before merging",
      "Combined page count shown before you commit",
      "100% in-browser — no upload, no server",
    ],
    howTo: [
      "Drop your PDF files onto the upload area.",
      "Drag the files into the order you want them combined.",
      "Remove anything you do not need.",
      "Click Merge PDFs and download the result.",
    ],
    faq: [
      {
        q: "Are my PDFs uploaded anywhere?",
        a: "No. Merging happens in your browser using pdf-lib. Your files never touch a network, which is why the tool works offline once the page has loaded.",
      },
      {
        q: "Is there a file size limit?",
        a: "The tool caps each file at 100 MB to protect your browser's memory. The real limit is your device's available RAM.",
      },
      {
        q: "Can I merge a password-protected PDF?",
        a: "Encrypted PDFs must be unlocked first. If a file is protected you'll get a clear message naming the file rather than a silent failure.",
      },
    ],
    related: ["pdf-splitter", "pdf-to-image", "pdf-invoice-maker", "image-compressor"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "pdf-splitter",
    name: "PDF Splitter",
    tagline: "Extract pages or split a PDF into separate documents.",
    description:
      "Upload a PDF, preview every page as a thumbnail, then extract the pages you want, split by custom ranges, or break the file into one PDF per page.",
    category: "files",
    icon: "scissors",
    keywords: [
      "split pdf", "extract pdf pages", "pdf splitter", "separate pdf",
      "delete pdf pages", "pdf page range", "cut pdf",
    ],
    seoTitle: "Split PDF Online Free — Extract Pages & Split by Range",
    seoDescription:
      "Split a PDF free online. Preview page thumbnails, select pages, extract custom ranges like 1-5 or 6-10, or split into one file per page. Nothing is uploaded.",
    features: [
      "Visual page thumbnails",
      "Click pages to select them",
      "Extract selection into one PDF",
      "Custom ranges such as 1-5, 6-10, 11-20",
      "Split into one PDF per page",
      "Download individually or as a ZIP",
      "Runs entirely in your browser",
    ],
    howTo: [
      "Upload the PDF you want to split.",
      "Wait a moment for the page thumbnails to render.",
      "Click the pages you want, or type page ranges.",
      "Choose Extract selection, Split by ranges or Split every page.",
      "Download the results individually or as a ZIP.",
    ],
    faq: [
      {
        q: "How do I write page ranges?",
        a: "Comma-separate them, using a hyphen for a span: `1-5, 6-10, 11-20`. Each range becomes its own PDF. Single pages work too: `1, 4, 9`.",
      },
      {
        q: "Can I delete pages instead of extracting them?",
        a: "Select every page you want to keep and extract those — the result is your document minus the unwanted pages.",
      },
      {
        q: "Why do thumbnails take a moment?",
        a: "Each page is rendered locally so nothing has to be uploaded. Long documents render progressively, and you can start selecting before it finishes.",
      },
    ],
    related: ["pdf-merger", "pdf-to-image", "pdf-invoice-maker", "image-compressor"],
    privateByDefault: true,
  },
  {
    slug: "pdf-to-image",
    name: "PDF to Image Converter",
    tagline: "Convert PDF pages into PNG, JPG or WebP images.",
    description:
      "Turn any PDF page into a high-resolution PNG, JPG or WebP image, with control over which pages to convert, the output resolution and the compression quality.",
    category: "files",
    icon: "image-down",
    keywords: [
      "pdf to image", "pdf to png", "pdf to jpg", "pdf to jpeg", "pdf to webp",
      "convert pdf", "pdf screenshot", "export pdf pages",
    ],
    seoTitle: "PDF to Image Converter — PDF to PNG, JPG & WebP Online",
    seoDescription:
      "Convert PDF pages to PNG, JPG or WebP online for free. Choose specific pages, set resolution up to 4x and download images individually or as a ZIP.",
    features: [
      "PNG, JPG and WebP output",
      "Convert every page or pick specific ones",
      "Resolution from 1x up to 4x for print-quality output",
      "Quality slider for JPG and WebP",
      "Per-page preview with file size",
      "Download one image or all of them as a ZIP",
      "Rendered locally — the PDF is never uploaded",
    ],
    howTo: [
      "Upload your PDF.",
      "Choose the output format and resolution.",
      "Select which pages to convert.",
      "Click Convert and review the previews.",
      "Download individual images or the full ZIP.",
    ],
    faq: [
      {
        q: "Which format should I pick?",
        a: "PNG for text, diagrams and anything needing a transparent or perfectly crisp result. JPG for photographic pages where file size matters. WebP when you want JPG-like sizes with better quality and your target supports it.",
      },
      {
        q: "What does the resolution multiplier do?",
        a: "1x renders each page at its natural size, roughly 72 DPI. 2x doubles both dimensions, 4x quadruples them — use 3x or 4x if the image is destined for print.",
      },
      {
        q: "Is there a page limit?",
        a: "No hard limit, but rendering hundreds of pages at 4x is memory-hungry. The tool converts pages one at a time and shows progress so a long document stays responsive.",
      },
    ],
    related: ["pdf-splitter", "pdf-merger", "image-compressor", "image-resizer"],
    privateByDefault: true,
  },

  // -------------------------------------------------------------------- images
  {
    slug: "image-compressor",
    name: "Image Compressor",
    tagline: "Shrink JPG, PNG, WebP and AVIF files without visible quality loss.",
    description:
      "Compress JPG, PNG, WebP and AVIF images online while keeping them looking sharp. Compare before and after side by side and see exactly how much you saved.",
    category: "images",
    icon: "image-minus",
    keywords: [
      "compress image", "compress photo", "reduce image size", "image optimizer",
      "shrink image", "compress jpg", "compress png", "make image smaller", "optimise photo",
    ],
    seoTitle: "Image Compressor — Compress JPG, PNG, WebP & AVIF Online Free",
    seoDescription:
      "Compress JPG, PNG, WebP and AVIF images online free while maintaining quality. Batch compress, compare before and after, and see the exact percentage saved.",
    features: [
      "JPG, PNG, WebP and AVIF in and out",
      "Quality slider with an instant size estimate",
      "Side-by-side before and after comparison",
      "Original size, compressed size and percentage saved",
      "Batch compress many images at once",
      "Optional maximum width to cut size further",
      "Download individually or as a ZIP",
      "All processing happens on your device",
    ],
    howTo: [
      "Drop your images onto the upload area.",
      "Pick an output format, or keep the original.",
      "Move the quality slider and watch the estimated size update.",
      "Compare the before and after previews.",
      "Download the compressed images.",
    ],
    faq: [
      {
        q: "Will compressing reduce quality?",
        a: "JPG, WebP and AVIF compression is lossy, so some data is discarded — but between roughly 75% and 85% quality the difference is usually invisible while the file gets far smaller. Use the comparison view to judge it for your own image.",
      },
      {
        q: "Are my photos uploaded to a server?",
        a: "No. Compression runs in your browser on a canvas; the images never leave your device.",
      },
      {
        q: "Which format gives the smallest file?",
        a: "AVIF is usually smallest, then WebP, then JPG — at equal visual quality. AVIF encoding depends on your browser; if it isn't supported the tool tells you instead of silently producing a PNG.",
      },
      {
        q: "Can I compress many images at once?",
        a: "Yes. Add as many as you like, apply the same settings to all of them, and download everything as a single ZIP.",
      },
    ],
    related: ["image-resizer", "social-media-image-resizer", "pdf-to-image", "pdf-merger"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    tagline: "Resize images by pixels, percentage or preset — in bulk.",
    description:
      "Resize one image or hundreds at once by exact dimensions, by percentage, or using presets for profile pictures, website images and social platforms.",
    category: "images",
    icon: "scaling",
    keywords: [
      "resize image", "image resizer", "change image size", "scale image",
      "resize photo", "bulk resize", "image dimensions", "crop resize",
    ],
    seoTitle: "Image Resizer — Resize Images Online by Pixels or Percentage",
    seoDescription:
      "Resize images online free. Set exact width and height, scale by percentage, lock the aspect ratio or use presets. Batch resize and download as a ZIP.",
    features: [
      "Resize by exact width and height",
      "Scale by percentage",
      "Lock or unlock the aspect ratio",
      "Presets for profile pictures, website images and social platforms",
      "Export as JPG, PNG or WebP",
      "Batch resize many images with one setting",
      "Download individually or as a ZIP",
      "High-quality resampling, entirely in your browser",
    ],
    howTo: [
      "Upload one or more images.",
      "Enter a width and height, or choose a preset.",
      "Decide whether to keep the aspect ratio locked.",
      "Pick the output format.",
      "Download the resized images.",
    ],
    faq: [
      {
        q: "Will resizing blur my image?",
        a: "Making an image smaller keeps it sharp. Enlarging beyond the original resolution always softens it, because the extra pixels have to be invented — the tool warns you when you scale above 100%.",
      },
      {
        q: "What does locking the aspect ratio do?",
        a: "It keeps the original proportions: change the width and the height follows automatically, so nothing gets stretched.",
      },
      {
        q: "Can I resize a batch of images at once?",
        a: "Yes. Upload as many as you like; the same dimensions and format apply to all of them, and you can download the lot as a ZIP.",
      },
    ],
    related: ["image-compressor", "social-media-image-resizer", "pdf-to-image", "qr-code-generator"],
    privateByDefault: true,
  },
  {
    slug: "social-media-image-resizer",
    name: "Social Media Image Resizer",
    tagline: "Crop and resize to the exact size every social platform wants.",
    description:
      "Resize images to the correct dimensions for Instagram, Facebook, LinkedIn, YouTube, X, TikTok and Pinterest, with crop, padding and background controls.",
    category: "images",
    icon: "layout-template",
    keywords: [
      "social media image size", "instagram size", "facebook cover", "youtube thumbnail",
      "linkedin banner", "twitter header", "tiktok", "pinterest pin", "story size", "reel size",
    ],
    seoTitle: "Social Media Image Resizer — Correct Sizes for Every Platform",
    seoDescription:
      "Resize images for Instagram, Facebook, LinkedIn, YouTube, X, TikTok and Pinterest. Presets for profiles, covers, posts, stories, reels, thumbnails and banners.",
    features: [
      "Presets for Instagram, Facebook, LinkedIn, YouTube, X, TikTok and Pinterest",
      "Profile pictures, covers, posts, stories, reels, thumbnails and banners",
      "Recommended dimensions shown for every preset",
      "Cover crop or contain with padding",
      "Custom background colour behind padded images",
      "Drag to reposition the crop",
      "JPG, PNG or WebP output",
    ],
    howTo: [
      "Upload the image you want to adapt.",
      "Pick a platform, then a placement such as Post or Story.",
      "Choose Cover to fill the frame or Contain to pad it.",
      "Drag the image to reposition the crop.",
      "Download at the exact recommended size.",
    ],
    faq: [
      {
        q: "What size should an Instagram post be?",
        a: "1080 × 1080 for a square, 1080 × 1350 for a portrait post and 1080 × 1920 for a story or reel. Every preset in the tool shows its dimensions before you export.",
      },
      {
        q: "What is the difference between Cover and Contain?",
        a: "Cover fills the whole frame and crops whatever overflows. Contain fits the entire image inside the frame and fills the leftover space with your chosen background colour.",
      },
      {
        q: "Do these sizes change?",
        a: "Platforms adjust their specs occasionally. The presets follow each platform's current published recommendations, and you can always enter custom dimensions.",
      },
    ],
    related: ["image-resizer", "image-compressor", "qr-code-generator", "email-signature-generator"],
    privateByDefault: true,
  },

  // ---------------------------------------------------------------- generators
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    tagline: "Create custom QR codes for links, Wi-Fi, contacts and more.",
    description:
      "Generate QR codes for URLs, plain text, email, phone, SMS, Wi-Fi networks, vCard contacts and map locations, with custom colours, a centre logo and PNG or SVG export.",
    category: "generators",
    icon: "qr-code",
    keywords: [
      "qr code", "qr generator", "make qr code", "wifi qr", "vcard qr",
      "url qr code", "scan code", "qr png", "qr svg",
    ],
    seoTitle: "QR Code Generator — Free Custom QR Codes (PNG & SVG)",
    seoDescription:
      "Create free custom QR codes for URLs, Wi-Fi, vCards, email, SMS and locations. Change colours, add a logo and download as PNG or SVG. No signup, no expiry.",
    features: [
      "Eight types: URL, text, email, phone, SMS, Wi-Fi, vCard and location",
      "Custom foreground and background colours with a contrast check",
      "Centre logo upload",
      "Adjustable size, margin and error-correction level",
      "Live preview as you type",
      "Download as PNG or scalable SVG",
      "Codes never expire and are not tracked",
    ],
    howTo: [
      "Pick the type of QR code you need.",
      "Fill in the fields for that type.",
      "Adjust the colours, size and margin.",
      "Optionally upload a logo for the centre.",
      "Download as PNG or SVG.",
    ],
    faq: [
      {
        q: "Do these QR codes expire?",
        a: "Never. The code is generated in your browser and encodes your data directly — there is no redirect through our servers, so nothing can stop working later.",
      },
      {
        q: "Why does adding a logo need a higher error-correction level?",
        a: "A logo covers part of the pattern. Level H builds in roughly 30% redundancy so the code still scans; the tool raises the level automatically when you add a logo.",
      },
      {
        q: "Can I make a Wi-Fi QR code?",
        a: "Yes. Choose Wi-Fi, enter the network name, password and security type, and anyone scanning it can join without typing the password.",
      },
      {
        q: "PNG or SVG?",
        a: "PNG for screens, email and social. SVG for print or anywhere it has to scale — it stays perfectly sharp at any size.",
      },
    ],
    related: ["barcode-generator", "password-generator", "email-signature-generator", "business-name-generator"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    tagline: "Generate strong, truly random passwords in your browser.",
    description:
      "Create cryptographically secure random passwords with full control over length and character sets, plus a live entropy and strength readout.",
    category: "generators",
    icon: "key-round",
    keywords: [
      "password generator", "random password", "strong password", "secure password",
      "passphrase", "password strength", "entropy",
    ],
    seoTitle: "Secure Password Generator — Strong Random Passwords Online",
    seoDescription:
      "Generate strong, cryptographically secure random passwords. Set the length and character sets, and see the entropy. Nothing is stored or transmitted.",
    features: [
      "Uses the browser's cryptographic random number generator",
      "Length from 4 to 128 characters",
      "Uppercase, lowercase, numbers and symbols",
      "Exclude ambiguous characters such as l, 1, I, 0 and O",
      "Memorable passphrase mode",
      "Live entropy in bits and a strength rating",
      "Bulk generation",
      "Never stored, never transmitted",
    ],
    howTo: [
      "Set how long the password should be.",
      "Choose which character types to include.",
      "Exclude ambiguous characters if it will be typed by hand.",
      "Copy the password, or generate a batch.",
    ],
    faq: [
      {
        q: "Are these passwords actually random?",
        a: "Yes. They come from `crypto.getRandomValues`, the browser's cryptographically secure generator, with rejection sampling so no character is more likely than another. `Math.random` is never used.",
      },
      {
        q: "Do you store the passwords you generate?",
        a: "No. Generation happens entirely in your browser, nothing is sent over the network, and nothing is written to storage. Close the tab and it is gone.",
      },
      {
        q: "How long should a password be?",
        a: "At least 16 characters with mixed types for important accounts — that is roughly 100 bits of entropy, far beyond brute force. The entropy readout tells you where you stand.",
      },
      {
        q: "What is entropy?",
        a: "A measure of unpredictability in bits. Each extra bit doubles the number of guesses needed. Under 50 bits is weak, 70+ is strong, 100+ is excellent.",
      },
    ],
    related: ["qr-code-generator", "barcode-generator", "business-name-generator", "email-signature-generator"],
    privateByDefault: true,
  },
  {
    slug: "barcode-generator",
    name: "Barcode Generator",
    tagline: "Create Code 128, EAN, UPC and ITF barcodes with live validation.",
    description:
      "Generate scannable retail and logistics barcodes in six formats, with input validated against each format's rules and PNG or SVG export.",
    category: "generators",
    icon: "scan-barcode",
    keywords: [
      "barcode", "barcode generator", "ean 13", "upc", "code 128", "code 39",
      "itf", "product barcode", "retail barcode", "sku",
    ],
    seoTitle: "Barcode Generator — Code 128, Code 39, EAN, UPC & ITF",
    seoDescription:
      "Generate barcodes online free in Code 128, Code 39, EAN-13, EAN-8, UPC-A and ITF. Input is validated per format. Download as PNG or SVG, or print directly.",
    features: [
      "Code 128, Code 39, EAN-13, EAN-8, UPC-A and ITF",
      "Validation against each format's rules before rendering",
      "Automatic EAN and UPC check-digit calculation",
      "Adjustable bar width, height and margin",
      "Show or hide the human-readable text",
      "Custom colours",
      "Download as PNG or SVG, or print",
    ],
    howTo: [
      "Choose the barcode format you need.",
      "Type the value — the tool validates it as you go.",
      "Adjust size, colours and the text label.",
      "Download as PNG or SVG, or print directly.",
    ],
    faq: [
      {
        q: "Which format should I use?",
        a: "Code 128 for general business and logistics, since it encodes any ASCII text compactly. EAN-13 or UPC-A for retail products sold at checkout. ITF for shipping cartons. Code 39 for older industrial systems.",
      },
      {
        q: "Why is my EAN-13 value rejected?",
        a: "EAN-13 needs exactly 12 or 13 digits. Enter 12 and the check digit is calculated for you; enter 13 and the final digit must match the calculated check digit.",
      },
      {
        q: "Can I sell products with a barcode made here?",
        a: "The barcode will scan correctly, but retail requires a number legitimately assigned to you by GS1. This tool encodes numbers — it does not issue them.",
      },
    ],
    related: ["qr-code-generator", "password-generator", "invoice-generator", "business-name-generator"],
    privateByDefault: true,
  },
  {
    slug: "business-name-generator",
    name: "Business Name Generator",
    tagline: "Generate brandable business names and check domains instantly.",
    description:
      "Describe your business and get dozens of brandable name ideas across different naming styles, with live domain availability checks and a favourites list.",
    category: "generators",
    icon: "sparkles",
    keywords: [
      "business name", "company name", "brand name", "name generator",
      "startup name", "domain name ideas", "naming", "brandable",
    ],
    seoTitle: "Business Name Generator — Brandable Company Name Ideas",
    seoDescription:
      "Generate business name ideas from your industry, keywords and style. Get dozens of brandable names, check .com availability live and save your favourites.",
    features: [
      "Names tailored to your industry, keywords and audience",
      "Six naming styles, from modern and abstract to classic and playful",
      "Control the name length",
      "Live domain availability checks",
      "Favourite and copy any name",
      "Generate more without losing what you saved",
      "Names built from curated word lists matched to your industry",
    ],
    howTo: [
      "Pick your industry and describe what the business does.",
      "Add keywords you would like reflected in the name.",
      "Choose a naming style and preferred length.",
      "Generate, then favourite the names you like.",
      "Check domain availability on your shortlist.",
    ],
    faq: [
      {
        q: "Can I use a generated name for my business?",
        a: "Check first. A generated name may already be trademarked, registered or in use somewhere. Search your national company register and trademark database, and get legal advice, before committing.",
      },
      {
        q: "How accurate is the domain check?",
        a: "It queries public DNS and registry records, so an unregistered domain is reported reliably. Treat it as a strong signal rather than a guarantee — always confirm at a registrar before you buy.",
      },
      {
        q: "How are the names generated?",
        a: "By a rules engine over curated word lists. What you type as your industry picks the word set — a coffee shop gets Roastery and Larder, an accountancy gets Ledger and Treasury — and your keywords become the first half of the name.",
      },
      {
        q: "Is anything sent to an AI service?",
        a: "No. There is no model behind this and no third-party API call. The only outbound request is the optional domain availability check, which queries public registry and DNS records.",
      },
    ],
    related: ["qr-code-generator", "email-signature-generator", "password-generator", "invoice-generator"],
  },
  {
    slug: "email-signature-generator",
    name: "Email Signature Generator",
    tagline: "Design an email signature that renders everywhere.",
    description:
      "Build a professional HTML email signature with your photo, logo and social links, then copy it straight into Gmail, Outlook or Apple Mail.",
    category: "generators",
    icon: "mail",
    keywords: [
      "email signature", "signature generator", "gmail signature", "outlook signature",
      "html signature", "email footer", "professional signature",
    ],
    seoTitle: "Email Signature Generator — Free HTML Signatures for Gmail & Outlook",
    seoDescription:
      "Create a professional HTML email signature free. Add your photo, logo and social links, customise fonts and colours, then copy it into Gmail, Outlook or Apple Mail.",
    features: [
      "Four layouts: stacked, side-by-side, compact and minimal",
      "Photo and company logo",
      "Social links for the major platforms",
      "Font, size, colour, alignment and spacing controls",
      "Optional divider and icons",
      "Live preview at real size",
      "Copy as rich text, copy the HTML, or download the file",
      "Table-based markup for maximum email-client compatibility",
    ],
    howTo: [
      "Enter your name, title, company and contact details.",
      "Add a photo, a logo and your social links.",
      "Choose a layout and adjust fonts and colours.",
      "Check the live preview.",
      "Copy the signature and paste it into your email client's settings.",
    ],
    faq: [
      {
        q: "How do I add this to Gmail?",
        a: "Press Copy signature, then open Gmail Settings → See all settings → General → Signature, create a signature and paste. Use Copy signature rather than Copy HTML — Gmail wants rich text, not markup.",
      },
      {
        q: "Will it look right in Outlook?",
        a: "The signature uses table-based layout with inline styles, which is what Outlook's rendering engine handles best. Outlook ignores some modern CSS, so the design deliberately stays within what it supports.",
      },
      {
        q: "Why isn't my photo showing for recipients?",
        a: "Images must be hosted at a public URL. An uploaded photo is embedded for preview, but for a signature you send every day, host the image somewhere permanent and paste that URL.",
      },
    ],
    related: ["qr-code-generator", "business-name-generator", "social-media-image-resizer", "image-resizer"],
    privateByDefault: true,
  },
];

/** Every tool on the site, assembled from the catalog files. */
export const tools: Tool[] = [
  ...baseTools,
  ...calculatorTools,
  ...textTools,
  ...developerTools,
  ...unitTools,
  ...designTools,
  ...seoTools,
  ...fileTools,
  ...imageTools,
  ...randomTools,
  ...datetimeTools,
  ...productivityTools,
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export const toolSlugs = tools.map((t) => t.slug);

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug);
}

/** Throws at build time if a route references a slug that isn't registered. */
export function requireTool(slug: string): Tool {
  const tool = bySlug.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export function toolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function relatedTools(slug: string, limit = 4): Tool[] {
  const tool = getTool(slug);
  if (!tool) return [];
  const explicit = (tool.related ?? [])
    .map((s) => bySlug.get(s))
    .filter((t): t is Tool => Boolean(t) && t!.slug !== slug);
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const sameCategory = toolsByCategory(tool.category).filter(
    (t) => t.slug !== slug && !explicit.some((e) => e.slug === t.slug),
  );
  return [...explicit, ...sameCategory].slice(0, limit);
}

export const popularTools = tools.filter((t) => t.popular);

/**
 * Ranked fuzzy-ish search over names, taglines and keywords.
 * Deliberately simple and synchronous — it runs on every keystroke in the
 * command palette against 18 records, so there is nothing to optimise.
 */
export function searchTools(query: string, limit = 8): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = tools.map((tool) => {
    const name = tool.name.toLowerCase();
    const haystack = [
      name,
      tool.tagline.toLowerCase(),
      tool.category,
      ...tool.keywords,
    ].join(" ");

    let score = 0;
    if (name === q) score += 200;
    if (name.startsWith(q)) score += 120;
    if (name.includes(q)) score += 80;
    if (tool.keywords.some((k) => k === q)) score += 90;
    if (tool.keywords.some((k) => k.startsWith(q))) score += 45;

    // Every term must appear somewhere, so "compress photo" beats "compress".
    let matchedAll = true;
    for (const term of terms) {
      if (haystack.includes(term)) {
        score += name.includes(term) ? 30 : 12;
      } else {
        matchedAll = false;
      }
    }
    if (matchedAll) score += 25;
    if (tool.popular) score += 5;

    return { tool, score };
  });

  return scored
    .filter((s) => s.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.tool);
}
