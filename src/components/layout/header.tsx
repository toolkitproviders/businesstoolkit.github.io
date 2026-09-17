"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search as SearchIcon, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchDialog, useSearchHotkeys } from "@/components/layout/search";
import { Logo } from "@/components/layout/logo";
import { categories, categoryOrder, tools, toolsByCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const openSearch = React.useCallback(() => setSearchOpen(true), []);
  useSearchHotkeys(openSearch);

  // Close everything on navigation.
  React.useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  // Click-outside and Escape close the desktop dropdowns.
  React.useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[70] rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-fg)] shadow-pop"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
        <div className="container-page">
          <div className="flex h-16 items-center gap-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-lg py-1 pr-2"
              aria-label="BusinessToolKit home"
            >
              <Logo className="size-8" />
              <span className="text-[15px] font-bold tracking-tight text-[var(--fg)]">
                Business<span className="text-[var(--accent)]">ToolKit</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              ref={navRef}
              aria-label="Main"
              className="ml-4 hidden items-center gap-0.5 lg:flex"
            >
              {/*
                One menu rather than a link per category: the catalog now spans
                twelve categories, which would overflow the bar and keep moving
                as tools are added.
              */}
              <div
                className="relative"
                onMouseEnter={() => {
                  clearTimeout(closeTimer.current);
                  setOpenMenu("tools");
                }}
                onMouseLeave={() => {
                  closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
                }}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === "tools"}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(openMenu === "tools" ? null : "tools")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    openMenu === "tools"
                      ? "bg-[var(--bg-muted)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
                  )}
                >
                  Tools
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", openMenu === "tools" && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>

                {openMenu === "tools" && (
                  <div className="absolute left-0 top-full w-[44rem] pt-2">
                    <div className="animate-[fade-up_0.18s_ease-out] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-pop">
                      <ul className="grid grid-cols-3 gap-1">
                        {categoryOrder.map((key) => {
                          const category = categories[key];
                          const count = toolsByCategory(key).length;
                          if (count === 0) return null;
                          return (
                            <li key={key}>
                              <Link
                                href={`/tools?category=${key}`}
                                className="block rounded-lg px-3 py-2 transition-colors hover:bg-[var(--bg-subtle)]"
                              >
                                <span className="flex items-baseline justify-between gap-2">
                                  <span className="text-sm font-medium text-[var(--fg)]">
                                    {category.label}
                                  </span>
                                  <span className="text-xs text-[var(--fg-subtle)]">{count}</span>
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-[var(--fg-muted)]">
                                  {category.description}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      <Link
                        href="/tools"
                        className="mt-2 block rounded-lg bg-[var(--bg-subtle)] px-3 py-2 text-center text-sm font-medium text-[var(--accent)] hover:bg-[var(--bg-muted)]"
                      >
                        Browse all {tools.length} tools
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <NavLink href="/tools" active={isActive("/tools")}>
                All tools
              </NavLink>
              <NavLink href="/blog" active={isActive("/blog")}>
                Blog
              </NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={openSearch}
                aria-label="Search tools"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] md:border md:border-[var(--border-strong)] md:bg-[var(--bg-subtle)] md:pr-2"
              >
                <SearchIcon className="size-4" aria-hidden="true" />
                <span className="hidden text-sm md:inline">Search</span>
                <kbd className="ml-4 hidden rounded border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--fg-subtle)] lg:inline">
                  ⌘K
                </kbd>
              </button>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] lg:hidden"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div
            id="mobile-nav"
            className="thin-scroll max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)] lg:hidden"
          >
            <div className="container-page space-y-5 py-5">
              <div className="flex flex-wrap gap-2">
                <MobileChip href="/tools">All tools</MobileChip>
                <MobileChip href="/blog">Blog</MobileChip>
                <MobileChip href="/dashboard">Dashboard</MobileChip>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
                  Categories
                </p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {categoryOrder.map((key) => {
                    const count = toolsByCategory(key).length;
                    if (count === 0) return null;
                    return (
                      <li key={key}>
                        <Link
                          href={`/tools?category=${key}`}
                          className="flex items-center justify-between rounded-lg p-2.5 hover:bg-[var(--bg-subtle)]"
                        >
                          <span className="text-sm font-medium text-[var(--fg)]">
                            {categories[key].label}
                          </span>
                          <span className="text-xs text-[var(--fg-subtle)]">{count}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--bg-muted)] text-[var(--fg)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
      )}
    >
      {children}
    </Link>
  );
}

function MobileChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3.5 py-1.5 text-sm font-medium text-[var(--fg)]"
    >
      {children}
    </Link>
  );
}
