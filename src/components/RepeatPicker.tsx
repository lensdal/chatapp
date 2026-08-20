import type { Recurrence, RepeatFreq } from '../types'
import { WEEKDAY_INITIALS, recurrenceSummary, isRepeating } from '../lib/recurrence'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

const FREQS: { id: RepeatFreq; label: string }[] = [
  { id: 'none', label: "Doesn't repeat" },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

const UNIT: Record<RepeatFreq, string> = {
  none: '',
  daily: 'day(s)',
  weekly: 'week(s)',
  monthly: 'month(s)',
  yearly: 'year(s)',
}

// A compact Google-Calendar-style recurrence editor.
export default function RepeatPicker({
  value,
  onChange,
}: {
  value: Recurrence
  onChange: (r: Recurrence) => void
}) {
  const set = (patch: Partial<Recurrence>) => onChange({ ...value, ...patch })
  const endMode: 'never' | 'until' | 'count' = value.until ? 'until' : value.count ? 'count' : 'never'

  const toggleWeekday = (d: number) => {
    const cur = value.weekdays ?? []
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    set({ weekdays: next })
  }

  return (
    <div>
      <label className={labelCls}>Repeat</label>
      <select
        className={inputCls}
        value={value.freq}
        onChange={(e) => {
          const freq = e.target.value as RepeatFreq
          set({ freq, interval: value.interval || 1, weekdays: freq === 'weekly' ? value.weekdays : undefined })
        }}
      >
        {FREQS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      {isRepeating(value) && (
        <div className="mt-3 space-y-3 rounded-2xl bg-canvas p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink/60">Every</span>
            <input
              type="number"
              min={1}
              className="w-16 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-violet"
              value={value.interval}
              onChange={(e) => set({ interval: Math.max(1, Number(e.target.value) || 1) })}
            />
            <span className="text-sm font-semibold text-ink/60">{UNIT[value.freq]}</span>
          </div>

          {value.freq === 'weekly' && (
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_INITIALS.map((ini, d) => {
                const on = (value.weekdays ?? []).includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWeekday(d)}
                    className={`h-9 w-9 rounded-full text-xs font-bold transition ${
                      on ? 'bg-violet text-white shadow-soft' : 'bg-white text-ink/55 ring-1 ring-black/10 hover:bg-black/[0.04]'
                    }`}
                    aria-label={`Repeat on day ${d}`}
                  >
                    {ini}
                  </button>
                )
              })}
            </div>
          )}

          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Ends</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => set({ until: undefined, count: undefined })}
                className={`chip ${endMode === 'never' ? 'bg-ink text-white' : 'bg-white text-ink/55 ring-1 ring-black/10'}`}
              >
                Never
              </button>
              <button
                type="button"
                onClick={() => set({ count: undefined, until: value.until ?? new Date().toISOString() })}
                className={`chip ${endMode === 'until' ? 'bg-ink text-white' : 'bg-white text-ink/55 ring-1 ring-black/10'}`}
              >
                On date
              </button>
              <button
                type="button"
                onClick={() => set({ until: undefined, count: value.count ?? 10 })}
                className={`chip ${endMode === 'count' ? 'bg-ink text-white' : 'bg-white text-ink/55 ring-1 ring-black/10'}`}
              >
                After N
              </button>
            </div>
            {endMode === 'until' && (
              <input
                type="date"
                className={`${inputCls} mt-2`}
                value={value.until ? value.until.slice(0, 10) : ''}
                onChange={(e) => set({ until: e.target.value ? new Date(`${e.target.value}T00:00`).toISOString() : undefined })}
              />
            )}
            {endMode === 'count' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-ink/60">After</span>
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded-xl border border-black/10 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-violet"
                  value={value.count ?? 10}
                  onChange={(e) => set({ count: Math.max(1, Number(e.target.value) || 1) })}
                />
                <span className="text-sm font-semibold text-ink/60">times</span>
              </div>
            )}
          </div>

          <p className="text-[11px] font-semibold text-violet">{recurrenceSummary(value)}</p>
        </div>
      )}
    </div>
  )
}
