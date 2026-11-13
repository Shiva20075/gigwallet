import { AlertTriangle, CheckCircle2, Hourglass, ReceiptText, ShieldAlert, Vault } from 'lucide-react'
import { fmtMonths, leanMonth, monthLabel, shiftMonth, currentMonth } from '../lib/finance.js'
import { Banner, Card, NumberField, Tag } from './ui.jsx'

const MAX = 100_000_000
const SCALE = 12 // months shown on the meter
const MINIMUM = 3 // months of expenses generally treated as the least to hold

export default function LeanMonth({ settings, onSetting, money }) {
  const r = leanMonth(settings)
  const hasGap = r.gap > 0
  const emptyDate = hasGap && Number.isFinite(r.runway) ? monthLabel(shiftMonth(currentMonth(), Math.floor(r.runway))) : null
  const meter = hasGap ? Math.min(r.runway / 12, 1) * 100 : 100

  const banner = {
    ok: {
      tone: 'good', icon: CheckCircle2, title: 'Expected income covers your expenses',
      body: `After the ${settings.taxRate}% tax reserve you keep ${money.fmt(-r.gap)} a month. Your savings stay untouched.`,
    },
    watch: {
      tone: 'warn', icon: AlertTriangle, title: `Lean month ahead — short ${money.fmt(r.gap)} a month`,
      body: `Projected income is not enough. Savings can fill the gap for ${fmtMonths(r.runway)}, until about ${emptyDate}.`,
    },
    warning: {
      tone: 'warn', icon: AlertTriangle, title: `Warning — savings last only ${fmtMonths(r.runway)}`,
      body: `Projected income falls ${money.fmt(r.gap)} short each month. Savings run out around ${emptyDate}. Line up work or cut costs now.`,
    },
    critical: {
      tone: 'bad', icon: ShieldAlert,
      title: settings.savingsBalance > 0 ? `Critical — under 3 months of cover` : 'Critical — no savings to cover the gap',
      body:
        settings.savingsBalance > 0
          ? `You are short ${money.fmt(r.gap)} a month and savings cover just ${fmtMonths(r.runway)}. This needs action immediately.`
          : `You are short ${money.fmt(r.gap)} a month with nothing in reserve.`,
    },
  }[r.status]

  // Emergency cover: how long savings alone pay the bills, and what is missing to reach the 3-month minimum.
  const cover = r.zeroIncomeRunway
  const coverPct = Math.min(cover / SCALE, 1) * 100
  const toMinimum = Math.max(MINIMUM * settings.expectedExpenses - settings.savingsBalance, 0)
  const fill = r.status === 'critical' ? 'bg-bad' : r.status === 'ok' ? 'bg-good' : 'bg-accent'

  return (
    <Card className="p-5 sm:p-6" data-testid="runway-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl leading-tight">Savings runway</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">Lean-month warning: what if a slow month becomes the norm?</p>
        </div>
        <Tag kind="simulated" />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
        <div className="min-w-0">
          <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Figure icon={Vault} label="Emergency savings" value={money.fmt(settings.savingsBalance)} testid="rw-savings" />
            <Figure icon={ReceiptText} label="Essential expenses" value={money.fmt(settings.expectedExpenses)} sub="/ mo" testid="rw-expenses" />
            <Figure icon={Hourglass} label="Cover with no income" value={fmtMonths(cover)} tone={cover < MINIMUM ? 'text-bad' : ''} testid="rw-cover" />
          </dl>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <NumberField label="Expected income" prefix={money.symbol} value={settings.expectedIncome} max={MAX} onChange={(v) => onSetting('expectedIncome', v)} hint="Per month, before tax" />
            <NumberField label="Monthly expenses" prefix={money.symbol} value={settings.expectedExpenses} max={MAX} onChange={(v) => onSetting('expectedExpenses', v)} hint="What you need to live" />
            <NumberField label="Savings balance" prefix={money.symbol} value={settings.savingsBalance} max={MAX} onChange={(v) => onSetting('savingsBalance', v)} hint="Your cushion today" />
          </div>
        </div>

        <div className="min-w-0 rounded-xl bg-sand/50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-[13px] font-medium text-ink-2">At your expected income, savings last</p>
              <p data-testid="runway" className="mt-1 font-display text-6xl leading-none">
                {hasGap ? fmtMonths(r.runway) : 'Indefinitely'}
              </p>
            </div>
            <div className="text-[13px] text-ink-2 sm:text-right">
              <p>
                Take-home <span className="num font-semibold text-ink">{money.fmt(r.takeHome)}</span>
              </p>
              <p>
                {hasGap ? 'Monthly shortfall' : 'Monthly surplus'}{' '}
                <span className={`num font-semibold ${hasGap ? 'text-bad' : 'text-good'}`}>{money.fmt(Math.abs(r.gap))}</span>
              </p>
            </div>
          </div>

          <div className="mt-5" aria-hidden>
            <div className="relative">
              <div className="h-3 overflow-hidden rounded-full bg-white">
                <div className={`ease-meter h-full rounded-full ${fill}`} style={{ width: `${Math.max(meter, 2)}%` }} />
              </div>
              {/* where savings alone (no income at all) would run out */}
              <span
                className="ease-meter absolute -bottom-1.5 -top-1.5 w-0.5 rounded-full bg-ink"
                style={{ left: `calc(${coverPct}% - 1px)`, transition: 'left 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
              />
            </div>
            <div className="num mt-2 flex justify-between text-[11px] text-ink-3">
              <span>0</span>
              <span>3 mo</span>
              <span>6 mo</span>
              <span>9 mo</span>
              <span>12+ mo</span>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-2">
            <span className="h-3.5 w-0.5 rounded-full bg-ink" /> With no income at all, the same savings cover {fmtMonths(cover)} of expenses.
          </p>

          <div className="mt-4">
            <Banner tone={banner.tone} icon={banner.icon} title={banner.title}>
              {banner.body}
            </Banner>
          </div>
          {toMinimum > 0 && (
            <p data-testid="rw-minimum" className="mt-3 text-[13px] leading-relaxed text-bad">
              <strong className="font-semibold">Savings are below a {MINIMUM}-month emergency fund.</strong>{' '}
              <span className="text-ink-2">Another {money.fmt(toMinimum)} would get you there.</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function Figure({ icon: Icon, label, value, sub, tone = '', testid }) {
  return (
    <div className="rounded-xl border border-line bg-white/60 px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-3">
        <Icon size={13} aria-hidden /> {label}
      </dt>
      <dd className="mt-1">
        <span data-testid={testid} className={`num text-lg font-semibold leading-tight ${tone}`}>{value}</span>
        {sub && <span className="ml-1 whitespace-nowrap text-xs text-ink-3">{sub}</span>}
      </dd>
    </div>
  )
}
