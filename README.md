# BusinessToolKit

18 free online business tools in one Next.js application — invoices, quotations,
PDF manipulation, image processing, and generators for QR codes, barcodes,
passwords, business names and email signatures.

Everything is free — no plans, no accounts, no sign-up, no feature gates.

The defining constraint: **14 of the 18 tools never send your files anywhere.**
Image and PDF work happens in the browser with the Canvas API, `pdf-lib` and
`pdf.js`. You can disconnect from the network after the page loads and they
still work.

---

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. No API keys are required — every tool works out of
the box, including the currency converter (it uses a free, keyless rate feed).

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Logic + PDF test suites (114 assertions) |

---

## The tools

| Category | Tools |
| --- | --- |
| **Business** | Invoice Generator · Quotation Generator · Profit Margin Calculator · VAT/Tax Calculator · Salary Calculator · Currency Converter |
| **Documents** | PDF Invoice Maker · PDF Merger · PDF Splitter · PDF to Image |
| **Images** | Image Compressor · Image Resizer · Social Media Image Resizer |
| **Generators** | QR Code · Password · Barcode · Business Name · Email Signature |

Each lives at `/tools/<slug>` with its own metadata, JSON-LD, FAQ and
how-to content.

---

## Architecture

```
src/
  app/                    Routes. One directory per tool; thin, metadata only.
    api/                  rates · domain · business-names  (the only server work)
  components/
    ui/                   Design system: Button, Field, Alert, Modal, Tabs…
    layout/               Header, Footer, search palette, theme toggle
    tools/                ToolLayout, ToolCard, FileUploader, shared panels
  features/
    documents/            Invoice + quotation engine (types, editor, preview, pdf)
    calculators/          Margin, VAT, salary, currency
    images/               Canvas pipeline, compressor, resizers, presets
    pdf/                  pdf-lib + pdf.js core, merger, splitter, to-image
    generators/           QR, barcode, password, business name, signature
    account/              Local dashboard (saved documents, favourites)
  lib/
    tools.ts              Registry — drives nav, search, sitemap, SEO, routing
    seo.ts                Metadata + JSON-LD builders
    blog.ts               Long-tail SEO articles as typed content blocks
    storage.ts            Repository interface over browser local storage
    analytics.ts          Privacy-first event layer
    server/               rates · rate-limit · name-generator  (server-only)
```

### One registry drives the site

`src/lib/tools.ts` is the single source of truth. Navigation, the homepage grid,
global search, `sitemap.ts`, breadcrumbs, related-tool rails, JSON-LD and every
tool page's copy are generated from it. **Adding a tool means adding one entry
plus a route directory** — the test suite fails if a registry entry has no route,
or a route has no registry entry.

### Performance

Heavy libraries load only when a tool needs them:

| Library | Loaded by | When |
| --- | --- | --- |
| `pdf-lib` (~400 KB) | Invoice/quote PDF export, merge, split | On first action |
| `pdfjs-dist` (~350 KB) | Page thumbnails, PDF→image | On file upload |
| `qrcode`, `jsbarcode`, `jszip` | Their respective tools | On demand |

The homepage ships **106 KB** of first-load JS; the heaviest tool page is 133 KB.

### Security

- Uploaded file names pass through `sanitizeFilename` before reaching the DOM.
- File type and size are validated client-side before any processing.
- Generated email-signature HTML escapes every value and filters URLs through
  `safeUrl`, so a pasted `javascript:` string can never become a live link.
- API routes are rate-limited, validate all input, and never leak provider
  errors or stack traces.
- Provider credentials stay server-side behind `src/lib/server/`.
- Security headers are set in `next.config.ts`.

---

## Testing

```bash
npm test
```

- **`tests/logic.test.mjs`** (98 assertions) — invoice/quotation money maths
  including rounding and multi-rate tax, PDF text safety, barcode check digits
  and format rules, passphrase entropy, the tool registry against the real route
  directories, search ranking, and the filename/URL sanitisers.
- **`tests/pdf.test.mjs`** (16 assertions) — the shipped `features/pdf/core.ts`:
  merge, extract, page-range parsing and error handling, verified with `pdf-lib`.

Tests import the application's real TypeScript modules directly; Node strips the
types and `tests/resolver.mjs` maps the `@/` alias.

---

## Configuration

Everything in `.env.example` is optional.

| Variable | Effect if unset |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs fall back to `http://localhost:3000` |
| `EXCHANGE_RATE_API_URL` / `_KEY` | Uses the free keyless `open.er-api.com` feed |

---

## What is and isn't wired up

Being precise about this matters more than a longer feature list.

**Fully working, free and ungated:** all 18 tools, including real PDF generation, in-browser image
compression and resizing, PDF merge/split/convert, scannable QR codes and
barcodes, live exchange rates, live domain availability checks, and business name
generation from a local rules engine.

**Designed but not connected:**

- **Persistence.** Saved documents, favourites and recent tools live in browser
  local storage behind the `Repository` interface in `src/lib/storage.ts`. There
  is no database and no server storage — a future backend would only need a
  second implementation of that interface.
- **Analytics.** Events are collected and scrubbed in `src/lib/analytics.ts` into
  a bounded in-memory buffer. Point `dispatch()` at a provider to go live.
- **Admin.** `/admin` is deliberately **read-only** — there are no accounts, so
  nobody to authorise, and an unprotected write surface would be worse than
  none. It is `noindex` and disallowed in `robots.txt`.

### No accounts, by design

There is no sign-up, log-in or password reset. Nothing is gated, so there is
nothing to gate access to — and with no user records there is no personal data
to store, leak or hand over. Saved documents live in your own browser; the
invoice and quotation tools export JSON if you want a copy you control.

---

## SEO

Every tool page is independently indexable with a unique title, meta
description, canonical URL, Open Graph tags and dynamic OG image (`/og`), plus
`SoftwareApplication`, `HowTo`, `FAQPage` and `BreadcrumbList` structured data.
`sitemap.ts` and `robots.ts` are generated from the registry, and `/blog`
carries six long-form articles that cross-link into the relevant tools.

---

## Accessibility

Semantic landmarks and heading order, a skip link, visible focus rings on every
control, labelled form fields with errors wired via `role="alert"`, ARIA roles on
the custom tabs/switch/segmented controls, keyboard-navigable search (`⌘K` or
`/`), and `prefers-reduced-motion` honoured. Light mode is the default; dark
mode follows the OS until you choose explicitly, and is applied before first
paint so there is no flash.
