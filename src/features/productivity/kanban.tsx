"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { useToolState } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { EmptyHint, SavedFooter, useToolOpened } from "./shared";

/**
 * A three-column board that survives a reload.
 *
 * Cards move with buttons rather than drag-and-drop: a button works with a
 * keyboard, on a phone and with a screen reader, and on a board this size
 * dragging buys nothing.
 */

interface Card {
  id: string;
  text: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To do", cards: [] },
  { id: "doing", title: "In progress", cards: [] },
  { id: "done", title: "Done", cards: [] },
];

export function KanbanBoard({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const [columns, setColumns, ready] = useToolState<Column[]>(toolSlug, DEFAULT_COLUMNS);

  const addCard = (columnId: string, text: string) =>
    setColumns((current) =>
      current.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, { id: uid("c"), text }] } : c)),
    );

  const editCard = (columnId: string, cardId: string, text: string) =>
    setColumns((current) =>
      current.map((c) =>
        c.id === columnId
          ? { ...c, cards: c.cards.map((card) => (card.id === cardId ? { ...card, text } : card)) }
          : c,
      ),
    );

  const removeCard = (columnId: string, cardId: string) =>
    setColumns((current) =>
      current.map((c) => (c.id === columnId ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) } : c)),
    );

  /** Moves a card to the neighbouring column, keeping it at the end there. */
  const moveCard = (columnIndex: number, cardId: string, direction: -1 | 1) => {
    const target = columnIndex + direction;
    setColumns((current) => {
      if (target < 0 || target >= current.length) return current;
      const card = current[columnIndex].cards.find((c) => c.id === cardId);
      if (!card) return current;
      return current.map((column, i) => {
        if (i === columnIndex) return { ...column, cards: column.cards.filter((c) => c.id !== cardId) };
        if (i === target) return { ...column, cards: [...column.cards, card] };
        return column;
      });
    });
  };

  const total = columns.reduce((sum, c) => sum + c.cards.length, 0);

  const exportText = () =>
    columns
      .map((column) =>
        [
          `${column.title} (${column.cards.length})`,
          "".padEnd(24, "-"),
          ...(column.cards.length ? column.cards.map((c) => `- ${c.text}`) : ["(empty)"]),
          "",
        ].join("\n"),
      )
      .join("\n");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column, columnIndex) => (
          <ToolPanel key={column.id} title={`${column.title} · ${column.cards.length}`}>
            <Input
              value={column.title}
              aria-label={`Rename the ${column.title} column`}
              onChange={(e) =>
                setColumns((current) =>
                  current.map((c) => (c.id === column.id ? { ...c, title: e.target.value } : c)),
                )
              }
              className="text-sm font-medium"
            />

            {column.cards.length === 0 ? (
              <EmptyHint>{ready ? "Nothing here yet." : "Loading…"}</EmptyHint>
            ) : (
              <ul className="space-y-2">
                {column.cards.map((card) => (
                  <li
                    key={card.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
                  >
                    <textarea
                      value={card.text}
                      rows={2}
                      aria-label="Card text"
                      onChange={(e) => editCard(column.id, card.id, e.target.value)}
                      className="w-full resize-none bg-transparent text-sm text-[var(--fg)] outline-none"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Move to ${columns[columnIndex - 1]?.title ?? "the previous column"}`}
                          disabled={columnIndex === 0}
                          onClick={() => moveCard(columnIndex, card.id, -1)}
                        >
                          <span aria-hidden="true">←</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Move to ${columns[columnIndex + 1]?.title ?? "the next column"}`}
                          disabled={columnIndex === columns.length - 1}
                          onClick={() => moveCard(columnIndex, card.id, 1)}
                        >
                          <span aria-hidden="true">→</span>
                        </Button>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Delete this card"
                        onClick={() => removeCard(column.id, card.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AddCard onAdd={(text) => addCard(column.id, text)} />
          </ToolPanel>
        ))}
      </div>

      <ToolPanel title="Your board">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setColumns((current) => [
                ...current,
                { id: uid("col"), title: `Column ${current.length + 1}`, cards: [] },
              ])
            }
          >
            <Plus className="size-3.5" />
            Add a column
          </Button>
          {columns.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumns((current) => current.slice(0, -1))}
            >
              <Trash2 className="size-3.5" />
              Remove the last column
            </Button>
          )}
        </div>

        <SavedFooter
          slug={toolSlug}
          ready={ready}
          count={total}
          exportText={exportText}
          exportName="board.txt"
          onCleared={() => setColumns(DEFAULT_COLUMNS)}
        />
      </ToolPanel>
    </div>
  );
}

function AddCard({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = React.useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue("");
      }}
      className="flex gap-2"
    >
      <Input
        value={value}
        placeholder="Add a card"
        aria-label="Add a card"
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" size="icon" disabled={!value.trim()} aria-label="Add card" className="shrink-0">
        <Plus className="size-4" />
      </Button>
    </form>
  );
}
