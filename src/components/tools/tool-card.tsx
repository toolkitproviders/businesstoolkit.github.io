import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolIcon } from "@/components/tools/tool-icon";
import { categories, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const category = categories[tool.category];

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-lift",
        "focus-within:-translate-y-0.5 focus-within:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} category={tool.category} />
        <Badge tone="neutral">{category.label}</Badge>
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--fg)]">
        {/* Stretched link: the whole card is clickable, one tab stop. */}
        <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0">
          {tool.name}
        </Link>
      </h3>

      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">{tool.tagline}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]">
          Use Tool
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
        {tool.privateByDefault && (
          <span
            className="inline-flex items-center gap-1 text-xs text-[var(--fg-subtle)]"
            title="Runs entirely in your browser — files are never uploaded"
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Private
          </span>
        )}
      </div>
    </article>
  );
}

/** Dense variant used in the related-tools rail and dashboard. */
export function ToolCardCompact({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
    >
      <ToolIcon icon={tool.icon} category={tool.category} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--fg)]">{tool.name}</span>
        <span className="block truncate text-xs text-[var(--fg-muted)]">{tool.tagline}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-[var(--fg-subtle)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
