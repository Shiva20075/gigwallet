import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank } from 'lucide-react'
import { monthLabel } from '../lib/finance.js'
import { NumberField, Tag } from './ui.jsx'

// Change against the previous month. `goodWhenUp` decides the colour: more income
// is good news, more spending is not.
function Delta({ now, before, label, goodWhenUp }) {
  if (!before) return null
  const change = (now - before) / before
  if (Math.abs(change) < 0.005) return <span className="text-xs text-ink-3">Level with {label}</span>
  const up = change > 0
  return (
    <span
      className={`num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up === goodWhenUp ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
      }`}
      title={`Compared with ${label}`}
    >
      {up ? '▲' : '▼'} {Math.abs(Math.round(change * 100))}% <span className="font-medium opacity-80">vs {label}</span>
    </span>
  )
}

function Stat({ icon: Icon, label, value, sub, badge, children }) {
  return (
    <div className="card-hover flex flex-col rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-sand text-ink">
            <Icon size={15} />
          </span>
          {label}
        </span>
        {badge}
      </div>
      <p className="num mt-4 text-[1.6rem] font-semibold leading-none tracking-tight">{value}</p>
      <div className="mt-2 text-[13px] text-ink-3">{sub}</div>
      {children}
    </div>
  )
}

export default function Overview({ monthName, monthKind, totals, prev, planned, settings, onSetting, money }) {
  const short = planned.available < 0
  const share = totals.income > 0 ? Math.round((planned.available / totals.income) * 100) : 0
  const ofIncome = (v) => (totals.income > 0 ? `${Math.round((v / totals.income) * 100)}% of income` : null)
  const prevLabel = prev ? monthLabel(prev.month, 'short') : ''

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_2fr]">
      {/* Hero: the one number a freelancer actually wants */}
      <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-7">
        <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/65">
            Available balance · {monthName}
          </p>
          <Tag kind={monthKind === 'historical' ? 'historical' : monthKind === 'future' ? 'simulated' : 'actual'} onDark>
            {monthKind === 'future' ? 'Upcoming' : undefined}
          </Tag>
        </div>
        <p data-testid="available" className={`num relative mt-5 break-words font-display text-[3.25rem] leading-none sm:text-7xl lg:text-6xl xl:text-7xl ${short ? 'text-[#ff9b7a]' : ''}`}>
          {money.fmt(planned.available)}
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
          {totals.income === 0
            ? 'No income logged for this month yet.'
            : short
              ? 'This month is over-committed. Expenses, tax and savings exceed what came in.'
              : `Safe to spend after expenses, tax reserve and savings — ${share}% of what you earned.`}
        </p>
        <div className="mt-6 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {totals.income > 0 &&
            [
              [planned.expenses, 'bg-accent'],
              [planned.tax, 'bg-white/55'],
              [planned.savings, 'bg-white/30'],
              [Math.max(planned.available, 0), 'bg-white'],
            ].map(([v, cls], i) => v > 0 && <span key={i} className={cls} style={{ flexGrow: v }} />)}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/65">
          <Key cls="bg-accent">Expenses</Key>
          <Key cls="bg-white/55">Tax</Key>
          <Key cls="bg-white/30">Savings</Key>
          <Key cls="bg-white">Available</Key>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          icon={ArrowUpRight}
          label="Income"
          value={money.fmt(totals.income)}
          sub="Total received this month"
          badge={<Delta now={totals.income} before={prev?.income} label={prevLabel} goodWhenUp />}
        />
        <Stat
          icon={ArrowDownRight}
          label="Expenses"
          value={money.fmt(totals.expenses)}
          sub={ofIncome(totals.expenses) ? `Total spent · ${ofIncome(totals.expenses)}` : 'Total spent this month'}
          badge={<Delta now={totals.expenses} before={prev?.expenses} label={prevLabel} goodWhenUp={false} />}
        />
        <Stat
          icon={PiggyBank}
          label="Planned savings"
          value={money.fmt(planned.savings)}
          sub={ofIncome(planned.savings) ? `Monthly target · ${ofIncome(planned.savings)}` : 'Monthly target, set aside first'}
        />
        <Stat
          icon={Landmark}
          label="Tax reserve"
          value={money.fmt(planned.tax)}
          sub={
            <span className="flex items-center gap-2">
              <span className="shrink-0">Rate</span>
              <span className="w-20">
                <NumberField
                  compact
                  value={settings.taxRate}
                  min={0}
                  max={60}
                  suffix="%"
                  onChange={(v) => onSetting('taxRate', v)}
                />
              </span>
              <span>of income</span>
            </span>
          }
        />
      </div>
    </div>
  )
}

function Key({ cls, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      {children}
    </span>
  )
}
