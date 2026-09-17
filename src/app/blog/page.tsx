import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { sortedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Blog — Guides on Invoicing, PDFs, Images and Business Admin",
  description:
    "Practical guides on creating invoices, quotations, profit margins, compressing images, merging PDFs and picking the right social media image sizes.",
  path: "/blog",
  keywords: ["invoicing guide", "business admin", "pdf guide", "image optimisation"],
});

export default function BlogIndexPage() {
  const posts = sortedPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />

      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Guides and how-tos</h1>
          <p className="mt-3 max-w-2xl text-[var(--fg-muted)]">
            Practical writing about the paperwork side of running a business — what to put on an
            invoice, how margins actually work, and how to get files down to a sensible size.
          </p>
        </div>
      </div>

      <div className="container-page py-12">
        {featured && (
          <article className="group relative mb-10 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition-shadow hover:shadow-lift sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Latest</Badge>
              <Badge tone="neutral">{featured.category}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              <Link href={`/blog/${featured.slug}`} className="after:absolute after:inset-0">
                {featured.title}
              </Link>
            </h2>
            <p className="mt-3 max-w-3xl text-[var(--fg-muted)]">{featured.description}</p>
            <div className="mt-5 flex items-center gap-4 text-sm text-[var(--fg-subtle)]">
              <time dateTime={featured.date}>{formatDate(featured.date)}</time>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {featured.readingMinutes} min read
              </span>
            </div>
          </article>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="group relative flex flex-col rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Badge tone="neutral" className="self-start">
                {post.category}
              </Badge>
              <h2 className="mt-3 text-base font-semibold">
                <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                {post.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--fg-subtle)]">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="flex items-center gap-1.5">
                  {post.readingMinutes} min
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
