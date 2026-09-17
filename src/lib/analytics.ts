/**
 * Privacy-first analytics.
 *
 * Events carry a tool slug and a small set of non-identifying properties —
 * never file names, file contents, form values or anything a person typed.
 * Nothing is sent anywhere until a provider is wired into `dispatch` below;
 * until then events land in a bounded in-memory buffer that the admin
 * dashboard reads, so the event surface can be reviewed before it goes live.
 */

export type AnalyticsEvent =
  | "tool_opened"
  | "tool_completed"
  | "download_clicked"
  | "conversion"
  | "search_performed";

export interface AnalyticsPayload {
  tool?: string;
  category?: string;
  /** Free-form counters only — never user content. */
  count?: number;
  format?: string;
  [key: string]: string | number | boolean | undefined;
}

interface RecordedEvent {
  event: AnalyticsEvent;
  payload: AnalyticsPayload;
  at: number;
}

const BUFFER_LIMIT = 200;
const buffer: RecordedEvent[] = [];

/** Keys that must never appear in a payload, even by accident. */
const BLOCKED_KEYS = new Set([
  "email", "name", "filename", "file", "value", "password", "content",
  "address", "phone", "query", "text", "amount",
]);

function scrub(payload: AnalyticsPayload): AnalyticsPayload {
  const clean: AnalyticsPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    if (value === undefined) continue;
    // Cap string length so nothing large can ride along in a label.
    clean[key] = typeof value === "string" ? value.slice(0, 64) : value;
  }
  return clean;
}

function dispatch(record: RecordedEvent): void {
  // Replace this body with a provider call (Plausible, Fathom, PostHog EU…)
  // when one is chosen. Keeping it in a single function is what makes the
  // analytics layer swappable without touching any tool.
  buffer.push(record);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
}

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;
  // Honour Do Not Track without needing a consent banner for basic counts.
  if (navigator.doNotTrack === "1") return;
  try {
    dispatch({ event, payload: scrub(payload), at: Date.now() });
  } catch {
    // Analytics must never break a tool.
  }
}

/** Read-only view for the admin dashboard. */
export function recentEvents(): RecordedEvent[] {
  return [...buffer].reverse();
}

export function eventTotals(): Record<string, number> {
  return buffer.reduce<Record<string, number>>((acc, e) => {
    acc[e.event] = (acc[e.event] ?? 0) + 1;
    return acc;
  }, {});
}
