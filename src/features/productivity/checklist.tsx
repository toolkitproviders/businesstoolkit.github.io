"use client";

import * as React from "react";
import { Field, Input, Progress, SegmentedControl, Select, Stat } from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { useToolState } from "@/lib/storage";
import { toISODate } from "@/lib/dates";
import { uid } from "@/lib/utils";
import { AddRow, EmptyHint, ItemRow, moveItem, SavedFooter, useToolOpened } from "./shared";

/**
 * Serves both the To-Do List and the Checklist Maker.
 *
 * They are the same object — a list of things to tick off — differing in what
 * each row carries and what the page is for, so the slug picks the variant
 * rather than there being two components to keep in step.
 */

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority?: "low" | "normal" | "high";
  due?: string;
}

type Filter = "all" | "open" | "done";

const PRIORITY_LABEL: Record<string, string> = { low: "Low", normal: "Normal", high: "High" };

export function ChecklistTool({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const isTodo = toolSlug === "todo-list";

  const [title, setTitle] = useToolState<string>(`${toolSlug}:title`, isTodo ? "" : "Pre-flight checklist");
  const [tasks, setTasks, ready] = useToolState<Task[]>(toolSlug, []);
  const [filter, setFilter] = React.useState<Filter>("all");

  const done = tasks.filter((t) => t.done).length;
  const visible = tasks.filter((t) =>
    filter === "open" ? !t.done : filter === "done" ? t.done : true,
  );

  const update = (id: string, patch: Partial<Task>) =>
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const exportText = () =>
    [
      title || (isTodo ? "To-do list" : "Checklist"),
      "".padEnd(24, "-"),
      ...tasks.map((t) => {
        const box = t.done ? "[x]" : "[ ]";
        const extras = [
          t.priority && t.priority !== "normal" ? PRIORITY_LABEL[t.priority].toLowerCase() : "",
          t.due ? `due ${t.due}` : "",
        ].filter(Boolean);
        return `${box} ${t.text}${extras.length ? `  (${extras.join(", ")})` : ""}`;
      }),
      "",
      `${done} of ${tasks.length} complete`,
    ].join("\n");

  return (
    <div className="space-y-6">
      <ToolPanel
        title={isTodo ? "Your tasks" : "Your checklist"}
        description={
          isTodo
            ? "Add tasks, set a priority and a due date, and tick them off. Everything is saved in this browser."
            : "Build a checklist you can print or reuse. It is saved in this browser."
        }
      >
        {!isTodo && (
          <Field label="Checklist title" htmlFor={`${toolSlug}-title`}>
            <Input
              id={`${toolSlug}-title`}
              value={title}
              placeholder="Pre-flight checklist"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        )}

        <AddRow
          placeholder={isTodo ? "What needs doing?" : "Add a checklist item"}
          onAdd={(text) =>
            setTasks((current) => [
              ...current,
              { id: uid("t"), text, done: false, priority: "normal" },
            ])
          }
        />

        {tasks.length > 0 && (
          <>
            <Progress value={(done / tasks.length) * 100} label={`${done} of ${tasks.length} complete`} />

            {isTodo && (
              <SegmentedControl
                ariaLabel="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: `All ${tasks.length}` },
                  { value: "open", label: `To do ${tasks.length - done}` },
                  { value: "done", label: `Done ${done}` },
                ]}
              />
            )}
          </>
        )}

        {tasks.length === 0 ? (
          <EmptyHint>
            {ready
              ? isTodo
                ? "Nothing on the list yet. Add your first task above."
                : "Empty checklist. Add your first item above."
              : "Loading…"}
          </EmptyHint>
        ) : visible.length === 0 ? (
          <EmptyHint>Nothing matches that filter.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {visible.map((task) => {
              const index = tasks.findIndex((t) => t.id === task.id);
              const overdue =
                task.due && !task.done && task.due < toISODate(new Date()) ? true : false;
              return (
                <ItemRow
                  key={task.id}
                  item={task}
                  first={index === 0}
                  last={index === tasks.length - 1}
                  placeholder={isTodo ? "What needs doing?" : "Checklist item"}
                  onChange={(text) => update(task.id, { text })}
                  onToggle={() => update(task.id, { done: !task.done })}
                  onRemove={() => setTasks((current) => current.filter((t) => t.id !== task.id))}
                  onMove={
                    filter === "all"
                      ? (direction) => setTasks((current) => moveItem(current, index, direction))
                      : undefined
                  }
                  trailing={
                    isTodo ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <Select
                          value={task.priority ?? "normal"}
                          aria-label="Priority"
                          onChange={(e) => update(task.id, { priority: e.target.value as Task["priority"] })}
                          className="h-8 w-[5.5rem] text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </Select>
                        <input
                          type="date"
                          value={task.due ?? ""}
                          aria-label="Due date"
                          onChange={(e) => update(task.id, { due: e.target.value })}
                          className={
                            overdue
                              ? "h-8 rounded-lg border border-[var(--error)] bg-[var(--surface)] px-2 text-xs text-[var(--error)]"
                              : "h-8 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-xs text-[var(--fg-muted)]"
                          }
                        />
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </ul>
        )}

        {isTodo && tasks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Open" value={String(tasks.length - done)} tone="accent" />
            <Stat label="High priority" value={String(tasks.filter((t) => t.priority === "high" && !t.done).length)} />
            <Stat
              label="Overdue"
              value={String(
                tasks.filter((t) => t.due && !t.done && t.due < toISODate(new Date())).length,
              )}
              tone="warning"
            />
          </div>
        )}

        <SavedFooter
          slug={toolSlug}
          ready={ready}
          count={tasks.length}
          exportText={exportText}
          exportName={isTodo ? "todo-list.txt" : "checklist.txt"}
          onCleared={() => setTasks([])}
        />
      </ToolPanel>
    </div>
  );
}
