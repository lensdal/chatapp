import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessagesSquare,
  CalendarDays,
  ListChecks,
  Users,
  Settings,
} from 'lucide-react'
import { useStore } from '../store/store'
import { colorClasses } from '../lib/ui'
import { memberById, tasksForGroup, openTasks, myGroups } from '../lib/selectors'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chats', label: 'Chats', icon: MessagesSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/kids', label: 'My Kids', icon: Users },
]

export default function Sidebar() {
  const { state } = useStore()
  const me = memberById(state, state.currentUserId)!
  const openCount = openTasks(state).length

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-6 border-r border-black/5 bg-white/70 px-4 py-6 backdrop-blur">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet text-lg text-white shadow-soft">
          🏘️
        </span>
        <div>
          <div className="text-lg font-extrabold leading-none tracking-tight">Village</div>
          <div className="text-[11px] font-medium text-ink/45">It takes a village</div>
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
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${colorClasses[g.color].soft}`}
                >
                  {g.emoji}
                </span>
                <span className="truncate font-medium">{g.name}</span>
                {open > 0 && (
                  <span className={`ml-auto h-2 w-2 rounded-full ${colorClasses[g.color].dot}`} />
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
        <div className="mt-1 flex items-center gap-2.5 rounded-2xl bg-canvas px-3 py-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${colorClasses[me.color].soft}`}
          >
            {me.emoji}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold">{me.name === 'You' ? 'You' : me.name}</div>
            <div className="text-[11px] text-ink/45">{state.children.length} kids · {state.groups.length} groups</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
