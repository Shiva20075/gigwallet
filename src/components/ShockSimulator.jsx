import { CheckCircle2, ShieldAlert, TrendingDown, AlertTriangle } from 'lucide-react'
import { SHOCK_PCT, fmtMonths, shockScenario } from '../lib/finance.js'
import RecoveryPlan from './RecoveryPlan.jsx'
import { Banner, Card, Tag } from './ui.jsx'

export default function ShockSimulator({ totals, flexible, settings, monthName, money }) {
  const { normal, shocked, runway, verdict } = shockScenario({ ...totals, ...settings })
  const noIncome = totals.income === 0

  const rows = [
    ['Income', 'income', false],
    [`Tax reserve (${settings.taxRate}%)`, 'tax', false],
    ['Expenses', 'expenses', false],
    ['Savings funded', 'savings', true],
    ['Available balance', 'available', true],
    ['Deficit', 'deficit', true],
  ]

  const banner = {
    safe: {
      tone: 'good', icon: CheckCircle2, title: 'You can survive this shock',
      body: `Even with ${SHOCK_PCT}% less income you cover expenses, tax and your full savings target, with ${money.fmt(shocked.available)} to spare.`,
    },
    tight: {
      tone: 'warn', icon: AlertTriangle, title: 'You survive, but savings take the hit',
      body: `Bills and tax are covered, but you can only save ${money.fmt(shocked.savings)} of your ${money.fmt(settings.savingsTarget)} target and nothing is left to spend.`,
    },
    drawdown: {
      tone: 'warn', icon: AlertTriangle, title: `You survive for ${fmtMonths(runway)} — on savings`,
      body: `Income no longer covers bills. You would draw ${money.fmt(shocked.deficit)} a month from your ${money.fmt(settings.savingsBalance)} cushion and save nothing new.`,
    },
    fail: {
      tone: 'bad', icon: ShieldAlert, title: 'You cannot sustain this shock',
      body:
        settings.savingsBalance > 0
          ? `A ${money.fmt(shocked.deficit)} monthly deficit would drain your savings in ${fmtMonths(runway)}.`
          : `A ${money.fmt(shocked.deficit)} monthly deficit with no savings to draw on.`,
    },
  }[verdict]

  return (
    <Card className="p-5 sm:p-6" data-testid="shock-card">
     <div className={noIncome ? '' : 'grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-0'}>
      <div className={noIncome ? '' : 'min-w-0 lg:pr-8'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl leading-tight">Income shock simulation</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">{monthName} replayed with {SHOCK_PCT}% less income.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tag kind="simulated" />
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 text-xs font-semibold text-white">
            <TrendingDown size={13} className="text-accent" /> −{SHOCK_PCT}%
          </span>
        </div>
      </div>

      {noIncome ? (
        <div className="mt-5 grid flex-1 place-items-center rounded-xl bg-sand/50 px-6 py-12 text-center text-sm text-ink-3">
          Log some income for {monthName} to run the simulation.
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/40 text-xs uppercase tracking-wider text-ink-3">
                  <th className="px-3 py-2.5 text-left font-medium sm:px-4">&nbsp;</th>
                  <th className="px-3 py-2.5 text-right font-medium sm:px-4">Normal</th>
                  <th className="bg-accent-soft px-3 py-2.5 text-right font-semibold text-accent-deep sm:px-4">Shocked</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, key, strong]) => {
                  const delta = shocked[key] - normal[key]
                  return (
                    <tr key={key} data-testid={`shock-${key}`} className="border-t border-line align-top transition-colors hover:bg-sand/30">
                      <th scope="row" className={`px-3 py-2.5 text-left sm:px-4 ${strong ? 'font-semibold text-ink' : 'font-normal text-ink-2'}`}>
                        {label}
                      </th>
                      <td className="num px-3 py-2.5 text-right sm:px-4">{money.fmt(normal[key])}</td>
                      <td className="num bg-accent-soft/50 px-3 py-2.5 text-right sm:px-4">
                        <span className={`font-semibold ${key === 'deficit' && shocked.deficit > 0 ? 'text-bad' : ''}`}>
                          {money.fmt(shocked[key])}
                        </span>
                        <span className="block text-xs text-ink-3">
                          {Math.abs(delta) < 0.005 ? 'no change' : money.signed(delta)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5" data-testid="shock-verdict">
            <Banner tone={banner.tone} icon={banner.icon} title={banner.title}>
              {banner.body}
            </Banner>
          </div>
          <p className="mt-3 text-[13px] text-ink-3">
            Money is allocated in order: tax reserve, expenses, savings, then spending.
          </p>
        </>
      )}
      </div>

      {!noIncome && (
        <div className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {/* keyed on the shock inputs: any change to income, expenses, tax or the
              savings target starts again from a fresh recommendation */}
          <RecoveryPlan
            key={[shocked.income, shocked.tax, shocked.expenses, settings.savingsTarget, flexible].join('|')}
            shocked={shocked}
            savingsTarget={settings.savingsTarget}
            flexible={flexible}
            money={money}
          />
        </div>
      )}
     </div>
    </Card>
  )
}
