import type { Tool } from "@/lib/tool-types";

/**
 * Productivity tools. These remember what you type, in this browser's own
 * storage — the copy says so plainly, because storage that quietly disappears
 * with a cache clear is worse than none at all.
 */
export const productivityTools: Tool[] = [
  {
    slug: "todo-list",
    name: "To-Do List",
    tagline: "Tasks with priorities and due dates, saved here.",
    description:
      "Keep a task list with priorities, due dates and a completion bar, saved in your browser so it is still there next time. No account, no sync, no signup.",
    category: "productivity",
    icon: "list-todo",
    keywords: [
      "to do list", "todo list online", "task list", "simple to do app",
      "task manager", "checklist app", "daily tasks",
    ],
    seoTitle: "To-Do List — Simple Task List, Saved in Your Browser",
    seoDescription:
      "A to-do list with priorities, due dates and progress, saved in your browser. No account and no signup — open the page and start typing.",
    faq: [
      {
        q: "Where is my list stored?",
        a: "In this browser's local storage, on this device. It is not uploaded, does not sync to your phone, and clearing your browsing data will delete it.",
      },
      {
        q: "How do I keep a backup?",
        a: "Use Download to save the list as a text file, or Copy to paste it somewhere. That is the only copy that outlives this browser.",
      },
      {
        q: "Do I need an account?",
        a: "No. There are no accounts on this site at all, which is why nothing you type here leaves your device.",
      },
    ],
    related: ["checklist-maker", "daily-planner", "kanban-board", "habit-tracker"],
    privateByDefault: true,
    popular: true,
  },
  {
    slug: "checklist-maker",
    name: "Checklist Maker",
    tagline: "Build a checklist you can print and reuse.",
    description:
      "Make a titled checklist for a process, a handover or a trip, tick items off as you go, and print or download it when you need it on paper.",
    category: "productivity",
    icon: "list-checks",
    keywords: [
      "checklist maker", "create checklist", "printable checklist",
      "checklist template", "process checklist", "packing list",
    ],
    seoTitle: "Checklist Maker — Build, Tick Off and Print",
    seoDescription:
      "Create a titled checklist, tick items off, and print or download it. Saved in your browser between visits, with no account needed.",
    faq: [
      {
        q: "Can I print it?",
        a: "Yes — the Print button opens your browser's print dialogue, and the page is laid out so the checklist comes out cleanly on paper.",
      },
      {
        q: "How is this different from the to-do list?",
        a: "A checklist is a fixed list you run through repeatedly, so it has a title and prints well. The to-do list is for changing work, so it has priorities and due dates.",
      },
    ],
    related: ["todo-list", "daily-planner", "notes", "kanban-board"],
    privateByDefault: true,
  },
  {
    slug: "notes",
    name: "Online Notepad",
    tagline: "A scratchpad that survives a reload.",
    description:
      "Keep as many notes as you like in your browser, saved automatically as you type — the place for the text you would otherwise leave in an untitled tab.",
    category: "productivity",
    icon: "notebook-pen",
    keywords: [
      "online notepad", "notes online", "scratchpad", "text editor online",
      "quick notes", "notepad no signup", "write notes",
    ],
    seoTitle: "Online Notepad — Notes Saved in Your Browser",
    seoDescription:
      "A simple notepad that saves as you type, keeps multiple notes, and needs no account. Everything stays in your browser on this device.",
    faq: [
      {
        q: "Do I have to press save?",
        a: "No. Every keystroke is written to your browser's storage, so closing the tab by accident costs you nothing.",
      },
      {
        q: "Can I get to my notes from another device?",
        a: "No. Storage is per-browser and per-device by design, because there is no account behind it. Download the notes to move them.",
      },
      {
        q: "Is anything sent to a server?",
        a: "Nothing. The page does no network requests once loaded, which is what makes it safe for a draft you would not paste into a website.",
      },
    ],
    related: ["todo-list", "checklist-maker", "word-counter", "daily-planner"],
    privateByDefault: true,
  },
  {
    slug: "daily-planner",
    name: "Daily Planner",
    tagline: "Plan a day hour by hour, and print it.",
    description:
      "Lay out a single day from 6am to 10pm, move between days with one click, and print the page when you want the plan on paper.",
    category: "productivity",
    icon: "calendar-check",
    keywords: [
      "daily planner", "day planner online", "hourly schedule",
      "daily schedule template", "time blocking", "printable day plan",
    ],
    seoTitle: "Daily Planner — Hour-by-Hour Day Plan, Printable",
    seoDescription:
      "Plan a day hour by hour, move between days, and print the result. Saved in your browser between visits, with no account needed.",
    faq: [
      {
        q: "Are past days kept?",
        a: "Yes. Entries are stored against their date, so moving back to last Tuesday brings up exactly what you wrote then.",
      },
      {
        q: "What hours does it cover?",
        a: "6am to 10pm, which covers a normal working day with room either side. Longer notes go in one slot rather than spilling into the next.",
      },
    ],
    related: ["weekly-planner", "todo-list", "pomodoro-timer", "checklist-maker"],
    privateByDefault: true,
  },
  {
    slug: "weekly-planner",
    name: "Weekly Planner",
    tagline: "A seven-day view you can fill in and print.",
    description:
      "See a whole week at once, write freely under each day, move between weeks, and print the plan — with today's column marked.",
    category: "productivity",
    icon: "calendar-range",
    keywords: [
      "weekly planner", "week planner online", "weekly schedule",
      "week view planner", "printable weekly plan", "week at a glance",
    ],
    seoTitle: "Weekly Planner — Plan Your Week, Print It Out",
    seoDescription:
      "Plan a whole week in one view with free text under each day, move between weeks, and print it. Saved in your browser, no account needed.",
    faq: [
      {
        q: "Which day does the week start on?",
        a: "Monday, following the ISO convention, and the week number is shown alongside the dates.",
      },
      {
        q: "Can I see a different week?",
        a: "Yes — step back and forward a week at a time, or jump straight to a date. Everything you have written for that week comes back with it.",
      },
    ],
    related: ["daily-planner", "todo-list", "kanban-board", "date-difference-calculator"],
    privateByDefault: true,
  },
  {
    slug: "kanban-board",
    name: "Kanban Board",
    tagline: "Three columns, moved with a button not a drag.",
    description:
      "A simple board with To do, In progress and Done — add columns if you need them, move cards with arrow buttons, and keep it all in your browser.",
    category: "productivity",
    icon: "columns3",
    keywords: [
      "kanban board", "kanban online", "task board", "trello alternative",
      "simple project board", "workflow board", "free kanban",
    ],
    seoTitle: "Kanban Board — Simple Task Board, No Signup",
    seoDescription:
      "A simple Kanban board with editable columns and cards moved by button, saved in your browser. No account, no team, no signup.",
    faq: [
      {
        q: "Why buttons instead of drag and drop?",
        a: "A button works with a keyboard, on a phone and with a screen reader. On a board this size, dragging would only be slower and less reliable.",
      },
      {
        q: "Can I share the board with my team?",
        a: "No — everything is stored in your own browser, with no server behind it. Download the board as text if you need to send it to someone.",
      },
      {
        q: "Can I rename or add columns?",
        a: "Yes. Type over any column name, and add or remove columns from the panel underneath.",
      },
    ],
    related: ["todo-list", "weekly-planner", "checklist-maker", "habit-tracker"],
    privateByDefault: true,
  },
  {
    slug: "habit-tracker",
    name: "Habit Tracker",
    tagline: "A two-week grid with streaks that count.",
    description:
      "Track any number of habits on a fortnightly grid, tick off each day, and watch the current streak for each one — all kept in your browser.",
    category: "productivity",
    icon: "target",
    keywords: [
      "habit tracker", "daily habit tracker", "streak tracker",
      "habit grid", "routine tracker", "build habits",
    ],
    seoTitle: "Habit Tracker — Daily Grid With Streaks",
    seoDescription:
      "Track habits on a two-week grid with current streaks for each one, saved in your browser. No account and no signup required.",
    faq: [
      {
        q: "How is the streak counted?",
        a: "Consecutive days back from today. If today is not ticked yet the streak still counts from yesterday, so an evening habit does not look broken all morning.",
      },
      {
        q: "Can I look at earlier weeks?",
        a: "Yes, step back a week at a time. Every day you have ever ticked is kept, so old streaks stay visible.",
      },
      {
        q: "Is my data private?",
        a: "Entirely. It lives in this browser on this device, is never uploaded, and disappears if you clear your browsing data — so download a copy if it matters.",
      },
    ],
    related: ["todo-list", "pomodoro-timer", "daily-planner", "kanban-board"],
    privateByDefault: true,
  },
  {
    slug: "random-picker",
    name: "Random Picker",
    tagline: "Draw a winner from a list, fairly.",
    description:
      "Paste a list of names or options and draw one or several at random, with or without repeats, using your browser's cryptographic randomness.",
    category: "productivity",
    icon: "shuffle",
    keywords: [
      "random picker", "random name picker", "prize draw", "raffle picker",
      "pick a winner", "random selection", "wheel of names",
    ],
    seoTitle: "Random Picker — Draw a Winner From Any List",
    seoDescription:
      "Paste a list and draw one or more entries at random, with or without repeats. Cryptographically random and drawn entirely in your browser.",
    faq: [
      {
        q: "Is the draw genuinely fair?",
        a: "Yes. It uses your browser's cryptographic random number generator and rejects the tail of the range, so no entry is favoured by rounding.",
      },
      {
        q: "What does “do not pick the same entry twice” do?",
        a: "It draws without replacement, which is what a prize draw needs — one entry cannot win two prizes.",
      },
      {
        q: "Is my list stored?",
        a: "No. It stays on the page while you are using it and is not uploaded or saved anywhere.",
      },
    ],
    related: ["decision-maker", "random-number-generator", "lottery-number-generator", "sort-lines"],
    privateByDefault: true,
  },
  {
    slug: "decision-maker",
    name: "Decision Maker",
    tagline: "Coin, dice, yes or no, or your own options.",
    description:
      "Settle it with a coin flip, a yes or no, a roll of the dice, or a random choice from your own list — and see the odds behind each one.",
    category: "productivity",
    icon: "scale",
    keywords: [
      "decision maker", "coin flip", "yes or no", "dice roller",
      "help me decide", "random choice", "flip a coin online",
    ],
    seoTitle: "Decision Maker — Coin Flip, Dice or Your Own Options",
    seoDescription:
      "Flip a coin, roll dice, get a yes or no, or pick randomly from your own list. Cryptographically random and decided in your browser.",
    faq: [
      {
        q: "Is the coin really fair?",
        a: "Yes — 50/50 every time, from your browser's cryptographic random number generator. Each flip knows nothing about the ones before it.",
      },
      {
        q: "Does a coin flip actually help me decide?",
        a: "Often, though not the way you expect. If you find yourself disappointed by the result, you have learned what you actually wanted.",
      },
      {
        q: "Can I roll unusual dice?",
        a: "Yes — up to twenty dice with anything from 2 to 100 sides each, which covers d4, d8, d20 and the rest.",
      },
    ],
    related: ["random-picker", "random-number-generator", "lottery-number-generator", "pin-generator"],
    privateByDefault: true,
  },
];
