import { format } from 'date-fns'
import type { PaymentMethod } from '../types'

export interface ParseResult {
  type: 'task' | 'event'
  title: string
  dateISO?: string
  hasTime: boolean
  amount?: number
  method?: PaymentMethod
  cues: string[]
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const WEEKDAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

const EVENT_KW =
  /(game|practice|meeting|party|trip|meet\b|recital|rehearsal|picnic|potluck|ceremon|concert|tryout|tournament|field ?trip|assembly|conference|open house|fair|festival|showcase|match|graduation|pizza night|movie night)/i

function atDate(base: Date, hour: number, minute: number): Date {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

function yearFor(month: number, day: number): number {
  const now = new Date()
  const candidate = new Date(now.getFullYear(), month, day)
  // If the date already passed by more than a day, assume next year.
  return candidate.getTime() < now.getTime() - 86400000 ? now.getFullYear() + 1 : now.getFullYear()
}

export function parseForward(raw: string): ParseResult {
  const text = raw.trim()
  const lower = text.toLowerCase()
  const cues: string[] = []

  // --- money ---
  let amount: number | undefined
  let method: PaymentMethod | undefined
  const money =
    text.match(/\$\s?(\d+(?:\.\d{1,2})?)/) ||
    text.match(/(\d+(?:\.\d{1,2})?)\s*(?:dollars|bucks)/i)
  if (money) {
    amount = Number(money[1])
    cues.push(`💵 $${amount}`)
  }
  if (/venmo/i.test(text)) method = 'venmo'
  else if (/cash\s?app|cashapp/i.test(text)) method = 'cashapp'
  if (amount && method) cues.push(method === 'venmo' ? 'Venmo' : 'Cash App')

  // --- time of day ---
  let hour: number | undefined
  let minute = 0
  const tm = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (tm) {
    hour = Number(tm[1]) % 12
    if (/pm/i.test(tm[3])) hour += 12
    if (tm[2]) minute = Number(tm[2])
  }

  // --- date ---
  let day: Date | undefined
  const monthDay = lower.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?/,
  )
  const dayMonth = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/,
  )
  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\b/)
  const weekday = lower.match(/\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/)
  const theNth = lower.match(/\bthe\s+(\d{1,2})(?:st|nd|rd|th)\b/)

  if (/\btoday\b/.test(lower)) {
    day = new Date()
  } else if (/\btomorrow\b/.test(lower)) {
    day = new Date()
    day.setDate(day.getDate() + 1)
  } else if (monthDay) {
    const m = MONTHS[monthDay[1]]
    const dd = Number(monthDay[2])
    day = new Date(yearFor(m, dd), m, dd)
  } else if (dayMonth) {
    const m = MONTHS[dayMonth[2]]
    const dd = Number(dayMonth[1])
    day = new Date(yearFor(m, dd), m, dd)
  } else if (numeric) {
    const m = Number(numeric[1]) - 1
    const dd = Number(numeric[2])
    if (m >= 0 && m <= 11 && dd >= 1 && dd <= 31) day = new Date(yearFor(m, dd), m, dd)
  } else if (weekday) {
    const target = WEEKDAYS[weekday[1]]
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const diff = (target - d.getDay() + 7) % 7
    d.setDate(d.getDate() + diff)
    day = d
  } else if (theNth) {
    const dd = Number(theNth[1])
    const now = new Date()
    let m = now.getMonth()
    if (dd < now.getDate()) m += 1
    day = new Date(now.getFullYear(), m, dd)
  }

  let dateISO: string | undefined
  const hasTime = hour !== undefined
  if (day) {
    const withTime = atDate(day, hour ?? 9, minute)
    dateISO = withTime.toISOString()
    cues.push(`📅 ${format(withTime, hasTime ? 'EEE, MMM d · h:mm a' : 'EEE, MMM d')}`)
  }

  // --- type ---
  let type: 'task' | 'event'
  if (amount) type = 'task'
  else if (EVENT_KW.test(text) || hasTime) type = 'event'
  else type = 'task'
  cues.unshift(type === 'event' ? '📌 Looks like an event' : '✅ Looks like a task')

  // --- title ---
  const clean = (s: string) =>
    s
      .replace(/^(hi|hello|hey)\b[^,!:]*[,!:]\s*/i, '')
      .replace(/^(reminder|reminders|fyi|psa|heads up|note|update)\s*[:,-]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
  const sentences = text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  // Pick the first sentence that still has substance after stripping greetings.
  let title = ''
  for (const s of sentences) {
    const c = clean(s)
    if (c.length >= 4) {
      title = c
      break
    }
  }
  if (!title) title = clean(text) || text.trim()
  if (title.length > 72) title = title.slice(0, 70).trim() + '…'
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1)

  return { type, title, dateISO, hasTime, amount, method, cues }
}
