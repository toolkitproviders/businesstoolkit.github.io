"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { useToolState } from "@/lib/storage";
import { addDays, DAY_NAMES, isoWeekNumber, startOfToday, startOfWeek, toISODate } from "@/lib/dates";
import { SavedFooter, useToolOpened } from "./shared";

/**
 * Serves both the Daily Planner and the Weekly Planner.
 *
 * Entries are keyed by date and slot, so the same store holds every day you
 * have ever planned and moving between days is just a change of key. Both
 * views print cleanly, which is half of what a planner is for.
 */

type Entries = Record<string, string>;

const START_HOUR = 6;
const END_HOUR = 22;

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function PlannerTool({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const weekly = toolSlug === "weekly-planner";

  const [entries, setEntries, ready] = useToolState<Entries>(toolSlug, {});
  const [anchor, setAnchor] = React.useState<Date | null>(null);

  // The current date can only be read in the browser, so the grid starts from
  // a placeholder and settles on mount.
  React.useEffect(() => setAnchor(startOfToday()), []);

  const today = anchor ?? new Date(2026, 0, 1);
  const weekStart = startOfWeek(today);
  const days = weekly ? Array.from({ length: 7 }, (_v, i) => addDays(weekStart, i)) : [today];

  const set = (key: string, value: string) =>
    setEntries((current) => {
      const next = { ...current };
      if (value.trim()) next[key] = value;
      else delete next[key];
      return next;
    });

  const shift = (amount: number) => setAnchor(addDays(today, weekly ? amount * 7 : amount));

  const exportText = () => {
    const lines: string[] = [];
    for (const day of days) {
      const iso = toISODate(day);
      lines.push(`${DAY_NAMES[day.getDay()]} ${day.toLocaleDateString()}`);
      lines.push("".padEnd(28, "-"));
      if (weekly) {
        const text = entries[`${iso}:all`] ?? "";
        lines.push(text || "(nothing planned)");
      } else {
        for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
          const text = entries[`${iso}:${hour}`];
          if (text) lines.push(`${hourLabel(hour).padStart(6)}  ${text}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  };

  const plannedCount = Object.keys(entries).length;

  return (
    <div className="space-y-6">
      <ToolPanel
        title={weekly ? "Week of" : "Plan for"}
        description="Everything you type is saved in this browser as you go."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-52 text-center text-sm font-medium text-[var(--fg)]">
              {anchor === null
                ? "Loading…"
                : weekly
                  ? `${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · week ${isoWeekNumber(weekStart)}`
                  : today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <Button variant="outline" size="icon" aria-label="Next" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAnchor(startOfToday())}>
              Today
            </Button>
            <Field label="" htmlFor={`${toolSlug}-jump`} className="sr-only">
              <span>Jump to a date</span>
            </Field>
            <Input
              id={`${toolSlug}-jump`}
              type="date"
              aria-label="Jump to a date"
              value={anchor ? toISODate(today) : ""}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                if (y && m && d) setAnchor(new Date(y, m - 1, d));
              }}
              className="w-40"
            />
          </div>
        </div>
      </ToolPanel>

      <ToolPanel title={weekly ? "Your week" : "Your day"}>
        {weekly ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const iso = toISODate(day);
              const isToday = anchor !== null && iso === toISODate(startOfToday());
              return (
                <div
                  key={iso}
                  className={
                    isToday
                      ? "rounded-lg border-2 border-[var(--accent)] bg-[var(--surface)] p-3"
                      : "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                  }
                >
                  <p className="mb-2 flex items-baseline justify-between text-sm font-semibold text-[var(--fg)]">
                    {DAY_NAMES[day.getDay()]}
                    <span className="text-xs font-normal text-[var(--fg-subtle)]">
                      {day.getDate()} {day.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                  </p>
                  <Textarea
                    rows={7}
                    value={entries[`${iso}:all`] ?? ""}
                    placeholder="What is happening?"
                    aria-label={`Plan for ${DAY_NAMES[day.getDay()]} ${day.toLocaleDateString()}`}
                    onChange={(e) => set(`${iso}:all`, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_v, i) => START_HOUR + i).map((hour) => {
              const key = `${toISODate(today)}:${hour}`;
              return (
                <li key={hour} className="flex items-center gap-3 bg-[var(--surface)] px-3 py-1.5">
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-[var(--fg-subtle)]">
                    {hourLabel(hour)}
                  </span>
                  <input
                    value={entries[key] ?? ""}
                    placeholder="—"
                    aria-label={`Plan for ${hourLabel(hour)}`}
                    onChange={(e) => set(key, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)]"
                  />
                </li>
              );
            })}
          </ul>
        )}

        <SavedFooter
          slug={toolSlug}
          ready={ready}
          count={plannedCount}
          exportText={exportText}
          exportName={weekly ? "weekly-plan.txt" : "daily-plan.txt"}
          onCleared={() => setEntries({})}
        />
      </ToolPanel>
    </div>
  );
}
