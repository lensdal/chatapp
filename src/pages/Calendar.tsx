import { useState } from 'react'
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import Topbar from '../components/Topbar'
import { Card, EmptyState } from '../components/ui'
import { EventRow, ReminderRow } from '../components/items'
import { useStore } from '../store/store'
import { groupById } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import { expandOccurrences } from '../lib/recurrence'

export default function CalendarPage() {
  const { state } = useStore()
  const [cursor, setCursor] = useState(() => new Date())
  const [childFilter, setChildFilter] = useState<string>('all')

  const events = state.events
    .filter((e) => childFilter === 'all' || e.childId === childFilter)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))

  const reminders = state.reminders
    .filter((r) => childFilter === 'all' || r.childId === childFilter)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))

  const monthStart = startOfMonth(cursor)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(cursor)),
  })

  // Expand recurring events/reminders into concrete occurrences across the
  // whole visible grid, so a weekly item lands on every matching day.
  const gridStart = new Date(days[0]); gridStart.setHours(0, 0, 0, 0)
  const gridEnd = new Date(days[days.length - 1]); gridEnd.setHours(23, 59, 59, 999)
  const eventOccs = expandOccurrences(events, gridStart.toISOString(), gridEnd.toISOString())
  const reminderOccs = expandOccurrences(reminders, gridStart.toISOString(), gridEnd.toISOString())

  const mStart = new Date(startOfMonth(cursor)); mStart.setHours(0, 0, 0, 0)
  const mEnd = new Date(endOfMonth(cursor)); mEnd.setHours(23, 59, 59, 999)
  const monthEvents = expandOccurrences(events, mStart.toISOString(), mEnd.toISOString())
  const monthReminders = expandOccurrences(reminders, mStart.toISOString(), mEnd.toISOString())

  return (
    <>
      <Topbar title="Calendar" subtitle="Every group's events, all in one view." />
      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden px-8 pb-6 pt-4">
        <Card className="flex min-w-0 flex-1 flex-col p-5">
          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">{format(cursor, 'MMMM yyyy')}</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setCursor(addMonths(cursor, -1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-ink/60 transition hover:bg-violet-soft hover:text-violet"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCursor(addMonths(cursor, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-ink/60 transition hover:bg-violet-soft hover:text-violet"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setCursor(new Date())}
                  className="rounded-full bg-canvas px-3 text-xs font-bold text-ink/60 transition hover:bg-violet-soft hover:text-violet"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setChildFilter('all')}
                className={`chip ${childFilter === 'all' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
              >
                All kids
              </button>
              {state.children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChildFilter(c.id)}
                  className="chip"
                  style={childFilter === c.id ? groupStyles.solid(c.color) : groupStyles.soft(c.color)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink/35">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = eventOccs.filter((o) => isSameDay(new Date(o.date), day))
              const dayReminders = reminderOccs.filter((o) => isSameDay(new Date(o.date), day))
              const inMonth = isSameMonth(day, cursor)
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[84px] rounded-2xl border p-1.5 ${
                    inMonth ? 'border-black/5 bg-canvas/40' : 'border-transparent bg-transparent'
                  }`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday(day)
                        ? 'bg-violet text-white'
                        : inMonth
                          ? 'text-ink/70'
                          : 'text-ink/25'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((o) => {
                      const g = groupById(state, o.item.groupId)!
                      return (
                        <div
                          key={o.key}
                          className="truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold"
                          style={groupStyles.soft(g.color)}
                          title={o.item.title}
                        >
                          {o.item.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="px-1.5 text-[10px] font-bold text-ink/40">+{dayEvents.length - 3} more</div>
                    )}
                    {dayReminders.slice(0, 2).map((o) => (
                      <div
                        key={o.key}
                        className="flex items-center gap-1 truncate rounded-lg bg-sun-soft px-1.5 py-0.5 text-[10px] font-semibold text-[#B7841A]"
                        title={o.item.title}
                      >
                        <Bell size={9} className="shrink-0" /> {o.item.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Agenda */}
        <div className="hidden w-[340px] shrink-0 flex-col lg:flex">
          <Card className="flex min-h-0 flex-1 flex-col p-3">
            <h3 className="px-2 py-2 text-sm font-extrabold uppercase tracking-wide text-ink/40">
              {format(cursor, 'MMMM')} agenda
            </h3>
            <div className="min-h-0 flex-1 divide-y divide-black/5 overflow-y-auto">
              {monthEvents.length === 0 && monthReminders.length === 0 ? (
                <EmptyState emoji="🗓️" text="Nothing scheduled this month." />
              ) : (
                <>
                  {monthReminders.map((o) => (
                    <ReminderRow key={o.key} reminder={{ ...o.item, date: o.date }} showGroup />
                  ))}
                  {monthEvents.map((o) => (
                    <EventRow key={o.key} event={{ ...o.item, date: o.date }} showGroup />
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
