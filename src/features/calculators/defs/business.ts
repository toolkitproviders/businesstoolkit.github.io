import type { CalculatorDef } from "../types";
import { formatNumber, formatPercent, round2 } from "@/lib/utils";

const num = (value: number, digits = 2) => formatNumber(value, digits);

export const commissionCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Flat or tiered commission on a sale.",
  modes: {
    key: "mode",
    label: "Commission structure",
    options: [
      { value: "flat", label: "Flat rate" },
      { value: "tiered", label: "Above a threshold" },
      { value: "base", label: "Base + commission" },
    ],
  },
  fields: [
    { key: "sales", label: "Sales amount", type: "currency", initial: "50000" },
    { key: "rate", label: "Commission rate", type: "percent", initial: "5" },
    {
      key: "threshold",
      label: "Only above",
      type: "currency",
      initial: "20000",
      when: (v) => v.mode === "tiered",
      hint: "Commission applies to sales beyond this figure.",
    },
    { key: "base", label: "Base salary", type: "currency", initial: "3000", when: (v) => v.mode === "base" },
  ],
  compute: (values, h) => {
    const sales = h.num("sales");
    const rate = h.num("rate");
    const mode = h.str("mode") || "flat";

    let commissionable = sales;
    if (mode === "tiered") commissionable = Math.max(0, sales - h.num("threshold"));

    const commission = round2(commissionable * (rate / 100));
    const base = mode === "base" ? h.num("base") : 0;
    const total = round2(commission + base);
    const effective = sales > 0 ? (commission / sales) * 100 : 0;

    const outputs = [
      { label: "Commission", value: h.money(commission), tone: "accent" as const },
      { label: mode === "base" ? "Total earnings" : "Total", value: h.money(total), tone: "success" as const },
      { label: "Effective rate", value: formatPercent(effective, 2), sub: "Of total sales" },
    ];

    return {
      outputs,
      segments:
        mode === "base"
          ? [
              { label: "Base", value: Math.max(0, base), color: "#345aa5" },
              { label: "Commission", value: Math.max(0, commission), color: "#18818a" },
            ]
          : undefined,
      note:
        mode === "tiered" && commissionable === 0
          ? "Sales are below the threshold, so no commission is earned."
          : undefined,
    };
  },
  formulas: [
    { label: "Flat commission", formula: "Sales × rate ÷ 100" },
    { label: "Above a threshold", formula: "(Sales − threshold) × rate ÷ 100", note: "Negative amounts are treated as zero." },
  ],
};

export const hourlyRateCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Convert a salary to an hourly rate, or work out what to charge.",
  modes: {
    key: "mode",
    label: "Direction",
    options: [
      { value: "toHourly", label: "Salary → hourly" },
      { value: "freelance", label: "Freelance rate" },
    ],
  },
  fields: [
    { key: "salary", label: "Annual salary", type: "currency", initial: "60000", when: (v) => v.mode !== "freelance" },
    { key: "target", label: "Target annual income", type: "currency", initial: "80000", when: (v) => v.mode === "freelance" },
    { key: "expenses", label: "Annual business expenses", type: "currency", initial: "12000", when: (v) => v.mode === "freelance" },
    { key: "hours", label: "Hours per week", type: "number", initial: "37.5", step: "0.5" },
    { key: "weeks", label: "Working weeks per year", type: "number", initial: "46", step: "1", hint: "52 minus holiday and unpaid time." },
    { key: "billable", label: "Billable share", type: "percent", initial: "70", when: (v) => v.mode === "freelance", hint: "Time actually invoiced, after admin and sales." },
  ],
  compute: (values, h) => {
    const hours = Math.max(0.1, h.num("hours", 37.5));
    const weeks = Math.max(1, h.num("weeks", 46));
    const mode = h.str("mode") || "toHourly";
    const totalHours = hours * weeks;

    if (mode === "freelance") {
      const target = h.num("target");
      const expenses = h.num("expenses");
      const billablePct = Math.min(100, Math.max(1, h.num("billable", 70)));
      const billableHours = totalHours * (billablePct / 100);
      const required = round2((target + expenses) / billableHours);

      return {
        outputs: [
          { label: "Rate to charge", value: h.money(required), tone: "accent", sub: "Per billable hour" },
          { label: "Billable hours", value: num(billableHours, 0), sub: `${formatPercent(billablePct, 0)} of ${num(totalHours, 0)}` },
          { label: "Day rate", value: h.money(round2(required * (hours / 5))), sub: "Based on your weekly hours" },
        ],
        note: "Charging only for billable hours is what covers the unpaid admin, sales and downtime.",
      };
    }

    const salary = h.num("salary");
    const hourly = round2(salary / totalHours);

    return {
      outputs: [
        { label: "Hourly rate", value: h.money(hourly), tone: "accent" },
        { label: "Daily rate", value: h.money(round2(hourly * (hours / 5))) },
        { label: "Weekly", value: h.money(round2(hourly * hours)) },
        { label: "Annual hours", value: num(totalHours, 0) },
      ],
    };
  },
  formulas: [
    { label: "Hourly from salary", formula: "Salary ÷ (hours per week × working weeks)" },
    {
      label: "Freelance rate",
      formula: "(Target income + expenses) ÷ billable hours",
      note: "Billable hours are always well below total hours — pricing on total hours is the classic freelance mistake.",
    },
  ],
};

export const overtimeCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Pay for standard hours plus overtime at a premium rate.",
  fields: [
    { key: "rate", label: "Standard hourly rate", type: "currency", initial: "20" },
    { key: "standard", label: "Standard hours", type: "number", initial: "40", step: "0.5" },
    { key: "overtime", label: "Overtime hours", type: "number", initial: "6", step: "0.5" },
    { key: "multiplier", label: "Overtime multiplier", type: "number", initial: "1.5", step: "0.1", suffix: "×", hint: "1.5 is time-and-a-half, 2 is double time." },
  ],
  compute: (values, h) => {
    const rate = h.num("rate");
    const standard = Math.max(0, h.num("standard"));
    const overtime = Math.max(0, h.num("overtime"));
    const multiplier = Math.max(1, h.num("multiplier", 1.5));

    const basePay = round2(rate * standard);
    const otRate = round2(rate * multiplier);
    const otPay = round2(otRate * overtime);
    const total = round2(basePay + otPay);
    const totalHours = standard + overtime;
    const blended = totalHours > 0 ? round2(total / totalHours) : 0;

    return {
      outputs: [
        { label: "Total pay", value: h.money(total), tone: "accent" },
        { label: "Standard pay", value: h.money(basePay) },
        { label: "Overtime pay", value: h.money(otPay), tone: "success", sub: `${num(overtime, 1)} h at ${h.money(otRate)}` },
        { label: "Blended rate", value: h.money(blended), sub: "Average across all hours" },
      ],
      segments: [
        { label: "Standard", value: Math.max(0, basePay), color: "#345aa5" },
        { label: "Overtime", value: Math.max(0, otPay), color: "#18818a" },
      ],
    };
  },
  formulas: [
    { label: "Overtime rate", formula: "Standard rate × multiplier" },
    { label: "Total pay", formula: "(Standard hours × rate) + (overtime hours × overtime rate)" },
  ],
};

export const employeeCostCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "What an employee actually costs beyond their salary.",
  fields: [
    { key: "salary", label: "Gross annual salary", type: "currency", initial: "50000" },
    { key: "employerTax", label: "Employer tax / social contributions", type: "percent", initial: "13.8" },
    { key: "pension", label: "Employer pension", type: "percent", initial: "5" },
    { key: "insurance", label: "Insurance & benefits", type: "currency", initial: "1800", hint: "Annual cost." },
    { key: "equipment", label: "Equipment & software", type: "currency", initial: "1500", hint: "Annual cost." },
    { key: "overhead", label: "Office & overhead", type: "currency", initial: "3000", hint: "Annual cost." },
  ],
  compute: (values, h) => {
    const salary = h.num("salary");
    const tax = round2(salary * (h.num("employerTax") / 100));
    const pension = round2(salary * (h.num("pension") / 100));
    const insurance = h.num("insurance");
    const equipment = h.num("equipment");
    const overhead = h.num("overhead");

    const extras = round2(tax + pension + insurance + equipment + overhead);
    const total = round2(salary + extras);
    const multiplier = salary > 0 ? total / salary : 0;

    return {
      outputs: [
        { label: "True annual cost", value: h.money(total), tone: "accent" },
        { label: "On top of salary", value: h.money(extras), tone: "warning" },
        { label: "Cost multiplier", value: `${num(multiplier, 2)}×`, sub: "Of gross salary" },
        { label: "Monthly cost", value: h.money(round2(total / 12)) },
      ],
      segments: [
        { label: "Salary", value: Math.max(0, salary), color: "#345aa5" },
        { label: "Employer tax", value: Math.max(0, tax), color: "#6996d4" },
        { label: "Pension", value: Math.max(0, pension), color: "#18818a" },
        { label: "Benefits & overhead", value: Math.max(0, insurance + equipment + overhead), color: "#b45309" },
      ],
      note: "A multiplier between 1.25 and 1.4 is typical — budgeting on salary alone understates headcount cost badly.",
    };
  },
  formulas: [
    { label: "Total cost", formula: "Salary + employer tax + pension + benefits + equipment + overhead" },
    { label: "Multiplier", formula: "Total cost ÷ gross salary" },
  ],
};

export const salesTargetCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "What you need to sell to hit a revenue or profit goal.",
  fields: [
    { key: "target", label: "Revenue target", type: "currency", initial: "500000" },
    { key: "price", label: "Average order value", type: "currency", initial: "2500" },
    { key: "conversion", label: "Lead conversion rate", type: "percent", initial: "12" },
    { key: "period", label: "Over", type: "number", initial: "12", step: "1", suffix: "months" },
  ],
  compute: (values, h) => {
    const target = h.num("target");
    const price = h.num("price");
    const conversion = Math.max(0.01, h.num("conversion", 1));
    const months = Math.max(1, h.num("period", 12));

    if (price <= 0) {
      return { outputs: [{ label: "Orders needed", value: "—" }], warning: "Enter an average order value above zero." };
    }

    const orders = Math.ceil(target / price);
    const leads = Math.ceil(orders / (conversion / 100));

    return {
      outputs: [
        { label: "Orders needed", value: num(orders, 0), tone: "accent" },
        { label: "Leads needed", value: num(leads, 0), sub: `At ${formatPercent(conversion, 1)} conversion` },
        { label: "Orders per month", value: num(Math.ceil(orders / months), 0) },
        { label: "Leads per month", value: num(Math.ceil(leads / months), 0) },
        { label: "Revenue per month", value: h.money(round2(target / months)) },
      ],
    };
  },
  formulas: [
    { label: "Orders", formula: "Target revenue ÷ average order value" },
    { label: "Leads", formula: "Orders ÷ (conversion rate ÷ 100)" },
  ],
};

export const revenueCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Revenue from volume and price, with growth projection.",
  fields: [
    { key: "units", label: "Units sold per month", type: "number", initial: "400", step: "1" },
    { key: "price", label: "Price per unit", type: "currency", initial: "45" },
    { key: "growth", label: "Monthly growth", type: "percent", initial: "3" },
    { key: "months", label: "Project over", type: "number", initial: "12", step: "1", suffix: "months" },
  ],
  compute: (values, h) => {
    const units = h.num("units");
    const price = h.num("price");
    const growth = h.num("growth") / 100;
    const months = Math.max(1, Math.min(120, Math.round(h.num("months", 12))));

    const monthly = round2(units * price);

    let total = 0;
    const rows: string[][] = [];
    for (let m = 1; m <= months; m += 1) {
      const monthUnits = units * Math.pow(1 + growth, m - 1);
      const monthRevenue = monthUnits * price;
      total += monthRevenue;
      if (months <= 36 || m % 3 === 0 || m === months) {
        rows.push([String(m), num(monthUnits, 0), h.money(round2(monthRevenue)), h.money(round2(total))]);
      }
    }

    return {
      outputs: [
        { label: "Month 1 revenue", value: h.money(monthly), tone: "accent" },
        { label: `Total over ${months} months`, value: h.money(round2(total)), tone: "success" },
        { label: "Average per month", value: h.money(round2(total / months)) },
      ],
      table: { head: ["Month", "Units", "Revenue", "Cumulative"], rows, caption: "Projected revenue" },
    };
  },
  formulas: [
    { label: "Monthly revenue", formula: "Units × price" },
    { label: "With growth", formula: "Month n = units × (1 + growth)^(n − 1) × price" },
  ],
};

export const cacCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Customer acquisition cost, and whether your lifetime value covers it.",
  fields: [
    { key: "spend", label: "Sales & marketing spend", type: "currency", initial: "40000" },
    { key: "customers", label: "New customers won", type: "number", initial: "160", step: "1" },
    { key: "revenuePer", label: "Average revenue per customer", type: "currency", initial: "90", hint: "Per month, for the lifetime calculation." },
    { key: "margin", label: "Gross margin", type: "percent", initial: "70" },
    { key: "lifetime", label: "Average customer lifetime", type: "number", initial: "24", step: "1", suffix: "months" },
  ],
  compute: (values, h) => {
    const spend = h.num("spend");
    const customers = h.num("customers");

    if (customers <= 0) {
      return { outputs: [{ label: "CAC", value: "—" }], warning: "Enter the number of customers acquired." };
    }

    const cac = round2(spend / customers);
    const ltv = round2(h.num("revenuePer") * h.num("lifetime") * (h.num("margin") / 100));
    const ratio = cac > 0 ? ltv / cac : 0;
    const payback = h.num("revenuePer") > 0
      ? round2(cac / (h.num("revenuePer") * (h.num("margin") / 100)))
      : 0;

    return {
      outputs: [
        { label: "CAC", value: h.money(cac), tone: "accent" },
        { label: "LTV", value: h.money(ltv), tone: "success" },
        {
          label: "LTV : CAC",
          value: `${num(ratio, 2)} : 1`,
          tone: ratio >= 3 ? "success" : ratio >= 1 ? "warning" : "error",
        },
        { label: "Payback period", value: `${num(payback, 1)} months` },
      ],
      warning:
        ratio < 1
          ? "You are spending more to win a customer than they are worth. This does not scale."
          : ratio < 3
            ? "A ratio below 3:1 leaves little room for overheads. Most SaaS businesses target 3:1 or better."
            : undefined,
    };
  },
  formulas: [
    { label: "CAC", formula: "Sales & marketing spend ÷ new customers" },
    { label: "LTV", formula: "Monthly revenue × lifetime months × gross margin" },
    { label: "Payback", formula: "CAC ÷ monthly gross profit per customer" },
  ],
};

export const roasCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Return on ad spend, and the break-even ROAS your margin demands.",
  fields: [
    { key: "revenue", label: "Revenue from ads", type: "currency", initial: "48000" },
    { key: "spend", label: "Ad spend", type: "currency", initial: "12000" },
    { key: "margin", label: "Gross margin", type: "percent", initial: "45", hint: "Used to work out whether the campaign actually made money." },
  ],
  compute: (values, h) => {
    const revenue = h.num("revenue");
    const spend = h.num("spend");
    const margin = h.num("margin");

    if (spend <= 0) {
      return { outputs: [{ label: "ROAS", value: "—" }], warning: "Enter an ad spend above zero." };
    }

    const roas = revenue / spend;
    const grossProfit = round2(revenue * (margin / 100));
    const netProfit = round2(grossProfit - spend);
    const breakEvenRoas = margin > 0 ? 100 / margin : 0;

    return {
      outputs: [
        { label: "ROAS", value: `${num(roas, 2)}×`, tone: roas >= breakEvenRoas ? "success" : "error" },
        { label: "Net profit", value: h.money(netProfit), tone: netProfit >= 0 ? "success" : "error" },
        { label: "Break-even ROAS", value: `${num(breakEvenRoas, 2)}×`, sub: `At ${formatPercent(margin, 0)} margin` },
        { label: "ROAS as %", value: formatPercent(roas * 100, 0) },
      ],
      warning:
        roas < breakEvenRoas
          ? `A ${num(roas, 2)}× return loses money at a ${formatPercent(margin, 0)} margin — you need at least ${num(breakEvenRoas, 2)}×.`
          : undefined,
      segments:
        netProfit > 0
          ? [
              { label: "Ad spend", value: spend, color: "#b45309" },
              { label: "Net profit", value: netProfit, color: "#18818a" },
            ]
          : undefined,
    };
  },
  formulas: [
    { label: "ROAS", formula: "Revenue from ads ÷ ad spend" },
    {
      label: "Break-even ROAS",
      formula: "100 ÷ gross margin %",
      note: "A 4× ROAS is a loss at a 20% margin but a strong result at 60%. Revenue alone tells you nothing.",
    },
  ],
};

export const pricingCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Set a price from cost, target margin and expected volume.",
  fields: [
    { key: "unitCost", label: "Variable cost per unit", type: "currency", initial: "18" },
    { key: "fixed", label: "Fixed costs", type: "currency", initial: "15000" },
    { key: "volume", label: "Expected units sold", type: "number", initial: "1500", step: "1" },
    { key: "margin", label: "Target net margin", type: "percent", initial: "30", max: 99 },
  ],
  compute: (values, h) => {
    const unitCost = h.num("unitCost");
    const fixed = h.num("fixed");
    const volume = Math.max(1, h.num("volume", 1));
    const margin = Math.min(99, Math.max(0, h.num("margin")));

    const fullCost = round2(unitCost + fixed / volume);
    const price = round2(fullCost / (1 - margin / 100));
    const profitPerUnit = round2(price - fullCost);

    return {
      outputs: [
        { label: "Price to charge", value: h.money(price), tone: "accent" },
        { label: "Full cost per unit", value: h.money(fullCost), sub: `Includes ${h.money(round2(fixed / volume))} of fixed cost` },
        { label: "Profit per unit", value: h.money(profitPerUnit), tone: "success" },
        { label: "Total profit", value: h.money(round2(profitPerUnit * volume)), tone: "success" },
      ],
      segments: [
        { label: "Variable cost", value: Math.max(0, unitCost), color: "#94a3b8" },
        { label: "Fixed cost share", value: Math.max(0, fixed / volume), color: "#6996d4" },
        { label: "Profit", value: Math.max(0, profitPerUnit), color: "#18818a" },
      ],
      note: "Fixed costs are spread across your expected volume — sell fewer units and the real cost per unit rises.",
    };
  },
  formulas: [
    { label: "Full cost per unit", formula: "Variable cost + (fixed costs ÷ volume)" },
    {
      label: "Price for a target margin",
      formula: "Full cost ÷ (1 − margin ÷ 100)",
      note: "Adding the margin percentage to the cost gives a smaller margin than intended.",
    },
  ],
};

export const budgetCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Income against planned spending, with the surplus or shortfall.",
  fields: [
    { key: "income", label: "Monthly income", type: "currency", initial: "12000" },
    { key: "payroll", label: "Payroll", type: "currency", initial: "5200" },
    { key: "rent", label: "Rent & utilities", type: "currency", initial: "1800" },
    { key: "marketing", label: "Marketing", type: "currency", initial: "1200" },
    { key: "software", label: "Software & tools", type: "currency", initial: "600" },
    { key: "other", label: "Other costs", type: "currency", initial: "900" },
  ],
  compute: (values, h) => {
    const income = h.num("income");
    const lines: [string, number, string][] = [
      ["Payroll", h.num("payroll"), "#345aa5"],
      ["Rent & utilities", h.num("rent"), "#6996d4"],
      ["Marketing", h.num("marketing"), "#18818a"],
      ["Software", h.num("software"), "#74d8d7"],
      ["Other", h.num("other"), "#94a3b8"],
    ];

    const spend = round2(lines.reduce((sum, [, v]) => sum + v, 0));
    const surplus = round2(income - spend);
    const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

    return {
      outputs: [
        { label: surplus >= 0 ? "Monthly surplus" : "Monthly shortfall", value: h.money(Math.abs(surplus)), tone: surplus >= 0 ? "success" : "error" },
        { label: "Total spending", value: h.money(spend) },
        { label: "Surplus rate", value: formatPercent(savingsRate, 1), tone: savingsRate >= 0 ? "accent" : "error" },
        { label: "Annual surplus", value: h.money(round2(surplus * 12)), tone: surplus >= 0 ? "success" : "error" },
      ],
      segments: [
        ...lines.filter(([, v]) => v > 0).map(([label, value, color]) => ({ label, value, color })),
        ...(surplus > 0 ? [{ label: "Surplus", value: surplus, color: "#15803d" }] : []),
      ],
      warning: surplus < 0 ? "Planned spending exceeds income." : undefined,
      table: {
        head: ["Category", "Monthly", "Annual", "Share"],
        rows: lines.map(([label, value]) => [
          label,
          h.money(value),
          h.money(round2(value * 12)),
          income > 0 ? formatPercent((value / income) * 100, 1) : "—",
        ]),
        caption: "Spending by category",
      },
    };
  },
  formulas: [
    { label: "Surplus", formula: "Income − total spending" },
    { label: "Surplus rate", formula: "Surplus ÷ income × 100" },
  ],
};

export const cashFlowCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Projected closing balance and the month you would run out.",
  fields: [
    { key: "opening", label: "Opening balance", type: "currency", initial: "40000" },
    { key: "inflow", label: "Monthly cash in", type: "currency", initial: "18000" },
    { key: "outflow", label: "Monthly cash out", type: "currency", initial: "21000" },
    { key: "growth", label: "Monthly change in cash in", type: "percent", initial: "4" },
    { key: "months", label: "Project over", type: "number", initial: "12", step: "1", suffix: "months" },
  ],
  compute: (values, h) => {
    const opening = h.num("opening");
    const inflow = h.num("inflow");
    const outflow = h.num("outflow");
    const growth = h.num("growth") / 100;
    const months = Math.max(1, Math.min(120, Math.round(h.num("months", 12))));

    let balance = opening;
    let runwayMonth: number | null = null;
    const rows: string[][] = [];

    for (let m = 1; m <= months; m += 1) {
      const monthIn = inflow * Math.pow(1 + growth, m - 1);
      const net = monthIn - outflow;
      balance += net;
      if (balance < 0 && runwayMonth === null) runwayMonth = m;
      rows.push([String(m), h.money(round2(monthIn)), h.money(round2(net)), h.money(round2(balance))]);
    }

    const burn = round2(outflow - inflow);

    return {
      outputs: [
        { label: "Closing balance", value: h.money(round2(balance)), tone: balance >= 0 ? "success" : "error" },
        { label: burn > 0 ? "Monthly burn" : "Monthly surplus", value: h.money(Math.abs(burn)), tone: burn > 0 ? "warning" : "success" },
        {
          label: "Runway",
          value: runwayMonth ? `${runwayMonth} months` : "Beyond this projection",
          tone: runwayMonth ? "error" : "success",
        },
      ],
      warning: runwayMonth
        ? `On these numbers the balance goes negative in month ${runwayMonth}.`
        : undefined,
      table: { head: ["Month", "Cash in", "Net", "Balance"], rows, caption: "Monthly cash flow" },
    };
  },
  formulas: [
    { label: "Net cash flow", formula: "Cash in − cash out" },
    { label: "Closing balance", formula: "Opening balance + cumulative net cash flow" },
    { label: "Runway", formula: "The first month the projected balance falls below zero" },
  ],
};
