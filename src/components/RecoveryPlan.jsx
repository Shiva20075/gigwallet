import { useState } from 'react'
import { ArrowRight, CheckCircle2, LifeBuoy, RotateCcw, ShieldAlert, AlertTriangle, Wand2 } from 'lucide-react'
import { recoveryPlan, round2 } from '../lib/finance.js'
import { NumberField, Tag } from './ui.jsx'

const STATUS = {
  sustainable: { label: 'Budget sustainable', icon: CheckCircle2, cls: 'bg-good-soft text-good' },
  adjust: { label: 'Budget needs adjustment', icon: AlertTriangle, cls: 'bg-warn-soft text-warn' },
  deficit: { label: 'Budget deficit', icon: ShieldAlert, cls: 'bg-bad-soft text-bad' },
}

// A what-if planner. The two edits live in component state only: they never
// touch transactions, the savings target or localStorage.
export default function RecoveryPlan({ shocked, savingsTarget, flexible, money }) {
  const [expenseCut, setExpenseCut] = useState(null) // null = follow the recommendation
  const [savingsCut, setSavingsCut] = useState(null)

  const r = recoveryPlan({ shocked, savingsTarget, flexible, expenseCut, savingsCut })
  const status = STATUS[r.status]
  const StatusIcon = status.icon
  const edited = expenseCut != null || savingsCut != null

  // Raise the expense cut by exactly what is still missing.
  const closeGap = () => setExpenseCut(round2(Math.min(r.expenseCut + r.remainingDeficit, shocked.expenses)))
  const reset = () => {
    setExpenseCut(null)
    setSavingsCut(null)
  }

  return (
    <div data-testid="recovery">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h4 className="mr-auto flex items-center gap-2.5 font-display text-2xl leading-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-accent">
            <LifeBuoy size={17} aria-hidden />
          </span>
          Smart budget recovery
        </h4>
        <span data-testid="recovery-status" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.cls}`}>
          <StatusIcon size={14} aria-hidden /> {status.label}
        </span>
      </div>

      {r.status === 'sustainable' ? (
        <div className="mt-4 rounded-xl border border-good/25 bg-good-soft p-4">
          <p className="text-[15px] font-semibold text-good">No recovery plan needed</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            Even after the shock, {money.fmt(r.pool)} covers your {money.fmt(shocked.expenses)} of expenses and the full{' '}
            {money.fmt(savingsTarget)} savings target.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            {r.status === 'deficit' ? (
              <>
                After tax you have {money.fmt(r.pool)} for {money.fmt(shocked.expenses)} of expenses — a deficit of{' '}
                <strong data-testid="recovery-deficit" className="num font-semibold text-bad">{money.fmt(r.deficit)}</strong>. Adjust the plan below until it balances.
              </>
            ) : (
              <>
                Expenses are covered, but the shock leaves{' '}
                <strong className="num font-semibold text-warn">{money.fmt(r.savingsGap)}</strong> of your savings target unfunded.
                Trimming expenses by that much would refill it.
              </>
            )}
          </p>

          <Bridge r={r} shocked={shocked} money={money} />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Adjustment
              title="Expenses"
              testid="rec-expenses"
              original={shocked.expenses}
              revised={r.revisedExpenses}
              money={money}
              note={
                flexible > 0
                  ? r.fromEssentials > 0
                    ? `${money.fmt(r.fromFlexible)} can come from flexible spending; the other ${money.fmt(r.fromEssentials)} has to come from essentials.`
                    : `Fits within your ${money.fmt(flexible)} of flexible spending (dining, equipment, software, coworking, transport).`
                  : r.expenseCut > 0
                    ? 'No flexible spending logged this month, so this cut comes from essentials.'
                    : null
              }
            >
              <NumberField
                label="Reduce expenses by"
                prefix={money.symbol}
                value={r.expenseCut}
                max={shocked.expenses}
                onChange={setExpenseCut}
              />
            </Adjustment>

            <Adjustment
              title="Savings"
              testid="rec-savings"
              original={r.fundedSavings}
              originalLabel="Under shock"
              revised={r.revisedSavings}
              money={money}
              note={
                r.fundedSavings === 0
                  ? `Your ${money.fmt(savingsTarget)} target is already unfunded under the shock, so there is nothing more to release here.`
                  : `The shock funds ${money.fmt(r.fundedSavings)} of your ${money.fmt(savingsTarget)} target. Pausing some of it frees cash for this month only.`
              }
            >
              {r.fundedSavings === 0 ? (
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-ink-2">Reduce savings by</p>
                  <p className="num flex h-11 items-center rounded-xl border border-line bg-sand/50 px-3.5 text-[15px] font-medium text-ink-3">
                    {money.fmt(0)}
                  </p>
                </div>
              ) : (
                <NumberField
                  label="Reduce savings by"
                  prefix={money.symbol}
                  value={r.savingsCut}
                  max={r.fundedSavings}
                  onChange={setSavingsCut}
                />
              )}
            </Adjustment>
          </div>

          {/* The outcome: one dark panel, echoing the balance card at the top of the page */}
          <div
            role="status"
            data-testid="recovery-result"
            data-balanced={r.balanced}
            className="relative mt-4 overflow-hidden rounded-2xl bg-ink p-5 text-white sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                  {r.remainingDeficit > 0 ? 'Remaining deficit' : r.surplus > 0 ? 'Surplus' : 'Remaining deficit'}
                </p>
                <p
                  data-testid="sum-balance"
                  className={`num mt-2 font-display text-5xl leading-none transition-colors duration-300 ${r.balanced ? 'text-good-bright' : 'text-[#ff9b7a]'}`}
                >
                  {money.fmt(r.remainingDeficit > 0 ? r.remainingDeficit : r.surplus)}
                </p>
              </div>
              <span
                key={String(r.balanced)}
                className={`animate-pop grid h-11 w-11 shrink-0 place-items-center rounded-full ${r.balanced ? 'bg-good-bright text-ink' : 'bg-white/10 text-[#ff9b7a]'}`}
              >
                {r.balanced ? <CheckCircle2 size={22} aria-hidden /> : <ShieldAlert size={21} aria-hidden />}
              </span>
            </div>

            {r.status === 'deficit' && (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
                  <div
                    className={`ease-meter h-full rounded-full ${r.balanced ? 'bg-good-bright' : 'bg-accent'}`}
                    style={{ width: `${Math.max(r.progress * 100, 2)}%` }}
                  />
                </div>
                <p className="num mt-1.5 text-xs text-white/65">{Math.round(r.progress * 100)}% of the deficit closed</p>
              </div>
            )}

            <p className="mt-4 text-[15px] font-semibold leading-snug">
              {r.balanced ? 'Revised budget is balanced' : `Still ${money.fmt(r.remainingDeficit)} short`}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/75">
              {r.balanced
                ? r.surplus > 0
                  ? r.savingsGap > 0
                    ? `${money.fmt(r.surplus)} is left over — enough to put ${money.fmt(Math.min(r.surplus, r.savingsGap + r.savingsCut))} back toward savings.`
                    : `${money.fmt(r.surplus)} is left over after expenses and savings.`
                  : 'Income after tax now exactly covers the revised expenses and savings.'
                : 'Reduce expenses further, or the gap comes out of your savings balance.'}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-white/60">Expense reduction</dt>
                <dd data-testid="sum-expense" className="num mt-0.5 text-lg font-semibold">{money.fmt(r.expenseCut)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-white/60">Savings reduction</dt>
                <dd data-testid="sum-savings" className="num mt-0.5 text-lg font-semibold">{money.fmt(r.savingsCut)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!r.balanced && (
              <button type="button" onClick={closeGap} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-semibold text-ink transition hover:brightness-105 active:scale-[0.98]">
                <Wand2 size={14} aria-hidden /> Close the gap
              </button>
            )}
            {edited && (
              <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-ink transition hover:bg-sand active:scale-[0.98]">
                <RotateCcw size={14} aria-hidden /> Reset to recommendation
              </button>
            )}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
            <Tag kind="simulated">What-if</Tag> Your transactions and savings target are not changed.
          </p>
        </>
      )}
    </div>
  )
}

// Before and after on one scale. The tick is income after tax: anything to the
// right of it is money the month does not have.
function Bridge({ r, shocked, money }) {
  const before = round2(shocked.expenses + r.fundedSavings)
  const after = round2(r.revisedExpenses + r.revisedSavings)
  const scale = Math.max(before, r.pool) || 1
  const tick = (r.pool / scale) * 100

  return (
    <div className="mt-4 rounded-xl border border-line bg-sand/50 p-4" data-testid="recovery-bridge">
      <div className="space-y-4">
        <BridgeRow label="Shocked budget" sub="Original" value={before} pool={r.pool} scale={scale} tick={tick} money={money} muted />
        <BridgeRow label="Revised budget" sub="Recommended" value={after} pool={r.pool} scale={scale} tick={tick} money={money} />
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-0.5 rounded-full bg-ink" /> Income after tax <span className="num font-semibold text-ink">{money.fmt(r.pool)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="hatch-bad h-2.5 w-2.5 rounded-[3px]" /> Not covered
        </span>
      </p>
    </div>
  )
}

function BridgeRow({ label, sub, value, pool, scale, tick, money, muted = false }) {
  const covered = (Math.min(value, pool) / scale) * 100
  const over = (Math.max(value - pool, 0) / scale) * 100
  const spare = (Math.max(pool - value, 0) / scale) * 100
  const gap = round2(pool - value)
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-sm font-semibold">
          {label} <span className="font-normal text-ink-3">· {sub}</span>
        </p>
        <p className="num text-sm">
          <span className="text-ink-2">{money.fmt(value)}</span>{' '}
          <span className={`font-semibold ${gap < 0 ? 'text-bad' : 'text-good'}`}>
            {gap < 0 ? `−${money.fmt(-gap)}` : gap > 0 ? `+${money.fmt(gap)}` : 'balanced'}
          </span>
        </p>
      </div>
      <div className="relative mt-2" aria-hidden>
        <div className="flex h-3.5 overflow-hidden rounded-full bg-white">
          <span className={`ease-meter h-full ${muted ? 'bg-ink/45' : 'bg-ink'}`} style={{ width: `${covered}%` }} />
          <span className="ease-meter hatch-bad h-full" style={{ width: `${over}%`, opacity: muted ? 0.6 : 1 }} />
          <span className="ease-meter h-full bg-good-bright" style={{ width: `${spare}%` }} />
        </div>
        <span className="absolute -bottom-1 -top-1 w-0.5 rounded-full bg-ink" style={{ left: `calc(${tick}% - 1px)` }} />
      </div>
    </div>
  )
}

function Adjustment({ title, testid, original, originalLabel = 'Original', revised, money, note, children }) {
  const saved = round2(original - revised)
  return (
    <div data-testid={testid} className="card-hover flex flex-col rounded-xl border border-line bg-white/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className={`num rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${saved > 0 ? 'bg-good-soft text-good' : 'bg-sand text-ink-3'}`}>
          Saves {money.fmt(saved)}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-ink-3">{originalLabel}</p>
          <p data-role="original" className="num text-[15px] font-medium text-ink-2">{money.fmt(original)}</p>
        </div>
        <ArrowRight size={16} className="mt-3.5 shrink-0 text-ink-3" aria-hidden />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-ink-3">Recommended</p>
          <p data-role="revised" className="num text-[15px] font-semibold text-ink">{money.fmt(revised)}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
      {note && <p className="mt-2.5 text-xs leading-relaxed text-ink-3">{note}</p>}
    </div>
  )
}
