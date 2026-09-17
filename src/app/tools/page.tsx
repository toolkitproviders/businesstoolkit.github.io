import Link from "next/link";
import { ToolCard } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import {
  categories,
  categoryOrder,
  tools,
  toolsByCategory,
  type ToolCategory,
} from "@/lib/tools";

export const metadata = buildMetadata({
  title: `All ${tools.length} Business Tools — Calculators, Documents, PDFs & Generators`,
  description:
    `Browse all ${tools.length} free online business tools: calculators for finance and pricing, invoice and quotation generators, PDF and image utilities, QR codes and more.`,
  path: "/tools",
  keywords: ["business tools", "online tools", "free tools", "calculators", "pdf tools", "image tools"],
});

function isCategory(value: string | undefined): value is ToolCategory {
  return Boolean(value && value in categories);
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const active = isCategory(params.category) ? params.category : null;
  const visible = categoryOrder.filter((key) => !active || key === active);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "BusinessToolKit tools",
            numberOfItems: tools.length,
            itemListElement: tools.map((tool, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: tool.name,
              url: absoluteUrl(`/tools/${tool.slug}`),
            })),
          },
        ]}
      />

      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page py-10 sm:py-14">
          <Badge tone="accent">{tools.length} tools · all free</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {active ? `${categories[active].label} tools` : "All business tools"}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--fg-muted)]">
            {active
              ? categories[active].description
              : "Everything you need to run the paperwork side of a business — invoices, quotes, PDFs, images and generators. No signup, no watermarks."}
          </p>

          <nav aria-label="Filter by category" className="mt-6 flex flex-wrap gap-2">
            <FilterChip href="/tools" active={!active} count={tools.length}>
              All
            </FilterChip>
            {categoryOrder.map((key) => {
              const count = toolsByCategory(key).length;
              // A chip leading to an empty page is worse than no chip.
              if (count === 0) return null;
              return (
                <FilterChip
                  key={key}
                  href={`/tools?category=${key}`}
                  active={active === key}
                  count={count}
                >
                  {categories[key].label}
                </FilterChip>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container-page space-y-12 py-12">
        {visible.map((key) => {
          const list = toolsByCategory(key);
          if (list.length === 0) return null;
          return (
            <section key={key} aria-labelledby={`cat-${key}`}>
              <h2 id={`cat-${key}`} className="text-xl font-semibold">
                {categories[key].label}
              </h2>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{categories[key].description}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function FilterChip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)] bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-fg)]"
          : "inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
      }
    >
      {children}
      <span className={active ? "text-[var(--primary-fg)]/70" : "text-[var(--fg-subtle)]"}>
        {count}
      </span>
    </Link>
  );
}
