import type { CalculatorDef } from "../types";
import { formatNumber, formatPercent, round2 } from "@/lib/utils";

/** Greatest common divisor, used by the ratio and fraction tools. */
function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

const num = (value: number, digits = 2) => formatNumber(value, digits);

export const percentageCalculator: CalculatorDef = {
  inputDescription: "Three ways to work with percentages.",
  modes: {
    key: "mode",
    label: "Percentage mode",
    options: [
      { value: "of", label: "% of a number" },
      { value: "isWhatPercent", label: "X is what % of Y" },
      { value: "fromPercent", label: "X is Y% of what" },
    ],
  },
  fields: [
    { key: "percent", label: "Percentage", type: "percent", initial: "15", when: (v) => v.mode === "of" },
    { key: "base", label: "Of this number", type: "number", initial: "200", when: (v) => v.mode === "of" },
    { key: "part", label: "This number", type: "number", initial: "30", when: (v) => v.mode !== "of" },
    { key: "whole", label: "Out of", type: "number", initial: "200", when: (v) => v.mode === "isWhatPercent" },
    { key: "pct2", label: "Is this percentage", type: "percent", initial: "15", when: (v) => v.mode === "fromPercent" },
  ],
  compute: (values, h) => {
    const mode = h.str("mode") || "of";

    if (mode === "of") {
      const percent = h.num("percent");
      const base = h.num("base");
      const result = round2((percent / 100) * base);
      return {
        outputs: [
          { label: "Result", value: num(result), tone: "accent", sub: `${num(percent)}% of ${num(base)}` },
          { label: "Remainder", value: num(round2(base - result)), sub: "The other part of the number" },
        ],
      };
    }

    if (mode === "isWhatPercent") {
      const part = h.num("part");
      const whole = h.num("whole");
      if (whole === 0) {
        return { outputs: [{ label: "Result", value: "—" }], warning: "Divide by zero: enter a non-zero second number." };
      }
      const pct = (part / whole) * 100;
      return {
        outputs: [
          { label: "Percentage", value: formatPercent(pct), tone: "accent", sub: `${num(part)} out of ${num(whole)}` },
          { label: "As a fraction", value: `${num(part)} / ${num(whole)}` },
        ],
      };
    }

    const part = h.num("part");
    const pct = h.num("pct2");
    if (pct === 0) {
      return { outputs: [{ label: "Result", value: "—" }], warning: "Enter a percentage above zero." };
    }
    const whole = round2((part / pct) * 100);
    return {
      outputs: [
        { label: "The whole", value: num(whole), tone: "accent", sub: `${num(part)} is ${num(pct)}% of this` },
      ],
    };
  },
  formulas: [
    { label: "% of a number", formula: "Result = percentage ÷ 100 × number" },
    { label: "X is what % of Y", formula: "Percentage = X ÷ Y × 100" },
    { label: "X is Y% of what", formula: "Whole = X ÷ Y × 100" },
  ],
};

export const percentageChangeCalculator: CalculatorDef = {
  inputDescription: "The increase or decrease between two values.",
  fields: [
    { key: "from", label: "Original value", type: "number", initial: "120" },
    { key: "to", label: "New value", type: "number", initial: "150" },
  ],
  compute: (values, h) => {
    const from = h.num("from");
    const to = h.num("to");

    if (from === 0) {
      return {
        outputs: [{ label: "Change", value: "—" }],
        warning: "Percentage change from zero is undefined — any increase is infinite.",
      };
    }

    const diff = round2(to - from);
    const pct = (diff / Math.abs(from)) * 100;
    const rose = diff > 0;

    return {
      outputs: [
        {
          label: rose ? "Increase" : diff < 0 ? "Decrease" : "No change",
          value: formatPercent(Math.abs(pct)),
          tone: rose ? "success" : diff < 0 ? "error" : "neutral",
          sub: `${num(from)} → ${num(to)}`,
        },
        { label: "Absolute change", value: num(diff), tone: rose ? "success" : diff < 0 ? "error" : "neutral" },
        { label: "Multiplier", value: `${num(to / from, 4)}×`, sub: "New ÷ original" },
      ],
    };
  },
  formulas: [
    { label: "Percentage change", formula: "(New − Original) ÷ |Original| × 100" },
    {
      label: "Why the absolute value",
      formula: "|Original|",
      note: "Keeps the sign of the change meaningful when the original value is negative.",
    },
  ],
};

export const discountCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Work out a sale price, or the discount implied by one.",
  modes: {
    key: "mode",
    label: "Discount mode",
    options: [
      { value: "apply", label: "Apply a discount" },
      { value: "find", label: "Find the discount %" },
    ],
  },
  fields: [
    { key: "price", label: "Original price", type: "currency", initial: "250" },
    { key: "percent", label: "Discount", type: "percent", initial: "20", when: (v) => v.mode !== "find" },
    { key: "sale", label: "Sale price", type: "currency", initial: "200", when: (v) => v.mode === "find" },
  ],
  compute: (values, h) => {
    const price = h.num("price");
    const mode = h.str("mode") || "apply";

    if (mode === "find") {
      const sale = h.num("sale");
      if (price === 0) {
        return { outputs: [{ label: "Discount", value: "—" }], warning: "Enter an original price above zero." };
      }
      const saved = round2(price - sale);
      const pct = (saved / price) * 100;
      return {
        outputs: [
          { label: "Discount", value: formatPercent(pct), tone: "accent" },
          { label: "You save", value: h.money(saved), tone: "success" },
          { label: "Sale price", value: h.money(sale) },
        ],
        warning: sale > price ? "The sale price is higher than the original — that is a markup, not a discount." : undefined,
        segments: [
          { label: "You pay", value: Math.max(0, sale), color: "#345aa5" },
          { label: "You save", value: Math.max(0, saved), color: "#18818a" },
        ],
      };
    }

    const percent = Math.min(100, Math.max(0, h.num("percent")));
    const saved = round2(price * (percent / 100));
    const sale = round2(price - saved);

    return {
      outputs: [
        { label: "Sale price", value: h.money(sale), tone: "accent" },
        { label: "You save", value: h.money(saved), tone: "success", sub: `${num(percent)}% off` },
        { label: "Original price", value: h.money(price) },
      ],
      segments: [
        { label: "You pay", value: sale, color: "#345aa5" },
        { label: "You save", value: saved, color: "#18818a" },
      ],
    };
  },
  formulas: [
    { label: "Sale price", formula: "Original × (1 − discount ÷ 100)" },
    { label: "Discount percentage", formula: "(Original − Sale) ÷ Original × 100" },
  ],
};

export const markupCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Markup is profit as a share of cost — not of the selling price.",
  fields: [
    { key: "cost", label: "Cost price", type: "currency", initial: "60" },
    { key: "markup", label: "Markup", type: "percent", initial: "50" },
  ],
  compute: (values, h) => {
    const cost = h.num("cost");
    const markup = h.num("markup");
    const profit = round2(cost * (markup / 100));
    const price = round2(cost + profit);
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return {
      outputs: [
        { label: "Selling price", value: h.money(price), tone: "accent" },
        { label: "Profit per unit", value: h.money(profit), tone: "success" },
        { label: "Equivalent margin", value: formatPercent(margin), sub: "Profit ÷ selling price" },
      ],
      segments: [
        { label: "Cost", value: cost, color: "#94a3b8" },
        { label: "Profit", value: Math.max(0, profit), color: "#18818a" },
      ],
      note: "Markup and margin are different numbers for the same profit. A 50% markup is a 33.3% margin.",
    };
  },
  formulas: [
    { label: "Selling price", formula: "Cost × (1 + markup ÷ 100)" },
    { label: "Markup to margin", formula: "Margin = markup ÷ (100 + markup) × 100" },
  ],
};

export const tipCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Tip on a bill, optionally split between people.",
  fields: [
    { key: "bill", label: "Bill amount", type: "currency", initial: "84.50" },
    { key: "tip", label: "Tip", type: "percent", initial: "15" },
    { key: "people", label: "Split between", type: "number", initial: "2", min: 1, step: "1", suffix: "people" },
    {
      key: "round",
      label: "Rounding",
      type: "select",
      initial: "none",
      options: [
        { value: "none", label: "No rounding" },
        { value: "up", label: "Round total up" },
        { value: "person", label: "Round each share up" },
      ],
    },
  ],
  compute: (values, h) => {
    const bill = h.num("bill");
    const tipPct = h.num("tip");
    const people = Math.max(1, Math.floor(h.num("people", 1)));
    const rounding = h.str("round") || "none";

    let tip = round2(bill * (tipPct / 100));
    let total = round2(bill + tip);

    if (rounding === "up") {
      total = Math.ceil(total);
      tip = round2(total - bill);
    }

    let perPerson = round2(total / people);
    if (rounding === "person") {
      perPerson = Math.ceil(perPerson);
      total = round2(perPerson * people);
      tip = round2(total - bill);
    }

    return {
      outputs: [
        { label: "Tip", value: h.money(tip), tone: "accent" },
        { label: "Total", value: h.money(total), tone: "success" },
        { label: "Each person pays", value: h.money(perPerson), sub: `${people} ${people === 1 ? "person" : "people"}` },
      ],
      segments: [
        { label: "Bill", value: bill, color: "#345aa5" },
        { label: "Tip", value: Math.max(0, tip), color: "#18818a" },
      ],
    };
  },
  formulas: [
    { label: "Tip", formula: "Bill × tip% ÷ 100" },
    { label: "Each share", formula: "(Bill + tip) ÷ number of people" },
  ],
};

export const splitBillCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Split a bill evenly, including tax and tip.",
  fields: [
    { key: "bill", label: "Bill before tax", type: "currency", initial: "120" },
    { key: "tax", label: "Tax", type: "percent", initial: "8" },
    { key: "tip", label: "Tip", type: "percent", initial: "15" },
    { key: "people", label: "Number of people", type: "number", initial: "4", min: 1, step: "1" },
  ],
  compute: (values, h) => {
    const bill = h.num("bill");
    const taxPct = h.num("tax");
    const tipPct = h.num("tip");
    const people = Math.max(1, Math.floor(h.num("people", 1)));

    const tax = round2(bill * (taxPct / 100));
    // Tip is conventionally calculated on the pre-tax amount.
    const tip = round2(bill * (tipPct / 100));
    const total = round2(bill + tax + tip);
    const each = round2(total / people);
    // Distribute the rounding remainder so the shares sum to the total exactly.
    const remainder = round2(total - each * people);

    return {
      outputs: [
        { label: "Each person pays", value: h.money(each), tone: "accent" },
        { label: "Total", value: h.money(total), tone: "success" },
        { label: "Tax", value: h.money(tax) },
        { label: "Tip", value: h.money(tip) },
      ],
      segments: [
        { label: "Bill", value: bill, color: "#345aa5" },
        { label: "Tax", value: Math.max(0, tax), color: "#94a3b8" },
        { label: "Tip", value: Math.max(0, tip), color: "#18818a" },
      ],
      note:
        Math.abs(remainder) >= 0.01
          ? `Rounding leaves ${h.money(Math.abs(remainder))} — one person should pay ${h.money(round2(each + remainder))}.`
          : undefined,
    };
  },
  formulas: [
    { label: "Total", formula: "Bill + tax + tip" },
    { label: "Each share", formula: "Total ÷ number of people", note: "Tip is calculated on the pre-tax bill, the usual convention." },
  ],
};

export const averageCalculator: CalculatorDef = {
  inputDescription: "Mean, median, mode and range from a list of numbers.",
  fields: [
    {
      key: "numbers",
      label: "Numbers",
      type: "text",
      initial: "12, 18, 7, 25, 18, 30",
      wide: true,
      hint: "Separate with commas, spaces or new lines.",
    },
  ],
  compute: (values, h) => {
    const parsed = h
      .str("numbers")
      .split(/[\s,;]+/)
      .map((t) => Number.parseFloat(t))
      .filter((n) => Number.isFinite(n));

    if (parsed.length === 0) {
      return { outputs: [{ label: "Mean", value: "—" }], warning: "Enter at least one number." };
    }

    const sorted = [...parsed].sort((a, b) => a - b);
    const sum = parsed.reduce((a, b) => a + b, 0);
    const mean = sum / parsed.length;

    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    const counts = new Map<number, number>();
    for (const n of parsed) counts.set(n, (counts.get(n) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const modes = top > 1 ? [...counts.entries()].filter(([, c]) => c === top).map(([n]) => n) : [];

    // Population standard deviation.
    const variance = parsed.reduce((acc, n) => acc + (n - mean) ** 2, 0) / parsed.length;

    return {
      outputs: [
        { label: "Mean", value: num(mean, 4), tone: "accent", sub: `${parsed.length} values` },
        { label: "Median", value: num(median, 4) },
        { label: "Mode", value: modes.length ? modes.map((m) => num(m, 4)).join(", ") : "None" },
        { label: "Sum", value: num(sum, 4) },
        { label: "Range", value: num(sorted[sorted.length - 1] - sorted[0], 4), sub: `${num(sorted[0], 4)} to ${num(sorted[sorted.length - 1], 4)}` },
        { label: "Std deviation", value: num(Math.sqrt(variance), 4), sub: "Population" },
      ],
    };
  },
  formulas: [
    { label: "Mean", formula: "Sum of values ÷ count" },
    { label: "Median", formula: "Middle value once sorted", note: "With an even count it is the mean of the two middle values." },
    { label: "Mode", formula: "The most frequent value", note: "Reported as None when every value appears once." },
  ],
};

export const ratioCalculator: CalculatorDef = {
  inputDescription: "Simplify a ratio, or scale it to a new value.",
  modes: {
    key: "mode",
    label: "Ratio mode",
    options: [
      { value: "simplify", label: "Simplify" },
      { value: "scale", label: "Scale" },
      { value: "divide", label: "Divide an amount" },
    ],
  },
  fields: [
    { key: "a", label: "First part", type: "number", initial: "16" },
    { key: "b", label: "Second part", type: "number", initial: "24" },
    { key: "newA", label: "If the first part becomes", type: "number", initial: "8", when: (v) => v.mode === "scale" },
    { key: "amount", label: "Amount to divide", type: "number", initial: "1000", when: (v) => v.mode === "divide" },
  ],
  compute: (values, h) => {
    const a = h.num("a");
    const b = h.num("b");
    const mode = h.str("mode") || "simplify";

    if (a === 0 || b === 0) {
      return { outputs: [{ label: "Ratio", value: "—" }], warning: "Both parts of the ratio must be non-zero." };
    }

    const divisor = gcd(a, b);
    const simplified = `${num(a / divisor, 2)} : ${num(b / divisor, 2)}`;

    if (mode === "scale") {
      const newA = h.num("newA");
      const factor = newA / a;
      return {
        outputs: [
          { label: "Scaled ratio", value: `${num(newA)} : ${num(round2(b * factor))}`, tone: "accent" },
          { label: "Scale factor", value: `${num(factor, 4)}×` },
          { label: "Simplified", value: simplified },
        ],
      };
    }

    if (mode === "divide") {
      const amount = h.num("amount");
      const total = a + b;
      const firstShare = round2((a / total) * amount);
      const secondShare = round2(amount - firstShare);
      return {
        outputs: [
          { label: "First share", value: num(firstShare), tone: "accent", sub: formatPercent((a / total) * 100, 1) },
          { label: "Second share", value: num(secondShare), sub: formatPercent((b / total) * 100, 1) },
          { label: "Ratio", value: simplified },
        ],
        segments: [
          { label: "First", value: Math.max(0, firstShare), color: "#345aa5" },
          { label: "Second", value: Math.max(0, secondShare), color: "#18818a" },
        ],
      };
    }

    return {
      outputs: [
        { label: "Simplified", value: simplified, tone: "accent" },
        { label: "As a decimal", value: num(a / b, 4), sub: "First ÷ second" },
        { label: "First as a %", value: formatPercent((a / (a + b)) * 100, 2) },
      ],
    };
  },
  formulas: [
    { label: "Simplifying", formula: "Divide both parts by their greatest common divisor" },
    { label: "Dividing an amount", formula: "Share = part ÷ (part + part) × amount" },
  ],
};

export const fractionCalculator: CalculatorDef = {
  inputDescription: "Add, subtract, multiply or divide two fractions.",
  modes: {
    key: "op",
    label: "Operation",
    options: [
      { value: "add", label: "+" },
      { value: "sub", label: "−" },
      { value: "mul", label: "×" },
      { value: "div", label: "÷" },
    ],
  },
  fields: [
    { key: "n1", label: "First numerator", type: "number", initial: "1", step: "1" },
    { key: "d1", label: "First denominator", type: "number", initial: "2", step: "1" },
    { key: "n2", label: "Second numerator", type: "number", initial: "1", step: "1" },
    { key: "d2", label: "Second denominator", type: "number", initial: "3", step: "1" },
  ],
  compute: (values, h) => {
    const n1 = Math.round(h.num("n1"));
    const d1 = Math.round(h.num("d1"));
    const n2 = Math.round(h.num("n2"));
    const d2 = Math.round(h.num("d2"));
    const op = h.str("op") || "add";

    if (d1 === 0 || d2 === 0) {
      return { outputs: [{ label: "Result", value: "—" }], warning: "A denominator cannot be zero." };
    }
    if (op === "div" && n2 === 0) {
      return { outputs: [{ label: "Result", value: "—" }], warning: "Cannot divide by a fraction equal to zero." };
    }

    let numerator: number;
    let denominator: number;
    switch (op) {
      case "sub":
        numerator = n1 * d2 - n2 * d1;
        denominator = d1 * d2;
        break;
      case "mul":
        numerator = n1 * n2;
        denominator = d1 * d2;
        break;
      case "div":
        numerator = n1 * d2;
        denominator = d1 * n2;
        break;
      default:
        numerator = n1 * d2 + n2 * d1;
        denominator = d1 * d2;
    }

    // Normalise the sign onto the numerator, then reduce.
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const divisor = gcd(numerator, denominator);
    const rn = numerator / divisor;
    const rd = denominator / divisor;

    const whole = Math.trunc(rn / rd);
    const remainder = Math.abs(rn % rd);
    const mixed = whole !== 0 && remainder !== 0 ? `${whole} ${remainder}/${rd}` : `${rn}/${rd}`;

    return {
      outputs: [
        { label: "Result", value: `${rn}/${rd}`, tone: "accent", copy: `${rn}/${rd}` },
        { label: "Mixed number", value: mixed },
        { label: "As a decimal", value: num(rn / rd, 6) },
      ],
    };
  },
  formulas: [
    { label: "Add / subtract", formula: "a/b ± c/d = (a·d ± c·b) / (b·d)" },
    { label: "Multiply", formula: "a/b × c/d = (a·c) / (b·d)" },
    { label: "Divide", formula: "a/b ÷ c/d = (a·d) / (b·c)" },
    { label: "Reducing", formula: "Divide numerator and denominator by their GCD" },
  ],
};
