"use client";

import * as React from "react";
import { Flag, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { Alert, Button, Field, Input, SegmentedControl, Select, Stat } from "@/components/ui";
import { CopyButton, PrivacyNote, ToolPanel } from "@/components/tools/shared";
import {
  COMMON_TIME_ZONES,
  formatClock,
  formatLongDuration,
  formatOffset,
  zoneOffsetMinutes,
} from "@/lib/dates";
import { useToolState } from "@/lib/storage";
import { track } from "@/lib/analytics";

/**
 * The tools that tick: a countdown, a stopwatch, a Pomodoro timer and a world
 * clock.
 *
 * All four read the device clock, so none of them can be server-rendered — each
 * starts from a stable placeholder and fills in on mount, which keeps the
 * hydrated markup identical to what the server sent.
 *
 * Elapsed time is always measured against `Date.now()` rather than by counting
 * intervals. A background tab throttles timers to once a second or less, and a
 * counter would silently run slow; a timestamp cannot.
 */

/** Re-renders on an interval, but only once mounted. */
function useTicker(active: boolean, ms = 100): number {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return tick;
}

/** True once the component has mounted in the browser. */
function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

function useToolOpened(slug: string) {
  React.useEffect(() => {
    track("tool_opened", { tool: slug });
  }, [slug]);
}

/* ---------------------------------------------------------------- alerts -- */

/**
 * A short tone, synthesised rather than fetched, so nothing has to load and
 * no audio file has to be hosted. Silently does nothing where the browser
 * blocks audio until a gesture.
 */
function beep(times = 1) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const start = ctx.currentTime + i * 0.35;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.start(start);
      osc.stop(start + 0.3);
    }
    setTimeout(() => ctx.close(), times * 400 + 500);
  } catch {
    // No audio available; the on-screen state is the real signal.
  }
}

/* -------------------------------------------------------------- countdown -- */

export function CountdownTimer({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const mounted = useMounted();
  const [target, setTarget] = useToolState<string>(`${toolSlug}:target`, "");
  const [label, setLabel] = useToolState<string>(`${toolSlug}:label`, "");
  const firedRef = React.useRef(false);

  useTicker(mounted, 200);

  const targetDate = target ? new Date(target) : null;
  const valid = targetDate !== null && !Number.isNaN(targetDate.getTime());
  const remaining = valid && mounted ? targetDate.getTime() - Date.now() : 0;
  const finished = valid && remaining <= 0;

  React.useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      beep(3);
    }
    if (!finished) firedRef.current = false;
  }, [finished]);

  const days = Math.floor(Math.max(0, remaining) / 86400000);
  const hours = Math.floor((Math.max(0, remaining) % 86400000) / 3600000);
  const minutes = Math.floor((Math.max(0, remaining) % 3600000) / 60000);
  const seconds = Math.floor((Math.max(0, remaining) % 60000) / 1000);

  return (
    <div className="space-y-6">
      <ToolPanel title="Count down to" description="The target is remembered on this device.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date and time" htmlFor={`${toolSlug}-target`}>
            <Input
              id={`${toolSlug}-target`}
              type="datetime-local"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </Field>
          <Field label="What for" htmlFor={`${toolSlug}-label`} hint="Optional.">
            <Input
              id={`${toolSlug}-label`}
              value={label}
              placeholder="Launch day"
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "In 1 hour", ms: 3600000 },
            { label: "In 1 day", ms: 86400000 },
            { label: "In 1 week", ms: 604800000 },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date(Date.now() + preset.ms);
                const pad = (n: number) => String(n).padStart(2, "0");
                setTarget(
                  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
                );
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel title={label || "Time remaining"}>
        {!mounted ? (
          <p className="text-sm text-[var(--fg-muted)]">Starting the clock…</p>
        ) : !valid ? (
          <p className="text-sm text-[var(--fg-muted)]">
            Pick a date and time above and the countdown will start.
          </p>
        ) : finished ? (
          <Alert tone="success" title="Time is up">
            {label ? `${label} — the moment you were counting to has passed.` : "The moment you were counting to has passed."}
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Days" value={String(days)} tone="accent" />
              <Stat label="Hours" value={String(hours)} />
              <Stat label="Minutes" value={String(minutes)} />
              <Stat label="Seconds" value={String(seconds)} />
            </div>
            <p className="text-sm text-[var(--fg-muted)]">
              {formatLongDuration(remaining)} until {targetDate.toLocaleString()}.
            </p>
            <CopyButton
              value={`${label ? `${label}: ` : ""}${formatLongDuration(remaining)} remaining (until ${targetDate.toLocaleString()})`}
              label="Copy"
            />
          </>
        )}

        <PrivacyNote>
          The countdown runs in your browser and the target is saved on this device only.
        </PrivacyNote>
      </ToolPanel>
    </div>
  );
}

/* -------------------------------------------------------------- stopwatch -- */

interface StopwatchState {
  /** When the current run began, or null while paused. */
  startedAt: number | null;
  /** Milliseconds banked from earlier runs. */
  elapsed: number;
  laps: number[];
}

export function Stopwatch({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const mounted = useMounted();
  const [state, setState] = React.useState<StopwatchState>({ startedAt: null, elapsed: 0, laps: [] });

  const running = state.startedAt !== null;
  useTicker(mounted && running, 47);

  const total = state.elapsed + (state.startedAt !== null ? Date.now() - state.startedAt : 0);

  const start = () => setState((s) => (s.startedAt !== null ? s : { ...s, startedAt: Date.now() }));
  const pause = () =>
    setState((s) =>
      s.startedAt === null ? s : { ...s, elapsed: s.elapsed + (Date.now() - s.startedAt), startedAt: null },
    );
  const reset = () => setState({ startedAt: null, elapsed: 0, laps: [] });
  const lap = () => setState((s) => ({ ...s, laps: [...s.laps, total] }));

  const lapRows = state.laps.map((at, i) => ({
    index: i + 1,
    at,
    split: at - (state.laps[i - 1] ?? 0),
  }));
  const fastest = lapRows.length > 1 ? Math.min(...lapRows.map((l) => l.split)) : null;
  const slowest = lapRows.length > 1 ? Math.max(...lapRows.map((l) => l.split)) : null;

  return (
    <div className="space-y-6">
      <ToolPanel title="Stopwatch">
        <p className="tabular text-center text-5xl font-semibold tracking-tight text-[var(--fg)] sm:text-6xl">
          {mounted ? formatClock(total) : "00:00.0"}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {running ? (
            <Button onClick={pause} variant="outline">
              <Pause className="size-4" />
              Pause
            </Button>
          ) : (
            <Button onClick={start}>
              <Play className="size-4" />
              {total > 0 ? "Resume" : "Start"}
            </Button>
          )}
          <Button onClick={lap} variant="outline" disabled={!running}>
            <Flag className="size-4" />
            Lap
          </Button>
          <Button onClick={reset} variant="ghost" disabled={total === 0 && state.laps.length === 0}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>

        <PrivacyNote>
          Timed in your browser against the system clock, so it stays accurate even in a background
          tab.
        </PrivacyNote>
      </ToolPanel>

      {lapRows.length > 0 && (
        <ToolPanel title={`Laps (${lapRows.length})`}>
          <div className="thin-scroll max-h-80 overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg-subtle)]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--fg-muted)]">Lap</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--fg-muted)]">Split</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--fg-muted)]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[...lapRows].reverse().map((row) => (
                  <tr key={row.index}>
                    <td className="px-3 py-1.5">
                      {row.index}
                      {row.split === fastest && lapRows.length > 1 && (
                        <span className="ml-2 text-xs text-[var(--success)]">fastest</span>
                      )}
                      {row.split === slowest && lapRows.length > 1 && row.split !== fastest && (
                        <span className="ml-2 text-xs text-[var(--warning)]">slowest</span>
                      )}
                    </td>
                    <td className="tabular px-3 py-1.5 text-right">{formatClock(row.split)}</td>
                    <td className="tabular px-3 py-1.5 text-right">{formatClock(row.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CopyButton
            value={lapRows.map((r) => `${r.index}\t${formatClock(r.split)}\t${formatClock(r.at)}`).join("\n")}
            label="Copy laps"
          />
        </ToolPanel>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- pomodoro -- */

type Phase = "work" | "short" | "long";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  short: "Short break",
  long: "Long break",
};

export function PomodoroTimer({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const mounted = useMounted();

  const [settings, setSettings] = useToolState(`${toolSlug}:settings`, {
    work: 25,
    short: 5,
    long: 15,
    rounds: 4,
  });
  const [completed, setCompleted] = useToolState<number>(`${toolSlug}:completed`, 0);

  const [phase, setPhase] = React.useState<Phase>("work");
  const [endsAt, setEndsAt] = React.useState<number | null>(null);
  const [remaining, setRemaining] = React.useState(settings.work * 60000);
  const [round, setRound] = React.useState(1);

  const running = endsAt !== null;
  useTicker(mounted && running, 200);

  const left = running ? Math.max(0, endsAt - Date.now()) : remaining;

  const lengthFor = React.useCallback(
    (p: Phase) => Math.max(1, settings[p]) * 60000,
    [settings],
  );

  // Reset the displayed time whenever the length of the current phase changes.
  React.useEffect(() => {
    if (!running) setRemaining(lengthFor(phase));
  }, [lengthFor, phase, running]);

  const advance = React.useCallback(() => {
    beep(2);
    if (phase === "work") {
      setCompleted((c) => c + 1);
      const next: Phase = round % Math.max(1, settings.rounds) === 0 ? "long" : "short";
      setPhase(next);
      setRemaining(lengthFor(next));
    } else {
      if (phase === "long") setRound(1);
      else setRound((r) => r + 1);
      setPhase("work");
      setRemaining(lengthFor("work"));
    }
    setEndsAt(null);
  }, [lengthFor, phase, round, setCompleted, settings.rounds]);

  React.useEffect(() => {
    if (running && left <= 0) advance();
  }, [advance, left, running]);

  const start = () => setEndsAt(Date.now() + remaining);
  const pause = () => {
    if (endsAt === null) return;
    setRemaining(Math.max(0, endsAt - Date.now()));
    setEndsAt(null);
  };
  const reset = () => {
    setEndsAt(null);
    setRemaining(lengthFor(phase));
  };

  const progress = 1 - left / lengthFor(phase);

  return (
    <div className="space-y-6">
      <ToolPanel title={PHASE_LABEL[phase]} description={`Round ${round} of ${Math.max(1, settings.rounds)}`}>
        <p
          className={
            phase === "work"
              ? "tabular text-center text-6xl font-semibold tracking-tight text-[var(--fg)]"
              : "tabular text-center text-6xl font-semibold tracking-tight text-[var(--success)]"
          }
        >
          {mounted ? formatClock(left, false) : formatClock(settings.work * 60000, false)}
        </p>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress through this interval"
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {running ? (
            <Button onClick={pause} variant="outline">
              <Pause className="size-4" />
              Pause
            </Button>
          ) : (
            <Button onClick={start}>
              <Play className="size-4" />
              Start
            </Button>
          )}
          <Button onClick={reset} variant="ghost">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button onClick={advance} variant="ghost">
            Skip to {phase === "work" ? "break" : "focus"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Focus sessions done" value={String(completed)} tone="accent" />
          <Stat label="Focus time today" value={`${Math.round((completed * settings.work) / 60 * 10) / 10} h`} />
          <Stat label="Current phase" value={PHASE_LABEL[phase]} />
        </div>
      </ToolPanel>

      <ToolPanel title="Intervals" description="Saved on this device, so your settings are here next time.">
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["work", "Focus length (minutes)"],
            ["short", "Short break (minutes)"],
            ["long", "Long break (minutes)"],
            ["rounds", "Focus sessions before a long break"],
          ] as const).map(([key, labelText]) => (
            <Field key={key} label={labelText} htmlFor={`${toolSlug}-${key}`}>
              <Input
                id={`${toolSlug}-${key}`}
                type="number"
                min={1}
                max={key === "rounds" ? 12 : 180}
                value={settings[key]}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, [key]: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </Field>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCompleted(0)}>
          <Trash2 className="size-3.5" />
          Reset the session count
        </Button>
        <PrivacyNote>
          Your intervals and session count are saved in this browser only, and never uploaded.
        </PrivacyNote>
      </ToolPanel>
    </div>
  );
}

/* ------------------------------------------------------------- world clock -- */

const DEFAULT_ZONES = ["Europe/London", "America/New_York", "Asia/Tokyo", "Australia/Sydney"];

export function WorldClock({ toolSlug }: { toolSlug: string }) {
  useToolOpened(toolSlug);
  const mounted = useMounted();
  const [zones, setZones] = useToolState<string[]>(`${toolSlug}:zones`, DEFAULT_ZONES);
  const [format, setFormat] = React.useState<"24" | "12">("24");
  const [pending, setPending] = React.useState("");

  useTicker(mounted, 1000);
  const now = mounted ? new Date() : new Date(0);
  const localZone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const show = (zone: string) => {
    try {
      return now.toLocaleTimeString("en-GB", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: format === "12",
      });
    } catch {
      return "—";
    }
  };
  const showDate = (zone: string) => {
    try {
      return now.toLocaleDateString("en-GB", {
        timeZone: zone,
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <ToolPanel title="Add a city">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field label="Time zone" htmlFor={`${toolSlug}-add`}>
            <Select id={`${toolSlug}-add`} value={pending} onChange={(e) => setPending(e.target.value)}>
              <option value="">Choose a city…</option>
              {COMMON_TIME_ZONES.filter((z) => !zones.includes(z.value)).map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label} — {zone.value}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            disabled={!pending}
            onClick={() => {
              setZones((current) => (current.includes(pending) ? current : [...current, pending]));
              setPending("");
            }}
          >
            Add
          </Button>
        </div>

        <SegmentedControl
          ariaLabel="Clock format"
          value={format}
          onChange={setFormat}
          options={[
            { value: "24", label: "24-hour" },
            { value: "12", label: "12-hour" },
          ]}
        />
      </ToolPanel>

      <ToolPanel title="World clock" description={mounted ? `Your device is set to ${localZone}.` : undefined}>
        {!mounted ? (
          <p className="text-sm text-[var(--fg-muted)]">Reading your clock…</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {zones.map((zone) => {
              const info = COMMON_TIME_ZONES.find((z) => z.value === zone);
              const offset = zoneOffsetMinutes(now, zone);
              const localOffset = zoneOffsetMinutes(now, localZone);
              const gap = (offset - localOffset) / 60;
              return (
                <li
                  key={zone}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--fg)]">
                      {info?.label ?? zone}
                      {zone === localZone && (
                        <span className="ml-2 text-xs font-normal text-[var(--accent)]">you</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--fg-subtle)]">
                      {showDate(zone)} · {formatOffset(offset)}
                      {zone !== localZone && gap !== 0 && ` · ${gap > 0 ? "+" : ""}${gap}h`}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-xl font-semibold text-[var(--fg)]">{show(zone)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${info?.label ?? zone}`}
                    className="size-8 shrink-0"
                    onClick={() => setZones((current) => current.filter((z) => z !== zone))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {zones.length === 0 && (
          <p className="text-sm text-[var(--fg-muted)]">
            No cities yet — add one above, or{" "}
            <button
              type="button"
              className="underline hover:text-[var(--fg)]"
              onClick={() => setZones(DEFAULT_ZONES)}
            >
              restore the defaults
            </button>
            .
          </p>
        )}

        <PrivacyNote>
          Times come from your browser&rsquo;s own time zone data. Your list of cities is saved on
          this device only.
        </PrivacyNote>
      </ToolPanel>
    </div>
  );
}
