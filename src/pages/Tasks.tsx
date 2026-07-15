import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, EmptyState } from '../components/ui'
import { TaskRow } from '../components/items'
import CreateTaskModal from '../components/CreateTask'
import { useStore } from '../store/store'
import { colorClasses } from '../lib/ui'
import type { Task } from '../types'

type Status = 'open' | 'payments' | 'done'
type GroupBy = 'kid' | 'group'

export default function Tasks() {
  const { state } = useStore()
  const [status, setStatus] = useState<Status>('open')
  const [groupBy, setGroupBy] = useState<GroupBy>('kid')
  const [newOpen, setNewOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...state.tasks]
    if (status === 'open') list = list.filter((t) => !t.done)
    else if (status === 'done') list = list.filter((t) => t.done)
    else if (status === 'payments') list = list.filter((t) => t.payment && !t.payment.paid)
    return list.sort((a, b) => {
      const av = a.dueDate ? +new Date(a.dueDate) : Infinity
      const bv = b.dueDate ? +new Date(b.dueDate) : Infinity
      return av - bv
    })
  }, [state.tasks, status])

  // Build sections
  const sections = useMemo(() => {
    if (groupBy === 'kid') {
      return [
        ...state.children.map((c) => ({
          id: c.id,
          label: `${c.emoji} ${c.name}`,
          color: c.color,
          tasks: filtered.filter((t) => t.childId === c.id),
        })),
        {
          id: 'general',
          label: '🏫 Whole-group / general',
          color: 'violet' as const,
          tasks: filtered.filter((t) => !t.childId),
        },
      ].filter((s) => s.tasks.length > 0)
    }
    return [
      ...state.groups.map((g) => ({
        id: g.id,
        label: `${g.emoji} ${g.name}`,
        color: g.color,
        tasks: filtered.filter((t) => t.groupId === g.id),
      })),
      {
        id: 'personal',
        label: '🏠 Personal',
        color: 'violet' as const,
        tasks: filtered.filter((t) => !t.groupId),
      },
    ].filter((s) => s.tasks.length > 0)
  }, [filtered, groupBy, state.children, state.groups])

  const segBtn = (s: Status, label: string) => (
    <button
      onClick={() => setStatus(s)}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        status === s ? 'bg-violet text-white shadow-soft' : 'text-ink/55 hover:text-violet'
      }`}
    >
      {label}
    </button>
  )

  return (
    <>
      <Topbar title="Tasks" subtitle="Everything you need to do, pulled from every group." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft">
            {segBtn('open', 'Open')}
            {segBtn('payments', 'Payments')}
            {segBtn('done', 'Completed')}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink/40">Group by</span>
              <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft">
                {(['kid', 'group'] as GroupBy[]).map((gb) => (
                  <button
                    key={gb}
                    onClick={() => setGroupBy(gb)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-bold capitalize transition ${
                      groupBy === gb ? 'bg-violet text-white' : 'text-ink/55 hover:text-violet'
                    }`}
                  >
                    {gb}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
            >
              <Plus size={16} /> New task
            </button>
          </div>
        </div>

        {sections.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              emoji={status === 'done' ? '🗂️' : '🎉'}
              text={status === 'done' ? 'No completed tasks yet.' : 'Nothing here — you’re all caught up!'}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {sections.map((sec) => (
              <Card key={sec.id} className="overflow-hidden">
                <div className={`flex items-center justify-between px-5 py-3 ${colorClasses[sec.color].soft}`}>
                  <span className="font-extrabold">{sec.label}</span>
                  <span className={`chip bg-white/70 ${colorClasses[sec.color].text}`}>
                    {sec.tasks.length}
                  </span>
                </div>
                <div className="divide-y divide-black/5 p-2">
                  {sec.tasks.map((t: Task) => (
                    <TaskRow key={t.id} task={t} showKid={groupBy === 'group'} showGroup={groupBy === 'kid'} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <CreateTaskModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  )
}
