import { Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { CaptureButton } from './Capture'
import AddMenu from './AddMenu'
import NotificationBell from './NotificationBell'

export default function Topbar({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
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
        <AddMenu>
          {(open) => (
            <button
              onClick={open}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
            >
              <Plus size={16} /> Add
            </button>
          )}
        </AddMenu>
        <CaptureButton variant="topbar" />
        <NotificationBell />
        <div className="hidden rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink/60 shadow-soft lg:block">
          {format(new Date(), 'EEEE, MMM d')}
        </div>
      </div>
    </header>
  )
}
