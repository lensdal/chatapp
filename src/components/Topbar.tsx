import { useState } from 'react'
import { Bell, Search, Plus, CalendarDays, ListChecks, ClipboardList, BarChart3, PiggyBank } from 'lucide-react'
import { format } from 'date-fns'
import { useStore } from '../store/store'
import { overdueTasks, paymentsDue, myGroups } from '../lib/selectors'
import { CaptureButton } from './Capture'
import AddComposer from './AddComposer'
import Modal from './Modal'
import { GroupIcon } from './ui'
import { CreateSignupModal } from './Signup'
import { CreatePollModal } from './Poll'
import { CreateCollectionModal } from './Collection'

type Kind = 'event' | 'task' | 'reminder'
type Sheet = 'signup' | 'poll' | 'collect'

export default function Topbar({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const { state } = useStore()
  const alerts = overdueTasks(state).length + paymentsDue(state).length
  const groups = myGroups(state)

  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [createKind, setCreateKind] = useState<Kind>('event')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [sheetGroupId, setSheetGroupId] = useState('')
  const [pickFor, setPickFor] = useState<Sheet | null>(null)

  const openComposer = (k: Kind) => {
    setCreateKind(k)
    setComposerOpen(true)
    setAddMenuOpen(false)
  }

  // Sign-up / poll / collect need a group. If the user has exactly one, use it;
  // otherwise ask which group first.
  const startSheet = (kind: Sheet) => {
    setAddMenuOpen(false)
    if (groups.length === 0) return
    if (groups.length === 1) {
      setSheetGroupId(groups[0].id)
      setSheet(kind)
    } else {
      setPickFor(kind)
    }
  }
  const pickGroup = (gid: string) => {
    setSheetGroupId(gid)
    setSheet(pickFor)
    setPickFor(null)
  }

  const MENU = [
    { icon: CalendarDays, label: 'Event', run: () => openComposer('event') },
    { icon: ListChecks, label: 'Task', run: () => openComposer('task') },
    { icon: Bell, label: 'Reminder', run: () => openComposer('reminder') },
    { icon: ClipboardList, label: 'Sign-up sheet', run: () => startSheet('signup') },
    { icon: BarChart3, label: 'Poll', run: () => startSheet('poll') },
    { icon: PiggyBank, label: 'Collect money', run: () => startSheet('collect') },
  ] as const

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-black/5 bg-canvas/80 px-8 py-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-ink/45">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-ink/40 shadow-soft lg:flex">
          <Search size={16} />
          <span>Search groups, tasks…</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
          >
            <Plus size={16} /> Add
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAddMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl bg-white p-1 shadow-card">
                {MENU.map((it) => {
                  const Icon = it.icon
                  return (
                    <button
                      key={it.label}
                      onClick={it.run}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.04]"
                    >
                      <Icon size={16} className="text-violet" /> {it.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <CaptureButton variant="topbar" />
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 shadow-soft transition hover:text-violet">
          <Bell size={19} />
          {alerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tang px-1 text-[10px] font-bold text-white">
              {alerts}
            </span>
          )}
        </button>
        <div className="hidden rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink/60 shadow-soft lg:block">
          {format(new Date(), 'EEEE, MMM d')}
        </div>
      </div>

      <AddComposer open={composerOpen} onClose={() => setComposerOpen(false)} initialKind={createKind} />

      {/* Group picker for sign-up / poll / collect when there's more than one group */}
      <Modal open={!!pickFor} onClose={() => setPickFor(null)} title="Which group?">
        <div className="space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => pickGroup(g.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5 text-left transition hover:bg-black/[0.05]"
            >
              <GroupIcon emoji={g.emoji} color={g.color} image={g.image} size="sm" />
              <span className="font-bold">{g.name}</span>
            </button>
          ))}
        </div>
      </Modal>

      {sheetGroupId && (
        <>
          <CreateSignupModal open={sheet === 'signup'} onClose={() => setSheet(null)} groupId={sheetGroupId} />
          <CreatePollModal open={sheet === 'poll'} onClose={() => setSheet(null)} groupId={sheetGroupId} />
          <CreateCollectionModal open={sheet === 'collect'} onClose={() => setSheet(null)} groupId={sheetGroupId} />
        </>
      )}
    </header>
  )
}
