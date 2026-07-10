import type { AppState, ChatMessage, EventItem, Group, Task } from '../types'
import { isPast, isToday } from 'date-fns'

export const byId = <T extends { id: string }>(list: T[], id?: string) =>
  list.find((x) => x.id === id)

export const memberById = (s: AppState, id?: string) => byId(s.members, id)
export const childById = (s: AppState, id?: string) => byId(s.children, id)
export const groupById = (s: AppState, id?: string) => byId(s.groups, id)

// --- membership helpers ---
export const groupMemberIds = (g: Group) => g.members.map((m) => m.memberId)
export const membershipFor = (g: Group, memberId: string) =>
  g.members.find((m) => m.memberId === memberId)
export const isAdmin = (g: Group, memberId: string) =>
  membershipFor(g, memberId)?.role === 'admin'

/** The identity shown for a member *in a specific group*: their name + a sub-label. */
export const displayLabel = (
  s: AppState,
  g: Group,
  memberId: string,
): { name: string; sub: string } => {
  const m = memberById(s, memberId)
  const gm = membershipFor(g, memberId)
  const name = m?.isSelf ? 'You' : (m?.name ?? 'Someone')
  let sub = ''
  if (gm?.displayName) sub = gm.displayName
  else if (gm?.childName && gm?.relationship) sub = `${gm.childName}'s ${gm.relationship}`
  else if (gm?.relationship) sub = gm.relationship
  else sub = m?.role ?? ''
  return { name, sub }
}

export const pollsForGroup = (s: AppState, groupId: string) =>
  s.polls.filter((p) => p.groupId === groupId)
export const collectionsForGroup = (s: AppState, groupId: string) =>
  s.collections.filter((c) => c.groupId === groupId)
export const groupByCode = (s: AppState, code: string) =>
  s.groups.find((g) => g.joinCode.toLowerCase() === code.trim().toLowerCase())

export const myGroups = (s: AppState) =>
  s.groups.filter((g) => g.members.some((m) => m.memberId === s.currentUserId))

export const amIMember = (g: Group, memberId: string) =>
  g.members.some((m) => m.memberId === memberId)

export const messagesForGroup = (s: AppState, groupId: string): ChatMessage[] =>
  s.messages
    .filter((m) => m.groupId === groupId)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))

export const lastMessage = (s: AppState, groupId: string): ChatMessage | undefined => {
  const msgs = messagesForGroup(s, groupId)
  return msgs[msgs.length - 1]
}

const byDateAsc = (a: { date: string }, b: { date: string }) =>
  +new Date(a.date) - +new Date(b.date)

const byDueAsc = (a: Task, b: Task) => {
  const av = a.dueDate ? +new Date(a.dueDate) : Infinity
  const bv = b.dueDate ? +new Date(b.dueDate) : Infinity
  return av - bv
}

export const eventsForGroup = (s: AppState, groupId: string) =>
  s.events.filter((e) => e.groupId === groupId).sort(byDateAsc)

export const tasksForGroup = (s: AppState, groupId: string) =>
  s.tasks.filter((t) => t.groupId === groupId).sort(byDueAsc)

export const eventsForChild = (s: AppState, childId: string) =>
  s.events.filter((e) => e.childId === childId).sort(byDateAsc)

export const tasksForChild = (s: AppState, childId: string) =>
  s.tasks.filter((t) => t.childId === childId).sort(byDueAsc)

export const upcomingEvents = (s: AppState) =>
  s.events.filter((e) => !isPast(new Date(e.date)) || isToday(new Date(e.date))).sort(byDateAsc)

export const openTasks = (s: AppState) => s.tasks.filter((t) => !t.done).sort(byDueAsc)

export const overdueTasks = (s: AppState) =>
  s.tasks.filter(
    (t) => !t.done && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)),
  )

export const paymentsDue = (s: AppState) =>
  s.tasks.filter((t) => t.payment && !t.payment.paid).sort(byDueAsc)

export const signupsForGroup = (s: AppState, groupId: string) =>
  s.signups
    .filter((su) => su.groupId === groupId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

export const slotsRemaining = (sheet: { slots: { qty: number; claims: unknown[] }[] }) =>
  sheet.slots.reduce((n, sl) => n + Math.max(0, sl.qty - sl.claims.length), 0)

export interface TodoCounts {
  all: number
  scheduled: number
  active: number
  overdue: number
}

export const todoCounts = (s: AppState): TodoCounts => {
  const open = openTasks(s)
  return {
    all: open.length,
    scheduled: open.filter((t) => t.dueDate && !isPast(new Date(t.dueDate))).length,
    active: open.filter((t) => !t.dueDate || isToday(new Date(t.dueDate))).length,
    overdue: overdueTasks(s).length,
  }
}

export type { EventItem, Task }
