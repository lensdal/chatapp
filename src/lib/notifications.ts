import type { AppState } from '../types'
import { overdueTasks, paymentsDue, groupById, displayLabel } from './selectors'
import { expandOccurrences } from './recurrence'
import { fmtDay } from './dates'

export type NotifKind = 'rsvp' | 'overdue' | 'payment'

export interface Notif {
  id: string
  kind: NotifKind
  emoji: string
  title: string
  detail: string
  ts: number // for ordering — most urgent (smallest) first
  to: string // route to open
}

// Everything the current user should be nudged about, surfaced in the in-app
// notification center. RSVP nudges auto-appear for any upcoming event in the
// user's groups they haven't answered yet — no manual send required.
export function buildNotifications(state: AppState): Notif[] {
  const me = state.currentUserId
  const out: Notif[] = []
  const today0 = new Date(new Date().toDateString())
  const horizon = new Date(today0)
  horizon.setDate(today0.getDate() + 14)

  // ---- RSVP nudges (auto) ----
  const occ = expandOccurrences(state.events, today0.toISOString(), horizon.toISOString())
  const seen = new Set<string>()
  for (const o of occ) {
    const ev = o.item
    if (seen.has(ev.id)) continue
    const group = groupById(state, ev.groupId)
    if (!group) continue
    if (!group.members.some((m) => m.memberId === me)) continue // not my group
    if (ev.rsvps?.[me]) continue // already replied
    seen.add(ev.id)
    const organizer = ev.createdById ? displayLabel(state, group, ev.createdById).name : group.name
    out.push({
      id: `rsvp-${ev.id}`,
      kind: 'rsvp',
      emoji: '👋',
      title: `Let ${organizer} know if you're going`,
      detail: `${ev.title} · ${fmtDay(o.date)}`,
      ts: +new Date(o.date),
      to: '/calendar',
    })
  }

  // ---- Overdue tasks ----
  for (const t of overdueTasks(state)) {
    out.push({
      id: `overdue-${t.id}`,
      kind: 'overdue',
      emoji: '⏰',
      title: `Overdue: ${t.title}`,
      detail: t.dueDate ? `Was due ${fmtDay(t.dueDate)}` : 'Past due',
      ts: t.dueDate ? +new Date(t.dueDate) : 0,
      to: '/tasks',
    })
  }

  // ---- Payments due ----
  for (const t of paymentsDue(state)) {
    out.push({
      id: `pay-${t.id}`,
      kind: 'payment',
      emoji: '💸',
      title: `Payment due: ${t.title}`,
      detail: `$${t.payment?.amount ?? 0}${t.payment?.recipient ? ` to ${t.payment.recipient}` : ''}`,
      ts: t.dueDate ? +new Date(t.dueDate) : 0,
      to: '/',
    })
  }

  return out.sort((a, b) => a.ts - b.ts)
}
