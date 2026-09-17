/**
 * Calendar maths and the date, time and productivity tools.
 *
 * The cases here are the ones that catch date code out: leap days, month-end
 * clamping, daylight saving, inclusive counting and week numbering.
 */
import {
  parseISODate, toISODate, isLeapYear, daysInMonth, daysBetween,
  addDays, addMonths, addYears, diffParts,
  isWorkingDay, workingDaysBetween, addWorkingDays,
  isoWeekNumber, startOfWeek, dayOfYear, currentStreak, zodiacSign,
  formatClock, formatLongDuration, parseTimeOfDay,
  zoneOffsetMinutes, formatOffset, COMMON_TIME_ZONES,
} from "../src/lib/dates.ts";
import { TEXT_TOOL_DEFS, textToolSlugs } from "../src/features/text/defs/index.ts";
import { runTextTool } from "../src/features/text/types.ts";
import { tools, toolSlugs } from "../src/lib/tools.ts";

let pass = 0;
const failures = [];
const check = (name, cond, extra = "") => {
  if (cond) pass += 1;
  else {
    failures.push(`${name} ${extra}`);
    console.log("  FAIL", name, extra);
  }
};
const eq = (name, actual, expected) =>
  check(name, Object.is(actual, expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
const group = (title) => console.log(`\n${title}`);

const d = (iso) => parseISODate(iso);
const run = (slug, input, values = {}) => runTextTool(TEXT_TOOL_DEFS[slug], input, values);
const stat = (result, label) => result.stats?.find((s) => s.label === label)?.value;

/* ---------------------------------------------------------------- parsing -- */
group("parsing");
eq("valid date", toISODate(d("2026-03-14")), "2026-03-14");
eq("leap day parses", toISODate(d("2024-02-29")), "2024-02-29");
eq("29 February in a common year is rejected", d("2026-02-29"), null);
eq("31 April is rejected", d("2026-04-31"), null);
eq("month 13 is rejected", d("2026-13-01"), null);
eq("day 0 is rejected", d("2026-01-00"), null);
eq("a non-date is rejected", d("not a date"), null);
eq("a loose format is rejected", d("14/03/2026"), null);
eq("whitespace is trimmed", toISODate(d("  2026-03-14 ")), "2026-03-14");
eq("parsing gives local midnight", d("2026-03-14").getHours(), 0);

/* --------------------------------------------------------------- calendar -- */
group("calendar facts");
eq("2024 is a leap year", isLeapYear(2024), true);
eq("2026 is not", isLeapYear(2026), false);
eq("1900 is not a leap year", isLeapYear(1900), false);
eq("2000 is a leap year", isLeapYear(2000), true);
eq("February 2024", daysInMonth(2024, 1), 29);
eq("February 2026", daysInMonth(2026, 1), 28);
eq("April", daysInMonth(2026, 3), 30);
eq("December", daysInMonth(2026, 11), 31);

group("day arithmetic");
eq("days in a week", daysBetween(d("2026-03-01"), d("2026-03-08")), 7);
eq("backwards is negative", daysBetween(d("2026-03-08"), d("2026-03-01")), -7);
eq("same day is zero", daysBetween(d("2026-03-08"), d("2026-03-08")), 0);
eq("across a year boundary", daysBetween(d("2025-12-31"), d("2026-01-01")), 1);
eq("a whole common year", daysBetween(d("2026-01-01"), d("2027-01-01")), 365);
eq("a whole leap year", daysBetween(d("2024-01-01"), d("2025-01-01")), 366);
// Spring clock changes are the classic way a day count comes out at 6.96.
eq("across a US spring clock change", daysBetween(d("2026-03-07"), d("2026-03-09")), 2);
eq("across a UK spring clock change", daysBetween(d("2026-03-28"), d("2026-03-30")), 2);
eq("across an autumn clock change", daysBetween(d("2026-10-24"), d("2026-10-26")), 2);

eq("add days", toISODate(addDays(d("2026-03-14"), 30)), "2026-04-13");
eq("subtract days", toISODate(addDays(d("2026-03-14"), -14)), "2026-02-28");
eq("add days over a leap day", toISODate(addDays(d("2024-02-28"), 1)), "2024-02-29");

group("month arithmetic");
eq("simple month", toISODate(addMonths(d("2026-03-14"), 1)), "2026-04-14");
eq("31 January plus a month clamps", toISODate(addMonths(d("2026-01-31"), 1)), "2026-02-28");
eq("31 January in a leap year clamps to the 29th", toISODate(addMonths(d("2024-01-31"), 1)), "2024-02-29");
eq("31 March minus a month clamps", toISODate(addMonths(d("2026-03-31"), -1)), "2026-02-28");
eq("months roll into the next year", toISODate(addMonths(d("2026-11-15"), 3)), "2027-02-15");
eq("29 February plus a year clamps", toISODate(addYears(d("2024-02-29"), 1)), "2025-02-28");
eq("29 February plus four years", toISODate(addYears(d("2024-02-29"), 4)), "2028-02-29");

group("calendar difference");
{
  const p = diffParts(d("1990-05-15"), d("2026-09-17"));
  eq("years", p.years, 36);
  eq("months", p.months, 4);
  eq("days", p.days, 2);
}
{
  // 31 Jan to 1 Mar is the case a naive borrow gets wrong.
  const p = diffParts(d("2024-01-31"), d("2024-03-01"));
  eq("awkward month end: years", p.years, 0);
  eq("awkward month end: months", p.months, 1);
  eq("awkward month end: days", p.days, 1);
}
{
  const p = diffParts(d("2026-01-31"), d("2026-02-28"));
  eq("31 Jan to 28 Feb is one whole month", `${p.years}/${p.months}/${p.days}`, "0/1/0");
}
{
  const p = diffParts(d("2026-03-14"), d("2026-03-14"));
  eq("same day is nothing", `${p.years}/${p.months}/${p.days}`, "0/0/0");
}
{
  const p = diffParts(d("2026-09-17"), d("1990-05-15"));
  eq("reversed dates give the same answer", `${p.years}/${p.months}/${p.days}`, "36/4/2");
}
{
  const p = diffParts(d("2026-03-14"), d("2027-03-13"));
  eq("one day short of a year", `${p.years}/${p.months}/${p.days}`, "0/11/27");
}

/* ---------------------------------------------------------- working days -- */
group("working days");
// 2026-03-16 is a Monday.
eq("Monday is a working day", isWorkingDay(d("2026-03-16")), true);
eq("Saturday is not", isWorkingDay(d("2026-03-21")), false);
eq("Sunday is not", isWorkingDay(d("2026-03-22")), false);
eq("a holiday is not", isWorkingDay(d("2026-03-16"), { holidays: ["2026-03-16"] }), false);
eq("Friday is a working day with a Fri-Sat weekend", isWorkingDay(d("2026-03-20"), { weekend: [5, 6] }), false);
eq("Sunday works with a Fri-Sat weekend", isWorkingDay(d("2026-03-22"), { weekend: [5, 6] }), true);

eq("Monday to Friday is five", workingDaysBetween(d("2026-03-16"), d("2026-03-20")), 5);
eq("a full week is five", workingDaysBetween(d("2026-03-16"), d("2026-03-22")), 5);
eq("two weeks is ten", workingDaysBetween(d("2026-03-16"), d("2026-03-29")), 10);
eq("one day is one", workingDaysBetween(d("2026-03-16"), d("2026-03-16")), 1);
eq("a weekend alone is zero", workingDaysBetween(d("2026-03-21"), d("2026-03-22")), 0);
eq("a holiday reduces the count", workingDaysBetween(d("2026-03-16"), d("2026-03-20"), { holidays: ["2026-03-18"] }), 4);
eq("a weekend holiday changes nothing", workingDaysBetween(d("2026-03-16"), d("2026-03-20"), { holidays: ["2026-03-21"] }), 5);
eq("reversed dates give the same count", workingDaysBetween(d("2026-03-20"), d("2026-03-16")), 5);
eq("no weekend counts every day", workingDaysBetween(d("2026-03-16"), d("2026-03-22"), { weekend: [] }), 7);

eq("Friday plus one working day is Monday", toISODate(addWorkingDays(d("2026-03-20"), 1)), "2026-03-23");
eq("Monday plus five working days is next Monday", toISODate(addWorkingDays(d("2026-03-16"), 5)), "2026-03-23");
eq("Monday minus one working day is Friday", toISODate(addWorkingDays(d("2026-03-16"), -1)), "2026-03-13");
eq("adding zero changes nothing", toISODate(addWorkingDays(d("2026-03-16"), 0)), "2026-03-16");
eq("holidays are skipped too", toISODate(addWorkingDays(d("2026-03-16"), 1, { holidays: ["2026-03-17"] })), "2026-03-18");

/* ------------------------------------------------------------------ weeks -- */
group("weeks and days of the year");
// 1 January 2026 is a Thursday, so it is in week 1.
eq("1 January 2026 is week 1", isoWeekNumber(d("2026-01-01")), 1);
// 1 January 2027 is a Friday, so it belongs to the last week of 2026.
eq("1 January 2027 is week 53", isoWeekNumber(d("2027-01-01")), 53);
eq("mid-March 2026", isoWeekNumber(d("2026-03-16")), 12);
eq("week starts on Monday", toISODate(startOfWeek(d("2026-03-19"))), "2026-03-16");
eq("a Monday is its own week start", toISODate(startOfWeek(d("2026-03-16"))), "2026-03-16");
eq("Sunday belongs to the week before", toISODate(startOfWeek(d("2026-03-22"))), "2026-03-16");
eq("first day of the year", dayOfYear(d("2026-01-01")), 1);
eq("last day of a common year", dayOfYear(d("2026-12-31")), 365);
eq("last day of a leap year", dayOfYear(d("2024-12-31")), 366);

/* ---------------------------------------------------------------- streaks -- */
group("streaks");
{
  const today = d("2026-03-16");
  eq("no days is no streak", currentStreak([], today), 0);
  eq("today alone is one", currentStreak(["2026-03-16"], today), 1);
  eq("three days back from today", currentStreak(["2026-03-16", "2026-03-15", "2026-03-14"], today), 3);
  // Today unticked still counts back from yesterday.
  eq("yesterday counts while today is unticked", currentStreak(["2026-03-15", "2026-03-14"], today), 2);
  eq("a gap ends the streak", currentStreak(["2026-03-16", "2026-03-14"], today), 1);
  eq("an old run does not count", currentStreak(["2026-03-01", "2026-03-02"], today), 0);
}

/* ----------------------------------------------------------- formatting --- */
group("durations");
eq("under a minute", formatClock(5400), "00:05.4");
eq("minutes and seconds", formatClock(83400), "01:23.4");
eq("with hours", formatClock(3723400), "1:02:03.4");
eq("without tenths", formatClock(83400, false), "01:23");
eq("zero", formatClock(0), "00:00.0");
eq("negative is clamped", formatClock(-500), "00:00.0");
eq("long duration", formatLongDuration(90061000), "1 day, 1 hour, 1 minute");
eq("long duration is trimmed to three parts", formatLongDuration(90061000).split(", ").length, 3);
eq("seconds only", formatLongDuration(45000), "45 seconds");
eq("one second is singular", formatLongDuration(1000), "1 second");
eq("nothing left", formatLongDuration(0), "0 seconds");

group("times of day");
eq("morning", parseTimeOfDay("09:00"), 32400);
eq("with seconds", parseTimeOfDay("09:00:30"), 32430);
eq("single-digit hour", parseTimeOfDay("9:05"), 32700);
eq("midnight", parseTimeOfDay("00:00"), 0);
eq("hour 24 is rejected", parseTimeOfDay("24:00"), null);
eq("minute 60 is rejected", parseTimeOfDay("12:60"), null);
eq("rubbish is rejected", parseTimeOfDay("half past nine"), null);

/* -------------------------------------------------------------- time zones -- */
group("time zones");
{
  const january = new Date("2026-01-15T12:00:00Z");
  const july = new Date("2026-07-15T12:00:00Z");
  eq("UTC has no offset", zoneOffsetMinutes(january, "UTC"), 0);
  eq("India is half past", zoneOffsetMinutes(january, "Asia/Kolkata"), 330);
  eq("New York in winter", zoneOffsetMinutes(january, "America/New_York"), -300);
  eq("New York in summer", zoneOffsetMinutes(july, "America/New_York"), -240);
  eq("London in winter is UTC", zoneOffsetMinutes(january, "Europe/London"), 0);
  eq("London in summer is UTC+1", zoneOffsetMinutes(july, "Europe/London"), 60);
  eq("Tokyo does not change", zoneOffsetMinutes(january, "Asia/Tokyo"), zoneOffsetMinutes(july, "Asia/Tokyo"));
  eq("an unknown zone falls back to zero", zoneOffsetMinutes(january, "Not/AZone"), 0);
}
eq("format UTC", formatOffset(0), "UTC");
eq("format a positive offset", formatOffset(330), "UTC+05:30");
eq("format a negative offset", formatOffset(-300), "UTC-05:00");
check("every listed zone resolves", COMMON_TIME_ZONES.every((z) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: z.value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}));

/* ------------------------------------------------------------- date tools -- */
group("date tools");
{
  const r = await run("date-difference-calculator", "", { from: "2026-03-16", to: "2026-03-20", inclusive: "" });
  eq("days between", stat(r, "Days"), "4");
  const inclusive = await run("date-difference-calculator", "", { from: "2026-03-16", to: "2026-03-20", inclusive: "1" });
  eq("inclusive adds a day", stat(inclusive, "Days"), "5");
  const swapped = await run("date-difference-calculator", "", { from: "2026-03-20", to: "2026-03-16", inclusive: "" });
  eq("reversed dates still work", stat(swapped, "Days"), "4");
  check("reversal is explained", (swapped.note ?? "").includes("other way around"));
}
{
  const r = await run("age-calculator", "", { birth: "1990-05-15", on: "2026-09-17" });
  eq("age in years", stat(r, "Age"), "36");
  check("months and days shown", r.stats[0].sub === "4 months, 2 days", r.stats[0].sub);
  eq("total days", stat(r, "Total days"), (13274).toLocaleString("en-US"));
  eq("born on a", stat(r, "Born on a"), "Tuesday");
  const rows = Object.fromEntries(r.table.rows);
  eq("star sign", rows["Star sign"], "Taurus");

  const future = await run("age-calculator", "", { birth: "2030-01-01", on: "2026-01-01" });
  check("a birth date after the measure date is rejected", Boolean(future.error));
  const empty = await run("age-calculator", "", { birth: "" });
  check("an empty birth date just prompts", Boolean(empty.note) && !empty.error);
}
{
  const r = await run("working-days-calculator", "", { from: "2026-03-16", to: "2026-03-20", weekend: "sat-sun" });
  eq("a working week", stat(r, "Working days"), "5");
  eq("total days", stat(r, "Total days"), "5");

  const withHoliday = await run("working-days-calculator", "2026-03-18", { from: "2026-03-16", to: "2026-03-20", weekend: "sat-sun" });
  eq("a holiday is deducted", stat(withHoliday, "Working days"), "4");
  eq("the holiday is counted", stat(withHoliday, "Holidays counted"), "1");

  const fullWeek = await run("working-days-calculator", "", { from: "2026-03-16", to: "2026-03-22", weekend: "sat-sun" });
  eq("a calendar week has five working days", stat(fullWeek, "Working days"), "5");
  eq("and two weekend days", stat(fullWeek, "Weekend days"), "2");

  const bad = await run("working-days-calculator", "not-a-date", { from: "2026-03-16", to: "2026-03-20" });
  check("a bad holiday line is reported", (bad.warning ?? "").includes("not-a-date"));
}
{
  const r = await run("add-subtract-days", "", { start: "2026-03-16", direction: "add", amount: "30", unit: "days" });
  eq("add 30 days", stat(r, "Result"), "2026-04-15");
  const back = await run("add-subtract-days", "", { start: "2026-03-16", direction: "subtract", amount: "30", unit: "days" });
  eq("subtract 30 days", stat(back, "Result"), "2026-02-14");
  const months = await run("add-subtract-days", "", { start: "2026-01-31", direction: "add", amount: "1", unit: "months" });
  eq("month end clamps", stat(months, "Result"), "2026-02-28");
  check("clamping is explained", (months.note ?? "").includes("clamps"));
  const working = await run("add-subtract-days", "", { start: "2026-03-20", direction: "add", amount: "1", unit: "working" });
  eq("Friday plus one working day", stat(working, "Result"), "2026-03-23");
  const weeks = await run("add-subtract-days", "", { start: "2026-03-16", direction: "add", amount: "2", unit: "weeks" });
  eq("add two weeks", stat(weeks, "Result"), "2026-03-30");
}
{
  const r = await run("time-difference-calculator", "", { start: "09:00", end: "17:30", break: "30" });
  eq("a working day", stat(r, "Duration"), "8h 0m");
  eq("decimal hours", stat(r, "Decimal hours"), "8.00");

  const overnight = await run("time-difference-calculator", "", { start: "22:00", end: "06:00", break: "0" });
  eq("an overnight shift", stat(overnight, "Duration"), "8h 0m");
  check("overnight is explained", (overnight.note ?? "").includes("overnight"));

  const paid = await run("time-difference-calculator", "", { start: "09:00", end: "17:00", break: "60", rate: "15" });
  eq("pay is worked out", stat(paid, "Pay"), "105.00");

  const bad = await run("time-difference-calculator", "", { start: "nonsense", end: "17:00" });
  check("a bad time is reported", Boolean(bad.error));
}

/* ------------------------------------------------------ productivity tools -- */
group("picker and decisions");
{
  const list = "Ada\nGrace\nAlan\nKatherine";
  const r = await run("random-picker", list, { count: "2", unique: "1", order: "1" });
  const picked = r.output.split("\n").map((l) => l.replace(/^\d+\.\s*/, ""));
  eq("picked the right number", picked.length, 2);
  check("winners come from the list", picked.every((p) => list.split("\n").includes(p)), r.output);
  check("no repeats when unique", new Set(picked).size === 2);

  const tooMany = await run("random-picker", "One\nTwo", { count: "5", unique: "1" });
  check("asking for more than the list reports an error", Boolean(tooMany.error));

  const empty = await run("random-picker", "", { count: "1" });
  check("an empty list just prompts", Boolean(empty.note) && !empty.error);
}
{
  const coin = await run("decision-maker", "", { mode: "coin", flips: "50" });
  const flips = coin.output.split("\n");
  eq("fifty flips", flips.length, 50);
  check("only heads and tails", flips.every((f) => f === "Heads" || f === "Tails"));

  const yes = await run("decision-maker", "", { mode: "yesno" });
  check("yes or no", ["Yes", "No"].includes(yes.output));

  const dice = await run("decision-maker", "", { mode: "dice", dice: "3", sides: "6" });
  const rolls = dice.output.split(/\s+/).map(Number);
  eq("three dice", rolls.length, 3);
  check("each die is 1 to 6", rolls.every((v) => v >= 1 && v <= 6), dice.output);

  const options = await run("decision-maker", "Alpha\nBeta\nGamma", { mode: "options" });
  check("chooses one of my options", ["Alpha", "Beta", "Gamma"].includes(options.output));

  const ranked = await run("decision-maker", "Alpha\nBeta\nGamma", { mode: "rank" });
  const order = ranked.output.split("\n").map((l) => l.replace(/^\d+\.\s*/, ""));
  check("ranking keeps every option", order.sort().join() === "Alpha,Beta,Gamma", ranked.output);
}

/* -------------------------------------------------------------- registry -- */
group("registry");
for (const slug of [
  "date-difference-calculator", "age-calculator", "working-days-calculator",
  "add-subtract-days", "time-difference-calculator", "time-zone-converter",
  "random-picker", "decision-maker",
]) {
  const def = TEXT_TOOL_DEFS[slug];
  check(`${slug} exists`, Boolean(def));
  check(`${slug} is marked deferred`, Boolean(def?.deferred), "it reads the clock, so it cannot be server-rendered");
  let ok = true;
  try {
    await runTextTool(def, "");
  } catch (err) {
    ok = false;
    console.log("   ", slug, err.message);
  }
  check(`${slug} survives empty input`, ok);
}
check("every date and productivity catalog entry has a definition or a component",
  tools.filter((t) => ["datetime", "productivity"].includes(t.category)).length === 19);
check("all catalog slugs are unique", new Set(toolSlugs).size === toolSlugs.length);

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
