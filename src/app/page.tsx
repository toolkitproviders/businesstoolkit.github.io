import Link from "next/link";
import {
  ArrowRight,
  FileStack,
  Gauge,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/tools/tool-card";
import { categories, categoryOrder, tools, toolsByCategory } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="grid-hero pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="accent" className="px-3 py-1">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {tools.length} tools · free · no signup required
            </Badge>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--fg)] sm:text-5xl lg:text-6xl">
              {tools.length} Powerful Business Tools.
              <span className="block text-[var(--accent)]">One Simple Website.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Create invoices, quotations, PDFs, images, QR codes, barcodes, calculations, and more
              — completely online.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/tools" size="lg" className="w-full sm:w-auto">
                Explore All Tools
                <ArrowRight />
              </ButtonLink>
              <ButtonLink
                href="/tools/invoice-generator"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Create an Invoice
              </ButtonLink>
            </div>

            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--fg-muted)]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden="true" />
                Files never leave your browser
              </li>
              <li className="flex items-center gap-1.5">
                <Gauge className="size-4 text-[var(--accent)]" aria-hidden="true" />
                No upload wait
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet className="size-4 text-[var(--accent)]" aria-hidden="true" />
                Free to use
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- tools grid */}
      <section id="tools" className="container-page py-14 sm:py-16" aria-labelledby="tools-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="tools-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Every tool you need
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
              Grouped into four categories so you can find the right one fast. Nothing is locked
              behind a signup.
            </p>
          </div>
          <Link
            href="/tools"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all {tools.length} tools
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 space-y-12">
          {categoryOrder.map((key) => {
            const category = categories[key];
            const list = toolsByCategory(key);
            if (list.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-semibold text-[var(--fg)]">
                    {category.label}
                    <span className="ml-2 text-sm font-normal text-[var(--fg-subtle)]">
                      {list.length} tools
                    </span>
                  </h3>
                </div>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{category.description}</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------- why us */}
      <section
        className="border-y border-[var(--border)] bg-[var(--bg-subtle)]"
        aria-labelledby="why-heading"
      >
        <div className="container-page py-14 sm:py-16">
          <h2 id="why-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built to be trusted with real work
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={<ShieldCheck className="size-5" />}
              title="Private by default"
              body="Image and PDF tools process files locally with your browser's own APIs. Nothing is uploaded, so nothing can leak."
            />
            <Feature
              icon={<Gauge className="size-5" />}
              title="Genuinely fast"
              body="Heavy libraries load only when a tool needs them, so the homepage stays light and every page loads quickly."
            />
            <Feature
              icon={<FileStack className="size-5" />}
              title="Real output"
              body="Vector PDFs that stay sharp in print, scannable barcodes, and QR codes that never expire or redirect through us."
            />
            <Feature
              icon={<Wallet className="size-5" />}
              title="Free, with no catch"
              body="Every tool is free and unlimited. No account, no trial, no watermark, and nothing held back behind an upgrade prompt."
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-2xl bg-navy-900 px-6 py-12 text-center sm:px-12 dark:bg-navy-800">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #3cbec0 0, transparent 45%), radial-gradient(circle at 80% 60%, #6593e2 0, transparent 45%)",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Start with one tool. Stay for the other {tools.length - 1}.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-navy-200">
              No account, no credit card, no watermark. Create something useful in the next two
              minutes.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/tools/invoice-generator"
                size="lg"
                className="w-full bg-white text-navy-900 hover:bg-navy-100 sm:w-auto"
              >
                Create an Invoice
                <ArrowRight />
              </ButtonLink>
              <ButtonLink
                href="/tools"
                size="lg"
                variant="ghost"
                className="w-full text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Browse all tools
              </ButtonLink>
            </div>
            <p className="mt-6 text-xs text-navy-300">
              {siteConfig.name} — used for invoices, quotes, PDFs, images and more.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold text-[var(--fg)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{body}</p>
    </div>
  );
}
