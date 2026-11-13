import { useEffect, useId, useRef, useState } from 'react'
import { CircleDot, FlaskConical, History, X } from 'lucide-react'

export function Card({ className = '', children, ...rest }) {
  return (
    <section className={`rounded-2xl border border-line bg-card ${className}`} {...rest}>
      {children}
    </section>
  )
}

export function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>}
        <h2 className="font-display text-[1.7rem] leading-tight text-ink">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// A number input that only commits valid values. While the user is typing
// something invalid the last good value stays in effect and an error shows.
export function NumberField({ label, value, onChange, min = 0, max, prefix, suffix, hint, compact = false }) {
  const id = useId()
  const [draft, setDraft] = useState(null) // null = not editing
  const text = draft ?? String(value)

  const parsed = text.trim() === '' ? NaN : Number(text)
  let error = null
  if (!Number.isFinite(parsed)) error = 'Enter a number'
  else if (parsed < min) error = `Must be at least ${min}`
  else if (max != null && parsed > max) error = `Must be ${max} or less`

  const handle = (e) => {
    const next = e.target.value
    setDraft(next)
    const n = next.trim() === '' ? NaN : Number(next)
    if (Number.isFinite(n) && n >= min && (max == null || n <= max)) onChange(n)
  }

  return (
    <div className={compact ? '' : 'w-full'}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <div
        className={`flex items-center rounded-xl border bg-white transition-colors focus-within:border-ink ${
          error ? 'border-bad' : 'border-line'
        } ${compact ? 'h-9 px-2.5' : 'h-11 px-3.5'}`}
      >
        {prefix && <span className="mr-1.5 text-sm text-ink-3">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          value={text}
          onChange={handle}
          onFocus={() => setDraft(String(value))}
          onBlur={() => setDraft(null)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`num w-full min-w-0 bg-transparent font-medium text-ink outline-none ${compact ? 'text-sm' : 'text-[15px]'}`}
        />
        {suffix && <span className="ml-1.5 text-sm text-ink-3">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-bad">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>
      )}
    </div>
  )
}

export function Modal({ title, subtitle, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('[data-autofocus]')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-rise max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl leading-tight">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-sand"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const TONES = {
  good: 'border-good/25 bg-good-soft text-good',
  warn: 'border-warn/25 bg-warn-soft text-warn',
  bad: 'border-bad/25 bg-bad-soft text-bad',
  neutral: 'border-line bg-sand text-ink-2',
}

// Says what kind of number the reader is looking at: money that really moved,
// a closed past month, or a what-if that exists only on screen.
const KINDS = {
  actual: { icon: CircleDot, label: 'Actual', cls: 'border-ink/15 bg-card text-ink' },
  historical: { icon: History, label: 'Historical', cls: 'border-line bg-sand/70 text-ink-2' },
  simulated: { icon: FlaskConical, label: 'Simulated', cls: 'border-dashed border-accent/60 bg-accent-soft/50 text-accent-deep' },
}

export function Tag({ kind = 'actual', children, onDark = false }) {
  const k = KINDS[kind]
  const Icon = k.icon
  return (
    <span
      data-kind={kind}
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wider ${
        onDark ? 'border-white/20 bg-white/10 text-white/85' : k.cls
      }`}
    >
      <Icon size={12} aria-hidden />
      {children ?? k.label}
    </span>
  )
}

// Circular progress, 0-100. Purely presentational.
export function Ring({ value, size = 168, stroke = 12, color = 'var(--color-accent)', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(Math.max(value, 0), 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sand)" strokeWidth={stroke} />
        <circle
          className="ring-arc"
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

// A thin horizontal meter that eases to its value.
export function Meter({ value, tone = 'bg-accent', track = 'bg-sand', className = 'h-1.5' }) {
  return (
    <div className={`overflow-hidden rounded-full ${track} ${className}`} aria-hidden>
      <div className={`ease-meter h-full rounded-full ${tone}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

export function Banner({ tone = 'neutral', icon: Icon, title, children }) {
  return (
    <div role="status" className={`flex gap-3 rounded-xl border p-4 ${TONES[tone]}`}>
      {Icon && <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />}
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug">{title}</p>
        {children && <p className="mt-1 text-sm leading-relaxed text-ink">{children}</p>}
      </div>
    </div>
  )
}

export const btn = {
  primary:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-ink transition hover:brightness-105 active:scale-[0.98]',
  dark:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-ink/85 active:scale-[0.98]',
  ghost:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink transition hover:bg-sand active:scale-[0.98]',
  danger:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-bad px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]',
}
