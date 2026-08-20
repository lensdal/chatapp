import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Pencil } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, SectionTitle, EmptyState, GroupIcon } from '../components/ui'
import { EventRow, TaskRow } from '../components/items'
import EditChildModal from '../components/EditChildModal'
import { useStore } from '../store/store'
import { childById, tasksForChild, eventsForChild } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import { isPast, isToday } from 'date-fns'

function KidsGrid() {
  const { state } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  return (
    <>
      <Topbar title="My Kids" subtitle="A quick read on where each kid stands." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
          >
            <Plus size={16} /> Add a kid
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {state.children.map((child) => {
            const open = tasksForChild(state, child.id).filter((t) => !t.done)
            const overdue = open.filter(
              (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)),
            ).length
            const groups = state.groups.filter((g) => g.childIds.includes(child.id))
            return (
              <Link key={child.id} to={`/kids/${child.id}`}>
                <Card className="overflow-hidden transition hover:shadow-soft">
                  <div className="flex flex-col items-center gap-2 px-5 py-6" style={groupStyles.softBg(child.color)}>
                    <span className="text-5xl">{child.emoji}</span>
                    <span className="text-xl font-extrabold">{child.name}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black/5 py-4 text-center">
                    <div>
                      <div className="text-xl font-extrabold">{groups.length}</div>
                      <div className="text-[11px] font-semibold text-ink/45">groups</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold">{open.length}</div>
                      <div className="text-[11px] font-semibold text-ink/45">to-dos</div>
                    </div>
                    <div>
                      <div className={`text-xl font-extrabold ${overdue ? 'text-tang' : ''}`}>{overdue}</div>
                      <div className="text-[11px] font-semibold text-ink/45">overdue</div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
      <EditChildModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}

function KidDetail({ childId }: { childId: string }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const child = childById(state, childId)
  if (!child) {
    navigate('/kids')
    return null
  }
  const groups = state.groups.filter((g) => g.childIds.includes(child.id))
  const openTasks = tasksForChild(state, child.id).filter((t) => !t.done)
  const upcoming = eventsForChild(state, child.id).filter(
    (e) => new Date(e.date) >= new Date(new Date().toDateString()),
  )

  return (
    <>
      <Topbar title={`${child.emoji} ${child.name}`} subtitle={`${groups.length} groups · ${openTasks.length} open to-dos`} />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/kids" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
            <ChevronLeft size={16} /> All kids
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink/70 shadow-soft ring-1 ring-black/5 transition hover:text-violet"
          >
            <Pencil size={14} /> Edit kid
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section>
              <SectionTitle>To-dos</SectionTitle>
              <Card className="divide-y divide-black/5 p-2">
                {openTasks.length === 0 ? (
                  <EmptyState emoji="🎉" text={`${child.name} is all caught up!`} />
                ) : (
                  openTasks.map((t) => <TaskRow key={t.id} task={t} showKid={false} />)
                )}
              </Card>
            </section>

            <section>
              <SectionTitle>Upcoming events</SectionTitle>
              <Card className="divide-y divide-black/5 p-2">
                {upcoming.length === 0 ? (
                  <EmptyState emoji="📅" text="Nothing on the calendar." />
                ) : (
                  upcoming.map((e) => <EventRow key={e.id} event={e} showKid={false} />)
                )}
              </Card>
            </section>
          </div>

          <div>
            <SectionTitle>{child.name}'s groups</SectionTitle>
            <div className="space-y-3">
              {groups.map((g) => {
                const open = state.tasks.filter((t) => t.groupId === g.id && !t.done).length
                return (
                  <Link key={g.id} to={`/chats/${g.id}`}>
                    <Card className="flex items-center gap-3 p-4 transition hover:shadow-soft">
                      <GroupIcon emoji={g.emoji} color={g.color} image={g.image} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{g.name}</div>
                        <div className="truncate text-xs text-ink/45">{g.description || g.category}</div>
                      </div>
                      {open > 0 && <span className="chip" style={groupStyles.soft(child.color)}>{open}</span>}
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <EditChildModal open={editOpen} onClose={() => setEditOpen(false)} childId={child.id} />
    </>
  )
}

export default function Kids() {
  const { childId } = useParams()
  if (!childId) return <KidsGrid />
  return <KidDetail childId={childId} />
}
