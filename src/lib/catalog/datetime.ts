import type { Tool } from "@/lib/tool-types";

/**
 * Date and time tools. All of them read the device clock and calendar, so the
 * answers are in the visitor's own time zone rather than a server's.
 */
export const datetimeTools: Tool[] = [
  {
    slug: "date-difference-calculator",
    name: "Date Difference Calculator",
    tagline: "How long between two dates, counted six ways.",
    description:
      "Work out the gap between two dates in days, weeks, months and years, with a breakdown of working days and weekends in the range.",
    category: "datetime",
    icon: "calendar-days",
    keywords: [
      "date difference", "days between dates", "how many days between",
      "date calculator", "weeks between dates", "months between dates",
    ],
    seoTitle: "Date Difference Calculator — Days Between Two Dates",
    seoDescription:
      "Find the days, weeks, months and years between two dates, with working days and weekends broken out. Free and calculated in your browser.",
    faq: [
      {
        q: "Does it count the first and last day?",
        a: "By default it counts the gap, so Monday to Friday is four days. Tick the inclusive option and it becomes five, which is how holiday allowance is counted.",
      },
      {
        q: "How are months worked out?",
        a: "As whole calendar months first, then the leftover days. So 31 January to 28 February is one month, not twenty-eight days short of two.",
      },
      {
        q: "Does it handle leap years?",
        a: "Yes. The arithmetic runs on your browser's own calendar, so 29 February and century leap rules are handled properly.",
      },
    ],
    related: ["working-days-calculator", "age-calculator", "add-subtract-days", "time-difference-calculator"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    tagline: "Exact age in years, months and days.",
    description:
      "Work out an exact age from a date of birth, on today's date or any other, plus total days lived, the day of the week you were born and the countdown to the next birthday.",
    category: "datetime",
    icon: "cake",
    keywords: [
      "age calculator", "how old am i", "date of birth calculator",
      "exact age", "age in days", "birthday countdown",
    ],
    seoTitle: "Age Calculator — Exact Age in Years, Months and Days",
    seoDescription:
      "Work out an exact age from a date of birth in years, months and days, with total days lived and the next birthday. Nothing you enter is stored.",
    faq: [
      {
        q: "Is my date of birth stored anywhere?",
        a: "No. It is used to do the arithmetic in your browser and nothing else — it is not saved, not sent to a server, and not logged.",
      },
      {
        q: "What about someone born on 29 February?",
        a: "The tool counts the age correctly and points out the leap-day birthday. Most legal systems treat it as 1 March in common years, though practice varies.",
      },
      {
        q: "Can I work out an age on a past or future date?",
        a: "Yes — put that date in the second box. It is the usual way to check an age as at a policy date or a school cut-off.",
      },
    ],
    related: ["date-difference-calculator", "add-subtract-days", "working-days-calculator", "countdown-timer"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "working-days-calculator",
    name: "Working Days Calculator",
    tagline: "Business days between two dates, holidays included.",
    description:
      "Count the working days in a date range, excluding weekends and any public holidays you add, with a choice of which days count as the weekend.",
    category: "datetime",
    icon: "briefcase",
    keywords: [
      "working days calculator", "business days between dates", "weekdays between",
      "holiday allowance", "delivery days", "sla days",
    ],
    seoTitle: "Working Days Calculator — Business Days Between Dates",
    seoDescription:
      "Count working days between two dates, excluding weekends and your own public holidays, with support for Friday–Saturday weekends.",
    faq: [
      {
        q: "Are both end dates counted?",
        a: "Yes. Monday to Friday is five working days, which is how holiday allowance, notice periods and delivery windows are normally counted.",
      },
      {
        q: "How do I add public holidays?",
        a: "Put one date per line in the box, as YYYY-MM-DD. A holiday that falls on a weekend is ignored, because it was never a working day.",
      },
      {
        q: "Can I use a Friday and Saturday weekend?",
        a: "Yes. The weekend selector covers Saturday–Sunday, Friday–Saturday, Sunday only, or no weekend at all.",
      },
    ],
    related: ["date-difference-calculator", "add-subtract-days", "age-calculator", "salary-calculator"],
    privateByDefault: true,
  },
  {
    slug: "add-subtract-days",
    name: "Add or Subtract Days",
    tagline: "What date is 90 days from now?",
    description:
      "Add or take away days, working days, weeks, months or years from any date, and see the result with its day of the week and week number.",
    category: "datetime",
    icon: "calendar-plus",
    keywords: [
      "add days to date", "subtract days from date", "date plus days",
      "90 days from today", "date calculator add", "deadline calculator",
    ],
    seoTitle: "Add or Subtract Days — Date Calculator",
    seoDescription:
      "Add or subtract days, working days, weeks, months or years from any date. Shows the day of the week and week number. Free and browser-based.",
    faq: [
      {
        q: "What happens when I add a month to 31 January?",
        a: "You get the last day of February — the 28th, or the 29th in a leap year. Clamping to the month end is the convention almost every system uses.",
      },
      {
        q: "What counts as a working day?",
        a: "Monday to Friday. For public holidays as well, use the Working Days Calculator, which lets you list them.",
      },
      {
        q: "Can I count backwards?",
        a: "Yes — switch to Subtract. It is the quick way to find a deadline's start date or a notice period's beginning.",
      },
    ],
    related: ["date-difference-calculator", "working-days-calculator", "countdown-timer", "age-calculator"],
    privateByDefault: true,
  },
  {
    slug: "time-difference-calculator",
    name: "Time Difference Calculator",
    tagline: "Hours worked between two times, breaks deducted.",
    description:
      "Work out the hours and minutes between two times, deduct an unpaid break, handle overnight shifts, and get the decimal hours a timesheet needs.",
    category: "datetime",
    icon: "clock-4",
    keywords: [
      "time difference", "hours between times", "timesheet calculator",
      "hours worked calculator", "shift calculator", "decimal hours",
    ],
    seoTitle: "Time Difference Calculator — Hours Worked and Decimal Hours",
    seoDescription:
      "Work out hours between two times with break deduction and overnight shifts, plus the decimal hours payroll expects. Free and browser-based.",
    faq: [
      {
        q: "What are decimal hours?",
        a: "Minutes expressed as a fraction of an hour: 7h 30m is 7.50. Nearly every payroll and timesheet system wants the decimal, not the minutes.",
      },
      {
        q: "Does it handle a night shift?",
        a: "Yes. If the end time is earlier than the start, it is treated as the following day — so 22:00 to 06:00 comes out as eight hours.",
      },
      {
        q: "Can it work out the pay?",
        a: "Put an hourly rate in and it multiplies the worked hours by it. It does not apply tax or overtime rules — the Salary and Overtime calculators cover those.",
      },
    ],
    related: ["salary-calculator", "overtime-calculator", "hourly-rate-calculator", "date-difference-calculator"],
    privateByDefault: true,
  },
  {
    slug: "time-zone-converter",
    name: "Time Zone Converter",
    tagline: "One time, every city, daylight saving included.",
    description:
      "Convert a date and time between any two of twenty-nine cities and see it in all of them at once, with daylight saving applied for the date you choose.",
    category: "datetime",
    icon: "globe",
    keywords: [
      "time zone converter", "timezone converter", "what time is it in",
      "meeting time zones", "utc converter", "est to gmt",
    ],
    seoTitle: "Time Zone Converter — Any Time, Any City",
    seoDescription:
      "Convert a time between cities with daylight saving applied for that date, and see every zone at once. Uses your browser's own time zone data.",
    faq: [
      {
        q: "Why does the difference between two cities change?",
        a: "Daylight saving. London and New York are five hours apart most of the year but four for a couple of weeks each spring, because the clocks change on different dates.",
      },
      {
        q: "Are all offsets whole hours?",
        a: "No. India is UTC+05:30, Nepal UTC+05:45 and parts of Australia UTC+08:45. Assuming whole hours is a reliable way to miss a meeting.",
      },
      {
        q: "Where does the time zone data come from?",
        a: "Your browser's own database, which is kept current by its updates. Nothing is looked up over the network.",
      },
    ],
    related: ["world-clock", "timestamp-converter", "time-difference-calculator", "cron-expression-helper"],
    privateByDefault: true,
  },
  {
    slug: "countdown-timer",
    name: "Countdown Timer",
    tagline: "Count down to any moment, live.",
    description:
      "Count down to a launch, a deadline or a birthday with a live timer that keeps accurate time even in a background tab, and remembers your target.",
    category: "datetime",
    icon: "alarm-clock",
    keywords: [
      "countdown timer", "countdown to date", "days until",
      "event countdown", "deadline timer", "launch countdown",
    ],
    seoTitle: "Countdown Timer — Live Countdown to Any Date",
    seoDescription:
      "Count down to any date and time with a live timer that stays accurate in a background tab and remembers your target on this device.",
    faq: [
      {
        q: "Will it drift if I leave the tab in the background?",
        a: "No. Browsers throttle background timers, so the countdown measures against the system clock each tick rather than counting intervals. It cannot fall behind.",
      },
      {
        q: "Is my target saved?",
        a: "Yes, in this browser on this device. It is not uploaded and does not sync anywhere else.",
      },
      {
        q: "Does it make a sound when it reaches zero?",
        a: "It plays a short tone, synthesised in the browser. Some browsers block audio until you have interacted with the page, in which case the on-screen message is the signal.",
      },
    ],
    related: ["stopwatch", "pomodoro-timer", "add-subtract-days", "date-difference-calculator"],
    privateByDefault: true,
  },
  {
    slug: "stopwatch",
    name: "Stopwatch",
    tagline: "Start, stop and lap, accurate to a tenth.",
    description:
      "A stopwatch with lap times, split times and the fastest and slowest laps marked — accurate even when the tab is in the background.",
    category: "datetime",
    icon: "timer-reset",
    keywords: [
      "stopwatch", "online stopwatch", "lap timer", "timer with laps",
      "split times", "free stopwatch",
    ],
    seoTitle: "Online Stopwatch — With Laps and Split Times",
    seoDescription:
      "A free online stopwatch with laps, split times and fastest and slowest laps marked. Stays accurate in a background tab. No signup.",
    faq: [
      {
        q: "What is the difference between a lap and a split?",
        a: "The split is the time for that lap alone; the total is the elapsed time when the lap was taken. Both columns are shown.",
      },
      {
        q: "Is it accurate?",
        a: "It measures against the system clock rather than counting intervals, so it stays right to within a few milliseconds even if the tab is throttled.",
      },
      {
        q: "Are my laps saved if I close the tab?",
        a: "No — the stopwatch is deliberately not persisted, so it always starts clean. Copy the laps before you leave if you need them.",
      },
    ],
    related: ["countdown-timer", "pomodoro-timer", "time-difference-calculator", "world-clock"],
    privateByDefault: true,
  },
  {
    slug: "pomodoro-timer",
    name: "Pomodoro Timer",
    tagline: "Focus sessions and breaks, on your own intervals.",
    description:
      "Work in timed focus sessions with short and long breaks, on intervals you set, with the session count kept between visits.",
    category: "datetime",
    icon: "timer-reset",
    keywords: [
      "pomodoro timer", "focus timer", "25 minute timer", "work break timer",
      "productivity timer", "study timer",
    ],
    seoTitle: "Pomodoro Timer — Focus Sessions and Breaks",
    seoDescription:
      "A Pomodoro timer with adjustable focus and break lengths, automatic long breaks and a session count saved on this device. Free, no signup.",
    faq: [
      {
        q: "What is the Pomodoro technique?",
        a: "Twenty-five minutes of focused work, then a five-minute break, with a longer break after four rounds. The intervals are a starting point, not a rule.",
      },
      {
        q: "Can I change the lengths?",
        a: "Yes, all of them — focus, short break, long break and how many focus sessions come before a long one. Your settings are saved on this device.",
      },
      {
        q: "Does it keep going if I switch tabs?",
        a: "Yes. It measures against the system clock, so a throttled background tab cannot make it run slow.",
      },
    ],
    related: ["stopwatch", "countdown-timer", "todo-list", "habit-tracker"],
    privateByDefault: true,
  },
  {
    slug: "world-clock",
    name: "World Clock",
    tagline: "Live times for the cities you care about.",
    description:
      "Watch the current time in as many cities as you like, side by side, with the offset from your own zone and your list saved for next time.",
    category: "datetime",
    icon: "globe",
    keywords: [
      "world clock", "time in other countries", "current time worldwide",
      "multiple time zones", "team time zones", "global clock",
    ],
    seoTitle: "World Clock — Live Times in Cities Around the World",
    seoDescription:
      "See the live time in as many cities as you like, with the offset from your own zone. Your list of cities is saved on this device.",
    faq: [
      {
        q: "Is the time accurate?",
        a: "It is your device's clock rendered in each zone. If your computer's clock is right, every city shown is right.",
      },
      {
        q: "Does it handle daylight saving?",
        a: "Yes, automatically. The offsets shown come from your browser's time zone database, which its updates keep current.",
      },
      {
        q: "Are my cities remembered?",
        a: "Yes, in this browser on this device. Nothing is uploaded and the list does not sync between devices.",
      },
    ],
    related: ["time-zone-converter", "timestamp-converter", "countdown-timer", "time-difference-calculator"],
    privateByDefault: true,
  },
];
