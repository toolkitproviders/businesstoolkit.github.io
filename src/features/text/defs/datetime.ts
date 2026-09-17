import type { TextResult, TextToolDef } from "../types";
import {
  addDays,
  addMonths,
  addWorkingDays,
  addYears,
  COMMON_TIME_ZONES,
  DAY_NAMES,
  dayOfYear,
  daysBetween,
  diffParts,
  formatLongDuration,
  formatOffset,
  isLeapYear,
  isoWeekNumber,
  isWorkingDay,
  parseISODate,
  parseTimeOfDay,
  startOfToday,
  toISODate,
  workingDaysBetween,
  zodiacSign,
  zoneOffsetMinutes,
  type Weekday,
} from "@/lib/dates";

/**
 * Date and time calculators.
 *
 * All of them read the device clock for their "today" defaults, so every one
 * is marked `deferred` — the server's idea of today would not match the
 * browser's, and for a visitor near midnight it genuinely would not.
 */

const n = (value: number) => value.toLocaleString("en-US");
const longDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Reads a date option, falling back to today when it is empty or malformed. */
function dateOf(value: string, fallback: Date): Date {
  return parseISODate(value) ?? fallback;
}

const WEEKEND_OPTIONS = [
  { value: "sat-sun", label: "Saturday and Sunday" },
  { value: "fri-sat", label: "Friday and Saturday" },
  { value: "sun", label: "Sunday only" },
  { value: "none", label: "None — every day is a working day" },
];

function weekendFor(key: string): Weekday[] {
  if (key === "fri-sat") return [5, 6];
  if (key === "sun") return [0];
  if (key === "none") return [];
  return [0, 6];
}

/* ------------------------------------------------------- date difference -- */

export const dateDifferenceCalculator: TextToolDef = {
  controlsTitle: "Two dates",
  deferred: true,
  options: [
    { key: "from", label: "From", type: "date" },
    { key: "to", label: "To", type: "date" },
    { key: "inclusive", label: "Count both the start and end day", type: "checkbox", initial: "", wide: true },
  ],
  transform: (_input, _v, h) => {
    const today = startOfToday();
    const from = dateOf(h.str("from"), today);
    const to = dateOf(h.str("to"), addDays(today, 30));
    const [earlier, later] = from <= to ? [from, to] : [to, from];

    const days = daysBetween(earlier, later) + (h.bool("inclusive") ? 1 : 0);
    const parts = diffParts(earlier, later);
    const totalMonths = parts.years * 12 + parts.months;

    return {
      stats: [
        { label: "Days", value: n(days), tone: "accent" },
        { label: "Weeks", value: `${Math.floor(days / 7)}w ${days % 7}d` },
        { label: "Months", value: n(totalMonths), sub: `and ${parts.days} days` },
        { label: "Years", value: n(parts.years), sub: `${parts.months} months, ${parts.days} days` },
        { label: "Hours", value: n(days * 24) },
        { label: "Minutes", value: n(days * 1440) },
      ],
      output: [
        `From   ${longDate(earlier)}`,
        `To     ${longDate(later)}`,
        "",
        `${n(days)} days`,
        `${parts.years} years, ${parts.months} months, ${parts.days} days`,
        `${Math.floor(days / 7)} weeks and ${days % 7} days`,
      ].join("\n"),
      filename: "date-difference.txt",
      note: from > to ? "Those dates were the other way around, so they have been swapped." : undefined,
      table: {
        head: ["Measure", "Value"],
        rows: [
          ["Calendar days", n(days)],
          ["Working days", n(workingDaysBetween(earlier, later))],
          ["Weekends", n(days - workingDaysBetween(earlier, later))],
          ["Full weeks", n(Math.floor(days / 7))],
          ["Start day", DAY_NAMES[earlier.getDay()]],
          ["End day", DAY_NAMES[later.getDay()]],
        ],
        caption: "Breakdown",
      },
    } satisfies TextResult;
  },
  output: { label: "Summary", mono: true, rows: 8 },
  privacyNote: "Calculated in your browser using your device's own clock and calendar.",
  notes: [
    { label: "Inclusive counting", formula: "Add one day", note: "Use it when both the first and last day count, as with holiday allowance." },
    { label: "Months", formula: "Whole calendar months, then the leftover days", note: "So 31 January to 28 February is one month, not 28 days short of two." },
  ],
};

/* ------------------------------------------------------------------ age -- */

export const ageCalculator: TextToolDef = {
  controlsTitle: "Date of birth",
  deferred: true,
  options: [
    { key: "birth", label: "Date of birth", type: "date", wide: true },
    { key: "on", label: "Age on this date", type: "date", wide: true, hint: "Leave blank for today." },
  ],
  transform: (_input, _v, h) => {
    const today = startOfToday();
    const birth = parseISODate(h.str("birth"));
    if (!birth) {
      return { note: "Enter a date of birth and the age will appear here. Nothing you type is sent anywhere." };
    }
    const on = dateOf(h.str("on"), today);
    if (birth > on) {
      return { error: "That date of birth is after the date you are measuring to." };
    }

    const parts = diffParts(birth, on);
    const totalDays = daysBetween(birth, on);

    // The next birthday, allowing for 29 February falling back to the 28th.
    let nextBirthday = new Date(on.getFullYear(), birth.getMonth(), birth.getDate());
    if (Number.isNaN(nextBirthday.getTime()) || nextBirthday < on) {
      nextBirthday = addYears(new Date(birth), parts.years + 1);
    }
    const untilBirthday = daysBetween(on, nextBirthday);

    return {
      stats: [
        { label: "Age", value: `${parts.years}`, sub: `${parts.months} months, ${parts.days} days`, tone: "accent" },
        { label: "Total days", value: n(totalDays) },
        { label: "Total weeks", value: n(Math.floor(totalDays / 7)) },
        { label: "Total months", value: n(parts.years * 12 + parts.months) },
        { label: "Next birthday", value: untilBirthday === 0 ? "Today" : `${n(untilBirthday)} days` },
        { label: "Born on a", value: DAY_NAMES[birth.getDay()] },
      ],
      output: [
        `Born        ${longDate(birth)}`,
        `Age on      ${longDate(on)}`,
        "",
        `${parts.years} years, ${parts.months} months and ${parts.days} days`,
        `${n(totalDays)} days in total`,
        `Next birthday: ${longDate(nextBirthday)}`,
      ].join("\n"),
      filename: "age.txt",
      table: {
        head: ["Detail", "Value"],
        rows: [
          ["Day of the week born", DAY_NAMES[birth.getDay()]],
          ["Star sign", zodiacSign(birth)],
          ["Born in a leap year", isLeapYear(birth.getFullYear()) ? "Yes" : "No"],
          ["Total hours", n(totalDays * 24)],
          ["Next birthday falls on", DAY_NAMES[nextBirthday.getDay()]],
        ],
        caption: "More detail",
      },
      note:
        birth.getMonth() === 1 && birth.getDate() === 29
          ? "Born on 29 February — in common years the birthday is usually marked on 28 February or 1 March."
          : undefined,
    } satisfies TextResult;
  },
  output: { label: "Summary", mono: true, rows: 8 },
  privacyNote:
    "Your date of birth is used only to do the arithmetic in your browser. It is not stored or sent anywhere.",
};

/* -------------------------------------------------------- working days --- */

export const workingDaysCalculator: TextToolDef = {
  input: {
    label: "Public holidays",
    placeholder: "2026-12-25\n2026-12-26",
    rows: 6,
    mono: true,
    hint: "One date per line, as YYYY-MM-DD. Leave empty to count weekends only.",
  },
  controlsTitle: "Date range",
  deferred: true,
  options: [
    { key: "from", label: "From", type: "date" },
    { key: "to", label: "To", type: "date" },
    { key: "weekend", label: "Weekend", type: "select", initial: "sat-sun", options: WEEKEND_OPTIONS, wide: true },
  ],
  transform: (input, _v, h) => {
    const today = startOfToday();
    const from = dateOf(h.str("from"), today);
    const to = dateOf(h.str("to"), addDays(today, 30));
    const [earlier, later] = from <= to ? [from, to] : [to, from];

    const holidays = input
      .split(/\r\n|\r|\n/u)
      .map((l) => l.trim())
      .filter(Boolean);
    const valid = holidays.filter((d) => parseISODate(d));
    const invalid = holidays.filter((d) => !parseISODate(d));

    const options = { weekend: weekendFor(h.str("weekend")), holidays: valid };
    const total = daysBetween(earlier, later) + 1;
    const working = workingDaysBetween(earlier, later, options);
    const weekendDays = workingDaysBetween(earlier, later, { weekend: [], holidays: [] }) - workingDaysBetween(earlier, later, { weekend: options.weekend, holidays: [] });
    const holidaysInRange = valid.filter((d) => {
      const date = parseISODate(d);
      return date !== null && date >= earlier && date <= later && !options.weekend.includes(date.getDay() as Weekday);
    }).length;

    return {
      stats: [
        { label: "Working days", value: n(working), tone: "accent" },
        { label: "Total days", value: n(total) },
        { label: "Weekend days", value: n(weekendDays) },
        { label: "Holidays counted", value: n(holidaysInRange) },
        { label: "Full weeks", value: n(Math.floor(total / 7)) },
      ],
      output: [
        `From          ${longDate(earlier)}`,
        `To            ${longDate(later)}`,
        `Working days  ${working}`,
        `Total days    ${total}`,
      ].join("\n"),
      filename: "working-days.txt",
      warning: invalid.length
        ? `These holiday lines were not dates in YYYY-MM-DD form and were ignored: ${invalid.slice(0, 3).join(", ")}`
        : undefined,
      note: "Both the start and end date are counted, which is how holiday allowance and delivery windows are normally worked out.",
    } satisfies TextResult;
  },
  output: { label: "Summary", mono: true, rows: 6 },
  privacyNote: "Calculated in your browser. Nothing you enter is sent anywhere.",
  notes: [
    { label: "Inclusive", formula: "Both end dates are counted", note: "Monday to Friday is five working days." },
    { label: "Holidays", formula: "Only counted when they fall on a working day", note: "A bank holiday on a Saturday changes nothing." },
  ],
};

/* ----------------------------------------------------- add/subtract days -- */

export const addSubtractDays: TextToolDef = {
  controlsTitle: "Start date",
  deferred: true,
  options: [
    { key: "start", label: "Start date", type: "date", wide: true },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      initial: "add",
      options: [
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
      ],
    },
    { key: "amount", label: "How many", type: "number", initial: "30", min: 0, max: 100000 },
    {
      key: "unit",
      label: "Unit",
      type: "select",
      initial: "days",
      wide: true,
      options: [
        { value: "days", label: "Calendar days" },
        { value: "working", label: "Working days (skipping weekends)" },
        { value: "weeks", label: "Weeks" },
        { value: "months", label: "Months" },
        { value: "years", label: "Years" },
      ],
    },
  ],
  transform: (_input, _v, h) => {
    const start = dateOf(h.str("start"), startOfToday());
    const sign = h.str("direction") === "subtract" ? -1 : 1;
    const amount = Math.max(0, Math.round(h.num("amount", 30))) * sign;
    const unit = h.str("unit") || "days";

    const result =
      unit === "weeks" ? addDays(start, amount * 7)
      : unit === "months" ? addMonths(start, amount)
      : unit === "years" ? addYears(start, amount)
      : unit === "working" ? addWorkingDays(start, amount)
      : addDays(start, amount);

    const elapsed = daysBetween(start, result);

    return {
      stats: [
        { label: "Result", value: toISODate(result), sub: DAY_NAMES[result.getDay()], tone: "accent" },
        { label: "Calendar days apart", value: n(Math.abs(elapsed)) },
        { label: "Week number", value: `Week ${isoWeekNumber(result)}` },
      ],
      output: [
        `Start   ${longDate(start)}`,
        `Result  ${longDate(result)}`,
        "",
        `ISO format   ${toISODate(result)}`,
        `Day of week  ${DAY_NAMES[result.getDay()]}`,
        `Day of year  ${dayOfYear(result)}`,
      ].join("\n"),
      filename: "date.txt",
      note:
        unit === "months" && start.getDate() > 28
          ? "Adding months clamps to the end of the shorter month, so 31 January plus one month is the last day of February."
          : unit === "working"
            ? "Working days skip Saturdays and Sundays. Use the Working Days Calculator to allow for public holidays as well."
            : undefined,
    } satisfies TextResult;
  },
  output: { label: "Result", mono: true, rows: 8 },
  privacyNote: "Calculated in your browser using your device's calendar.",
};

/* ------------------------------------------------------- time difference -- */

export const timeDifferenceCalculator: TextToolDef = {
  controlsTitle: "Two times",
  deferred: true,
  options: [
    { key: "start", label: "Start time", type: "time", initial: "09:00" },
    { key: "end", label: "End time", type: "time", initial: "17:30" },
    { key: "break", label: "Unpaid break (minutes)", type: "number", initial: "30", min: 0, max: 1440 },
    { key: "overnight", label: "The end time is on the next day", type: "checkbox", initial: "", wide: true },
    { key: "rate", label: "Hourly rate (optional)", type: "number", placeholder: "For a pay total", min: 0 },
  ],
  transform: (_input, _v, h) => {
    const start = parseTimeOfDay(h.str("start"));
    const end = parseTimeOfDay(h.str("end"));
    if (start === null || end === null) {
      return { error: "Enter both times as HH:MM, for example 09:00 and 17:30." };
    }

    // An end earlier than the start means an overnight shift, which is what
    // people actually mean rather than a negative duration.
    let seconds = end - start;
    const wrapped = seconds < 0 || h.bool("overnight");
    if (seconds < 0) seconds += 86400;
    else if (h.bool("overnight")) seconds += 86400;

    const breakMinutes = Math.max(0, h.num("break", 0));
    const worked = Math.max(0, seconds - breakMinutes * 60);
    const hours = worked / 3600;
    const rate = h.num("rate", 0);

    const stats: TextResult["stats"] = [
      { label: "Duration", value: `${Math.floor(worked / 3600)}h ${Math.round((worked % 3600) / 60)}m`, tone: "accent" },
      { label: "Decimal hours", value: hours.toFixed(2), sub: "for timesheets" },
      { label: "Total minutes", value: n(Math.round(worked / 60)) },
    ];
    if (rate > 0) {
      stats.push({ label: "Pay", value: (hours * rate).toFixed(2), sub: `at ${rate} per hour`, tone: "success" });
    }

    return {
      stats,
      output: [
        `Start          ${h.str("start")}`,
        `End            ${h.str("end")}${wrapped ? " (next day)" : ""}`,
        `Break          ${breakMinutes} minutes`,
        `Worked         ${Math.floor(worked / 3600)}h ${Math.round((worked % 3600) / 60)}m`,
        `Decimal hours  ${hours.toFixed(2)}`,
      ].join("\n"),
      filename: "time-difference.txt",
      note: wrapped ? "Counted as an overnight shift, so the end time is treated as the following day." : undefined,
      warning: worked === 0 && seconds > 0 ? "The break is as long as the shift, so no time is left." : undefined,
    } satisfies TextResult;
  },
  output: { label: "Summary", mono: true, rows: 7 },
  privacyNote: "Calculated in your browser. Nothing you enter is stored.",
  notes: [
    { label: "Decimal hours", formula: "minutes ÷ 60", note: "7h 30m is 7.50, which is what payroll systems expect." },
    { label: "Overnight", formula: "An end before the start adds a day", note: "So 22:00 to 06:00 is eight hours, not minus sixteen." },
  ],
};

/* ------------------------------------------------------ time zone convert -- */

export const timeZoneConverter: TextToolDef = {
  controlsTitle: "Convert a time",
  deferred: true,
  options: [
    { key: "when", label: "Date and time", type: "datetime", wide: true, hint: "Leave blank to use the time right now." },
    {
      key: "from",
      label: "From",
      type: "select",
      initial: "Europe/London",
      options: COMMON_TIME_ZONES.map((z) => ({ value: z.value, label: `${z.label} — ${z.value}` })),
    },
    {
      key: "to",
      label: "To",
      type: "select",
      initial: "America/New_York",
      options: COMMON_TIME_ZONES.map((z) => ({ value: z.value, label: `${z.label} — ${z.value}` })),
    },
    { key: "all", label: "Show every zone, not just the one selected", type: "checkbox", initial: "1", wide: true },
  ],
  transform: (_input, _v, h) => {
    const fromZone = h.str("from") || "Europe/London";
    const toZone = h.str("to") || "America/New_York";
    const raw = h.str("when").trim();

    // A wall-clock time typed for another zone has to be shifted by that
    // zone's offset to become the real instant it refers to.
    let instant: Date;
    if (raw) {
      const naive = new Date(raw);
      if (Number.isNaN(naive.getTime())) {
        return { error: "That is not a date and time this browser can read. Use the picker." };
      }
      const guess = new Date(naive.getTime() - zoneOffsetMinutes(naive, fromZone) * 60000);
      instant = new Date(naive.getTime() - zoneOffsetMinutes(guess, fromZone) * 60000);
    } else {
      instant = new Date();
    }

    const show = (zone: string) =>
      instant.toLocaleString("en-GB", {
        timeZone: zone,
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

    const fromOffset = zoneOffsetMinutes(instant, fromZone);
    const toOffset = zoneOffsetMinutes(instant, toZone);
    const gap = (toOffset - fromOffset) / 60;

    const rows = COMMON_TIME_ZONES.map((zone) => [
      zone.label,
      show(zone.value),
      formatOffset(zoneOffsetMinutes(instant, zone.value)),
    ]);

    return {
      stats: [
        { label: COMMON_TIME_ZONES.find((z) => z.value === toZone)?.label ?? toZone, value: show(toZone), tone: "accent" },
        { label: COMMON_TIME_ZONES.find((z) => z.value === fromZone)?.label ?? fromZone, value: show(fromZone) },
        {
          label: "Difference",
          value: gap === 0 ? "Same time" : `${gap > 0 ? "+" : ""}${gap} hours`,
        },
      ],
      output: rows.map(([label, time, offset]) => `${label.padEnd(18)} ${time}  ${offset}`).join("\n"),
      filename: "time-zones.txt",
      table: h.bool("all") ? { head: ["City", "Local time", "Offset"], rows, caption: "Every zone" } : undefined,
      note: raw
        ? "Daylight saving is applied for the date you chose, which is why the difference can change through the year."
        : `Showing the time right now. Your device is set to ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`,
    } satisfies TextResult;
  },
  output: { label: "All zones", mono: true, rows: 14 },
  privacyNote: "Converted in your browser using its own time zone database.",
  notes: [
    { label: "Offsets change", formula: "Daylight saving moves the clocks", note: "London is UTC in winter and UTC+1 in summer." },
    { label: "Half-hour zones", formula: "India is UTC+05:30, Nepal UTC+05:45", note: "Not every offset is a whole hour." },
  ],
};
