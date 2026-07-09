import {
  format,
  formatDistanceToNowStrict,
  isPast,
  isToday,
  isTomorrow,
  isThisWeek,
  differenceInCalendarDays,
} from 'date-fns'

export function fmtTime(iso: string): string {
  return format(new Date(iso), 'h:mm a')
}

export function fmtDay(iso: string): string {
  return format(new Date(iso), 'EEE, MMM d')
}

export function fmtDayShort(iso: string): string {
  return format(new Date(iso), 'MMM d')
}

export function fmtRelativeDue(iso: string): { label: string; tone: 'overdue' | 'soon' | 'later' } {
  const d = new Date(iso)
  if (isToday(d)) return { label: 'Due today', tone: 'soon' }
  if (isTomorrow(d)) return { label: 'Due tomorrow', tone: 'soon' }
  if (isPast(d)) {
    const days = Math.abs(differenceInCalendarDays(d, new Date()))
    return { label: `${days}d overdue`, tone: 'overdue' }
  }
  const days = differenceInCalendarDays(d, new Date())
  if (days <= 6) return { label: `Due ${format(d, 'EEE')}`, tone: 'soon' }
  return { label: `Due ${format(d, 'MMM d')}`, tone: 'later' }
}

export function fmtMessageTime(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isTomorrow(d)) return `Tomorrow ${format(d, 'h:mm a')}`
  if (isThisWeek(d)) return format(d, 'EEE h:mm a')
  return format(d, 'MMM d, h:mm a')
}

export function fmtAgo(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}

export { isPast, isToday, isTomorrow }
