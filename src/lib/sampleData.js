import { shiftMonth, currentMonth } from './finance.js'

export const INCOME_CATEGORIES = ['Freelance project', 'Retainer', 'Gig platform', 'Workshop', 'Royalties', 'Other income']
export const EXPENSE_CATEGORIES = [
  'Rent', 'Groceries', 'Utilities', 'Insurance', 'Software', 'Coworking',
  'Transport', 'Dining', 'Equipment', 'Other expense',
]

// Spending that can realistically be trimmed in a bad month. Everything else
// (rent, groceries, utilities, insurance) is treated as essential.
export const FLEXIBLE_CATEGORIES = ['Dining', 'Equipment', 'Software', 'Coworking', 'Transport', 'Other expense']

export const DEFAULT_SETTINGS = {
  schema: 2, // 2 = INR became the default currency
  currency: 'INR',
  taxRate: 25,
  savingsTarget: 600,
  savingsBalance: 7500,
  expectedIncome: 3000,
  expectedExpenses: 3100,
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

// Income per month, index 0 = current month, 5 = five months ago. All fictional.
// [day, category, note, amount]
const INCOME = [
  [[3, 'Retainer', 'Kestrel Labs — design retainer', 1800], [8, 'Freelance project', 'Lumen Bikes — landing page', 2150], [11, 'Gig platform', 'Taskhive payouts', 700]],
  [[3, 'Retainer', 'Kestrel Labs — design retainer', 1800], [19, 'Gig platform', 'Taskhive payouts', 650]],
  [[3, 'Retainer', 'Kestrel Labs — design retainer', 1800], [12, 'Freelance project', 'Harbor & Pine — brand refresh', 3400], [24, 'Workshop', 'Figma basics evening class', 1200]],
  [[3, 'Retainer', 'Kestrel Labs — design retainer', 1800], [17, 'Freelance project', 'Odd Fellow Bakery — menu design', 900], [26, 'Gig platform', 'Taskhive payouts', 400]],
  [[5, 'Freelance project', 'Moss & Marrow — packaging', 2900], [14, 'Retainer', 'Kestrel Labs — design retainer', 1800], [22, 'Royalties', 'Icon pack sales', 500]],
  [[6, 'Freelance project', 'Tidewater Yoga — website', 2600], [20, 'Gig platform', 'Taskhive payouts', 850], [27, 'Royalties', 'Icon pack sales', 450]],
]

// Small month-to-month wobble so expenses look real rather than copy-pasted.
const WOBBLE = [0, 14.2, -9.75, 22.4, -6.1, 11.35]

const EXPENSES = (w) => [
  [1, 'Rent', 'Studio apartment', 1350],
  [2, 'Insurance', 'Health insurance premium', 312],
  [4, 'Coworking', 'Common Desk — flex pass', 180],
  [5, 'Software', 'Design + cloud subscriptions', 64.98],
  [6, 'Groceries', 'Weekly shop', 142.18 + w],
  [7, 'Utilities', 'Electricity & internet', 121.36 + w / 2],
  [9, 'Transport', 'Transit pass & rideshares', 58],
  [10, 'Dining', 'Client lunch', 47.5 + w / 4],
  [16, 'Groceries', 'Weekly shop', 96.4 - w / 2],
  [23, 'Groceries', 'Weekly shop', 118.75],
]

const ONE_OFFS = {
  0: [[11, 'Equipment', 'Monitor arm', 89]],
  2: [[18, 'Equipment', 'Drawing tablet', 329]],
  4: [[21, 'Other expense', 'Accountant — quarterly filing', 220]],
}

export function buildSampleTransactions(now = new Date()) {
  const thisMonth = currentMonth()
  const out = []
  for (let back = 0; back < 6; back++) {
    const month = shiftMonth(thisMonth, -back)
    const add = (type) => ([day, category, note, amount]) => {
      // Never seed entries dated in the future.
      const d = back === 0 ? Math.min(day, now.getDate()) : day
      out.push({
        id: newId(),
        type,
        category,
        note,
        amount: Math.round(amount * 100) / 100,
        date: `${month}-${String(d).padStart(2, '0')}`,
      })
    }
    INCOME[back].forEach(add('income'))
    EXPENSES(WOBBLE[back]).forEach(add('expense'))
    ;(ONE_OFFS[back] ?? []).forEach(add('expense'))
  }
  return out
}
