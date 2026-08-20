import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { EventRow } from '../components/items'
import { useStore } from '../store/store'
import { groupById } from '../lib/selectors'
import { colorClasses, groupStyles } from '../lib/ui'

export default function CalendarPage() {
  const { state } = useStore()
  const [cursor, setCursor] = useState(() => new Date())
  const [childFilter, setChildFilter] = useState<string>('all')

  const events = state.events
    .filter((e) => childFilter === 'all' || e.childId === childFilter)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))

  const monthStart = startOfMonth(cursor)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(cursor)),
  })

  const monthEvents = events.filter((e) => isSameMonth(new Date(e.date), cursor))

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
                  className={`chip ${childFilter === c.id ? colorClasses[c.color].solid : colorClasses[c.color].softText}`}
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
              const dayEvents = events.filter((e) => isSameDay(new Date(e.date), day))
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
                    {dayEvents.slice(0, 3).map((e) => {
                      const g = groupById(state, e.groupId)!
                      return (
                        <div
                          key={e.id}
                          className="truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold"
                          style={groupStyles.soft(g.color)}
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="px-1.5 text-[10px] font-bold text-ink/40">+{dayEvents.length - 3} more</div>
                    )}
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
              {monthEvents.length === 0 ? (
                <EmptyState emoji="🗓️" text="No events this month." />
              ) : (
                monthEvents.map((e) => <EventRow key={e.id} event={e} showGroup />)
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
