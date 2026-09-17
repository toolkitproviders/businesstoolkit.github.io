import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { categories, categoryOrder, toolsByCategory } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

const company = [
  { label: "Support us", href: "/donate" },
  { label: "Blog", href: "/blog" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contact", href: "/contact" },
];

const resources = [
  { label: "All tools", href: "/tools" },
  { label: "How to create an invoice", href: "/blog/how-to-create-a-professional-invoice" },
  { label: "Invoice vs quotation", href: "/blog/invoice-vs-quotation" },
  { label: "Best social media image sizes", href: "/blog/best-image-sizes-for-social-media" },
];

const legal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo className="size-8" />
              <span className="text-[15px] font-bold tracking-tight text-[var(--fg)]">
                Business<span className="text-[var(--accent)]">ToolKit</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--fg-muted)]">
              Free business tools in one place. Most of them run entirely in your browser, so
              your files never leave your device.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--fg-muted)]">
              We make it for you, with your help — no ads, no accounts, no tracking.{" "}
              <Link
                href="/donate"
                className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
              >
                <Heart className="size-3.5" aria-hidden="true" />
                Support the project
              </Link>
            </p>
            <ul className="mt-5 flex gap-2">
              {siteConfig.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Tools" className="lg:col-span-5">
            <h2 className="text-sm font-semibold text-[var(--fg)]">Tools</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {categoryOrder.filter((key) => toolsByCategory(key).length > 0).map((key) => (
                <div key={key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
                    {categories[key].label}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {/* Top few per category; the full list lives on /tools. */}
                    {toolsByCategory(key).slice(0, 5).map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] hover:underline"
                        >
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                    {toolsByCategory(key).length > 5 && (
                      <li>
                        <Link
                          href={`/tools?category=${key}`}
                          className="text-sm font-medium text-[var(--accent)] hover:underline"
                        >
                          + {toolsByCategory(key).length - 5} more
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-1">
            <FooterColumn title="Company" links={company} />
            <FooterColumn title="Resources" links={resources} />
            <FooterColumn title="Legal" links={legal} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--fg-subtle)]">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-sm text-[var(--fg-subtle)]">
            Built for businesses, freelancers and everyone in between.{" "}
            <Link href="/donate" className="font-medium text-[var(--accent)] hover:underline">
              Donate
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--fg)]">{title}</h2>
      <ul className="mt-3 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
