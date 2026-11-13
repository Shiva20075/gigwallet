import { useCallback, useMemo, useState } from 'react'
import CashflowChart from './components/CashflowChart.jsx'
import Header from './components/Header.jsx'
import LeanMonth from './components/LeanMonth.jsx'
import Overview from './components/Overview.jsx'
import PlanPanel from './components/PlanPanel.jsx'
import ResilienceScore from './components/ResilienceScore.jsx'
import ShockSimulator from './components/ShockSimulator.jsx'
import TransactionModal from './components/TransactionModal.jsx'
import Transactions from './components/Transactions.jsx'
import { Modal, SectionHeading, Tag, btn } from './components/ui.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import {
  currentMonth, flexibleTotal, makeMoney, monthLabel, monthOf, monthTotals, monthlySeries, plan, todayISO,
} from './lib/finance.js'
import { DEFAULT_SETTINGS, FLEXIBLE_CATEGORIES, buildSampleTransactions, newId } from './lib/sampleData.js'

const seed = () => ({ transactions: buildSampleTransactions(), settings: DEFAULT_SETTINGS })
// Data saved before schema 2 carried the old USD default; switch it to INR once.
// Transactions and every other setting are kept as they were.
const revive = (v) => {
  if (!v || !Array.isArray(v.transactions) || !v.settings) return null
  const settings = { ...DEFAULT_SETTINGS, ...v.settings, schema: DEFAULT_SETTINGS.schema }
  if (!v.settings.schema) settings.currency = DEFAULT_SETTINGS.currency
  return { ...v, settings }
}

export default function App() {
  const [data, setData] = useLocalStorage('gigwallet:v1', seed, revive)
  const { transactions, settings } = data

  const [month, setMonth] = useState(currentMonth)
  const [dialog, setDialog] = useState(null) // {kind:'add'} | {kind:'edit',tx} | {kind:'delete',tx} | {kind:'reset'}
  const close = useCallback(() => setDialog(null), [])

  const money = useMemo(() => makeMoney(settings.currency), [settings.currency])
  const totals = useMemo(() => monthTotals(transactions, month), [transactions, month])
  const planned = useMemo(() => plan({ ...totals, ...settings }), [totals, settings])
  const series = useMemo(() => monthlySeries(transactions, month), [transactions, month])
  const flexible = useMemo(() => flexibleTotal(transactions, month, FLEXIBLE_CATEGORIES), [transactions, month])
  const monthName = monthLabel(month)
  // What kind of data the open month holds: money that is moving now, a closed month, or one not started.
  const today = currentMonth()
  const monthKind = month === today ? 'actual' : month < today ? 'historical' : 'future'
  const prev = series[series.length - 2] // the month before the open one

  const setSetting = (key, value) => setData((d) => ({ ...d, settings: { ...d.settings, [key]: value } }))

  const saveTransaction = (fields) => {
    setData((d) => ({
      ...d,
      transactions:
        dialog.kind === 'edit'
          ? d.transactions.map((t) => (t.id === dialog.tx.id ? { ...t, ...fields } : t))
          : [...d.transactions, { id: newId(), ...fields }],
    }))
    setMonth(monthOf(fields.date)) // follow the entry so the user sees it land
    close()
  }

  const deleteTransaction = () => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== dialog.tx.id) }))
    close()
  }

  const resetData = () => {
    setData(seed())
    setMonth(currentMonth())
    close()
  }

  // New entries default to today, or to the 1st of whichever past/future month is open.
  const defaultDate = month === currentMonth() ? todayISO() : `${month}-01`
  const openAdd = () => setDialog({ kind: 'add' })

  return (
    <div id="top">
      <Header
        month={month}
        onMonth={setMonth}
        currency={settings.currency}
        onCurrency={(c) => setSetting('currency', c)}
        onAdd={openAdd}
        onReset={() => setDialog({ kind: 'reset' })}
      />

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">Dashboard · {monthName}</p>
              <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
                Steady plans for <em className="text-accent-deep">unsteady</em> income.
              </h1>
            </div>
            <p className="flex items-center gap-2 text-[13px] text-ink-2" data-testid="month-kind">
              {monthKind === 'actual' && <><Tag kind="actual" /> Logged transactions, month to date</>}
              {monthKind === 'historical' && <><Tag kind="historical" /> A closed month from your records</>}
              {monthKind === 'future' && <><Tag kind="simulated">Upcoming</Tag> Only entries you have dated ahead</>}
            </p>
          </div>
          <Overview monthName={monthName} monthKind={monthKind} totals={totals} prev={prev} planned={planned} settings={settings} onSetting={setSetting} money={money} />
          <ResilienceScore totals={totals} settings={settings} monthName={monthName} money={money} />
          <div className="grid gap-4 lg:grid-cols-[2fr_1.15fr]">
            <CashflowChart series={series} month={month} onMonth={setMonth} money={money} />
            <PlanPanel planned={planned} settings={settings} onSetting={setSetting} money={money} />
          </div>
        </div>

        <Transactions
          monthKind={monthKind}
          transactions={transactions}
          month={month}
          monthName={monthName}
          money={money}
          onAdd={openAdd}
          onEdit={(tx) => setDialog({ kind: 'edit', tx })}
          onDelete={(tx) => setDialog({ kind: 'delete', tx })}
        />

        <div className="space-y-4">
          <SectionHeading eyebrow="Stress test" title="Can you ride out a bad stretch?">
            <p className="flex items-center gap-2 text-[13px] text-ink-2">
              <Tag kind="simulated" /> Projections only. Nothing here changes your records.
            </p>
          </SectionHeading>
          <LeanMonth settings={settings} onSetting={setSetting} money={money} />
          <ShockSimulator totals={totals} flexible={flexible} settings={settings} monthName={monthName} money={money} />
        </div>

        <footer className="border-t border-line pt-6 text-[13px] text-ink-3">
          GigWallet keeps everything in this browser. Sample data is fictional. Figures are planning estimates, not tax advice.
        </footer>
      </main>

      {(dialog?.kind === 'add' || dialog?.kind === 'edit') && (
        <TransactionModal
          initial={dialog.tx}
          defaultDate={defaultDate}
          symbol={money.symbol}
          onSave={saveTransaction}
          onClose={close}
        />
      )}

      {dialog?.kind === 'delete' && (
        <Modal title="Delete this transaction?" onClose={close}>
          <div className="rounded-xl bg-sand p-4">
            <p className="font-medium">{dialog.tx.note || dialog.tx.category}</p>
            <p className="num text-sm text-ink-2">
              {dialog.tx.type === 'income' ? '+' : '−'}
              {money.fmt(dialog.tx.amount)} · {dialog.tx.category} · {dialog.tx.date}
            </p>
          </div>
          <p className="mt-3 text-sm text-ink-2">It will be removed from your totals. This cannot be undone.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className={btn.ghost}>Keep it</button>
            <button type="button" data-autofocus onClick={deleteTransaction} className={btn.danger}>Delete</button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'reset' && (
        <Modal title="Reset to demo data?" subtitle="Replaces all your transactions and settings with the fictional sample set." onClose={close}>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className={btn.ghost}>Cancel</button>
            <button type="button" data-autofocus onClick={resetData} className={btn.dark}>Reset data</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
