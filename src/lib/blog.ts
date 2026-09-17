/**
 * Blog content for long-tail SEO.
 *
 * Posts live in code rather than a CMS so they ship as static HTML with zero
 * runtime cost. `body` is a small block array instead of raw HTML, which keeps
 * rendering type-safe and means no `dangerouslySetInnerHTML` anywhere.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; tone: "info" | "warning"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "cta"; toolSlug: string; label: string };

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  readingMinutes: number;
  category: string;
  /** Tool slugs this article should link to. */
  tools: string[];
  body: Block[];
}

export const posts: Post[] = [
  {
    slug: "how-to-create-a-professional-invoice",
    title: "How to Create a Professional Invoice (With a Free Template)",
    description:
      "A step-by-step guide to writing an invoice that gets paid: what to include, how to number them, which payment terms to use, and the mistakes that cause late payment.",
    date: "2026-01-14",
    updated: "2026-08-02",
    readingMinutes: 7,
    category: "Invoicing",
    tools: ["invoice-generator", "pdf-invoice-maker", "vat-tax-calculator"],
    body: [
      {
        type: "p",
        text: "An invoice is not just a receipt of work done — it is the document that triggers payment. A vague or incomplete one gives a client an easy reason to delay, and it is usually the small omissions that cause the longest holdups: a missing purchase order number, an unclear due date, no bank details.",
      },
      {
        type: "p",
        text: "This guide covers exactly what a professional invoice needs, how to structure it, and how to avoid the errors that push payment out by weeks.",
      },
      { type: "h2", text: "What every invoice must contain" },
      {
        type: "p",
        text: "Requirements vary by country, but nearly every jurisdiction expects the same core set of fields. Missing one of these can make an invoice legally invalid for tax purposes.",
      },
      {
        type: "ul",
        items: [
          "The word “Invoice”, so it is not mistaken for a quote or a statement",
          "A unique invoice number that never repeats",
          "Your business name, address and contact details",
          "Your tax or VAT registration number, if you are registered",
          "The customer's name, company and billing address",
          "The invoice date and the payment due date",
          "A line for each product or service, with quantity and unit price",
          "The subtotal, any discount, the tax applied, and the total due",
          "Payment instructions — bank details, payment link, or accepted methods",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Add a purchase order number when you have one",
        text: "Larger companies route invoices through accounts payable systems that match against a PO. An invoice without the PO number often sits unprocessed until someone chases it.",
      },
      { type: "h2", text: "How to number invoices" },
      {
        type: "p",
        text: "Invoice numbers must be unique and, in most tax regimes, sequential with no gaps. Three schemes work well:",
      },
      {
        type: "table",
        head: ["Scheme", "Example", "Best for"],
        rows: [
          ["Sequential", "INV-0001, INV-0002", "Most small businesses"],
          ["Date-based", "2026-01-014", "Steady, predictable volume"],
          ["Client-prefixed", "ACME-0007", "Agencies with a few large accounts"],
        ],
      },
      {
        type: "p",
        text: "Whichever you pick, stay consistent. Switching schemes mid-year makes reconciliation painful and can raise questions in an audit.",
      },
      { type: "h2", text: "Choosing payment terms" },
      {
        type: "p",
        text: "Payment terms set the deadline. “Net 30” means payment is due 30 days after the invoice date. Shorter terms get you paid sooner, but only if the client's process can accommodate them.",
      },
      {
        type: "ul",
        items: [
          "Due on receipt — best for small jobs and new clients",
          "Net 7 or Net 14 — common for freelancers and small agencies",
          "Net 30 — the default for most business-to-business work",
          "Net 60 — usually imposed by large corporates; price it in",
        ],
      },
      {
        type: "p",
        text: "Always write the actual calendar due date on the invoice as well as the term. “Due 13 February 2026” is far harder to misread than “Net 30”.",
      },
      { type: "h2", text: "Handling tax correctly" },
      {
        type: "p",
        text: "If you are registered for VAT, GST or sales tax, the invoice must show the rate applied, the tax amount as its own line, and your registration number. Where different items carry different rates, show the tax per line rather than one lump sum.",
      },
      {
        type: "cta",
        toolSlug: "vat-tax-calculator",
        label: "Work out the tax on an amount",
      },
      { type: "h2", text: "Five mistakes that delay payment" },
      {
        type: "ol",
        items: [
          "No due date — “payment appreciated soon” is not a deadline.",
          "Sending to the wrong address. Ask for the accounts payable email, not your day-to-day contact.",
          "Vague line items. “Consulting — $4,000” invites questions; “Brand workshop, 2 days @ $2,000” does not.",
          "Missing payment details. Never make a client ask how to pay you.",
          "Reusing an invoice number. It breaks reconciliation and looks careless.",
        ],
      },
      { type: "h2", text: "Create your invoice" },
      {
        type: "p",
        text: "Our invoice generator includes every field above, calculates subtotals, discounts and tax automatically, and exports a print-ready PDF. It runs entirely in your browser, so your client data is never uploaded anywhere.",
      },
      { type: "cta", toolSlug: "invoice-generator", label: "Create an invoice now" },
    ],
  },
  {
    slug: "invoice-vs-quotation",
    title: "Invoice vs Quotation: What's the Difference?",
    description:
      "Quotations and invoices look similar but do completely different jobs. Here is when to send each, what changes between them, and how to convert one into the other.",
    date: "2026-02-03",
    readingMinutes: 5,
    category: "Invoicing",
    tools: ["quotation-generator", "invoice-generator"],
    body: [
      {
        type: "p",
        text: "Both documents list line items and totals, which is why they get confused. The difference is what they commit you to and when they are sent.",
      },
      { type: "h2", text: "The short answer" },
      {
        type: "table",
        head: ["", "Quotation", "Invoice"],
        rows: [
          ["Sent", "Before the work", "After the work is agreed or delivered"],
          ["Purpose", "Offer a price", "Request payment"],
          ["Binding", "An offer, valid until it expires", "A demand for payment"],
          ["Key date", "Expiry date", "Payment due date"],
          ["Numbering", "Quote number", "Invoice number (sequential, no gaps)"],
          ["Accounting", "Not recorded as revenue", "Recorded as revenue or a receivable"],
        ],
      },
      { type: "h2", text: "When to send a quotation" },
      {
        type: "p",
        text: "Send a quotation whenever the client needs to know the cost before committing — new projects, variable scope, competitive tenders. A quotation protects both sides: it fixes the price for a defined period and states exactly what is included.",
      },
      {
        type: "ul",
        items: [
          "Give it an expiry date. Without one, a client can accept a six-month-old price.",
          "Be explicit about what is excluded — that is where disputes start.",
          "State the assumptions the price depends on.",
          "Note whether prices include or exclude tax.",
        ],
      },
      { type: "h2", text: "When to send an invoice" },
      {
        type: "p",
        text: "Send an invoice once the work is agreed, delivered, or has reached an agreed milestone. Unlike a quotation, an invoice enters your accounts — it must be sequentially numbered and retained for the period your tax authority requires.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "A quotation is not proof of income",
        text: "Only invoices belong in your bookkeeping. Recording a quotation as revenue overstates your income and creates a mess to unwind at year end.",
      },
      { type: "h2", text: "Converting a quotation into an invoice" },
      {
        type: "p",
        text: "Once a quote is accepted, the invoice should mirror it exactly. Any difference in scope or price needs to be agreed in writing first — an invoice that quietly differs from the quote is the fastest route to a dispute.",
      },
      {
        type: "ol",
        items: [
          "Copy every line item across unchanged.",
          "Replace the quote number with a new sequential invoice number.",
          "Swap the expiry date for a payment due date.",
          "Reference the original quote number on the invoice.",
          "Add your payment instructions.",
        ],
      },
      {
        type: "p",
        text: "Our quotation generator does all five steps with one button, so nothing gets retyped and nothing drifts.",
      },
      { type: "cta", toolSlug: "quotation-generator", label: "Create a quotation" },
    ],
  },
  {
    slug: "how-to-calculate-profit-margin",
    title: "How to Calculate Profit Margin (And Why It Isn't Markup)",
    description:
      "The formula for gross profit margin, how margin differs from markup, and how to work backwards from a target margin to the price you need to charge.",
    date: "2026-02-21",
    readingMinutes: 6,
    category: "Finance",
    tools: ["profit-margin-calculator", "vat-tax-calculator"],
    body: [
      {
        type: "p",
        text: "Margin and markup describe the same profit from two different angles, and mixing them up is one of the most expensive arithmetic errors in small business. A shop that thinks it is making 50% when it is making 33% will underprice everything it sells.",
      },
      { type: "h2", text: "The profit margin formula" },
      {
        type: "p",
        text: "Gross profit margin expresses profit as a percentage of the selling price:",
      },
      {
        type: "quote",
        text: "Margin % = (Selling price − Cost price) ÷ Selling price × 100",
      },
      {
        type: "p",
        text: "An item that costs you 60 and sells for 100 earns 40 of gross profit. Divided by the selling price of 100, that is a 40% margin.",
      },
      { type: "h2", text: "The markup formula" },
      {
        type: "p",
        text: "Markup expresses the same profit as a percentage of the cost instead:",
      },
      { type: "quote", text: "Markup % = (Selling price − Cost price) ÷ Cost price × 100" },
      {
        type: "p",
        text: "The same item — cost 60, price 100, profit 40 — has a markup of 40 ÷ 60 = 66.7%. Identical profit, very different percentage, because the denominator changed.",
      },
      {
        type: "table",
        head: ["Margin", "Equivalent markup"],
        rows: [
          ["10%", "11.1%"],
          ["20%", "25.0%"],
          ["25%", "33.3%"],
          ["33.3%", "50.0%"],
          ["50%", "100.0%"],
          ["60%", "150.0%"],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Markup is always the larger number",
        text: "If someone quotes you a percentage above 100%, they are talking about markup — margin can never exceed 100%, because profit cannot be more than the whole selling price.",
      },
      { type: "h2", text: "Pricing for a target margin" },
      {
        type: "p",
        text: "To find the price that achieves a margin you want, divide the cost by one minus the margin:",
      },
      { type: "quote", text: "Selling price = Cost ÷ (1 − target margin)" },
      {
        type: "p",
        text: "For a 40% margin on a cost of 60: 60 ÷ (1 − 0.40) = 60 ÷ 0.60 = 100. The common mistake is to add 40% to the cost instead — 60 × 1.4 = 84, which is only a 28.6% margin.",
      },
      { type: "h2", text: "Gross margin is not net margin" },
      {
        type: "p",
        text: "Everything above is gross margin: revenue minus the direct cost of what you sold. It ignores rent, salaries, software, marketing and tax. Net margin — what actually reaches you — comes after all of those. A healthy gross margin can still leave a business losing money.",
      },
      { type: "cta", toolSlug: "profit-margin-calculator", label: "Calculate your margin" },
    ],
  },
  {
    slug: "how-to-compress-images-without-losing-quality",
    title: "How to Compress Images Without Losing Quality",
    description:
      "Which format to pick, what the quality slider actually does, and how to cut image file sizes by 70% or more without a visible difference.",
    date: "2026-03-11",
    readingMinutes: 6,
    category: "Images",
    tools: ["image-compressor", "image-resizer"],
    body: [
      {
        type: "p",
        text: "Images are usually the heaviest thing on a web page, and most of that weight is avoidable. A typical phone photo dropped straight onto a site is around 4 MB; the same picture, correctly sized and compressed, is often under 200 KB and looks identical on screen.",
      },
      { type: "h2", text: "Resize before you compress" },
      {
        type: "p",
        text: "This is the single biggest win and the one most often skipped. A 4032-pixel-wide photo displayed in a 800-pixel-wide column is carrying five times more pixels than any visitor will ever see. Resizing to the maximum displayed width typically cuts file size by 80% before compression does anything at all.",
      },
      { type: "cta", toolSlug: "image-resizer", label: "Resize an image first" },
      { type: "h2", text: "Choosing a format" },
      {
        type: "table",
        head: ["Format", "Best for", "Transparency", "Typical saving vs JPG"],
        rows: [
          ["JPG", "Photographs", "No", "Baseline"],
          ["PNG", "Logos, screenshots, line art", "Yes", "Often larger"],
          ["WebP", "Almost everything on the web", "Yes", "25–35% smaller"],
          ["AVIF", "Photos where size matters most", "Yes", "40–55% smaller"],
        ],
      },
      {
        type: "p",
        text: "WebP is the safe modern default — every current browser supports it. AVIF compresses harder still but takes longer to encode, and older software may not open it.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Never save a photo as PNG",
        text: "PNG is lossless, which sounds better but means a photograph stays enormous. PNG is for graphics with flat colour and hard edges; for anything camera-shaped, use JPG, WebP or AVIF.",
      },
      { type: "h2", text: "What the quality slider does" },
      {
        type: "p",
        text: "Lossy formats discard detail the eye is least likely to notice. The quality setting controls how aggressively. The relationship is not linear — going from 100 to 85 removes a lot of bytes and almost no visible detail, while going from 60 to 45 saves comparatively little and starts to show.",
      },
      {
        type: "ul",
        items: [
          "90–100 — archival; rarely worth the bytes on the web",
          "75–85 — the sweet spot for almost all web images",
          "60–75 — acceptable for thumbnails and background imagery",
          "Below 60 — visible blocking around edges and in flat areas",
        ],
      },
      { type: "h2", text: "Watch for these" },
      {
        type: "ul",
        items: [
          "Never re-compress an already-compressed image repeatedly — each pass throws away more detail permanently.",
          "Screenshots of text degrade faster than photos; keep them as PNG or use high-quality WebP.",
          "Compression strips EXIF data, which removes GPS coordinates from photos — usually a privacy win.",
          "Always compare before and after at full size, not a thumbnail.",
        ],
      },
      { type: "cta", toolSlug: "image-compressor", label: "Compress your images" },
    ],
  },
  {
    slug: "how-to-merge-pdf-files",
    title: "How to Merge PDF Files (Without Uploading Them Anywhere)",
    description:
      "Combine multiple PDFs into a single document in your browser, keep them in the right order, and understand why local processing matters for confidential files.",
    date: "2026-04-05",
    readingMinutes: 4,
    category: "Documents",
    tools: ["pdf-merger", "pdf-splitter", "pdf-to-image"],
    body: [
      {
        type: "p",
        text: "Merging PDFs is one of those tasks that seems like it should be built into every operating system and mostly is not. The usual answer is a website that asks you to upload your files — which is fine for a restaurant menu and a poor idea for a contract, a medical record or a payroll report.",
      },
      { type: "h2", text: "Why local processing matters" },
      {
        type: "p",
        text: "Most online PDF tools upload your document to a server, process it there, and hand back a download link. That means a copy of your file exists on infrastructure you do not control, for a retention period you have to take on trust.",
      },
      {
        type: "p",
        text: "Modern browsers can do the whole job locally. Our merger reads your files with the File API and combines them in memory — the bytes never touch a network. You can verify this yourself: open the browser's network tab, merge a document, and watch nothing happen.",
      },
      {
        type: "callout",
        tone: "info",
        title: "It works offline",
        text: "Once the page has loaded, disconnect from the internet and the tool still merges. That is the clearest proof that nothing is being uploaded.",
      },
      { type: "h2", text: "Merging step by step" },
      {
        type: "ol",
        items: [
          "Open the PDF Merger and drop all your files onto the upload area.",
          "Check the page count shown for each file.",
          "Drag the files into the order you want, or use the arrow buttons.",
          "Remove anything that got picked up by mistake.",
          "Click Merge and the combined PDF downloads immediately.",
        ],
      },
      { type: "h2", text: "Things worth knowing" },
      {
        type: "ul",
        items: [
          "Order is by file, not by page. To interleave pages, split the files first and merge the pieces.",
          "Password-protected PDFs must be unlocked before merging.",
          "Form fields and annotations are preserved, but form data may need flattening for consistent behaviour.",
          "Merging does not re-compress; the output size is roughly the sum of the inputs.",
        ],
      },
      { type: "cta", toolSlug: "pdf-merger", label: "Merge PDFs now" },
    ],
  },
  {
    slug: "best-image-sizes-for-social-media",
    title: "Best Image Sizes for Social Media (2026 Reference)",
    description:
      "Current recommended dimensions for Instagram, Facebook, LinkedIn, YouTube, X, TikTok and Pinterest — profiles, covers, posts, stories and thumbnails.",
    date: "2026-05-19",
    updated: "2026-09-01",
    readingMinutes: 5,
    category: "Images",
    tools: ["social-media-image-resizer", "image-resizer", "image-compressor"],
    body: [
      {
        type: "p",
        text: "Every platform crops differently, and uploading the wrong aspect ratio is how faces end up cut in half. These are the dimensions each platform currently recommends. Upload at these sizes and nothing gets re-cropped on your behalf.",
      },
      { type: "h2", text: "Instagram" },
      {
        type: "table",
        head: ["Placement", "Size (px)", "Ratio"],
        rows: [
          ["Profile picture", "320 × 320", "1:1"],
          ["Square post", "1080 × 1080", "1:1"],
          ["Portrait post", "1080 × 1350", "4:5"],
          ["Landscape post", "1080 × 566", "1.91:1"],
          ["Story / Reel", "1080 × 1920", "9:16"],
        ],
      },
      { type: "h2", text: "Facebook" },
      {
        type: "table",
        head: ["Placement", "Size (px)", "Ratio"],
        rows: [
          ["Profile picture", "320 × 320", "1:1"],
          ["Page cover", "1640 × 856", "1.91:1"],
          ["Shared post", "1200 × 630", "1.91:1"],
          ["Story", "1080 × 1920", "9:16"],
        ],
      },
      { type: "h2", text: "LinkedIn" },
      {
        type: "table",
        head: ["Placement", "Size (px)", "Ratio"],
        rows: [
          ["Profile picture", "400 × 400", "1:1"],
          ["Personal banner", "1584 × 396", "4:1"],
          ["Company cover", "1128 × 191", "5.9:1"],
          ["Post image", "1200 × 627", "1.91:1"],
        ],
      },
      { type: "h2", text: "YouTube, X, TikTok and Pinterest" },
      {
        type: "table",
        head: ["Platform", "Placement", "Size (px)"],
        rows: [
          ["YouTube", "Thumbnail", "1280 × 720"],
          ["YouTube", "Channel art", "2560 × 1440"],
          ["X", "Header", "1500 × 500"],
          ["X", "Post image", "1600 × 900"],
          ["TikTok", "Video / post", "1080 × 1920"],
          ["Pinterest", "Standard pin", "1000 × 1500"],
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Keep text away from the edges",
        text: "Covers and banners are cropped differently on mobile than on desktop. Keep anything important inside the middle 80% and it will survive both.",
      },
      { type: "h2", text: "Compress before uploading" },
      {
        type: "p",
        text: "Every platform re-compresses what you upload. Starting from a smaller, already-optimised file gives their encoder less to destroy, and the result usually looks better than uploading a 6 MB original.",
      },
      {
        type: "cta",
        toolSlug: "social-media-image-resizer",
        label: "Resize for any platform",
      },
    ],
  },
];

const bySlug = new Map(posts.map((p) => [p.slug, p]));

export function getPost(slug: string): Post | undefined {
  return bySlug.get(slug);
}

export const postSlugs = posts.map((p) => p.slug);

export function sortedPosts(): Post[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function relatedPosts(slug: string, limit = 3): Post[] {
  const post = getPost(slug);
  if (!post) return [];
  return sortedPosts()
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const aMatch = a.category === post.category ? 1 : 0;
      const bMatch = b.category === post.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
