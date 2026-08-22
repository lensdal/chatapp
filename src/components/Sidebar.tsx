import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessagesSquare,
  Inbox as InboxIcon,
  CalendarDays,
  ListChecks,
  Users,
  Settings,
} from 'lucide-react'
import { useStore } from '../store/store'
import { groupStyles } from '../lib/ui'
import { memberById, tasksForGroup, openTasks, myGroups } from '../lib/selectors'
import { Avatar, GroupIcon } from './ui'
import Logo from './Logo'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chats', label: 'Chats', icon: MessagesSquare },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/kids', label: 'My Kids', icon: Users },
]

export default function Sidebar() {
  const { state } = useStore()
  const me = memberById(state, state.currentUserId)!
  const openCount = openTasks(state).length
  const inboxCount = state.forwards.filter((f) => !f.handled).length

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-6 border-r border-black/5 bg-white/70 px-4 py-6 backdrop-blur">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-black/5">
          <Logo size={38} rounded={false} />
        </span>
        <div>
          <div className="text-lg font-extrabold leading-none tracking-tight">Village</div>
          <div className="mt-1 text-[11px] font-semibold text-ink/45">Connect. Communicate. Coordinate.</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-violet text-white shadow-soft'
                  : 'text-ink/60 hover:bg-violet-soft hover:text-violet'
              }`
            }
          >
            <n.icon size={19} strokeWidth={2.2} />
            <span>{n.label}</span>
            {n.label === 'Tasks' && openCount > 0 && (
              <span className="ml-auto rounded-full bg-tang px-2 py-0.5 text-[11px] font-bold text-white">
                {openCount}
              </span>
            )}
            {n.label === 'Inbox' && inboxCount > 0 && (
              <span className="ml-auto rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-white">
                {inboxCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink/35">
          Your groups
        </div>
        <div className="flex flex-col gap-0.5">
          {myGroups(state).map((g) => {
            const open = tasksForGroup(state, g.id).filter((t) => !t.done).length
            return (
              <NavLink
                key={g.id}
                to={`/chats/${g.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? 'bg-violet-soft text-violet' : 'text-ink/70 hover:bg-black/[0.03]'
                  }`
                }
              >
                <GroupIcon emoji={g.emoji} color={g.color} image={g.image} size="xs" />
                <span className="truncate font-medium">{g.name}</span>
                {open > 0 && (
                  <span className="ml-auto h-2 w-2 rounded-full" style={groupStyles.dot(g.color)} />
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-black/5 pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-violet-soft text-violet' : 'text-ink/60 hover:bg-black/[0.03]'
            }`
          }
        >
          <Settings size={19} strokeWidth={2.2} />
          Settings
        </NavLink>
        <NavLink to="/settings" className="mt-1 flex items-center gap-2.5 rounded-2xl bg-canvas px-3 py-2 transition hover:bg-black/[0.04]">
          <Avatar emoji={me.emoji} color={me.color} image={me.avatarImage} size="sm" />
          <div className="leading-tight">
            <div className="text-sm font-bold">{me.name === 'You' ? 'You' : me.name}</div>
            <div className="text-[11px] text-ink/45">{state.children.length} kids · {state.groups.length} groups</div>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
