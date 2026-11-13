import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, ReceiptText, Search, SearchX, Trash2 } from 'lucide-react'
import { monthOf } from '../lib/finance.js'
import { Card, SectionHeading, Tag, btn } from './ui.jsx'

const FILTERS = [
  ['all', 'All'],
  ['income', 'Income'],
  ['expense', 'Expenses'],
]

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Transactions({ transactions, month, monthKind, monthName, money, onAdd, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const inMonth = useMemo(
    () =>
      transactions
        .filter((t) => monthOf(t.date) === month)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [transactions, month],
  )
  const q = query.trim().toLowerCase()
  const rows = inMonth.filter(
    (t) =>
      (filter === 'all' || t.type === filter) &&
      (!q || t.category.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q)),
  )
  const sum = (type) => rows.reduce((s, t) => s + (t.type === type ? t.amount : 0), 0)
  const shownIncome = sum('income')
  const shownExpenses = sum('expense')

  return (
    <div id="transactions" className="scroll-mt-24 space-y-4">
      <SectionHeading
        eyebrow={
          <span className="flex items-center gap-2">
            {monthName}
            <Tag kind={monthKind === 'historical' ? 'historical' : monthKind === 'future' ? 'simulated' : 'actual'}>
              {monthKind === 'future' ? 'Upcoming' : undefined}
            </Tag>
          </span>
        }
        title="Transactions"
      >
        <button type="button" onClick={onAdd} className={btn.dark}>
          <Plus size={16} /> Add transaction
        </button>
      </SectionHeading>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex rounded-full bg-sand p-1">
            {FILTERS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={`h-8 rounded-full px-3.5 text-[13px] font-semibold transition ${
                  filter === k ? 'bg-card text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="ml-auto flex h-10 w-full items-center gap-2 rounded-full border border-line bg-white px-3.5 sm:w-64">
            <Search size={15} className="text-ink-3" />
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center" data-testid="tx-empty">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-sand text-ink-2">
              {inMonth.length === 0 ? <ReceiptText size={20} aria-hidden /> : <SearchX size={20} aria-hidden />}
            </span>
            <p className="font-display text-2xl leading-tight">
              {inMonth.length === 0 ? `Nothing logged for ${monthName}` : 'No transactions match'}
            </p>
            <p className="mt-1 text-sm text-ink-3">
              {inMonth.length === 0 ? 'Add your first income or expense to see the numbers move.' : 'Try a different filter or search.'}
            </p>
            {inMonth.length === 0 ? (
              <button type="button" onClick={onAdd} className={`${btn.primary} mt-5`}>
                <Plus size={16} /> Add a transaction
              </button>
            ) : (
              <button type="button" onClick={() => { setFilter('all'); setQuery('') }} className={`${btn.ghost} mt-5`}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <li className="hidden grid-cols-[1fr_8.5rem_4.5rem_8rem_4.5rem] lg:grid-cols-[1fr_10rem_6rem_9rem_5.5rem] gap-4 bg-sand/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-ink-3 md:grid">
              <span>Description</span>
              <span>Source / category</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Actions</span>
            </li>
            {rows.map((t) => {
              const income = t.type === 'income'
              const Icon = income ? ArrowUpRight : ArrowDownRight
              return (
                <li
                  key={t.id}
                  data-testid="tx-row"
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-sand/40 md:grid-cols-[1fr_8.5rem_4.5rem_8rem_4.5rem] md:gap-4 md:px-5 lg:grid-cols-[1fr_10rem_6rem_9rem_5.5rem]"
                >
                  <div className="contents md:flex md:min-w-0 md:items-center md:gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                        income ? 'bg-ink text-white' : 'bg-accent-soft text-accent-deep'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{t.note || t.category}</p>
                      <p className="truncate text-[13px] text-ink-3 md:hidden">
                        {t.category} · {fmtDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <span className="hidden min-w-0 md:block">
                    <span className="inline-block max-w-full truncate rounded-full bg-sand px-2.5 py-1 align-middle text-xs font-medium text-ink-2">{t.category}</span>
                  </span>
                  <span className="num hidden text-sm text-ink-2 md:block">{fmtDate(t.date)}</span>
                  <div className="row-span-1 text-right md:contents">
                    <p className={`num whitespace-nowrap text-[15px] font-semibold md:text-right ${income ? 'text-good' : 'text-ink'}`}>
                      {income ? '+' : '−'}
                      {money.fmt(t.amount)}
                    </p>
                    <div className="mt-0.5 flex justify-end gap-0.5 md:mt-0 md:opacity-60 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label={`Edit ${t.note || t.category}`}
                        onClick={() => onEdit(t)}
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition-colors hover:bg-sand hover:text-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${t.note || t.category}`}
                        onClick={() => onDelete(t)}
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition-colors hover:bg-bad-soft hover:text-bad"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line bg-sand/30 px-4 py-3 text-[13px] text-ink-2 md:px-5">
          <span>
            {rows.length} of {inMonth.length} {inMonth.length === 1 ? 'entry' : 'entries'}
          </span>
          <span className="num flex flex-wrap gap-x-5 gap-y-1">
            <span>In <strong className="font-semibold text-good">{money.fmt(shownIncome)}</strong></span>
            <span>Out <strong className="font-semibold text-ink">{money.fmt(shownExpenses)}</strong></span>
            <span>Net <strong className="font-semibold text-ink">{money.signed(shownIncome - shownExpenses)}</strong></span>
          </span>
        </div>
      </Card>
    </div>
  )
}
