import type { AppState, ChatMessage, EventItem, Task } from '../types'
import { isPast, isToday } from 'date-fns'

export const byId = <T extends { id: string }>(list: T[], id?: string) =>
  list.find((x) => x.id === id)

export const memberById = (s: AppState, id?: string) => byId(s.members, id)
export const childById = (s: AppState, id?: string) => byId(s.children, id)
export const groupById = (s: AppState, id?: string) => byId(s.groups, id)

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
