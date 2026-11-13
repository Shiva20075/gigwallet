import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { monthLabel } from '../lib/finance.js'
import { Card, Tag } from './ui.jsx'

const INCOME = '#16130f'
const EXPENSE = '#e8590c'

function Tip({ active, payload, money }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const net = d.income - d.expenses
  return (
    <div className="min-w-44 rounded-xl border border-line bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold">{monthLabel(d.month)}</p>
      <Row swatch={INCOME} label="Income" value={money.fmt(d.income)} />
      <Row swatch={EXPENSE} label="Expenses" value={money.fmt(d.expenses)} />
      <div className="mt-2 flex justify-between border-t border-line pt-2">
        <span className="text-ink-2">Net</span>
        <span className="num font-semibold">{money.signed(net)}</span>
      </div>
    </div>
  )
}

function Row({ swatch, label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 py-0.5">
      <span className="flex items-center gap-2 text-ink-2">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: swatch }} />
        {label}
      </span>
      <span className="num font-medium">{value}</span>
    </div>
  )
}

export default function CashflowChart({ series, month, onMonth, money }) {
  const empty = series.every((d) => d.income === 0 && d.expenses === 0)
  // Irregular income is the whole point: show the average and how far the months swing.
  const avg = (key) => series.reduce((sum, d) => sum + d[key], 0) / series.length
  const avgIncome = avg('income')
  const incomes = series.map((d) => d.income)
  const dim = (d) => (d.month === month ? 1 : 0.42) // the open month is solid, the rest are history
  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2.5 font-display text-2xl leading-tight">
            Income vs expenses <Tag kind="historical">6-month history</Tag>
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">Ending {monthLabel(month)}. Select a bar to open that month.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: INCOME }} /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: EXPENSE }} /> Expenses
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-ink-3" /> Avg income
          </span>
        </div>
      </div>

      {!empty && (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-3 text-[13px]">
          {[
            ['Avg income', money.whole(avgIncome)],
            ['Avg expenses', money.whole(avg('expenses'))],
            ['Income range', `${money.compact(Math.min(...incomes))} – ${money.compact(Math.max(...incomes))}`],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="truncate text-ink-3">{label}</dt>
              <dd className="num text-sm font-semibold sm:text-[15px]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-5 h-64 lg:h-auto lg:min-h-64 lg:flex-1">
        {empty ? (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-line bg-sand/40 px-6 text-center text-sm text-ink-2">
            <p>
              <span className="block font-medium text-ink">No history to chart yet</span>
              Log income or expenses and the last six months appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              barGap={2}
              barCategoryGap="28%"
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              onClick={(e) => e?.activeLabel && onMonth(series.find((d) => d.label === e.activeLabel)?.month ?? month)}
            >
              <CartesianGrid vertical={false} stroke="#e4dccd" strokeDasharray="0" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={({ x, y, payload }) => {
                  const open = series[payload.index]?.month === month
                  return (
                    <text x={x} y={y + 4} textAnchor="middle" fontSize={12.5} fontWeight={open ? 700 : 400} fill={open ? '#16130f' : '#5a5349'}>
                      {payload.value}
                    </text>
                  )
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={52}
                tickCount={5}
                tickFormatter={(v) => money.compact(v)}
                tick={{ fill: '#6f675b', fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: '#ede7da', opacity: 0.7 }} content={<Tip money={money} />} />
              <ReferenceLine y={avgIncome} stroke="#6f675b" strokeDasharray="5 4" strokeWidth={1.5} ifOverflow="extendDomain" />
              <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} cursor="pointer">
                {series.map((d) => <Cell key={d.month} fillOpacity={dim(d)} />)}
              </Bar>
              <Bar dataKey="expenses" name="Expenses" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} cursor="pointer">
                {series.map((d) => <Cell key={d.month} fillOpacity={dim(d)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
