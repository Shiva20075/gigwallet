import { Card, NumberField } from './ui.jsx'

export default function PlanPanel({ planned, settings, onSetting, money }) {
  const short = planned.available < 0
  const lines = [
    ['Income', planned.income, ''],
    ['Expenses', -planned.expenses, '−'],
    [`Tax reserve (${settings.taxRate}%)`, -planned.tax, '−'],
    ['Savings target', -planned.savings, '−'],
  ]

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="font-display text-2xl leading-tight">Savings &amp; tax plan</h3>
      <p className="mt-0.5 text-[13px] text-ink-3">Change a number and everything recalculates.</p>

      <div className="mt-5 space-y-4">
        <NumberField
          label="Monthly savings target"
          prefix={money.symbol}
          value={settings.savingsTarget}
          min={0}
          max={1000000}
          onChange={(v) => onSetting('savingsTarget', v)}
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="tax-slider" className="text-[13px] font-medium text-ink-2">
              Tax reserve rate
            </label>
            <span className="num text-sm font-semibold">{settings.taxRate}%</span>
          </div>
          <input
            id="tax-slider"
            type="range"
            min={0}
            max={60}
            step={1}
            value={settings.taxRate}
            onChange={(e) => onSetting('taxRate', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
        {lines.map(([label, v, sign]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-ink-2">{label}</dt>
            <dd className="num font-medium">
              {sign}
              {money.fmt(Math.abs(v))}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="font-semibold">Disposable income</dt>
          <dd data-testid="disposable" className={`num text-xl font-semibold ${short ? 'text-bad' : ''}`}>
            {money.fmt(planned.available)}
          </dd>
        </div>
      </dl>
      {short && (
        <p role="status" className="mt-3 rounded-xl border border-bad/25 bg-bad-soft px-3.5 py-2.5 text-[13px] font-medium text-bad">
          Short by {money.fmt(-planned.available)}. Lower the savings target or trim expenses to balance this month.
        </p>
      )}
    </Card>
  )
}
