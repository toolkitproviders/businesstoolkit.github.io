import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, ShieldCheck } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ToolCardCompact } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { categories, relatedTools, tools, type Tool } from "@/lib/tools";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  softwareApplicationSchema,
} from "@/lib/seo";

/**
 * The page shell every tool shares: breadcrumb, H1, the tool itself, then the
 * SEO content blocks (how-to, features, FAQ, related tools) and their
 * structured data. Tools only supply their own interface.
 */
export function ToolLayout({ tool, children }: { tool: Tool; children: React.ReactNode }) {
  const category = categories[tool.category];
  const related = relatedTools(tool.slug);

  const trail = [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: category.label, path: `/tools?category=${category.slug}` },
    { name: tool.name, path: `/tools/${tool.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema(tool),
          breadcrumbSchema(trail),
          faqSchema(tool.faq),
          howToSchema(tool),
        ]}
      />

      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page py-6 sm:py-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--fg-muted)]">
              {trail.map((item, i) => {
                const last = i === trail.length - 1;
                return (
                  <li key={item.path} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="size-3.5 text-[var(--fg-subtle)]" aria-hidden="true" />
                    )}
                    {last ? (
                      <span aria-current="page" className="font-medium text-[var(--fg)]">
                        {item.name}
                      </span>
                    ) : (
                      <Link href={item.path} className="hover:text-[var(--fg)] hover:underline">
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
            <ToolIcon icon={tool.icon} category={tool.category} size="lg" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="navy">{category.label}</Badge>
                {tool.privateByDefault && (
                  <Badge tone="success">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    Runs in your browser
                  </Badge>
                )}
                <Badge tone="accent">Free</Badge>
              </div>
              <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
                {tool.name}
              </h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[var(--fg-muted)]">
                {tool.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The tool itself */}
      <div className="container-page py-8 sm:py-10">{children}</div>

      {/* SEO content */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            {tool.howTo && tool.howTo.length > 0 && (
            <section aria-labelledby="how-to-heading">
              <h2 id="how-to-heading" className="text-lg font-semibold">
                How to use the {tool.name}
              </h2>
              <ol className="mt-4 space-y-3">
                {tool.howTo.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-fg)]">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--fg-muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
            )}

            {tool.features && tool.features.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-lg font-semibold">
                Features
              </h2>
              <ul className="mt-4 space-y-2.5">
                {tool.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[var(--success)]"
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-relaxed text-[var(--fg-muted)]">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
            )}

            <section aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-lg font-semibold">
                Related tools
              </h2>
              <div className="mt-4 space-y-2">
                {related.map((t) => (
                  <ToolCardCompact key={t.slug} tool={t} />
                ))}
              </div>
              <Link
                href="/tools"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Browse all {tools.length} tools
                <ChevronRight className="size-4" />
              </Link>
            </section>
          </div>

          <section aria-labelledby="faq-heading" className="mt-12 max-w-3xl">
            <h2 id="faq-heading" className="text-lg font-semibold">
              Frequently asked questions
            </h2>
            <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
              {tool.faq.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronRight
                      className="size-4 shrink-0 text-[var(--fg-subtle)] transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--fg-muted)]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
