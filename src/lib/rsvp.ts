import type { EventItem, RSVPStatus } from '../types'

export function rsvpsByStatus(event: EventItem, status: RSVPStatus): string[] {
  const r = event.rsvps ?? {}
  return Object.keys(r).filter((id) => r[id].status === status)
}

// Total heads coming: sum of adults + children across "going" RSVPs. A "going"
// with no counts is treated as 1 adult.
export function headcount(event: EventItem): {
  responders: number
  adults: number
  children: number
  total: number
} {
  const going = Object.values(event.rsvps ?? {}).filter((e) => e.status === 'going')
  let adults = 0
  let children = 0
  for (const e of going) {
    const a = e.adults ?? (e.children ? 0 : 1)
    adults += a
    children += e.children ?? 0
  }
  return { responders: going.length, adults, children, total: adults + children }
}
