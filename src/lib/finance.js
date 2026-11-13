// Pure money maths for GigWallet. No React, no side effects — easy to test.

export const SHOCK_PCT = 40

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISODate(new Date())
export const monthOf = (isoDate) => isoDate.slice(0, 7)
export const currentMonth = () => monthOf(todayISO())

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthLabel(month, style = 'long') {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return style === 'short'
    ? d.toLocaleDateString('en-US', { month: 'short' })
    : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function isValidISODate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

// ---------- totals ----------
export function monthTotals(transactions, month) {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    if (monthOf(t.date) !== month) continue
    if (t.type === 'income') income += t.amount
    else expenses += t.amount
  }
  return { income: round2(income), expenses: round2(expenses) }
}

export function monthlySeries(transactions, endMonth, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(endMonth, i - (count - 1))
    return { month, label: monthLabel(month, 'short'), ...monthTotals(transactions, month) }
  })
}

// ---------- the plan (dashboard) ----------
// Tax is reserved on gross income. Available = what is left after expenses,
// the tax reserve and the full savings target. It can go negative.
export function plan({ income, expenses, taxRate, savingsTarget }) {
  const tax = round2((income * taxRate) / 100)
  const available = round2(income - expenses - tax - savingsTarget)
  return { income, expenses, tax, savings: savingsTarget, available }
}

// ---------- what a given income can actually fund (simulator) ----------
// Priority order: tax reserve, then expenses, then savings, then spending money.
// If income cannot cover tax + expenses, the gap is the deficit.
export function budget({ income, expenses, taxRate, savingsTarget }) {
  const tax = round2((income * taxRate) / 100)
  const afterNeeds = round2(income - tax - expenses)
  const savings = round2(Math.min(Math.max(afterNeeds, 0), savingsTarget))
  const available = round2(Math.max(afterNeeds - savings, 0))
  const deficit = round2(Math.max(-afterNeeds, 0))
  return { income: round2(income), tax, expenses, savings, available, deficit }
}

export function shockScenario({ income, expenses, taxRate, savingsTarget, savingsBalance, pct = SHOCK_PCT }) {
  const normal = budget({ income, expenses, taxRate, savingsTarget })
  const shocked = budget({ income: income * (1 - pct / 100), expenses, taxRate, savingsTarget })
  const runway = shocked.deficit > 0 ? savingsBalance / shocked.deficit : Infinity

  let verdict
  if (shocked.deficit === 0 && shocked.savings >= savingsTarget) verdict = 'safe'
  else if (shocked.deficit === 0) verdict = 'tight'
  else if (runway >= 3) verdict = 'drawdown'
  else verdict = 'fail'

  return { normal, shocked, runway, verdict }
}

// ---------- smart budget recovery (what-if on top of the shocked budget) ----------
// Nothing here writes back to transactions or settings; it only answers
// "if I trimmed this much, would the shocked month balance?".
//
// pool        = shocked income - shocked tax reserve (money for expenses + savings)
// deficit     = what expenses alone overshoot the pool by (savings are already
//               unfunded by then, because savings are only funded after expenses)
// savingsGap  = how much of the savings target the shock leaves unfunded
export function flexibleTotal(transactions, month, flexibleCategories) {
  let sum = 0
  for (const t of transactions) {
    if (t.type === 'expense' && monthOf(t.date) === month && flexibleCategories.includes(t.category)) sum += t.amount
  }
  return round2(sum)
}

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)

export function recoveryPlan({ shocked, savingsTarget, flexible = 0, expenseCut = null, savingsCut = null }) {
  const pool = round2(shocked.income - shocked.tax)
  const { expenses, deficit } = shocked
  const fundedSavings = shocked.savings
  const savingsGap = round2(Math.max(savingsTarget - fundedSavings, 0))
  const shortfall = round2(Math.max(expenses + savingsTarget - pool, 0))

  const status = shortfall === 0 ? 'sustainable' : deficit === 0 ? 'adjust' : 'deficit'

  // Recommendation: with a deficit, cut exactly enough expenses to close it.
  // With no deficit but a savings gap, cut enough to refill the savings target.
  // Savings funded under the shock are left alone unless the user trims them.
  const recommended = {
    expenseCut: round2(Math.min(deficit > 0 ? deficit : savingsGap, expenses)),
    savingsCut: 0,
  }

  const cut = round2(clamp(expenseCut ?? recommended.expenseCut, 0, expenses))
  const sCut = round2(clamp(savingsCut ?? recommended.savingsCut, 0, fundedSavings))

  const revisedExpenses = round2(expenses - cut)
  const revisedSavings = round2(fundedSavings - sCut)
  const balance = round2(pool - revisedExpenses - revisedSavings) // < 0 = remaining deficit
  const fromFlexible = round2(Math.min(cut, flexible))

  return {
    status, pool, deficit, shortfall, savingsGap, fundedSavings, recommended,
    expenseCut: cut, savingsCut: sCut, revisedExpenses, revisedSavings,
    fromFlexible, fromEssentials: round2(cut - fromFlexible),
    balance,
    remainingDeficit: round2(Math.max(-balance, 0)),
    surplus: round2(Math.max(balance, 0)),
    balanced: balance >= 0,
    // share of the starting hole (deficit) that the adjustments have closed
    progress: deficit > 0 ? clamp((cut + sCut) / deficit, 0, 1) : 1,
  }
}

// ---------- financial resilience score (0-100) ----------
// An illustrative planning indicator, NOT a credit score. It is the sum of three
// factors, each scored linearly between a floor (0 points) and a target (full points):
//
//   1. Budget surplus        max 30   margin = available / income, where available is
//                                     income - expenses - tax reserve - savings target.
//                                     0 pts at a 0% margin, 30 pts at a 20% margin.
//   2. Shock affordability   max 40   coverage = shocked post-tax income / (expenses +
//                                     savings target) after the 40% income shock.
//                                     0 pts at 50% coverage, 40 pts at 100% coverage.
//   3. Savings runway        max 30   months = savings balance / expected monthly expenses.
//                                     0 pts at 0 months, 30 pts at 6 months.
//
// Every input comes from plan(), shockScenario() and leanMonth() above, so the score
// moves whenever transactions, the savings figures or the tax rate change.
export const RESILIENCE = {
  surplus: { max: 30, fullAt: 0.2 },
  shock: { max: 40, floor: 0.5, fullAt: 1 },
  runway: { max: 30, fullAt: 6 },
}

export function resilienceScore({ income, expenses, taxRate, savingsTarget, savingsBalance, expectedIncome, expectedExpenses }) {
  const R = RESILIENCE
  const linear = (value, floor, full, max) => round2(max * clamp((value - floor) / (full - floor), 0, 1))

  const available = plan({ income, expenses, taxRate, savingsTarget }).available
  const margin = income > 0 ? available / income : 0

  const { shocked } = shockScenario({ income, expenses, taxRate, savingsTarget, savingsBalance })
  const needs = expenses + savingsTarget
  const coverage = income > 0 ? (needs > 0 ? Math.min((shocked.income - shocked.tax) / needs, 1) : 1) : 0

  const months = leanMonth({ expectedIncome, expectedExpenses, taxRate, savingsBalance }).zeroIncomeRunway

  const factors = {
    surplus: { points: linear(margin, 0, R.surplus.fullAt, R.surplus.max), max: R.surplus.max, margin, available },
    shock: { points: linear(coverage, R.shock.floor, R.shock.fullAt, R.shock.max), max: R.shock.max, coverage },
    runway: {
      points: Number.isFinite(months) ? linear(months, 0, R.runway.fullAt, R.runway.max) : savingsBalance > 0 ? R.runway.max : 0,
      max: R.runway.max,
      months,
    },
  }
  const score = Math.round(factors.surplus.points + factors.shock.points + factors.runway.points)
  const band = score >= 80 ? 'strong' : score >= 60 ? 'steady' : score >= 40 ? 'exposed' : 'at-risk'
  return { score, band, factors, hasIncome: income > 0 }
}

// ---------- lean month ----------
export function leanMonth({ expectedIncome, expectedExpenses, taxRate, savingsBalance }) {
  const takeHome = round2(expectedIncome * (1 - taxRate / 100))
  const gap = round2(expectedExpenses - takeHome) // > 0 means a monthly shortfall
  const runway = gap > 0 ? savingsBalance / gap : Infinity
  const zeroIncomeRunway = expectedExpenses > 0 ? savingsBalance / expectedExpenses : Infinity

  let status
  if (gap <= 0) status = 'ok'
  else if (runway >= 6) status = 'watch'
  else if (runway >= 3) status = 'warning'
  else status = 'critical'

  return { takeHome, gap, runway, zeroIncomeRunway, status }
}

// ---------- formatting ----------
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR']

export function makeMoney(currency) {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  const full = new Intl.NumberFormat(locale, { style: 'currency', currency })
  const whole = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  const compact = new Intl.NumberFormat(locale, {
    style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1,
  })
  const symbol = full.formatToParts(0).find((p) => p.type === 'currency')?.value ?? ''
  return {
    symbol,
    fmt: (n) => full.format(n),
    whole: (n) => whole.format(n),
    compact: (n) => compact.format(n),
    signed: (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + full.format(Math.abs(n)),
  }
}

export function fmtMonths(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n >= 24) return `${Math.floor(n / 12)}+ years`
  if (n >= 10) return `${Math.floor(n)} months`
  const r = Math.floor(n * 10) / 10
  return `${r} ${r === 1 ? 'month' : 'months'}`
}
