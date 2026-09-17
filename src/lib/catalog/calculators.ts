import type { Tool } from "@/lib/tool-types";

/**
 * Calculator and finance tools.
 *
 * Each entry pairs with a definition in `features/calculators/defs/*` and is
 * rendered by the shared declarative engine, so the copy here is the whole
 * per-tool surface: metadata, keywords and genuine FAQs. `features`/`howTo`
 * are deliberately omitted — the on-page inputs, results and formula notes
 * already explain these tools better than a bullet list would.
 */
export const calculatorTools: Tool[] = [
  /* --------------------------------------------------------- calculators -- */
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    tagline: "Work out percentages three different ways.",
    description:
      "Find a percentage of a number, work out what percentage one number is of another, or reverse a percentage back to the original total.",
    category: "calculators",
    icon: "percent",
    keywords: ["percentage", "percent", "what is x percent of", "percent of a number", "calculate percentage"],
    seoTitle: "Percentage Calculator — Find Any Percentage Instantly",
    seoDescription:
      "Free percentage calculator. Find a percentage of a number, work out what percent one number is of another, or reverse a percentage to the original total.",
    faq: [
      {
        q: "How do I find 15% of a number?",
        a: "Divide the percentage by 100 and multiply. 15% of 200 is 0.15 × 200 = 30. The first mode does this for you.",
      },
      {
        q: "How do I work out what percentage one number is of another?",
        a: "Divide the part by the whole and multiply by 100. 30 out of 200 is 30 ÷ 200 × 100 = 15%.",
      },
      {
        q: "Can I reverse a percentage?",
        a: "Yes. The third mode answers “30 is 15% of what?” by calculating 30 ÷ 15 × 100 = 200.",
      },
    ],
    related: ["percentage-change-calculator", "discount-calculator", "vat-tax-calculator", "markup-calculator"],
    privateByDefault: true,
  },
  {
    slug: "percentage-change-calculator",
    name: "Percentage Increase & Decrease",
    tagline: "The percentage change between two values.",
    description:
      "Compare an original and a new value to get the percentage increase or decrease, the absolute change and the multiplier between them.",
    category: "calculators",
    icon: "trending-up",
    keywords: ["percentage increase", "percentage decrease", "percent change", "growth rate", "price increase"],
    seoTitle: "Percentage Increase & Decrease Calculator",
    seoDescription:
      "Calculate the percentage increase or decrease between two numbers, plus the absolute change and multiplier. Free and instant.",
    faq: [
      {
        q: "How is percentage change calculated?",
        a: "Subtract the original from the new value, divide by the original, and multiply by 100. From 120 to 150 is (150 − 120) ÷ 120 × 100 = 25%.",
      },
      {
        q: "Why can't I calculate change from zero?",
        a: "Any increase from zero is infinite in percentage terms, because you would be dividing by zero. The tool says so rather than showing a meaningless number.",
      },
      {
        q: "What does the multiplier mean?",
        a: "It is the new value divided by the original. A 25% increase is a 1.25× multiplier, which is often easier to apply to other figures.",
      },
    ],
    related: ["percentage-calculator", "roi-calculator", "revenue-calculator", "profit-calculator"],
    privateByDefault: true,
  },
  {
    slug: "discount-calculator",
    name: "Discount Calculator",
    tagline: "Sale prices and the discount behind them.",
    description:
      "Apply a percentage discount to a price, or work backwards from a sale price to see the discount you are actually being offered.",
    category: "calculators",
    icon: "percent",
    keywords: ["discount", "sale price", "percent off", "markdown", "how much off", "savings"],
    seoTitle: "Discount Calculator — Sale Price & Percent Off",
    seoDescription:
      "Calculate a sale price from a discount percentage, or find the discount percentage from an original and sale price. Free, instant, any currency.",
    faq: [
      {
        q: "How do I calculate 20% off?",
        a: "Multiply the price by 0.80, or by (1 − 20 ÷ 100). A £250 item at 20% off is £200.",
      },
      {
        q: "How do I find the discount percentage from a sale price?",
        a: "Subtract the sale price from the original, divide by the original, and multiply by 100. Switch to “Find the discount %” and the tool does it.",
      },
      {
        q: "Does it handle stacked discounts?",
        a: "Not directly — apply one, then run the result through again. Stacked discounts multiply rather than add: 20% then 10% off is 28% total, not 30%.",
      },
    ],
    related: ["markup-calculator", "percentage-calculator", "pricing-calculator", "vat-tax-calculator"],
    privateByDefault: true,
  },
  {
    slug: "markup-calculator",
    name: "Markup Calculator",
    tagline: "Set a selling price from cost and markup.",
    description:
      "Apply a markup percentage to your cost to get a selling price, and see the equivalent profit margin — the number markup is most often confused with.",
    category: "calculators",
    icon: "trending-up",
    keywords: ["markup", "markup percentage", "cost plus pricing", "selling price", "markup vs margin"],
    seoTitle: "Markup Calculator — Selling Price from Cost",
    seoDescription:
      "Calculate a selling price from cost and markup percentage, and see the equivalent profit margin. Free markup calculator with the formulas explained.",
    faq: [
      {
        q: "What is the difference between markup and margin?",
        a: "Markup is profit as a share of cost; margin is profit as a share of the selling price. A 50% markup is a 33.3% margin — same money, different denominator.",
      },
      {
        q: "How do I convert markup to margin?",
        a: "Margin = markup ÷ (100 + markup) × 100. The tool shows the equivalent margin automatically.",
      },
      {
        q: "What markup should I use?",
        a: "It depends entirely on your sector and cost base. Work backwards from the margin you need to cover overheads rather than copying a generic figure.",
      },
    ],
    related: ["gross-margin-calculator", "pricing-calculator", "discount-calculator", "profit-calculator"],
    privateByDefault: true,
  },
  {
    slug: "tip-calculator",
    name: "Tip Calculator",
    tagline: "Tip, total and each person's share.",
    description:
      "Work out a tip on any bill, get the total, and split it between any number of people — with optional rounding so nobody is counting out coins.",
    category: "calculators",
    icon: "percent",
    keywords: ["tip", "gratuity", "tip calculator", "restaurant tip", "service charge", "how much to tip"],
    seoTitle: "Tip Calculator — Gratuity & Bill Split",
    seoDescription:
      "Calculate a tip on any bill, see the total, and split it between any number of people. Optional rounding, any currency, works offline.",
    faq: [
      {
        q: "Should I tip on the pre-tax or post-tax amount?",
        a: "Convention in most places is to tip on the pre-tax bill. This tool applies the tip to the amount you enter, so enter the pre-tax figure to follow that convention.",
      },
      {
        q: "What does the rounding option do?",
        a: "“Round total up” lifts the total to the next whole unit and adjusts the tip. “Round each share up” makes every person's share a whole number, which usually tips slightly more.",
      },
    ],
    related: ["split-bill-calculator", "percentage-calculator", "discount-calculator", "vat-tax-calculator"],
    privateByDefault: true,
  },
  {
    slug: "split-bill-calculator",
    name: "Split Bill Calculator",
    tagline: "Divide a bill evenly, including tax and tip.",
    description:
      "Split any bill between a group, with tax and tip handled correctly and the rounding remainder called out so the shares actually add up to the total.",
    category: "calculators",
    icon: "percent",
    keywords: ["split bill", "split the check", "divide bill", "share cost", "group dinner", "bill splitter"],
    seoTitle: "Split Bill Calculator — Divide a Bill With Tax & Tip",
    seoDescription:
      "Split a bill between any number of people including tax and tip. Shows each share and flags the rounding remainder so the totals reconcile.",
    faq: [
      {
        q: "Why does it mention a rounding remainder?",
        a: "Dividing by three rarely gives clean money. Rather than quietly losing a penny, the tool tells you the remainder and which share should absorb it.",
      },
      {
        q: "Is the tip calculated before or after tax?",
        a: "Before tax, which is the usual convention. Tax and tip are both shown separately so you can check.",
      },
    ],
    related: ["tip-calculator", "percentage-calculator", "average-calculator", "budget-calculator"],
    privateByDefault: true,
  },
  {
    slug: "average-calculator",
    name: "Average Calculator",
    tagline: "Mean, median, mode, range and standard deviation.",
    description:
      "Paste any list of numbers to get the mean, median, mode, sum, range and standard deviation at once — separated by commas, spaces or new lines.",
    category: "calculators",
    icon: "trending-up",
    keywords: ["average", "mean", "median", "mode", "standard deviation", "range", "statistics"],
    seoTitle: "Average Calculator — Mean, Median, Mode & Range",
    seoDescription:
      "Calculate the mean, median, mode, sum, range and standard deviation of any list of numbers. Paste comma, space or line separated values.",
    faq: [
      {
        q: "What is the difference between mean, median and mode?",
        a: "The mean is the total divided by the count. The median is the middle value once sorted. The mode is the most frequent value. A few extreme values pull the mean but barely move the median.",
      },
      {
        q: "Why does it sometimes say the mode is None?",
        a: "Because no value repeats. A list where every number appears once has no mode, and reporting one would be misleading.",
      },
      {
        q: "Is the standard deviation population or sample?",
        a: "Population — it divides by the count rather than count minus one. Use it when your list is the whole set, not a sample of a larger one.",
      },
    ],
    related: ["percentage-calculator", "ratio-calculator", "split-bill-calculator", "revenue-calculator"],
    privateByDefault: true,
  },
  {
    slug: "ratio-calculator",
    name: "Ratio Calculator",
    tagline: "Simplify, scale or divide by a ratio.",
    description:
      "Reduce a ratio to its simplest form, scale it up or down, or split an amount between two parts in proportion.",
    category: "calculators",
    icon: "percent",
    keywords: ["ratio", "simplify ratio", "proportion", "scale ratio", "divide by ratio", "aspect ratio"],
    seoTitle: "Ratio Calculator — Simplify, Scale & Divide",
    seoDescription:
      "Simplify a ratio to its lowest terms, scale it to a new value, or divide an amount between two parts proportionally. Free and instant.",
    faq: [
      {
        q: "How do you simplify a ratio?",
        a: "Divide both parts by their greatest common divisor. 16:24 both divide by 8, giving 2:3.",
      },
      {
        q: "How do I split money by a ratio?",
        a: "Use the “Divide an amount” mode. Each share is its part divided by the total of both parts, multiplied by the amount.",
      },
    ],
    related: ["fraction-calculator", "percentage-calculator", "average-calculator", "pricing-calculator"],
    privateByDefault: true,
  },
  {
    slug: "fraction-calculator",
    name: "Fraction Calculator",
    tagline: "Add, subtract, multiply and divide fractions.",
    description:
      "Calculate with two fractions and get the result reduced to lowest terms, as a mixed number, and as a decimal.",
    category: "calculators",
    icon: "percent",
    keywords: ["fraction", "add fractions", "multiply fractions", "divide fractions", "simplify fraction", "mixed number"],
    seoTitle: "Fraction Calculator — Add, Subtract, Multiply & Divide",
    seoDescription:
      "Add, subtract, multiply or divide two fractions. Results are reduced to lowest terms and shown as a mixed number and a decimal.",
    faq: [
      {
        q: "How do you add fractions with different denominators?",
        a: "Cross-multiply: a/b + c/d = (a·d + c·b) ÷ (b·d), then reduce. The tool shows the reduced result directly.",
      },
      {
        q: "How do you divide by a fraction?",
        a: "Multiply by its reciprocal — flip the second fraction and multiply. a/b ÷ c/d = (a·d) ÷ (b·c).",
      },
    ],
    related: ["ratio-calculator", "percentage-calculator", "average-calculator", "profit-margin-calculator"],
    privateByDefault: true,
  },

  /* -------------------------------------------------------------- finance -- */
  {
    slug: "simple-interest-calculator",
    name: "Simple Interest Calculator",
    tagline: "Interest paid only on the original principal.",
    description:
      "Calculate simple interest on a principal over any period, and see the final amount alongside the interest earned.",
    category: "finance",
    icon: "trending-up",
    keywords: ["simple interest", "interest calculator", "principal", "interest earned", "flat interest"],
    seoTitle: "Simple Interest Calculator — Principal, Rate & Time",
    seoDescription:
      "Calculate simple interest from principal, annual rate and time. Shows interest earned and the final amount, with the formula explained.",
    faq: [
      {
        q: "What is simple interest?",
        a: "Interest calculated only on the original principal, never on accumulated interest. I = P × r × t.",
      },
      {
        q: "When is simple interest used?",
        a: "Short-term loans, some car finance and many bonds. Most savings accounts and mortgages compound instead, which grows faster.",
      },
    ],
    related: ["compound-interest-calculator", "loan-calculator", "roi-calculator", "emi-calculator"],
    privateByDefault: true,
  },
  {
    slug: "compound-interest-calculator",
    name: "Compound Interest Calculator",
    tagline: "Growth when interest earns interest.",
    description:
      "Project savings or investment growth with any compounding frequency and optional regular deposits, with a year-by-year balance table.",
    category: "finance",
    icon: "trending-up",
    keywords: ["compound interest", "savings calculator", "investment growth", "future value", "compounding"],
    seoTitle: "Compound Interest Calculator — With Regular Deposits",
    seoDescription:
      "Calculate compound interest with any compounding frequency and optional monthly deposits. Year-by-year balance table and the formulas explained.",
    faq: [
      {
        q: "How does compounding frequency change the result?",
        a: "More frequent compounding means interest starts earning interest sooner. The effect is real but smaller than people expect — moving from annual to daily at 7% adds roughly a quarter of a percent a year.",
      },
      {
        q: "When are the deposits assumed to be made?",
        a: "At the end of each compounding period, which is the standard ordinary-annuity assumption. Deposits made at the start of each period would grow slightly more.",
      },
      {
        q: "Does this account for inflation or tax?",
        a: "No. The figures are nominal. Subtract your expected inflation rate to think in today's money, and check the tax treatment of the account you are using.",
      },
    ],
    related: ["simple-interest-calculator", "roi-calculator", "loan-calculator", "budget-calculator"],
    privateByDefault: true,
  },
  {
    slug: "loan-calculator",
    name: "Loan Calculator",
    tagline: "Monthly repayment, total interest and schedule.",
    description:
      "Work out the monthly repayment on any loan, the total interest you will pay over its life, and a year-by-year amortisation schedule.",
    category: "finance",
    icon: "wallet",
    keywords: ["loan", "mortgage calculator", "repayment", "amortisation", "monthly payment", "interest"],
    seoTitle: "Loan Calculator — Monthly Repayment & Amortisation",
    seoDescription:
      "Calculate monthly loan repayments, total interest and a year-by-year amortisation schedule from the amount, rate and term.",
    faq: [
      {
        q: "Why is so much of an early payment interest?",
        a: "Interest is charged on the outstanding balance, which is highest at the start. The amortisation table shows the split shifting towards principal over time.",
      },
      {
        q: "Does this include fees or insurance?",
        a: "No — it calculates principal and interest only. Arrangement fees, insurance and taxes are additional, so treat the figure as a floor.",
      },
      {
        q: "What is the difference between this and the EMI calculator?",
        a: "The maths is identical. The loan calculator takes a term in years, the EMI calculator takes it in months and frames the result the way lenders in some markets present it.",
      },
    ],
    related: ["emi-calculator", "compound-interest-calculator", "simple-interest-calculator", "budget-calculator"],
    privateByDefault: true,
  },
  {
    slug: "emi-calculator",
    name: "EMI Calculator",
    tagline: "Equated monthly instalment and total payable.",
    description:
      "Calculate the fixed monthly instalment on a loan, the total interest and the share of your repayments that goes to interest rather than principal.",
    category: "finance",
    icon: "wallet",
    keywords: ["emi", "equated monthly instalment", "loan emi", "monthly instalment", "car loan", "personal loan"],
    seoTitle: "EMI Calculator — Equated Monthly Instalment",
    seoDescription:
      "Calculate your EMI from loan amount, interest rate and tenure in months. Shows total interest, total payable and a year-by-year schedule.",
    faq: [
      {
        q: "What is an EMI?",
        a: "A fixed monthly payment covering both interest and principal, set so the loan is exactly repaid at the end of the tenure.",
      },
      {
        q: "Does a longer tenure reduce what I pay?",
        a: "It reduces the monthly instalment but increases total interest, often substantially. Compare the total payable figure, not just the EMI.",
      },
    ],
    related: ["loan-calculator", "simple-interest-calculator", "compound-interest-calculator", "budget-calculator"],
    privateByDefault: true,
  },
  {
    slug: "roi-calculator",
    name: "ROI Calculator",
    tagline: "Return on investment, and the annualised rate.",
    description:
      "Calculate return on investment from what you put in and got back, plus the annualised rate (CAGR) so investments held for different periods can be compared.",
    category: "finance",
    icon: "trending-up",
    keywords: ["roi", "return on investment", "cagr", "annualised return", "investment return", "profit"],
    seoTitle: "ROI Calculator — Return on Investment & CAGR",
    seoDescription:
      "Calculate ROI and the annualised return (CAGR) from the amount invested, amount returned and holding period. Free and instant.",
    faq: [
      {
        q: "Why does the annualised return matter?",
        a: "A 35% total return is excellent over one year and poor over ten. CAGR converts both to a yearly rate so they can be compared fairly.",
      },
      {
        q: "Should the returned amount include the original investment?",
        a: "Yes. Enter the total value you ended up with, not just the profit.",
      },
    ],
    related: ["roas-calculator", "compound-interest-calculator", "profit-calculator", "customer-acquisition-cost-calculator"],
    privateByDefault: true,
  },
  {
    slug: "break-even-calculator",
    name: "Break-Even Calculator",
    tagline: "The volume that covers your fixed costs.",
    description:
      "Find how many units you must sell before fixed costs are covered, the revenue that represents, and the contribution each additional sale makes.",
    category: "finance",
    icon: "trending-up",
    keywords: ["break even", "break-even point", "contribution margin", "fixed costs", "unit economics"],
    seoTitle: "Break-Even Calculator — Units & Revenue to Break Even",
    seoDescription:
      "Calculate your break-even point in units and revenue from fixed costs, price and variable cost per unit, with contribution margin explained.",
    faq: [
      {
        q: "What is contribution margin?",
        a: "Price minus variable cost per unit — what each sale contributes towards fixed costs, and to profit once those are covered.",
      },
      {
        q: "Why does it sometimes say break-even is impossible?",
        a: "If the variable cost per unit is at least the selling price, every sale loses money and no volume will ever cover fixed costs. Raise the price or cut the unit cost.",
      },
    ],
    related: ["pricing-calculator", "profit-calculator", "gross-margin-calculator", "cash-flow-calculator"],
    privateByDefault: true,
  },
  {
    slug: "profit-calculator",
    name: "Profit Calculator",
    tagline: "Gross and net profit from revenue and costs.",
    description:
      "Enter revenue, cost of goods, operating expenses and other costs to get gross profit, net profit and both margins, with a visual cost breakdown.",
    category: "finance",
    icon: "trending-up",
    keywords: ["profit", "gross profit", "net profit", "profit and loss", "p&l", "business profit"],
    seoTitle: "Profit Calculator — Gross & Net Profit and Margins",
    seoDescription:
      "Calculate gross profit, net profit, gross margin and net margin from revenue, cost of goods and expenses. Free profit and loss calculator.",
    faq: [
      {
        q: "What is the difference between gross and net profit?",
        a: "Gross profit is revenue minus the direct cost of what you sold. Net profit is what remains after operating expenses and everything else. A healthy gross profit can still end in a net loss.",
      },
      {
        q: "What counts as cost of goods sold?",
        a: "Costs that scale directly with what you sell — materials, manufacturing, payment processing, delivery. Rent and salaries usually sit in operating expenses instead.",
      },
    ],
    related: ["gross-margin-calculator", "net-margin-calculator", "break-even-calculator", "profit-margin-calculator"],
    privateByDefault: true,
  },
  {
    slug: "gross-margin-calculator",
    name: "Gross Margin Calculator",
    tagline: "Margin on a product or on total sales.",
    description:
      "Calculate gross margin percentage and gross profit from revenue and cost of goods sold, with the equivalent markup shown alongside.",
    category: "finance",
    icon: "trending-up",
    keywords: ["gross margin", "margin percentage", "gross profit margin", "cogs", "margin calculator"],
    seoTitle: "Gross Margin Calculator — Margin % and Gross Profit",
    seoDescription:
      "Calculate gross margin percentage and gross profit from revenue and cost of goods sold. Shows the equivalent markup so the two are never confused.",
    faq: [
      {
        q: "What is a good gross margin?",
        a: "It varies enormously by sector — grocery retail often runs under 25% gross, while software routinely exceeds 75%. Compare against your own industry rather than a universal benchmark.",
      },
      {
        q: "Is gross margin the same as markup?",
        a: "No. Margin divides profit by the selling price; markup divides it by the cost. The tool shows both so you can see the difference on your own numbers.",
      },
    ],
    related: ["net-margin-calculator", "markup-calculator", "profit-calculator", "pricing-calculator"],
    privateByDefault: true,
  },
  {
    slug: "net-margin-calculator",
    name: "Net Margin Calculator",
    tagline: "What is left after every cost and tax.",
    description:
      "Calculate net profit margin from revenue, total costs and your tax rate — the figure that tells you whether the business actually makes money.",
    category: "finance",
    icon: "trending-up",
    keywords: ["net margin", "net profit margin", "after tax profit", "bottom line", "profitability"],
    seoTitle: "Net Margin Calculator — After-Tax Profit Margin",
    seoDescription:
      "Calculate net profit margin from revenue, total costs and tax rate. Shows pre-tax margin, tax and net profit with a visual breakdown.",
    faq: [
      {
        q: "Why is net margin lower than gross margin?",
        a: "Gross margin only subtracts the direct cost of goods. Net margin also absorbs salaries, rent, marketing, interest and tax.",
      },
      {
        q: "How is tax handled on a loss?",
        a: "No tax is applied when pre-tax profit is negative. Real loss relief rules vary by jurisdiction, so check with an accountant.",
      },
    ],
    related: ["gross-margin-calculator", "profit-calculator", "vat-tax-calculator", "cash-flow-calculator"],
    privateByDefault: true,
  },
  {
    slug: "budget-calculator",
    name: "Budget Calculator",
    tagline: "Income against spending, and what is left.",
    description:
      "Set out monthly income and spending by category to see your surplus or shortfall, the share each category takes, and the annual picture.",
    category: "finance",
    icon: "wallet",
    keywords: ["budget", "monthly budget", "business budget", "expenses", "surplus", "spending plan"],
    seoTitle: "Budget Calculator — Monthly Income vs Spending",
    seoDescription:
      "Plan a monthly budget by category and see your surplus or shortfall, the share each category takes and the annual totals.",
    faq: [
      {
        q: "What is a healthy surplus rate?",
        a: "For a business, enough to cover tax, reinvestment and a buffer for slow months. A consistent zero or negative surplus is the signal to act on.",
      },
      {
        q: "Is my budget saved?",
        a: "No. Everything stays in the page while you use it and is gone when you close the tab — nothing is uploaded or stored.",
      },
    ],
    related: ["cash-flow-calculator", "profit-calculator", "salary-calculator", "employee-cost-calculator"],
    privateByDefault: true,
  },
  {
    slug: "cash-flow-calculator",
    name: "Cash Flow Calculator",
    tagline: "Projected balance, burn rate and runway.",
    description:
      "Project your cash balance month by month from opening balance, cash in and cash out, and see exactly when the money would run out.",
    category: "finance",
    icon: "wallet",
    keywords: ["cash flow", "runway", "burn rate", "cash projection", "working capital", "forecast"],
    seoTitle: "Cash Flow Calculator — Runway & Burn Rate",
    seoDescription:
      "Project monthly cash flow from opening balance, income and costs. Shows burn rate, runway and the month your balance would go negative.",
    faq: [
      {
        q: "What is runway?",
        a: "The number of months before your cash balance reaches zero at the current rate. It is the single most important number for a business that is not yet profitable.",
      },
      {
        q: "Why is profit different from cash flow?",
        a: "Profit records a sale when it is made; cash flow records it when the money arrives. A profitable business can still run out of cash waiting on invoices.",
      },
    ],
    related: ["budget-calculator", "break-even-calculator", "profit-calculator", "revenue-calculator"],
    privateByDefault: true,
  },
  {
    slug: "commission-calculator",
    name: "Commission Calculator",
    tagline: "Flat, threshold or base-plus commission.",
    description:
      "Calculate sales commission on a flat rate, only above a threshold, or on top of a base salary — with the effective rate on total sales.",
    category: "finance",
    icon: "wallet",
    keywords: ["commission", "sales commission", "commission rate", "earnings", "quota", "base plus commission"],
    seoTitle: "Commission Calculator — Flat, Tiered & Base Plus",
    seoDescription:
      "Calculate sales commission on a flat rate, above a threshold, or on top of a base salary. Shows total earnings and the effective rate.",
    faq: [
      {
        q: "How does a threshold commission work?",
        a: "Commission applies only to sales above the threshold. On £50,000 of sales with a £20,000 threshold, commission is paid on £30,000.",
      },
      {
        q: "What is the effective rate?",
        a: "Commission divided by total sales. With a threshold it is always lower than the headline rate, which is worth knowing when comparing plans.",
      },
    ],
    related: ["sales-target-calculator", "salary-calculator", "hourly-rate-calculator", "overtime-calculator"],
    privateByDefault: true,
  },
  {
    slug: "hourly-rate-calculator",
    name: "Hourly Rate Calculator",
    tagline: "Salary to hourly, or the freelance rate you need.",
    description:
      "Convert an annual salary to an hourly rate, or work out what to charge as a freelancer once unbillable time and business costs are accounted for.",
    category: "finance",
    icon: "wallet",
    keywords: ["hourly rate", "freelance rate", "day rate", "salary to hourly", "contractor rate", "what to charge"],
    seoTitle: "Hourly Rate Calculator — Salary to Hourly & Freelance Rates",
    seoDescription:
      "Convert an annual salary to an hourly and daily rate, or calculate the freelance rate you need once unbillable hours and expenses are covered.",
    faq: [
      {
        q: "Why is my freelance rate so much higher than an equivalent salary?",
        a: "Because only part of your time is billable, and you carry costs an employer would otherwise absorb — holiday, sick leave, pension, equipment, software and unpaid sales time.",
      },
      {
        q: "What billable percentage is realistic?",
        a: "Most independent consultants land between 60% and 75%. Assuming 100% is the most common reason freelance rates end up too low.",
      },
    ],
    related: ["salary-calculator", "overtime-calculator", "employee-cost-calculator", "pricing-calculator"],
    privateByDefault: true,
  },
  {
    slug: "overtime-calculator",
    name: "Overtime Calculator",
    tagline: "Standard and premium hours in one total.",
    description:
      "Calculate total pay across standard and overtime hours at any multiplier, with the blended average rate across everything worked.",
    category: "finance",
    icon: "wallet",
    keywords: ["overtime", "time and a half", "double time", "overtime pay", "hourly pay", "payroll"],
    seoTitle: "Overtime Calculator — Time and a Half & Double Time",
    seoDescription:
      "Calculate overtime pay at any multiplier alongside standard hours. Shows overtime rate, total pay and the blended average rate.",
    faq: [
      {
        q: "What is time and a half?",
        a: "Overtime paid at 1.5× the standard hourly rate. Double time is 2×. Enter whichever multiplier applies to you.",
      },
      {
        q: "Is overtime legally required?",
        a: "It depends entirely on your country, contract and worker classification. This tool does the arithmetic; it does not tell you what you are entitled to.",
      },
    ],
    related: ["hourly-rate-calculator", "salary-calculator", "employee-cost-calculator", "commission-calculator"],
    privateByDefault: true,
  },
  {
    slug: "employee-cost-calculator",
    name: "Employee Cost Calculator",
    tagline: "What a hire really costs beyond salary.",
    description:
      "Add employer taxes, pension, benefits, equipment and overhead to a gross salary to see the true annual cost of a hire and the multiplier over salary.",
    category: "finance",
    icon: "wallet",
    keywords: ["employee cost", "cost of hiring", "employer cost", "true cost of an employee", "headcount cost", "burden rate"],
    seoTitle: "Employee Cost Calculator — True Cost of a Hire",
    seoDescription:
      "Calculate the real annual cost of an employee including employer taxes, pension, benefits, equipment and overhead, plus the multiplier over salary.",
    faq: [
      {
        q: "What multiplier should I expect?",
        a: "Typically 1.25× to 1.4× gross salary once employer taxes, pension and overhead are included. Budgeting on salary alone understates headcount cost badly.",
      },
      {
        q: "Are the default percentages accurate for my country?",
        a: "No — the defaults are illustrative. Employer contribution rates vary widely by country and by salary band, so replace them with your own figures.",
      },
    ],
    related: ["salary-calculator", "hourly-rate-calculator", "overtime-calculator", "budget-calculator"],
    privateByDefault: true,
  },
  {
    slug: "sales-target-calculator",
    name: "Sales Target Calculator",
    tagline: "Orders and leads needed to hit a revenue goal.",
    description:
      "Work backwards from a revenue target to the number of orders and leads you need, broken down per month against your conversion rate.",
    category: "finance",
    icon: "trending-up",
    keywords: ["sales target", "quota", "pipeline", "leads needed", "conversion rate", "sales forecast"],
    seoTitle: "Sales Target Calculator — Orders & Leads Needed",
    seoDescription:
      "Work backwards from a revenue target to the orders and leads required, using your average order value and conversion rate.",
    faq: [
      {
        q: "What conversion rate should I use?",
        a: "Your own historical rate from qualified lead to closed sale. Industry averages vary so widely that they are rarely useful for planning.",
      },
      {
        q: "Why are the numbers rounded up?",
        a: "You cannot close a fraction of a deal. Rounding up keeps the target achievable rather than technically correct but impossible.",
      },
    ],
    related: ["revenue-calculator", "commission-calculator", "customer-acquisition-cost-calculator", "roas-calculator"],
    privateByDefault: true,
  },
  {
    slug: "revenue-calculator",
    name: "Revenue Calculator",
    tagline: "Revenue projection with monthly growth.",
    description:
      "Project revenue from units and price with a monthly growth rate, and see the cumulative total build month by month.",
    category: "finance",
    icon: "trending-up",
    keywords: ["revenue", "sales forecast", "revenue projection", "growth", "mrr", "turnover"],
    seoTitle: "Revenue Calculator — Projection With Growth",
    seoDescription:
      "Project revenue from units sold, price and a monthly growth rate. Shows month-by-month and cumulative revenue over any period.",
    faq: [
      {
        q: "Is compounding monthly growth realistic?",
        a: "Over a few months, often. Over years it produces implausible numbers — growth almost always decays as a business scales, so treat long projections as an upper bound.",
      },
      {
        q: "Is this revenue or profit?",
        a: "Revenue — money in, before any costs. Use the profit calculator to see what actually remains.",
      },
    ],
    related: ["sales-target-calculator", "profit-calculator", "cash-flow-calculator", "roas-calculator"],
    privateByDefault: true,
  },
  {
    slug: "customer-acquisition-cost-calculator",
    name: "Customer Acquisition Cost Calculator",
    tagline: "CAC, lifetime value and the ratio between them.",
    description:
      "Calculate what each new customer costs to win, their lifetime value, the LTV:CAC ratio and how long it takes to pay back the acquisition cost.",
    category: "finance",
    icon: "trending-up",
    keywords: ["cac", "customer acquisition cost", "ltv", "lifetime value", "ltv cac ratio", "payback period", "unit economics"],
    seoTitle: "CAC Calculator — Customer Acquisition Cost & LTV:CAC",
    seoDescription:
      "Calculate customer acquisition cost, lifetime value, the LTV:CAC ratio and payback period from your spend, customers and margin.",
    faq: [
      {
        q: "What is a good LTV:CAC ratio?",
        a: "3:1 is the widely used benchmark. Below 1:1 you lose money on every customer. Far above 3:1 can mean you are underinvesting in growth.",
      },
      {
        q: "Should LTV use revenue or gross profit?",
        a: "Gross profit. Using revenue ignores the cost of serving the customer and flatters the ratio, which is why this tool asks for your margin.",
      },
      {
        q: "What should be included in acquisition cost?",
        a: "All sales and marketing spend for the period — ad budget, salaries, commissions and tools — divided by customers won in that period.",
      },
    ],
    related: ["roas-calculator", "roi-calculator", "sales-target-calculator", "pricing-calculator"],
    privateByDefault: true,
  },
  {
    slug: "roas-calculator",
    name: "ROAS Calculator",
    tagline: "Return on ad spend, against your break-even.",
    description:
      "Calculate return on ad spend and, crucially, the break-even ROAS your gross margin demands — so you know whether a campaign actually made money.",
    category: "finance",
    icon: "trending-up",
    keywords: ["roas", "return on ad spend", "ad spend", "advertising roi", "ppc", "campaign performance"],
    seoTitle: "ROAS Calculator — Return on Ad Spend & Break-Even",
    seoDescription:
      "Calculate ROAS from revenue and ad spend, plus the break-even ROAS your margin requires and the actual net profit from the campaign.",
    faq: [
      {
        q: "What is a good ROAS?",
        a: "There is no universal figure — it depends entirely on your margin. At a 20% margin you need 5× just to break even; at 60% you need 1.67×.",
      },
      {
        q: "Why does ROAS alone mislead?",
        a: "It compares revenue to spend and ignores the cost of delivering the product. A 4× ROAS looks strong but loses money at a 20% gross margin.",
      },
    ],
    related: ["customer-acquisition-cost-calculator", "roi-calculator", "revenue-calculator", "gross-margin-calculator"],
    privateByDefault: true,
  },
  {
    slug: "pricing-calculator",
    name: "Pricing Calculator",
    tagline: "A price that covers costs and hits your margin.",
    description:
      "Set a price from variable cost, fixed costs spread over expected volume, and the net margin you want — with the profit per unit and in total.",
    category: "finance",
    icon: "wallet",
    keywords: ["pricing", "how to price a product", "price calculator", "cost plus", "target margin", "unit price"],
    seoTitle: "Pricing Calculator — Price for a Target Margin",
    seoDescription:
      "Calculate the price you need from variable cost, fixed costs, expected volume and a target margin. Shows full cost per unit and total profit.",
    faq: [
      {
        q: "Why does volume affect the price?",
        a: "Fixed costs are spread across the units you sell. Sell half as many and the fixed cost per unit doubles, so a price that worked at high volume can lose money at low volume.",
      },
      {
        q: "Why divide by (1 − margin) instead of adding the margin?",
        a: "Adding 30% to cost gives a 23% margin, not 30%. Dividing by 0.70 gives the price that actually achieves the margin you asked for.",
      },
    ],
    related: ["markup-calculator", "break-even-calculator", "gross-margin-calculator", "discount-calculator"],
    privateByDefault: true,
  },
];
