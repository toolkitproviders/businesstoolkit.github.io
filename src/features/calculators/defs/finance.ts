import type { CalcOutput, CalculatorDef } from "../types";
import { formatNumber, formatPercent, round2 } from "@/lib/utils";

const num = (value: number, digits = 2) => formatNumber(value, digits);

const COMPOUND_OPTIONS = [
  { value: "1", label: "Annually" },
  { value: "2", label: "Semi-annually" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
  { value: "365", label: "Daily" },
];

export const simpleInterestCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Interest paid only on the original principal.",
  fields: [
    { key: "principal", label: "Principal", type: "currency", initial: "10000" },
    { key: "rate", label: "Annual rate", type: "percent", initial: "5" },
    { key: "years", label: "Time", type: "number", initial: "3", step: "0.1", suffix: "years" },
  ],
  compute: (values, h) => {
    const principal = h.num("principal");
    const rate = h.num("rate");
    const years = h.num("years");

    const interest = round2(principal * (rate / 100) * years);
    const total = round2(principal + interest);

    return {
      outputs: [
        { label: "Interest earned", value: h.money(interest), tone: "success" },
        { label: "Final amount", value: h.money(total), tone: "accent" },
        { label: "Principal", value: h.money(principal) },
      ],
      segments: [
        { label: "Principal", value: principal, color: "#345aa5" },
        { label: "Interest", value: Math.max(0, interest), color: "#18818a" },
      ],
    };
  },
  formulas: [
    { label: "Simple interest", formula: "I = P × r ÷ 100 × t" },
    {
      label: "Why it differs from compound",
      formula: "Interest never earns interest",
      note: "Over long periods simple interest falls far behind compound interest on the same rate.",
    },
  ],
};

export const compoundInterestCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Interest that earns interest, with optional regular deposits.",
  fields: [
    { key: "principal", label: "Starting amount", type: "currency", initial: "10000" },
    { key: "rate", label: "Annual rate", type: "percent", initial: "7" },
    { key: "years", label: "Time", type: "number", initial: "10", step: "0.5", suffix: "years" },
    {
      key: "frequency",
      label: "Compounded",
      type: "select",
      initial: "12",
      options: COMPOUND_OPTIONS,
    },
    { key: "deposit", label: "Regular deposit", type: "currency", initial: "0", hint: "Added at the end of each compounding period." },
  ],
  compute: (values, h) => {
    const principal = h.num("principal");
    const rate = h.num("rate") / 100;
    const years = Math.max(0, h.num("years"));
    const frequency = Math.max(1, h.num("frequency", 12));
    const deposit = h.num("deposit");

    const periods = years * frequency;
    const periodRate = rate / frequency;

    // Future value of the principal, plus an ordinary annuity for the deposits.
    const growth = Math.pow(1 + periodRate, periods);
    const fromPrincipal = principal * growth;
    const fromDeposits =
      periodRate === 0 ? deposit * periods : deposit * ((growth - 1) / periodRate);

    const total = round2(fromPrincipal + fromDeposits);
    const contributed = round2(principal + deposit * periods);
    const interest = round2(total - contributed);

    // Year-by-year summary rather than every compounding period.
    const rows: string[][] = [];
    const wholeYears = Math.min(50, Math.floor(years));
    for (let year = 1; year <= wholeYears; year += 1) {
      const p = year * frequency;
      const g = Math.pow(1 + periodRate, p);
      const bal = principal * g + (periodRate === 0 ? deposit * p : deposit * ((g - 1) / periodRate));
      const paid = principal + deposit * p;
      rows.push([String(year), h.money(round2(paid)), h.money(round2(bal - paid)), h.money(round2(bal))]);
    }

    return {
      outputs: [
        { label: "Final balance", value: h.money(total), tone: "accent" },
        { label: "Interest earned", value: h.money(interest), tone: "success" },
        { label: "Total contributed", value: h.money(contributed) },
      ],
      segments: [
        { label: "Contributed", value: Math.max(0, contributed), color: "#345aa5" },
        { label: "Interest", value: Math.max(0, interest), color: "#18818a" },
      ],
      table: rows.length
        ? { head: ["Year", "Contributed", "Interest", "Balance"], rows, caption: "Balance by year" }
        : undefined,
    };
  },
  formulas: [
    { label: "Compound growth", formula: "A = P × (1 + r/n)^(n·t)" },
    {
      label: "With regular deposits",
      formula: "+ PMT × [((1 + r/n)^(n·t) − 1) ÷ (r/n)]",
      note: "Assumes each deposit is made at the end of a compounding period.",
    },
  ],
};

/** Shared amortisation maths for the loan and EMI calculators. */
function amortise(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  if (months <= 0) return null;

  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const totalPaid = payment * months;
  return {
    payment: round2(payment),
    totalPaid: round2(totalPaid),
    totalInterest: round2(totalPaid - principal),
    monthlyRate,
  };
}

function yearlySchedule(
  principal: number,
  annualRate: number,
  months: number,
  money: (v: number) => string,
): string[][] {
  const monthlyRate = annualRate / 100 / 12;
  const result = amortise(principal, annualRate, months);
  if (!result) return [];

  const rows: string[][] = [];
  let balance = principal;
  let yearInterest = 0;
  let yearPrincipal = 0;

  for (let month = 1; month <= Math.min(months, 600); month += 1) {
    const interest = balance * monthlyRate;
    const principalPart = Math.min(result.payment - interest, balance);
    balance = Math.max(0, balance - principalPart);
    yearInterest += interest;
    yearPrincipal += principalPart;

    if (month % 12 === 0 || month === months) {
      rows.push([
        String(Math.ceil(month / 12)),
        money(round2(yearPrincipal)),
        money(round2(yearInterest)),
        money(round2(balance)),
      ]);
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }
  return rows;
}

export const loanCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Monthly repayment, total interest and the amortisation schedule.",
  fields: [
    { key: "amount", label: "Loan amount", type: "currency", initial: "250000" },
    { key: "rate", label: "Annual interest rate", type: "percent", initial: "6.5" },
    { key: "years", label: "Term", type: "number", initial: "25", step: "1", suffix: "years" },
  ],
  compute: (values, h) => {
    const amount = h.num("amount");
    const rate = h.num("rate");
    const years = Math.max(0, h.num("years"));
    const months = Math.round(years * 12);

    const result = amortise(amount, rate, months);
    if (!result || amount <= 0) {
      return { outputs: [{ label: "Monthly payment", value: "—" }], warning: "Enter a loan amount and a term above zero." };
    }

    return {
      outputs: [
        { label: "Monthly payment", value: h.money(result.payment), tone: "accent" },
        { label: "Total interest", value: h.money(result.totalInterest), tone: "warning" },
        { label: "Total repaid", value: h.money(result.totalPaid) },
        { label: "Payments", value: String(months), sub: `${years} years` },
      ],
      segments: [
        { label: "Principal", value: amount, color: "#345aa5" },
        { label: "Interest", value: Math.max(0, result.totalInterest), color: "#b45309" },
      ],
      table: {
        head: ["Year", "Principal", "Interest", "Balance"],
        rows: yearlySchedule(amount, rate, months, h.money),
        caption: "Amortisation by year",
      },
    };
  },
  formulas: [
    { label: "Monthly payment", formula: "P × i ÷ (1 − (1 + i)^−n)", note: "i is the monthly rate (annual ÷ 12 ÷ 100); n is the number of months." },
    { label: "Total interest", formula: "(Payment × n) − principal" },
  ],
};

export const emiCalculator: CalculatorDef = {
  currency: true,
  inputTitle: "Loan details",
  inputDescription: "Equated Monthly Instalment — the fixed amount paid each month.",
  fields: [
    { key: "amount", label: "Loan amount", type: "currency", initial: "500000" },
    { key: "rate", label: "Annual interest rate", type: "percent", initial: "9" },
    { key: "months", label: "Tenure", type: "number", initial: "60", step: "1", suffix: "months" },
  ],
  compute: (values, h) => {
    const amount = h.num("amount");
    const rate = h.num("rate");
    const months = Math.round(Math.max(0, h.num("months")));

    const result = amortise(amount, rate, months);
    if (!result || amount <= 0) {
      return { outputs: [{ label: "EMI", value: "—" }], warning: "Enter a loan amount and tenure above zero." };
    }

    const interestShare = result.totalPaid > 0 ? (result.totalInterest / result.totalPaid) * 100 : 0;

    return {
      outputs: [
        { label: "Monthly EMI", value: h.money(result.payment), tone: "accent" },
        { label: "Total interest", value: h.money(result.totalInterest), tone: "warning" },
        { label: "Total payable", value: h.money(result.totalPaid) },
        { label: "Interest share", value: formatPercent(interestShare, 1), sub: "Of everything you repay" },
      ],
      segments: [
        { label: "Principal", value: amount, color: "#345aa5" },
        { label: "Interest", value: Math.max(0, result.totalInterest), color: "#b45309" },
      ],
      table: {
        head: ["Year", "Principal", "Interest", "Balance"],
        rows: yearlySchedule(amount, rate, months, h.money),
        caption: "Repayment by year",
      },
    };
  },
  formulas: [
    { label: "EMI", formula: "P × i × (1 + i)^n ÷ ((1 + i)^n − 1)", note: "Algebraically identical to the loan payment formula." },
  ],
};

export const roiCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Return on investment, with an optional annualised figure.",
  fields: [
    { key: "cost", label: "Amount invested", type: "currency", initial: "10000" },
    { key: "returned", label: "Amount returned", type: "currency", initial: "13500" },
    { key: "years", label: "Held for", type: "number", initial: "2", step: "0.1", suffix: "years", hint: "Leave at 0 to skip the annualised figure." },
  ],
  compute: (values, h) => {
    const cost = h.num("cost");
    const returned = h.num("returned");
    const years = h.num("years");

    if (cost <= 0) {
      return { outputs: [{ label: "ROI", value: "—" }], warning: "Enter an invested amount above zero." };
    }

    const gain = round2(returned - cost);
    const roi = (gain / cost) * 100;

    const outputs: CalcOutput[] = [
      { label: "ROI", value: formatPercent(roi), tone: roi >= 0 ? "success" : "error" },
      { label: "Net gain", value: h.money(gain), tone: gain >= 0 ? "success" : "error" },
      { label: "Return multiple", value: `${num(returned / cost, 3)}×` },
    ];

    if (years > 0 && returned > 0) {
      // Compound annual growth rate.
      const cagr = (Math.pow(returned / cost, 1 / years) - 1) * 100;
      outputs.push({
        label: "Annualised (CAGR)",
        value: formatPercent(cagr),
        tone: cagr >= 0 ? "success" : "error",
      });
    }

    return {
      outputs,
      warning: gain < 0 ? "This investment lost money." : undefined,
      segments:
        gain > 0
          ? [
              { label: "Invested", value: cost, color: "#345aa5" },
              { label: "Gain", value: gain, color: "#18818a" },
            ]
          : undefined,
    };
  },
  formulas: [
    { label: "ROI", formula: "(Returned − invested) ÷ invested × 100" },
    { label: "Annualised (CAGR)", formula: "((Returned ÷ invested)^(1 ÷ years) − 1) × 100", note: "Lets you compare investments held for different lengths of time." },
  ],
};

export const breakEvenCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "How many units you must sell to cover your fixed costs.",
  fields: [
    { key: "fixed", label: "Fixed costs", type: "currency", initial: "20000", hint: "Rent, salaries, software — costs that do not vary with volume." },
    { key: "price", label: "Price per unit", type: "currency", initial: "50" },
    { key: "variable", label: "Variable cost per unit", type: "currency", initial: "30" },
  ],
  compute: (values, h) => {
    const fixed = h.num("fixed");
    const price = h.num("price");
    const variable = h.num("variable");

    const contribution = round2(price - variable);

    if (contribution <= 0) {
      return {
        outputs: [{ label: "Break-even units", value: "—" }],
        warning:
          "Each unit costs at least as much to make as it sells for, so no volume will ever cover your fixed costs. Raise the price or cut the variable cost.",
      };
    }

    const units = Math.ceil(fixed / contribution);
    const revenue = round2(units * price);
    const marginRatio = price > 0 ? (contribution / price) * 100 : 0;

    return {
      outputs: [
        { label: "Break-even units", value: num(units, 0), tone: "accent" },
        { label: "Break-even revenue", value: h.money(revenue), tone: "success" },
        { label: "Contribution per unit", value: h.money(contribution), sub: `${formatPercent(marginRatio, 1)} of the price` },
      ],
      segments: [
        { label: "Variable cost", value: Math.max(0, variable), color: "#94a3b8" },
        { label: "Contribution", value: contribution, color: "#18818a" },
      ],
      note: `Every unit beyond ${num(units, 0)} adds ${h.money(contribution)} of profit.`,
    };
  },
  formulas: [
    { label: "Contribution margin", formula: "Price − variable cost per unit" },
    { label: "Break-even units", formula: "Fixed costs ÷ contribution margin", note: "Rounded up — you cannot sell part of a unit." },
  ],
};

export const profitCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Gross and net profit from revenue and your cost lines.",
  fields: [
    { key: "revenue", label: "Revenue", type: "currency", initial: "120000" },
    { key: "cogs", label: "Cost of goods sold", type: "currency", initial: "54000" },
    { key: "operating", label: "Operating expenses", type: "currency", initial: "30000" },
    { key: "other", label: "Other expenses", type: "currency", initial: "6000" },
  ],
  compute: (values, h) => {
    const revenue = h.num("revenue");
    const cogs = h.num("cogs");
    const operating = h.num("operating");
    const other = h.num("other");

    const gross = round2(revenue - cogs);
    const net = round2(gross - operating - other);
    const grossMargin = revenue > 0 ? (gross / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (net / revenue) * 100 : 0;

    return {
      outputs: [
        { label: "Gross profit", value: h.money(gross), tone: gross >= 0 ? "success" : "error" },
        { label: "Gross margin", value: formatPercent(grossMargin), tone: "accent" },
        { label: "Net profit", value: h.money(net), tone: net >= 0 ? "success" : "error" },
        { label: "Net margin", value: formatPercent(netMargin), tone: "accent" },
        { label: "Total costs", value: h.money(round2(cogs + operating + other)) },
      ],
      segments: [
        { label: "Cost of goods", value: Math.max(0, cogs), color: "#94a3b8" },
        { label: "Operating", value: Math.max(0, operating), color: "#6996d4" },
        { label: "Other", value: Math.max(0, other), color: "#b45309" },
        { label: "Net profit", value: Math.max(0, net), color: "#18818a" },
      ],
      warning: net < 0 ? "Costs exceed revenue — this is a loss." : undefined,
    };
  },
  formulas: [
    { label: "Gross profit", formula: "Revenue − cost of goods sold" },
    { label: "Net profit", formula: "Gross profit − operating − other expenses" },
    { label: "Margin", formula: "Profit ÷ revenue × 100" },
  ],
};

export const grossMarginCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "Margin on a single product or on total sales.",
  fields: [
    { key: "revenue", label: "Revenue (or selling price)", type: "currency", initial: "100" },
    { key: "cogs", label: "Cost of goods sold", type: "currency", initial: "62" },
  ],
  compute: (values, h) => {
    const revenue = h.num("revenue");
    const cogs = h.num("cogs");
    const profit = round2(revenue - cogs);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const markup = cogs > 0 ? (profit / cogs) * 100 : 0;

    return {
      outputs: [
        { label: "Gross margin", value: formatPercent(margin), tone: margin >= 0 ? "success" : "error" },
        { label: "Gross profit", value: h.money(profit), tone: profit >= 0 ? "success" : "error" },
        { label: "Equivalent markup", value: formatPercent(markup), sub: "Profit ÷ cost" },
      ],
      segments: [
        { label: "Cost", value: Math.max(0, cogs), color: "#94a3b8" },
        { label: "Gross profit", value: Math.max(0, profit), color: "#18818a" },
      ],
      warning: profit < 0 ? "You are selling below cost." : undefined,
    };
  },
  formulas: [
    { label: "Gross margin", formula: "(Revenue − COGS) ÷ revenue × 100" },
    { label: "Margin vs markup", formula: "Markup = (Revenue − COGS) ÷ COGS × 100", note: "Same profit, different denominator. Markup is always the larger figure." },
  ],
};

export const netMarginCalculator: CalculatorDef = {
  currency: true,
  inputDescription: "What is left after every cost, including tax.",
  fields: [
    { key: "revenue", label: "Total revenue", type: "currency", initial: "250000" },
    { key: "costs", label: "Total costs", type: "currency", initial: "195000", hint: "COGS, operating expenses, interest and anything else before tax." },
    { key: "tax", label: "Tax rate", type: "percent", initial: "20" },
  ],
  compute: (values, h) => {
    const revenue = h.num("revenue");
    const costs = h.num("costs");
    const taxRate = Math.max(0, h.num("tax"));

    const preTax = round2(revenue - costs);
    const tax = preTax > 0 ? round2(preTax * (taxRate / 100)) : 0;
    const net = round2(preTax - tax);

    const netMargin = revenue > 0 ? (net / revenue) * 100 : 0;
    const preTaxMargin = revenue > 0 ? (preTax / revenue) * 100 : 0;

    return {
      outputs: [
        { label: "Net margin", value: formatPercent(netMargin), tone: netMargin >= 0 ? "success" : "error" },
        { label: "Net profit", value: h.money(net), tone: net >= 0 ? "success" : "error" },
        { label: "Pre-tax margin", value: formatPercent(preTaxMargin) },
        { label: "Tax", value: h.money(tax), tone: "warning" },
      ],
      segments: [
        { label: "Costs", value: Math.max(0, costs), color: "#94a3b8" },
        { label: "Tax", value: Math.max(0, tax), color: "#b45309" },
        { label: "Net profit", value: Math.max(0, net), color: "#18818a" },
      ],
      note: preTax <= 0 ? "No tax is applied to a loss in this calculation." : undefined,
    };
  },
  formulas: [
    { label: "Pre-tax profit", formula: "Revenue − total costs" },
    { label: "Net profit", formula: "Pre-tax profit × (1 − tax rate ÷ 100)" },
    { label: "Net margin", formula: "Net profit ÷ revenue × 100" },
  ],
};
