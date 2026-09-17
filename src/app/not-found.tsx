import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ToolCardCompact } from "@/components/tools/tool-card";
import { popularTools } from "@/lib/tools";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-[var(--fg-muted)]">
        The link may be out of date, or the address may have a typo in it. All 18 tools are still
        right where you left them.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/tools" size="lg">
          Browse all tools
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="lg">
          Go to the homepage
        </ButtonLink>
      </div>

      <div className="mt-12 w-full max-w-xl text-left">
        <h2 className="text-sm font-semibold text-[var(--fg-muted)]">Popular tools</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {popularTools.map((tool) => (
            <li key={tool.slug}>
              <ToolCardCompact tool={tool} />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-sm text-[var(--fg-subtle)]">
        Think this is a mistake?{" "}
        <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
          Let us know
        </Link>
        .
      </p>
    </div>
  );
}
