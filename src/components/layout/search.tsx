"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search as SearchIcon, X } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { categories, popularTools, searchTools, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Global command palette over every tool. Opens with the header button,
 * Cmd/Ctrl+K, or "/" anywhere outside a text field.
 */
export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const results: Tool[] = React.useMemo(
    () => (query.trim() ? searchTools(query, 8) : popularTools),
    [query],
  );

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  const go = React.useCallback(
    (tool: Tool) => {
      track("search_performed", { tool: tool.slug });
      onClose();
      router.push(`/tools/${tool.slug}`);
    },
    [onClose, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      // Handled here as well as on the form's submit: implicit form submission
      // needs a full key event, which assistive tech and automated input do not
      // always produce. `preventDefault` stops the two paths firing together.
      e.preventDefault();
      openActive();
    }
  };

  const openActive = () => {
    const tool = results[active] ?? results[0];
    if (tool) go(tool);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    openActive();
  };

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px] animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-pop"
      >
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <SearchIcon className="size-4.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all tools — try “compress photo” or “invoice”"
            className="h-14 w-full bg-transparent text-[15px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)] [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1 text-[var(--fg-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
          >
            <X className="size-4" />
          </button>
        </form>

        <div className="thin-scroll max-h-[min(24rem,55vh)] overflow-y-auto p-2">
          {!query.trim() && (
            <p className="px-2 pb-1.5 pt-1 text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
              Popular tools
            </p>
          )}

          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium text-[var(--fg)]">
                No tools match “{query.trim()}”
              </p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                Try a word describing the task, like “resize”, “merge” or “tax”.
              </p>
            </div>
          ) : (
            <ul id="search-results" ref={listRef} role="listbox" className="space-y-0.5">
              {results.map((tool, i) => (
                <li key={tool.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(tool)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                      i === active ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-subtle)]",
                    )}
                  >
                    <ToolIcon icon={tool.icon} category={tool.category} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--fg)]">
                        {tool.name}
                      </span>
                      <span className="block truncate text-xs text-[var(--fg-muted)]">
                        {tool.tagline}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-[var(--fg-subtle)] sm:block">
                      {categories[tool.category].label}
                    </span>
                    {i === active && (
                      <CornerDownLeft
                        className="size-3.5 shrink-0 text-[var(--fg-subtle)]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2 text-xs text-[var(--fg-subtle)] sm:flex">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> to open
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-sans text-[10px] text-[var(--fg-muted)]">
      {children}
    </kbd>
  );
}

/** Registers the global Cmd/Ctrl+K and "/" shortcuts. */
export function useSearchHotkeys(onOpen: () => void) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpen]);
}
