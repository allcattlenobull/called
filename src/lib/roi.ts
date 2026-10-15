// A transparent education-ROI model. Every assumption is visible and editable in the UI.
import type { Career } from '../types';
import { ROI_DEFAULTS } from '../data/education/routes';
import { estimatedEducationCost } from './matching';
import type { CollegeCosts } from './places';

export interface RoiAssumptions {
  tuition: number;
  years: number;
  paidWhileTraining: boolean;
  livingCosts: number;
  alternativeEarnings: number;
  borrowedShare: number;
  loanRate: number;
  repaymentYears: number;
  startingShare: number;
  /** Median pay where the person expects to work; defaults to the U.S. median. */
  medianPay?: number;
}

export interface RoiResult {
  totalCost: number;
  opportunityCost: number;
  borrowed: number;
  monthlyPayment: number;
  paymentShareOfIncome: number;
  startingPay: number;
  /** Years after finishing until earnings minus alternative earnings repay cost + opportunity cost. */
  breakEvenYears: number | null;
  tenYearNet: number;
}

export interface StudyPlan {
  /** Public college prices for the state where the person would study. */
  college?: CollegeCosts;
  outOfState?: boolean;
  /** Living away from home while training uses that state's typical room and board. */
  livingAway?: boolean;
  /** Median pay where they'd work afterward. */
  workPay?: number;
}

export function defaultAssumptions(c: Career, plan: StudyPlan = {}): RoiAssumptions {
  const paid = c.education.level === 'apprenticeship' || (c.education.years > 0 && c.education.routes[0] === 'apprenticeship');
  const col = plan.college;
  const rates = col ? { uni: plan.outOfState ? col.public4OutOfState : col.public4InState, cc: col.public2InState } : undefined;
  const living = plan.livingAway && c.education.years > 0 && !paid ? (col?.public4RoomBoard ?? 0) : ROI_DEFAULTS.livingCosts;
  return {
    tuition: Math.round(estimatedEducationCost(c, rates)),
    years: c.education.years,
    paidWhileTraining: paid,
    medianPay: plan.workPay,
    livingCosts: living,
    alternativeEarnings: ROI_DEFAULTS.alternativeEarnings,
    borrowedShare: ROI_DEFAULTS.borrowedShare,
    loanRate: ROI_DEFAULTS.loanRate,
    repaymentYears: ROI_DEFAULTS.repaymentYears,
    startingShare: ROI_DEFAULTS.startingShare,
  };
}

export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

export function computeRoi(c: Career, a: RoiAssumptions): RoiResult {
  const totalCost = a.tuition + a.livingCosts * a.years;
  // Apprentices are paid while training, roughly half of journey-level pay on average.
  const median = a.medianPay ?? c.pay.median;
  const trainingEarnings = a.paidWhileTraining ? median * 0.5 * a.years : 0;
  const opportunityCost = Math.max(0, a.alternativeEarnings * a.years - trainingEarnings);
  const borrowed = totalCost * a.borrowedShare;
  const pay = monthlyPayment(borrowed, a.loanRate, a.repaymentYears);
  const startingPay = median * a.startingShare;
  const paymentShareOfIncome = startingPay > 0 ? (pay * 12) / startingPay : 0;

  // Earnings ramp from starting pay to median over 5 years, then flat.
  const earningsInYear = (y: number) => {
    const t = Math.min(1, y / 5);
    return startingPay + (median - startingPay) * t;
  };
  let cumulative = -(totalCost + opportunityCost);
  let breakEvenYears: number | null = null;
  for (let y = 0; y < 30; y++) {
    const gain = earningsInYear(y) - a.alternativeEarnings;
    const before = cumulative;
    cumulative += gain;
    if (breakEvenYears === null && cumulative >= 0 && gain > 0) {
      breakEvenYears = y + (before < 0 ? -before / gain : 0);
    }
  }
  if (totalCost + opportunityCost === 0) breakEvenYears = 0;
  let tenYearNet = -(totalCost + opportunityCost);
  for (let y = 0; y < 10; y++) tenYearNet += earningsInYear(y) - a.alternativeEarnings;

  return {
    totalCost,
    opportunityCost,
    borrowed,
    monthlyPayment: pay,
    paymentShareOfIncome,
    startingPay,
    breakEvenYears: breakEvenYears === null ? null : Math.round(breakEvenYears * 10) / 10,
    tenYearNet,
  };
}
