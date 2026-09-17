import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Clock, Info, TriangleAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCardCompact } from "@/components/tools/tool-card";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { getPost, postSlugs, relatedPosts, type Block } from "@/lib/blog";
import { getTool, tools } from "@/lib/tools";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return postSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(post.slug);
  const linkedTools = post.tools.map((s) => getTool(s)).filter((t) => t !== undefined);

  return (
    <>
      <JsonLd
        data={[
          articleSchema(post),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="container-page py-8 sm:py-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--fg-muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--fg)] hover:underline">
                  Home
                </Link>
              </li>
              <ChevronRight className="size-3.5 text-[var(--fg-subtle)]" aria-hidden="true" />
              <li>
                <Link href="/blog" className="hover:text-[var(--fg)] hover:underline">
                  Blog
                </Link>
              </li>
              <ChevronRight className="size-3.5 text-[var(--fg-subtle)]" aria-hidden="true" />
              <li aria-current="page" className="font-medium text-[var(--fg)]">
                {post.category}
              </li>
            </ol>
          </nav>

          <div className="mt-5 max-w-3xl">
            <Badge tone="navy">{post.category}</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-[var(--fg-muted)]">
              {post.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--fg-subtle)]">
              <time dateTime={post.date}>Published {formatDate(post.date)}</time>
              {post.updated && <span>Updated {formatDate(post.updated)}</span>}
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {post.readingMinutes} min read
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="max-w-3xl">
            {post.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}

            <div className="mt-12 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <h2 className="text-lg font-semibold">Tools mentioned in this article</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {linkedTools.map((tool) => (
                  <ToolCardCompact key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold">More reading</h2>
              <ul className="mt-3 space-y-3">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="group block text-sm font-medium text-[var(--fg)] hover:text-[var(--accent)]"
                    >
                      {item.title}
                      <span className="mt-0.5 block text-xs font-normal text-[var(--fg-subtle)]">
                        {item.readingMinutes} min read
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/blog"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                All articles
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-[var(--radius-card)] bg-navy-900 p-5 text-center dark:bg-navy-800">
              <p className="text-sm font-semibold text-white">{tools.length} free business tools</p>
              <p className="mt-1.5 text-xs text-navy-200">
                Invoices, PDFs, images and generators. No signup required.
              </p>
              <ButtonLink
                href="/tools"
                size="sm"
                className="mt-4 w-full bg-white text-navy-900 hover:bg-navy-100"
              >
                Browse all tools
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/** Renders one content block. No raw HTML is ever injected. */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-10 scroll-mt-24 text-2xl font-bold tracking-tight first:mt-0">
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="mt-7 text-lg font-semibold">{block.text}</h3>;
    case "p":
      return (
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--fg-muted)]">{block.text}</p>
      );
    case "ul":
      return (
        <ul className="mt-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[var(--fg-muted)]">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-4 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[var(--fg-muted)]">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)] text-xs font-semibold text-[var(--fg)]">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="mt-5 border-l-3 border-[var(--accent)] bg-[var(--bg-subtle)] py-3 pl-5 pr-4">
          <p className="font-mono text-sm text-[var(--fg)]">{block.text}</p>
        </blockquote>
      );
    case "callout": {
      const warning = block.tone === "warning";
      return (
        <div
          className={
            warning
              ? "mt-6 flex gap-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4"
              : "mt-6 flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4"
          }
        >
          {warning ? (
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-[var(--warning)]"
              aria-hidden="true"
            />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-semibold text-[var(--fg)]">{block.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">{block.text}</p>
          </div>
        </div>
      );
    }
    case "table":
      return (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-[var(--bg-subtle)]">
              <tr>
                {block.head.map((cell, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-4 py-2.5 text-left font-semibold text-[var(--fg)]"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={
                        j === 0
                          ? "px-4 py-2.5 font-medium text-[var(--fg)]"
                          : "tabular px-4 py-2.5 text-[var(--fg-muted)]"
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "cta": {
      const tool = getTool(block.toolSlug);
      if (!tool) return null;
      return (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--fg)]">{tool.name}</p>
            <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{tool.tagline}</p>
          </div>
          <ButtonLink href={`/tools/${tool.slug}`} variant="accent" className="shrink-0">
            {block.label}
            <ArrowRight />
          </ButtonLink>
        </div>
      );
    }
  }
}
