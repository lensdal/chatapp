import { useState, type ReactNode } from 'react'
import { CalendarDays, ListChecks, Bell, ClipboardList, BarChart3, PiggyBank } from 'lucide-react'
import Modal from './Modal'
import { GroupIcon } from './ui'
import AddComposer from './AddComposer'
import { CreateSignupModal } from './Signup'
import { CreatePollModal } from './Poll'
import { CreateCollectionModal } from './Collection'
import { useStore } from '../store/store'
import { myGroups } from '../lib/selectors'

type Kind = 'event' | 'task' | 'reminder'
type Sheet = 'signup' | 'poll' | 'collect'

// The one Add experience used everywhere: a chooser for Event / Task / Reminder /
// Sign-up sheet / Poll / Collect money. The first three open the composer; the
// last three need a group (uses `groupId` if given, else asks which group).
export default function AddMenu({
  children,
  groupId,
}: {
  children: (open: () => void) => ReactNode
  groupId?: string
}) {
  const { state } = useStore()
  const groups = myGroups(state)

  const [menuOpen, setMenuOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [createKind, setCreateKind] = useState<Kind>('event')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [sheetGroupId, setSheetGroupId] = useState(groupId ?? '')
  const [pickFor, setPickFor] = useState<Sheet | null>(null)

  const openComposer = (k: Kind) => {
    setCreateKind(k)
    setComposerOpen(true)
  }
  const startSheet = (kind: Sheet) => {
    if (groupId) {
      setSheetGroupId(groupId)
      setSheet(kind)
      return
    }
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
    <>
      {children(() => setMenuOpen(true))}

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Add to Village">
        <div className="grid grid-cols-2 gap-2">
          {MENU.map((it) => {
            const Icon = it.icon
            return (
              <button
                key={it.label}
                onClick={() => { setMenuOpen(false); it.run() }}
                className="flex items-center gap-2.5 rounded-2xl bg-canvas px-4 py-3.5 text-sm font-bold text-ink/75 transition hover:bg-violet-soft hover:text-violet"
              >
                <Icon size={18} className="text-violet" /> {it.label}
              </button>
            )
          })}
        </div>
      </Modal>

      <AddComposer open={composerOpen} onClose={() => setComposerOpen(false)} initialKind={createKind} initialGroupId={groupId ?? ''} />

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
    </>
  )
}
