import Link from "next/link";
import { Mail, MessageSquare, ShieldQuestion } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the BusinessToolKit team about the tools, a bug, a feature request or a privacy question.",
  path: "/contact",
});

const ROUTES = [
  {
    icon: MessageSquare,
    title: "Feedback and feature requests",
    body: "Tell us what is missing, or which tool you would use next. We read everything.",
    email: siteConfig.contactEmail,
  },
  {
    icon: ShieldQuestion,
    title: "Privacy questions",
    body: "Questions about how files are handled, or about data we may hold.",
    email: siteConfig.contactEmail,
  },
  {
    icon: Mail,
    title: "Something is broken",
    body: "Tell us which tool, which browser, and what you were doing when it failed.",
    email: siteConfig.contactEmail,
  },
];

export default function ContactPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-[var(--fg-muted)]">
        We would rather hear about a problem than have you work around it.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {ROUTES.map((route) => (
          <div
            key={route.title}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <route.icon className="size-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{route.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">{route.body}</p>
            <a
              href={`mailto:${route.email}`}
              className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {route.email}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-subtle)] p-5">
        <h2 className="font-semibold">Before you write</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Most tool questions are answered on the tool&apos;s own page — every one has a FAQ section
          below the interface covering formats, limits and common errors. File handling is covered
          in detail in our{" "}
          <Link href="/privacy" className="font-medium text-[var(--accent)] hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {siteConfig.social.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer me"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--bg-subtle)]"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
