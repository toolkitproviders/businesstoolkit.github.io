"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button, Stat } from "@/components/ui";
import { ToolPanel } from "@/components/tools/shared";
import { useToolState } from "@/lib/storage";
import { addDays, currentStreak, startOfToday, toISODate } from "@/lib/dates";
import { cn, uid } from "@/lib/utils";
import { AddRow, EmptyHint, SavedFooter, useToolOpened } from "./shared";

/**
 * A habit grid with streaks.
 *
 * Completions are stored as a set of ISO dates per habit, so the grid can show
 * any window without the storage growing with the calendar. Streaks are counted
 * back from today, which is the number people actually care about.
 */

interface Habit {
  id: string;
  name: string;
  days: string[];
}

const WINDOW = 14;

export function HabitTracker({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const [habits, setHabits, ready] = useToolState<Habit[]>(toolSlug, []);
  const [anchor, setAnchor] = React.useState<Date | null>(null);

  // "Today" only exists in the browser, so the grid settles on mount.
  React.useEffect(() => setAnchor(startOfToday()), []);

  const today = anchor ?? new Date(2026, 0, 1);
  const days = Array.from({ length: WINDOW }, (_v, i) => addDays(today, i - (WINDOW - 1)));

  const toggle = (habitId: string, iso: string) =>
    setHabits((current) =>
      current.map((h) =>
        h.id === habitId
          ? {
              ...h,
              days: h.days.includes(iso) ? h.days.filter((d) => d !== iso) : [...h.days, iso],
            }
          : h,
      ),
    );

  const totalToday = anchor
    ? habits.filter((h) => h.days.includes(toISODate(today))).length
    : 0;
  const bestStreak = anchor
    ? habits.reduce((best, h) => Math.max(best, currentStreak(h.days, today)), 0)
    : 0;
  const completions = habits.reduce((sum, h) => sum + h.days.length, 0);

  const exportText = () =>
    [
      "Habit tracker",
      "".padEnd(24, "-"),
      ...habits.map((h) => `${h.name}: ${h.days.length} days, current streak ${anchor ? currentStreak(h.days, today) : 0}`),
      "",
      ...habits.map((h) => `${h.name}\n  ${[...h.days].sort().join("\n  ")}`),
    ].join("\n");

  return (
    <div className="space-y-6">
      <ToolPanel title="Your habits" description="Tick a day to mark it done. Everything is saved in this browser.">
        <AddRow
          placeholder="Name a habit — read, walk, practise…"
          onAdd={(name) => setHabits((current) => [...current, { id: uid("h"), name, days: [] }])}
        />

        {habits.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Done today" value={`${totalToday} of ${habits.length}`} tone="accent" />
            <Stat label="Best current streak" value={`${bestStreak} days`} />
            <Stat label="Total completions" value={String(completions)} />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnchor(addDays(today, -7))}>
            <ChevronLeft className="size-3.5" />
            Earlier
          </Button>
          <p className="text-xs text-[var(--fg-subtle)]">
            {anchor === null
              ? "Loading…"
              : `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[days.length - 1].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={anchor !== null && toISODate(today) >= toISODate(startOfToday())}
            onClick={() => setAnchor(addDays(today, 7))}
          >
            Later
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {habits.length === 0 ? (
          <EmptyHint>{ready ? "No habits yet. Add one above to start tracking." : "Loading…"}</EmptyHint>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-[var(--surface)] px-2 py-1 text-left text-xs font-medium text-[var(--fg-muted)]">
                    Habit
                  </th>
                  {days.map((day) => (
                    <th
                      key={toISODate(day)}
                      scope="col"
                      className="px-1 py-1 text-center text-[10px] font-medium text-[var(--fg-subtle)]"
                    >
                      <span className="block">{day.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                      <span className="block">{day.getDate()}</span>
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-1 text-right text-xs font-medium text-[var(--fg-muted)]">
                    Streak
                  </th>
                  <th scope="col" className="w-8" />
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id}>
                    <th scope="row" className="sticky left-0 z-10 bg-[var(--surface)] py-1 pr-2 text-left font-normal">
                      <input
                        value={habit.name}
                        aria-label="Habit name"
                        onChange={(e) =>
                          setHabits((current) =>
                            current.map((h) => (h.id === habit.id ? { ...h, name: e.target.value } : h)),
                          )
                        }
                        className="w-full min-w-28 bg-transparent text-sm text-[var(--fg)] outline-none"
                      />
                    </th>
                    {days.map((day) => {
                      const iso = toISODate(day);
                      const done = habit.days.includes(iso);
                      const isToday = anchor !== null && iso === toISODate(startOfToday());
                      return (
                        <td key={iso} className="p-0.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(habit.id, iso)}
                            aria-pressed={done}
                            aria-label={`${habit.name} on ${day.toLocaleDateString()}`}
                            className={cn(
                              "size-6 rounded-md border transition-colors",
                              done
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--bg-muted)]",
                              isToday && !done && "ring-1 ring-[var(--accent)]",
                            )}
                          />
                        </td>
                      );
                    })}
                    <td className="tabular px-2 py-1 text-right text-sm">
                      {anchor === null ? "—" : `${currentStreak(habit.days, startOfToday())}d`}
                    </td>
                    <td className="py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Delete ${habit.name}`}
                        onClick={() => setHabits((current) => current.filter((h) => h.id !== habit.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <SavedFooter
          slug={toolSlug}
          ready={ready}
          count={habits.length}
          exportText={exportText}
          exportName="habits.txt"
          onCleared={() => setHabits([])}
        />
      </ToolPanel>
    </div>
  );
}
