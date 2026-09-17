"use client";

import * as React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { useToolState } from "@/lib/storage";
import { cn, uid } from "@/lib/utils";
import { EmptyHint, SavedFooter, useToolOpened } from "./shared";

/**
 * A notepad that survives a reload.
 *
 * Notes are held in this browser's storage and written on every edit, so there
 * is no save button to forget. Nothing is uploaded, which is the point — this
 * is for the scratch text you would otherwise leave in an untitled tab.
 */

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export function NotesTool({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const [notes, setNotes, ready] = useToolState<Note[]>(toolSlug, []);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Keep a valid selection as notes are added and removed.
  const active = notes.find((n) => n.id === activeId) ?? notes[0] ?? null;
  React.useEffect(() => {
    if (!activeId && notes.length > 0) setActiveId(notes[0].id);
  }, [activeId, notes]);

  const create = () => {
    const note: Note = { id: uid("n"), title: "", body: "", updatedAt: Date.now() };
    setNotes((current) => [note, ...current]);
    setActiveId(note.id);
  };

  const update = (id: string, patch: Partial<Note>) =>
    setNotes((current) =>
      current.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );

  const remove = (id: string) => {
    setNotes((current) => current.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const exportText = () =>
    notes
      .map((n) => [n.title || "Untitled note", "".padEnd(24, "-"), n.body, ""].join("\n"))
      .join("\n");

  const words = active ? active.body.trim().split(/\s+/u).filter(Boolean).length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <ToolPanel title={`Notes (${notes.length})`}>
        <Button onClick={create} className="w-full">
          <Plus className="size-4" />
          New note
        </Button>

        {notes.length === 0 ? (
          <EmptyHint>{ready ? "No notes yet." : "Loading…"}</EmptyHint>
        ) : (
          <ul className="thin-scroll max-h-[28rem] space-y-1 overflow-y-auto">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(note.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                    note.id === active?.id
                      ? "bg-[var(--bg-muted)]"
                      : "hover:bg-[var(--bg-subtle)]",
                  )}
                >
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--fg)]">
                      {note.title || "Untitled note"}
                    </span>
                    <span className="block truncate text-xs text-[var(--fg-subtle)]">
                      {note.body.trim().split("\n")[0] || "Empty"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ToolPanel>

      <ToolPanel title={active ? active.title || "Untitled note" : "Nothing selected"}>
        {active ? (
          <>
            <Input
              value={active.title}
              placeholder="Title"
              aria-label="Note title"
              onChange={(e) => update(active.id, { title: e.target.value })}
            />
            <Textarea
              rows={18}
              value={active.body}
              placeholder="Start typing. Everything is saved as you go."
              aria-label="Note contents"
              onChange={(e) => update(active.id, { body: e.target.value })}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--fg-subtle)]">
              <span>
                {words} {words === 1 ? "word" : "words"} · {active.body.length} characters
              </span>
              <span>Last edited {new Date(active.updatedAt).toLocaleString()}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => remove(active.id)}>
              <Trash2 className="size-3.5" />
              Delete this note
            </Button>
          </>
        ) : (
          <EmptyHint>{ready ? "Create a note to start writing." : "Loading…"}</EmptyHint>
        )}

        <SavedFooter
          slug={toolSlug}
          ready={ready}
          count={notes.length}
          exportText={exportText}
          exportName="notes.txt"
          onCleared={() => {
            setNotes([]);
            setActiveId(null);
          }}
        />
      </ToolPanel>
    </div>
  );
}
