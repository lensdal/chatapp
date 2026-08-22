import { useMemo, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { EmptyState } from './ui'
import { useStore } from '../store/store'
import { buildNotifications } from '../lib/notifications'

const READ_KEY = 'village.notifs.read.v1'

function loadRead(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  } catch {
    return new Set<string>()
  }
}

const KIND_TINT: Record<string, string> = {
  rsvp: 'bg-sun-soft text-[#8a6413]',
  overdue: 'bg-tang-soft text-tang',
  payment: 'bg-mint-soft text-mint',
}

export default function NotificationBell() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<Set<string>>(loadRead)
  const [freshlyUnread, setFreshlyUnread] = useState<Set<string>>(new Set())

  const items = useMemo(() => buildNotifications(state), [state])
  const unreadCount = items.filter((i) => !read.has(i.id)).length

  const persist = (s: Set<string>) => {
    setRead(new Set(s))
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...s]))
    } catch {
      /* storage may be unavailable — badge just won't persist */
    }
  }

  const openPanel = () => {
    // Snapshot what was unread so we can highlight it, then clear the badge.
    setFreshlyUnread(new Set(items.filter((i) => !read.has(i.id)).map((i) => i.id)))
    const s = new Set(read)
    items.forEach((i) => s.add(i.id))
    persist(s)
    setOpen(true)
  }

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      <button
        onClick={openPanel}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 shadow-soft transition hover:text-violet"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tang px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Notifications">
        {items.length === 0 ? (
          <EmptyState emoji="🎉" text="You're all caught up!" />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => go(n.to)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-black/[0.03] ${
                    freshlyUnread.has(n.id) ? 'bg-violet-soft/50' : 'bg-canvas'
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${KIND_TINT[n.kind]}`}>
                    {n.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug">{n.title}</span>
                    <span className="block truncate text-xs text-ink/50">{n.detail}</span>
                  </span>
                  {freshlyUnread.has(n.id) && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink/45">
          <span className="inline-flex items-center gap-1">
            <CheckCheck size={13} /> Auto-nudges appear here as events approach.
          </span>
        </div>
      </Modal>
    </>
  )
}
