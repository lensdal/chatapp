import { format } from 'date-fns'
import type { Recurrence } from '../types'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export const NO_REPEAT: Recurrence = { freq: 'none', interval: 1 }

export function isRepeating(r?: Recurrence): boolean {
  return !!r && r.freq !== 'none'
}

// A human summary, Google-Calendar style: "Weekly on Mon, Wed", "Every 2 weeks".
export function recurrenceSummary(r?: Recurrence): string {
  if (!isRepeating(r)) return ''
  const { freq, interval, weekdays, until, count } = r!
  const every = interval > 1
  let base = ''
  if (freq === 'daily') base = every ? `Every ${interval} days` : 'Daily'
  else if (freq === 'weekly') {
    const days =
      weekdays && weekdays.length
        ? ' on ' + [...weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join(', ')
        : ''
    base = (every ? `Every ${interval} weeks` : 'Weekly') + days
  } else if (freq === 'monthly') base = every ? `Every ${interval} months` : 'Monthly'
  else if (freq === 'yearly') base = every ? `Every ${interval} years` : 'Yearly'

  if (until) return `${base} until ${format(new Date(until), 'MMM d, yyyy')}`
  if (count) return `${base} · ${count}×`
  return base
}

// Clamp a monthly/yearly roll-over so e.g. Jan 31 + 1 month → Feb 28, not Mar 3.
function addMonthsClamped(base: Date, months: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1, base.getHours(), base.getMinutes())
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(base.getDate(), daysInMonth))
  return d
}

// Expand a single dated item's recurrence into concrete occurrence timestamps
// that fall within [rangeStart, rangeEnd]. Non-repeating items yield at most
// their own date. Chronological; bounded by `until`, `count`, and a hard cap.
export function occurrencesInRange(
  baseISO: string,
  rec: Recurrence | undefined,
  rangeStartISO: string,
  rangeEndISO: string,
  cap = 500,
): string[] {
  const base = new Date(baseISO)
  const rangeStart = new Date(rangeStartISO)
  const rangeEnd = new Date(rangeEndISO)
  const out: string[] = []

  if (!isRepeating(rec)) {
    if (base >= rangeStart && base <= rangeEnd) out.push(base.toISOString())
    return out
  }

  const { freq, weekdays } = rec!
  const interval = Math.max(1, rec!.interval || 1)
  const until = rec!.until ? new Date(rec!.until) : null
  const maxCount = rec!.count && rec!.count > 0 ? rec!.count : Infinity
  let count = 0

  // Returns false when generation should stop entirely.
  const consider = (d: Date): boolean => {
    if (d < base) return true // earlier than the series start — skip, keep going
    if (count >= maxCount) return false
    if (until && d > until) return false
    if (d > rangeEnd) return false // chronological, nothing later can qualify
    count += 1
    if (d >= rangeStart) out.push(d.toISOString())
    return true
  }

  if (freq === 'weekly' && weekdays && weekdays.length) {
    const days = [...new Set(weekdays)].sort((a, b) => a - b)
    const weekSunday = new Date(base)
    weekSunday.setDate(base.getDate() - base.getDay())
    weekSunday.setHours(base.getHours(), base.getMinutes(), 0, 0)
    for (let block = 0; block < cap; block += 1) {
      const blockSunday = new Date(weekSunday)
      blockSunday.setDate(weekSunday.getDate() + block * interval * 7)
      if (blockSunday > rangeEnd && blockSunday > base) break
      let stop = false
      for (const wd of days) {
        const d = new Date(blockSunday)
        d.setDate(blockSunday.getDate() + wd)
        if (!consider(d)) { stop = true; break }
      }
      if (stop) break
    }
    return out
  }

  for (let k = 0; k < cap; k += 1) {
    let d: Date
    if (freq === 'daily') {
      d = new Date(base)
      d.setDate(base.getDate() + k * interval)
    } else if (freq === 'weekly') {
      d = new Date(base)
      d.setDate(base.getDate() + k * interval * 7)
    } else if (freq === 'monthly') {
      d = addMonthsClamped(base, k * interval)
    } else {
      d = addMonthsClamped(base, k * interval * 12)
    }
    if (!consider(d)) break
  }
  return out
}

// Expand a list of dated, possibly-recurring items into display occurrences.
export function expandOccurrences<T extends { id: string; date: string; recurrence?: Recurrence }>(
  items: T[],
  rangeStartISO: string,
  rangeEndISO: string,
): { item: T; date: string; key: string }[] {
  const out: { item: T; date: string; key: string }[] = []
  for (const it of items) {
    for (const occ of occurrencesInRange(it.date, it.recurrence, rangeStartISO, rangeEndISO)) {
      out.push({ item: it, date: occ, key: `${it.id}@${occ}` })
    }
  }
  return out.sort((a, b) => +new Date(a.date) - +new Date(b.date))
}

// A compact label for pills.
export function recurrenceShort(r?: Recurrence): string {
  if (!isRepeating(r)) return ''
  const { freq, interval } = r!
  const units: Record<string, string> = { daily: 'days', weekly: 'wks', monthly: 'mos', yearly: 'yrs', none: '' }
  const labels: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', none: '' }
  if (interval > 1) return `Every ${interval} ${units[freq]}`
  return labels[freq]
}
