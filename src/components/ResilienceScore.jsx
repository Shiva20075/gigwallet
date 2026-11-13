import { Hourglass, Scale, Zap } from 'lucide-react'
import { RESILIENCE, SHOCK_PCT, fmtMonths, resilienceScore } from '../lib/finance.js'
import { Card, Meter, Ring } from './ui.jsx'

const BANDS = {
  strong: { label: 'Strong', cls: 'bg-good-soft text-good', ring: 'var(--color-good)', line: 'You could absorb a bad stretch without changing how you live.' },
  steady: { label: 'Steady', cls: 'bg-good-soft text-good', ring: 'var(--color-accent)', line: 'Solid footing, with one or two soft spots worth firming up.' },
  exposed: { label: 'Exposed', cls: 'bg-warn-soft text-warn', ring: 'var(--color-accent)', line: 'A slow month would force real trade-offs. The weakest factor is the place to start.' },
  'at-risk': { label: 'At risk', cls: 'bg-bad-soft text-bad', ring: 'var(--color-bad)', line: 'There is little slack if income drops. Work through the recovery plan below.' },
}

const pct = (n) => `${Math.round(n * 100)}%`

export default function ResilienceScore({ totals, settings, monthName, money }) {
  const r = resilienceScore({ ...totals, ...settings })
  const band = BANDS[r.band]
  const { surplus, shock, runway } = r.factors

  const factors = [
    {
      key: 'surplus', icon: Scale, name: 'Budget surplus', f: surplus,
      text: !r.hasIncome
        ? `No income logged for ${monthName} yet.`
        : surplus.available < 0
          ? `Over-committed by ${money.fmt(-surplus.available)} after expenses, tax and savings.`
          : `${pct(surplus.margin)} of income is left after expenses, tax and savings. Full marks at ${pct(RESILIENCE.surplus.fullAt)}.`,
    },
    {
      key: 'shock', icon: Zap, name: 'Shock affordability', f: shock,
      text: !r.hasIncome
        ? 'Needs income to simulate a shock.'
        : `After a ${SHOCK_PCT}% income drop, what is left after tax covers ${pct(shock.coverage)} of expenses and savings. Points start above ${pct(RESILIENCE.shock.floor)}.`,
    },
    {
      key: 'runway', icon: Hourglass, name: 'Savings runway', f: runway,
      text: `Savings cover ${fmtMonths(runway.months)} of expected expenses. Full marks at ${RESILIENCE.runway.fullAt} months.`,
    },
  ]

  return (
    <Card className="p-5 sm:p-6" data-testid="resilience">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-8">
        <div className="flex flex-row items-center gap-5 lg:w-52 lg:flex-col lg:items-start lg:gap-4">
          <Ring value={r.score} color={band.ring}>
            <div>
              <p data-testid="resilience-score" className="num font-display text-6xl leading-none">{r.score}</p>
              <p className="mt-1 text-xs font-medium text-ink-3">out of 100</p>
            </div>
          </Ring>
          <div className="min-w-0">
            <span data-testid="resilience-band" className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${band.cls}`}>
              {band.label}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{band.line}</p>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-tight">Financial resilience score</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            How well {monthName}&rsquo;s budget and your savings would hold up if income fell.
          </p>

          <ul className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-3">
            {factors.map(({ key, icon: Icon, name, f, text }) => (
              <li key={key} data-testid={`factor-${key}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon size={15} className="text-accent-deep" aria-hidden /> {name}
                  </span>
                  <span className="num text-sm text-ink-2">
                    <strong className="font-semibold text-ink">{Math.round(f.points)}</strong> / {f.max}
                  </span>
                </div>
                <Meter className="mt-2 h-1.5" value={(f.points / f.max) * 100} tone="bg-ink" />
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ul>

          <details className="group mt-5 border-t border-line pt-3 text-[13px] text-ink-2">
            <summary className="cursor-pointer select-none font-medium text-ink hover:text-accent-deep">
              How this is calculated
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>
                <strong className="font-semibold">Budget surplus, {RESILIENCE.surplus.max} points.</strong> Available balance ÷ income.
                Scored evenly from 0% (no points) to {pct(RESILIENCE.surplus.fullAt)} (full).
              </li>
              <li>
                <strong className="font-semibold">Shock affordability, {RESILIENCE.shock.max} points.</strong> Income after a {SHOCK_PCT}% drop and tax ÷
                (expenses + savings target). Scored evenly from {pct(RESILIENCE.shock.floor)} (no points) to 100% (full).
              </li>
              <li>
                <strong className="font-semibold">Savings runway, {RESILIENCE.runway.max} points.</strong> Savings balance ÷ expected monthly
                expenses. Scored evenly from 0 to {RESILIENCE.runway.fullAt} months.
              </li>
            </ul>
          </details>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            An illustrative planning indicator based only on the figures in this app. It is not a credit score or a professional financial assessment.
          </p>
        </div>
      </div>
    </Card>
  )
}
