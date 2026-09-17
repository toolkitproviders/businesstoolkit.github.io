import type { CalculatorDef } from "../types";
import {
  averageCalculator,
  discountCalculator,
  fractionCalculator,
  markupCalculator,
  percentageCalculator,
  percentageChangeCalculator,
  ratioCalculator,
  splitBillCalculator,
  tipCalculator,
} from "./basic";
import {
  breakEvenCalculator,
  compoundInterestCalculator,
  emiCalculator,
  grossMarginCalculator,
  loanCalculator,
  netMarginCalculator,
  profitCalculator,
  roiCalculator,
  simpleInterestCalculator,
} from "./finance";
import {
  budgetCalculator,
  cacCalculator,
  cashFlowCalculator,
  commissionCalculator,
  employeeCostCalculator,
  hourlyRateCalculator,
  overtimeCalculator,
  pricingCalculator,
  revenueCalculator,
  roasCalculator,
  salesTargetCalculator,
} from "./business";
import {
  areaConverter,
  dataConverter,
  lengthConverter,
  speedConverter,
  temperatureConverter,
  timeConverter,
  volumeConverter,
  weightConverter,
} from "./units";

/**
 * Slug → calculator definition. The registry test asserts this stays in step
 * with the tool catalog in both directions.
 */
export const CALCULATOR_DEFS: Record<string, CalculatorDef> = {
  "percentage-calculator": percentageCalculator,
  "percentage-change-calculator": percentageChangeCalculator,
  "discount-calculator": discountCalculator,
  "markup-calculator": markupCalculator,
  "tip-calculator": tipCalculator,
  "split-bill-calculator": splitBillCalculator,
  "average-calculator": averageCalculator,
  "ratio-calculator": ratioCalculator,
  "fraction-calculator": fractionCalculator,

  "simple-interest-calculator": simpleInterestCalculator,
  "compound-interest-calculator": compoundInterestCalculator,
  "loan-calculator": loanCalculator,
  "emi-calculator": emiCalculator,
  "roi-calculator": roiCalculator,
  "break-even-calculator": breakEvenCalculator,
  "profit-calculator": profitCalculator,
  "gross-margin-calculator": grossMarginCalculator,
  "net-margin-calculator": netMarginCalculator,

  "budget-calculator": budgetCalculator,
  "cash-flow-calculator": cashFlowCalculator,
  "commission-calculator": commissionCalculator,
  "hourly-rate-calculator": hourlyRateCalculator,
  "overtime-calculator": overtimeCalculator,
  "employee-cost-calculator": employeeCostCalculator,
  "sales-target-calculator": salesTargetCalculator,
  "revenue-calculator": revenueCalculator,
  "customer-acquisition-cost-calculator": cacCalculator,
  "roas-calculator": roasCalculator,
  "pricing-calculator": pricingCalculator,

  "length-converter": lengthConverter,
  "weight-converter": weightConverter,
  "temperature-converter": temperatureConverter,
  "area-converter": areaConverter,
  "volume-converter": volumeConverter,
  "speed-converter": speedConverter,
  "data-storage-converter": dataConverter,
  "time-converter": timeConverter,
};

export const calculatorSlugs = Object.keys(CALCULATOR_DEFS);
