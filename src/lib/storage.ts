"use client";

/**
 * Client-side persistence layer.
 *
 * Every read/write in the app goes through this module rather than touching
 * `localStorage` directly. The site has no accounts and no server storage by
 * design, so this is the whole persistence layer — but keeping it behind one
 * `Repository` interface means a future backend would only need a second
 * implementation and a change to `repo` below, with no tool or page touched.
 *
 * Nothing here is a security boundary. Local storage is per-browser and
 * readable by anything running on this origin, so it holds only what the user
 * explicitly chose to save on their own device.
 */

import * as React from "react";

const NS = "btk";

export type DocumentKind = "invoice" | "quote";

export interface SavedDocument {
  id: string;
  kind: DocumentKind;
  /** Human label, e.g. "INV-0007 — Acme Ltd". */
  title: string;
  number: string;
  customer: string;
  total: number;
  currency: string;
  updatedAt: number;
  /** The full editor state; shape owned by features/documents/types.ts. */
  data: unknown;
}

export interface RecentToolEntry {
  slug: string;
  at: number;
}

export interface Repository {
  listDocuments(): SavedDocument[];
  getDocument(id: string): SavedDocument | undefined;
  saveDocument(doc: SavedDocument): void;
  deleteDocument(id: string): void;
  listFavourites(): string[];
  toggleFavourite(slug: string): string[];
  listRecentTools(): RecentToolEntry[];
  noteToolUse(slug: string): void;
}

/* ---------------------------------------------------------------- driver -- */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${NS}:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt or quota-blocked storage must never crash a page.
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("btk:storage", { detail: { key } }));
  } catch {
    // Quota exceeded or private mode — saving is a convenience, not critical.
  }
}

const MAX_DOCUMENTS = 100;
const MAX_RECENT = 12;

export const localRepository: Repository = {
  listDocuments() {
    return read<SavedDocument[]>("documents", []).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  getDocument(id) {
    return read<SavedDocument[]>("documents", []).find((d) => d.id === id);
  },
  saveDocument(doc) {
    const all = read<SavedDocument[]>("documents", []);
    const next = [doc, ...all.filter((d) => d.id !== doc.id)].slice(0, MAX_DOCUMENTS);
    write("documents", next);
  },
  deleteDocument(id) {
    write(
      "documents",
      read<SavedDocument[]>("documents", []).filter((d) => d.id !== id),
    );
  },
  listFavourites() {
    return read<string[]>("favourites", []);
  },
  toggleFavourite(slug) {
    const current = read<string[]>("favourites", []);
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    write("favourites", next);
    return next;
  },
  listRecentTools() {
    return read<RecentToolEntry[]>("recent", []);
  },
  noteToolUse(slug) {
    const current = read<RecentToolEntry[]>("recent", []).filter((e) => e.slug !== slug);
    write("recent", [{ slug, at: Date.now() }, ...current].slice(0, MAX_RECENT));
  },
};

/** Swap this for a server-backed implementation to move storage off-device. */
export const repo: Repository = localRepository;

/* ------------------------------------------------------------- React glue -- */

/**
 * Re-renders when this browser tab (or another one) changes stored data.
 *
 * The first render deliberately returns `initial` rather than reading storage,
 * so server markup and the hydrating client markup agree. Real data arrives in
 * the effect immediately afterwards.
 */
export function useStoredValue<T>(
  read: () => T,
  initial: T,
  deps: React.DependencyList = [],
): { value: T; ready: boolean } {
  const readRef = React.useRef(read);
  readRef.current = read;

  const [state, setState] = React.useState<{ value: T; ready: boolean }>({
    value: initial,
    ready: false,
  });

  React.useEffect(() => {
    const sync = () => setState({ value: readRef.current(), ready: true });
    sync();
    window.addEventListener("btk:storage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("btk:storage", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/* ----------------------------------------------------- per-tool workspaces -- */

/**
 * Whatever a tool wants to remember between visits, keyed by its slug.
 *
 * The productivity tools have no accounts behind them, so this is where a
 * to-do list or a week's plan lives. It is per-browser and per-device: the
 * tools say so on the page rather than letting anyone assume it syncs.
 */
export function readToolState<T>(slug: string, fallback: T): T {
  return read<T>(`tool:${slug}`, fallback);
}

export function writeToolState<T>(slug: string, value: T): void {
  write(`tool:${slug}`, value);
}

export function clearToolState(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${NS}:tool:${slug}`);
    window.dispatchEvent(new CustomEvent("btk:storage", { detail: { key: `tool:${slug}` } }));
  } catch {
    // Nothing to do — clearing is a convenience.
  }
}

/**
 * State that persists to this browser, with the same hydration rule as
 * `useStoredValue`: the first render uses `initial` so server and client
 * markup agree, and saved data arrives in the effect straight after.
 *
 * `ready` is false until that has happened, so a tool can avoid flashing an
 * empty state over data that is about to load.
 */
export function useToolState<T>(
  slug: string,
  initial: T,
): [T, (updater: T | ((previous: T) => T)) => void, boolean] {
  const [value, setValue] = React.useState<T>(initial);
  const [ready, setReady] = React.useState(false);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    setValue(readToolState<T>(slug, initial));
    loaded.current = true;
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const update = React.useCallback(
    (updater: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(previous) : updater;
        // Never write before the first read, or a slow load would overwrite
        // the saved data with the empty initial value.
        if (loaded.current) writeToolState(slug, next);
        return next;
      });
    },
    [slug],
  );

  return [value, update, ready];
}

/** Records that a tool was opened, for the dashboard's "recent tools" list. */
export function useRecordToolUse(slug: string): void {
  React.useEffect(() => {
    repo.noteToolUse(slug);
  }, [slug]);
}
