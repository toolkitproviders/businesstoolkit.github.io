/**
 * Calendar maths.
 *
 * Dates are handled as local midnight, never UTC, because every question these
 * tools answer ("how many days until…", "is this a working day") is asked about
 * the user's own calendar. Pure and browser-free, so the test suite exercises
 * the awkward cases — leap days, month-end clamping and daylight saving —
 * directly.
 */

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MS_PER_DAY = 86_400_000;

/** "2026-03-14" to local midnight. Returns null for anything unparseable. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight today, which is what "today" means to the person asking. */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** `month` is 0-based, as in the Date API. */
export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    ((month % 12) + 12) % 12
  ];
}

/**
 * Whole days between two dates.
 *
 * Both are normalised to midday before subtracting, so a clock change in the
 * range cannot turn 7 days into 6.96 and round down to 6.
 */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Adds calendar months, clamping to the end of the target month — so
 * 31 January plus one month is 28 or 29 February, not 2 or 3 March.
 */
export function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  return next;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export interface DateParts {
  years: number;
  months: number;
  days: number;
}

/**
 * The calendar difference people mean by "3 years, 2 months and 5 days".
 *
 * Counts whole months from the earlier date first, then the leftover days, so
 * month lengths never distort the answer.
 */
export function diffParts(from: Date, to: Date): DateParts {
  if (from > to) return diffParts(to, from);

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (addMonths(from, months) > to) months -= 1;
  // The estimate can be one short when the source day was clamped.
  while (addMonths(from, months + 1) <= to) months += 1;

  const anchor = addMonths(from, months);
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: daysBetween(anchor, to),
  };
}

/* ------------------------------------------------------------ working days -- */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkingDayOptions {
  /** Days treated as non-working. Defaults to Saturday and Sunday. */
  weekend?: Weekday[];
  /** Extra non-working dates, as ISO strings. */
  holidays?: string[];
}

export function isWorkingDay(date: Date, options: WorkingDayOptions = {}): boolean {
  const weekend = options.weekend ?? [0, 6];
  if (weekend.includes(date.getDay() as Weekday)) return false;
  return !(options.holidays ?? []).includes(toISODate(date));
}

/**
 * Working days from `from` up to and including `to`.
 *
 * Inclusive of both ends, which is how holiday allowance and delivery windows
 * are counted — five working days from Monday to Friday is five, not four.
 */
export function workingDaysBetween(from: Date, to: Date, options: WorkingDayOptions = {}): number {
  if (from > to) return workingDaysBetween(to, from, options);
  let count = 0;
  const cursor = new Date(from);
  // Bounded so a mistyped year cannot spin for ever.
  for (let guard = 0; cursor <= to && guard < 400_000; guard++) {
    if (isWorkingDay(cursor, options)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Steps forward (or back) by working days, skipping weekends and holidays. */
export function addWorkingDays(date: Date, count: number, options: WorkingDayOptions = {}): Date {
  const step = count >= 0 ? 1 : -1;
  let remaining = Math.abs(count);
  const cursor = new Date(date);
  for (let guard = 0; remaining > 0 && guard < 400_000; guard++) {
    cursor.setDate(cursor.getDate() + step);
    if (isWorkingDay(cursor, options)) remaining -= 1;
  }
  return cursor;
}

/* ------------------------------------------------------------------ weeks -- */

/** ISO 8601 week number: weeks start Monday, week 1 holds the first Thursday. */
export function isoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
}

/** The Monday of the week containing `date`. */
export function startOfWeek(date: Date, firstDay: Weekday = 1): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (result.getDay() - firstDay + 7) % 7;
  result.setDate(result.getDate() - shift);
  return result;
}

export function dayOfYear(date: Date): number {
  return daysBetween(new Date(date.getFullYear(), 0, 1), date) + 1;
}

/* ---------------------------------------------------------------- streaks -- */

/**
 * Consecutive days completed, counting back from `today`.
 *
 * Today not being marked yet does not break the streak — an evening habit
 * would otherwise read as broken every morning — so counting starts from
 * yesterday until today is ticked.
 */
export function currentStreak(days: string[], today: Date): number {
  const set = new Set(days);
  let streak = 0;
  const start = set.has(toISODate(today)) ? 0 : 1;
  for (let offset = start; offset < 3650; offset++) {
    if (!set.has(toISODate(addDays(today, -offset)))) break;
    streak += 1;
  }
  return streak;
}

/* ------------------------------------------------------------------ signs -- */

const ZODIAC: { name: string; until: [number, number] }[] = [
  { name: "Capricorn", until: [0, 19] },
  { name: "Aquarius", until: [1, 18] },
  { name: "Pisces", until: [2, 20] },
  { name: "Aries", until: [3, 19] },
  { name: "Taurus", until: [4, 20] },
  { name: "Gemini", until: [5, 20] },
  { name: "Cancer", until: [6, 22] },
  { name: "Leo", until: [7, 22] },
  { name: "Virgo", until: [8, 22] },
  { name: "Libra", until: [9, 22] },
  { name: "Scorpio", until: [10, 21] },
  { name: "Sagittarius", until: [11, 21] },
];

export function zodiacSign(date: Date): string {
  const month = date.getMonth();
  const day = date.getDate();
  for (const sign of ZODIAC) {
    if (month < sign.until[0] || (month === sign.until[0] && day <= sign.until[1])) return sign.name;
  }
  return "Capricorn";
}

/* -------------------------------------------------------------- durations -- */

/** Milliseconds to "1:23:45.6" — the format a stopwatch wants. */
export function formatClock(ms: number, showTenths = true): string {
  const safe = Math.max(0, Math.floor(ms));
  const tenths = Math.floor((safe % 1000) / 100);
  const totalSeconds = Math.floor(safe / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  return showTenths ? `${base}.${tenths}` : base;
}

/** Milliseconds to "2 days, 3 hours, 4 minutes" — for a countdown. */
export function formatLongDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const parts: string[] = [];
  const units: [string, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  let remaining = safe;
  for (const [name, size] of units) {
    const value = Math.floor(remaining / size);
    remaining %= size;
    if (value > 0) parts.push(`${value} ${name}${value === 1 ? "" : "s"}`);
  }
  return parts.length ? parts.slice(0, 3).join(", ") : "0 seconds";
}

/** "14:30" to minutes since midnight. Returns null for anything else. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/u.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

/* ----------------------------------------------------------- time zones ---- */

/** A reasonable spread of zones, rather than the full 400-entry IANA list. */
export const COMMON_TIME_ZONES: { value: string; label: string }[] = [
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Kolkata", label: "Mumbai and Delhi" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Africa/Johannesburg", label: "Johannesburg" },
  { value: "Europe/Istanbul", label: "Istanbul" },
  { value: "Europe/Athens", label: "Athens" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Lisbon", label: "Lisbon" },
  { value: "Africa/Lagos", label: "Lagos" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Chicago", label: "Chicago" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Denver", label: "Denver" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "America/Anchorage", label: "Anchorage" },
  { value: "Pacific/Honolulu", label: "Honolulu" },
  { value: "UTC", label: "UTC" },
];

/**
 * The offset of `zone` from UTC at `instant`, in minutes.
 *
 * Worked out by formatting the same instant in the zone and comparing, which
 * is the only way to get it right across daylight saving without shipping a
 * time zone database.
 */
export function zoneOffsetMinutes(instant: Date, zone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    return Math.round((asUtc - instant.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/** "+05:30", or "UTC" when there is no offset. */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
