import { Link } from 'react-router-dom'
import { CalendarDays, ListChecks, Clock3, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, SectionTitle, Donut, EmptyState, Pill } from '../components/ui'
import { TaskRow, EventRow, ReminderRow, PaymentButton, KidTag } from '../components/items'
import { CaptureButton } from '../components/Capture'
import { useStore } from '../store/store'
import {
  openTasks,
  overdueTasks,
  paymentsDue,
  todoCounts,
  tasksForChild,
  eventsForChild,
} from '../lib/selectors'
import { groupStyles, toHex } from '../lib/ui'
import { expandOccurrences } from '../lib/recurrence'
import { format } from 'date-fns'
import { fmtDayShort, fmtTime } from '../lib/dates'
import type { ReactNode } from 'react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatTile({
  icon,
  count,
  label,
  className,
}: {
  icon: ReactNode
  count: number
  label: string
  className: string
}) {
  return (
    <div className={`flex items-center gap-3 rounded-3xl px-5 py-4 ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60">{icon}</span>
      <div className="leading-none">
        <div className="text-2xl font-extrabold">{count}</div>
        <div className="mt-1 text-xs font-semibold opacity-70">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { state } = useStore()
  const counts = todoCounts(state)
  const today0 = new Date(new Date().toDateString())
  const horizon = new Date(today0); horizon.setDate(today0.getDate() + 90)
  const upcoming = expandOccurrences(state.events, today0.toISOString(), horizon.toISOString()).slice(0, 5)
  const headsUp = expandOccurrences(state.reminders, today0.toISOString(), horizon.toISOString()).slice(0, 4)
  const overdue = overdueTasks(state)
  const payments = paymentsDue(state)
  const open = openTasks(state)

  // Task breakdown by group for the donut.
  const donutSegs = state.groups
    .map((g) => ({
      color: toHex(g.color),
      value: open.filter((t) => t.groupId === g.id).length,
      label: g.name,
      key: g.id,
    }))
    .filter((s) => s.value > 0)

  return (
    <>
      <Topbar title={`${greeting()} 👋`} subtitle="Here's everything across all your groups, in one place." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        {/* WhatsApp forward banner */}
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-mint-soft to-violet-soft px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl">
            📲
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold">Drowning in WhatsApp messages?</div>
            <div className="text-sm text-ink/55">
              Forward the ones that matter to your Village number or email — they land in your inbox, ready to become tasks & events.
            </div>
          </div>
          <CaptureButton variant="hero" />
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            icon={<ListChecks size={20} className="text-violet" />}
            count={counts.all}
            label="Open to-dos"
            className="bg-white shadow-card"
          />
          <StatTile
            icon={<CalendarDays size={20} className="text-[#B7841A]" />}
            count={counts.scheduled}
            label="Scheduled"
            className="bg-sun-soft text-[#8a6413]"
          />
          <StatTile
            icon={<Clock3 size={20} className="text-sky" />}
            count={counts.active}
            label="Due now / no date"
            className="bg-sky-soft text-sky"
          />
          <StatTile
            icon={<AlertTriangle size={20} className="text-blush" />}
            count={counts.overdue}
            label="Overdue"
            className="bg-blush-soft text-blush"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left / main column */}
          <div className="space-y-6 xl:col-span-2">
            {/* By kid */}
            <section>
              <SectionTitle action={<Link to="/kids" className="text-sm font-semibold text-violet">View kids</Link>}>
                Everything by kid
              </SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {state.children.map((child) => {
                  const kidTasks = tasksForChild(state, child.id).filter((t) => !t.done)
                  const nextEvent = eventsForChild(state, child.id).find(
                    (e) => new Date(e.date) >= new Date(new Date().toDateString()),
                  )
                  return (
                    <Card key={child.id} className="overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3" style={groupStyles.softBg(child.color)}>
                        <span className="text-2xl">{child.emoji}</span>
                        <div>
                          <div className="font-extrabold leading-none">{child.name}</div>
                          <div className="text-xs font-semibold" style={groupStyles.text(child.color)}>
                            {kidTasks.length} to-do{kidTasks.length === 1 ? '' : 's'}
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        {nextEvent ? (
                          <Link to="/calendar" className="mb-3 flex items-center gap-2 rounded-2xl bg-canvas px-3 py-2">
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[10px] font-bold uppercase text-ink/45">
                                {format(new Date(nextEvent.date), 'MMM')}
                              </span>
                              <span className="text-base font-extrabold">
                                {format(new Date(nextEvent.date), 'd')}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold">{nextEvent.title}</div>
                              <div className="text-[11px] text-ink/45">{fmtTime(nextEvent.date)}</div>
                            </div>
                          </Link>
                        ) : (
                          <div className="mb-3 rounded-2xl bg-canvas px-3 py-2 text-xs text-ink/40">
                            No upcoming events
                          </div>
                        )}
                        <ul className="space-y-1.5">
                          {kidTasks.slice(0, 3).map((t) => (
                            <li key={t.id} className="flex items-center gap-2 text-xs">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={groupStyles.dot(child.color)} />
                              <span className="truncate font-medium text-ink/75">{t.title}</span>
                            </li>
                          ))}
                          {kidTasks.length === 0 && (
                            <li className="text-xs text-ink/40">All caught up! 🎉</li>
                          )}
                        </ul>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* Coming up */}
            <section>
              <SectionTitle action={<Link to="/calendar" className="text-sm font-semibold text-violet">Full calendar</Link>}>
                Coming up
              </SectionTitle>
              <Card className="divide-y divide-black/5 p-2">
                {upcoming.length === 0 ? (
                  <EmptyState emoji="📭" text="No upcoming events yet." />
                ) : (
                  upcoming.map((o) => <EventRow key={o.key} event={{ ...o.item, date: o.date }} />)
                )}
              </Card>
            </section>

            {/* Heads up — reminders */}
            {headsUp.length > 0 && (
              <section>
                <SectionTitle action={<Link to="/calendar" className="text-sm font-semibold text-violet">Calendar</Link>}>
                  Heads up
                </SectionTitle>
                <Card className="divide-y divide-black/5 p-2">
                  {headsUp.map((o) => (
                    <ReminderRow key={o.key} reminder={{ ...o.item, date: o.date }} />
                  ))}
                </Card>
              </section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Activity donut */}
            <Card className="p-5">
              <SectionTitle>Your load</SectionTitle>
              <div className="flex items-center gap-5">
                <Donut
                  segments={donutSegs.length ? donutSegs : [{ value: 1, color: '#EFEAF7' }]}
                  center={
                    <>
                      <span className="text-2xl font-extrabold">{open.length}</span>
                      <span className="text-[11px] font-semibold text-ink/45">to-dos</span>
                    </>
                  }
                />
                <ul className="min-w-0 flex-1 space-y-2">
                  {donutSegs.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="min-w-0 flex-1 truncate font-medium text-ink/70">{s.label}</span>
                      <span className="font-bold">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Payments due */}
            <Card className="p-5">
              <SectionTitle
                action={
                  <Pill className="bg-tang-soft text-tang">
                    <DollarSign size={12} />${payments.reduce((s, t) => s + (t.payment?.amount ?? 0), 0)}
                  </Pill>
                }
              >
                Payments due
              </SectionTitle>
              {payments.length === 0 ? (
                <EmptyState emoji="💸" text="Nothing to pay right now." />
              ) : (
                <ul className="space-y-3">
                  {payments.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <KidTag childId={t.childId} />
                          <span className="text-[11px] text-ink/45">
                            to {t.payment?.recipient} · {fmtDayShort(t.dueDate!)}
                          </span>
                        </div>
                      </div>
                      <PaymentButton task={t} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Needs attention */}
            {overdue.length > 0 && (
              <Card className="p-2">
                <div className="px-3 pt-3">
                  <SectionTitle
                    action={<Link to="/tasks" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">All tasks <ArrowRight size={14} /></Link>}
                  >
                    <span className="text-tang">Overdue</span>
                  </SectionTitle>
                </div>
                <div className="divide-y divide-black/5">
                  {overdue.slice(0, 4).map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
