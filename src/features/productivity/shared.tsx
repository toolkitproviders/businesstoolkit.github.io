"use client";

import * as React from "react";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
import { Alert, Button, Input } from "@/components/ui";
import { CopyButton, PrivacyNote } from "@/components/tools/shared";
import { clearToolState } from "@/lib/storage";
import { cn, downloadText, uid } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Shared pieces for the productivity tools.
 *
 * They all save to this browser and nowhere else, so they share one honest
 * line about what that means, one way to export the data, and one way to
 * clear it. Nothing here talks to a server.
 */

export interface StoredItem {
  id: string;
  text: string;
  done?: boolean;
}

export function newItem(text = ""): StoredItem {
  return { id: uid("i"), text, done: false };
}

export function useToolOpened(slug: string) {
  React.useEffect(() => {
    track("tool_opened", { tool: slug });
  }, [slug]);
}

/* ------------------------------------------------------------- add a row -- */

/** The "type something and press Enter" row every list tool starts with. */
export function AddRow({
  placeholder,
  onAdd,
  label = "Add",
}: {
  placeholder: string;
  onAdd: (text: string) => void;
  label?: string;
}) {
  const [value, setValue] = React.useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        aria-label={placeholder}
      />
      <Button type="submit" disabled={!value.trim()} className="shrink-0">
        <Plus className="size-4" />
        {label}
      </Button>
    </form>
  );
}

/* --------------------------------------------------------- saved footer --- */

/**
 * The line every productivity tool ends with: where the data lives, how to
 * take it away, and how to delete it.
 */
export function SavedFooter({
  slug,
  exportText,
  exportName,
  onCleared,
  ready,
  count,
}: {
  slug: string;
  exportText: () => string;
  exportName: string;
  onCleared: () => void;
  ready: boolean;
  count: number;
}) {
  const [confirming, setConfirming] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <CopyButton value={exportText()} label="Copy as text" />
        <Button variant="outline" size="sm" onClick={() => downloadText(exportText(), exportName)}>
          <Download className="size-3.5" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Print
        </Button>
        {count > 0 &&
          (confirming ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--error)] text-[var(--error)]"
                onClick={() => {
                  // Clear the stored copy as well as the state, so a reload
                  // does not bring it back.
                  clearToolState(slug);
                  onCleared();
                  setConfirming(false);
                }}
              >
                <Trash2 className="size-3.5" />
                Yes, delete everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-3.5" />
              Clear all
            </Button>
          ))}
      </div>

      <PrivacyNote>
        {ready
          ? "Saved automatically in this browser, on this device only. It is not uploaded, not synced between devices, and clearing your browser data will remove it — so download a copy of anything you need to keep."
          : "Loading anything you saved last time…"}
      </PrivacyNote>
    </div>
  );
}

/* ------------------------------------------------------------ empty state -- */

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--fg-muted)]">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------- item row --- */

/** One editable, checkable row with reorder and delete. */
export function ItemRow({
  item,
  onChange,
  onToggle,
  onRemove,
  onMove,
  first,
  last,
  placeholder = "Describe this item",
  trailing,
}: {
  item: StoredItem;
  onChange: (text: string) => void;
  onToggle?: () => void;
  onRemove: () => void;
  onMove?: (direction: -1 | 1) => void;
  first?: boolean;
  last?: boolean;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
      {onToggle && (
        <input
          type="checkbox"
          checked={Boolean(item.done)}
          onChange={onToggle}
          aria-label={item.text ? `Mark "${item.text}" as done` : "Mark as done"}
          className="size-4 shrink-0 cursor-pointer rounded border-[var(--border-strong)] accent-[var(--accent)]"
        />
      )}
      <input
        value={item.text}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)]",
          item.done && "text-[var(--fg-subtle)] line-through",
        )}
      />
      {trailing}
      {onMove && (
        <span className="flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move up"
            disabled={first}
            onClick={() => onMove(-1)}
          >
            <span aria-hidden="true">↑</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move down"
            disabled={last}
            onClick={() => onMove(1)}
          >
            <span aria-hidden="true">↓</span>
          </Button>
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label={item.text ? `Delete "${item.text}"` : "Delete"}
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

/** Moves an item within a list, returning a new array. */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export { Alert };
