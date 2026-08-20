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

// A compact label for pills.
export function recurrenceShort(r?: Recurrence): string {
  if (!isRepeating(r)) return ''
  const { freq, interval } = r!
  const units: Record<string, string> = { daily: 'days', weekly: 'wks', monthly: 'mos', yearly: 'yrs', none: '' }
  const labels: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', none: '' }
  if (interval > 1) return `Every ${interval} ${units[freq]}`
  return labels[freq]
}
