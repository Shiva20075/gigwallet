import { ChevronLeft, ChevronRight, Plus, RotateCcw, Wallet } from 'lucide-react'
import { CURRENCIES, currentMonth, monthLabel, shiftMonth } from '../lib/finance.js'

export default function Header({ month, onMonth, currency, onCurrency, onAdd, onReset }) {
  const isCurrent = month === currentMonth()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <a href="#top" className="mr-auto flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-accent">
            <Wallet size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            Gig<span className="text-accent-deep">Wallet</span>
          </span>
        </a>

        <div className="order-3 flex w-full items-center justify-between rounded-full border border-line bg-card p-1 sm:order-none sm:w-auto">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonth(shiftMonth(month, -1))}
            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-sand active:scale-95"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => onMonth(currentMonth())}
            title={isCurrent ? 'Viewing the current month' : 'Jump back to the current month'}
            className="num flex min-w-40 items-center justify-center gap-2 rounded-full px-2 py-1 text-sm font-semibold transition-colors hover:bg-sand"
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-accent' : 'border border-ink-3'}`}
            />
            {monthLabel(month)}
            {!isCurrent && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Today</span>}
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonth(shiftMonth(month, 1))}
            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-sand active:scale-95"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <select
          aria-label="Currency"
          value={currency}
          onChange={(e) => onCurrency(e.target.value)}
          className="h-10 cursor-pointer rounded-full border border-line bg-card px-3 text-sm font-medium transition-colors hover:bg-sand"
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset demo data"
          title="Reset demo data"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink-2 transition-colors hover:bg-sand hover:text-ink"
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-ink transition hover:brightness-105 active:scale-[0.98]"
        >
          <Plus size={17} strokeWidth={2.4} />
          Add<span className="hidden sm:inline">&nbsp;transaction</span>
        </button>
      </div>
    </header>
  )
}
