import Link from "next/link";
import {
  BarChart3,
  FileCode2,
  FileText,
  Megaphone,
  Search,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { categories, categoryOrder, tools, toolsByCategory } from "@/lib/tools";
import { posts } from "@/lib/blog";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Administration overview for BusinessToolKit.",
  path: "/admin",
  noIndex: true,
});

/**
 * Admin surface.
 *
 * Read-only by design: the site has no accounts, so there is nobody to
 * authorise and this exposes no mutations. It shows the content inventory a
 * future CMS would manage, and names where each area is edited today, so the
 * shape is established without shipping an unprotected write surface.
 */

const AREAS = [
  {
    icon: FileCode2,
    title: "Tools",
    status: "In code",
    body: "All 18 tools, their copy, SEO metadata, features and FAQs live in src/lib/tools.ts.",
  },
  {
    icon: FileText,
    title: "Blog posts",
    status: "In code",
    body: "Articles are typed content blocks in src/lib/blog.ts, rendered as static HTML.",
  },
  {
    icon: Search,
    title: "SEO metadata",
    status: "Generated",
    body: "Titles, descriptions, canonicals, Open Graph and JSON-LD are derived in src/lib/seo.ts.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    status: "Buffered",
    body: "Anonymous events are collected in src/lib/analytics.ts with no provider attached yet.",
  },
  {
    icon: Megaphone,
    title: "Advertisements",
    status: "Not implemented",
    body: "No ads are rendered or loaded, and no ad network is integrated.",
  },
  {
    icon: Settings2,
    title: "Usage limits",
    status: "Client-side",
    body: "File size and batch caps are enforced in the browser per tool to protect device memory, not to gate features.",
  },
] as const;

export default function AdminPage() {
  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
        <Badge tone="warning">Read-only</Badge>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4">
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0 text-[var(--warning)]"
          aria-hidden="true"
        />
        <p className="text-sm text-[var(--fg-muted)]">
          The site has no accounts, so this page deliberately exposes no controls that change
          anything — an unprotected write surface would be worse than no admin at all. It is
          excluded from the sitemap and disallowed in <code>robots.txt</code>. Put authentication in
          front of this route before adding any mutations.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Content inventory</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Tools" value={tools.length} />
          <Metric label="Categories" value={categoryOrder.length} />
          <Metric label="Blog posts" value={posts.length} />
          <Metric
            label="FAQ entries"
            value={tools.reduce((sum, t) => sum + t.faq.length, 0)}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Tools by category</caption>
            <thead className="bg-[var(--bg-subtle)]">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-[var(--fg-muted)]">
                  Category
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-[var(--fg-muted)]">
                  Tools
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium text-[var(--fg-muted)]">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categoryOrder.map((key) => (
                <tr key={key}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    {categories[key].label}
                  </th>
                  <td className="px-4 py-2.5 text-[var(--fg-muted)]">
                    {toolsByCategory(key)
                      .map((t) => t.name)
                      .join(", ")}
                  </td>
                  <td className="tabular px-4 py-2.5 text-right">{toolsByCategory(key).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Management areas</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area) => (
            <div
              key={area.title}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <area.icon className="size-5 text-[var(--fg-subtle)]" aria-hidden="true" />
                <Badge
                  tone={
                    area.status === "In code" || area.status === "Generated"
                      ? "success"
                      : area.status === "Not implemented"
                        ? "neutral"
                        : "accent"
                  }
                >
                  {area.status}
                </Badge>
              </div>
              <h3 className="mt-3 font-semibold">{area.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{area.body}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-[var(--fg-muted)]">
        Back to the{" "}
        <Link href="/" className="font-medium text-[var(--accent)] hover:underline">
          public site
        </Link>
        .
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">{label}</p>
      <p className="tabular mt-1.5 text-2xl font-semibold">{value}</p>
    </div>
  );
}
