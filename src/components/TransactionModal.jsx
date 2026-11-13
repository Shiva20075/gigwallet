import { useState } from 'react'
import { isValidISODate, todayISO } from '../lib/finance.js'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/sampleData.js'
import { Modal, btn } from './ui.jsx'

const MAX_AMOUNT = 10_000_000

export function validateTransaction(form) {
  const errors = {}
  const raw = form.amount.trim().replace(/,/g, '')
  if (raw === '') errors.amount = 'Enter an amount'
  else if (!/^\d+(\.\d{1,2})?$/.test(raw)) errors.amount = 'Use a positive number with up to 2 decimals'
  else if (Number(raw) <= 0) errors.amount = 'Amount must be greater than zero'
  else if (Number(raw) > MAX_AMOUNT) errors.amount = 'That amount is too large'

  if (!form.date) errors.date = 'Pick a date'
  else if (!isValidISODate(form.date)) errors.date = 'That is not a valid date'
  else if (form.date < '2000-01-01') errors.date = 'Date is too far in the past'
  else if (form.date > `${Number(todayISO().slice(0, 4)) + 1}-12-31`) errors.date = 'Date is too far in the future'

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  if (!cats.includes(form.category)) errors.category = form.type === 'income' ? 'Choose a source' : 'Choose a category'

  if (form.note.length > 80) errors.note = 'Keep it under 80 characters'
  return { errors, amount: Number(raw) }
}

export default function TransactionModal({ initial, defaultDate, symbol, onSave, onClose }) {
  const editing = !!initial
  const [form, setForm] = useState(() =>
    initial
      ? { type: initial.type, amount: String(initial.amount), date: initial.date, category: initial.category, note: initial.note ?? '' }
      : { type: 'expense', amount: '', date: defaultDate, category: '', note: '' },
  )
  const [submitted, setSubmitted] = useState(false)

  const { errors, amount } = validateTransaction(form)
  const show = (k) => (submitted ? errors[k] : null)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setType = (type) => setForm((f) => (f.type === type ? f : { ...f, type, category: '' }))
  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const submit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) return
    onSave({ type: form.type, amount, date: form.date, category: form.category, note: form.note.trim() })
  }

  const field = (err) =>
    `h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] outline-none transition-colors focus:border-ink ${
      err ? 'border-bad' : 'border-line'
    }`

  return (
    <Modal
      title={editing ? 'Edit transaction' : 'New transaction'}
      subtitle={editing ? 'Changes update your dashboard straight away.' : 'Log money in or money out.'}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={form.type === t}
              onClick={() => setType(t)}
              className={`h-10 rounded-lg text-sm font-semibold capitalize transition ${
                form.type === t ? 'bg-ink text-white shadow-sm' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Field label="Amount" error={show('amount')}>
          <div className={`flex h-14 items-center rounded-xl border bg-white px-4 focus-within:border-ink ${show('amount') ? 'border-bad' : 'border-line'}`}>
            <span className="mr-2 text-xl text-ink-3">{symbol}</span>
            <input
              data-autofocus
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className="num w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-ink-3/50"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" error={show('date')}>
            <input name="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={field(show('date'))} />
          </Field>
          <Field label={form.type === 'income' ? 'Source' : 'Category'} error={show('category')}>
            <select name="category" value={form.category} onChange={(e) => set('category', e.target.value)} className={field(show('category'))}>
              <option value="">Select…</option>
              {cats.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description (optional)" error={show('note')}>
          <input
            name="note"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder={form.type === 'income' ? 'Client or project' : 'What was it for?'}
            className={field(show('note'))}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button type="submit" className={btn.primary}>
            {editing ? 'Save changes' : `Add ${form.type}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-medium text-bad">
          {error}
        </span>
      )}
    </label>
  )
}
