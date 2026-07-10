import { CalendarCheck, Wallet, RotateCcw, Info, Check, MessageCircle, Download, Languages, Bell } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, SectionTitle, Avatar } from '../components/ui'
import { useStore } from '../store/store'
import { useToast } from '../components/Toast'
import { colorClasses } from '../lib/ui'
import type { EventItem } from '../types'

const LANGUAGES = ['', 'Spanish', 'Mandarin', 'Vietnamese', 'Arabic', 'French', 'Tagalog']

function downloadICS(events: EventItem[]) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  }
  const esc = (s: string) => s.replace(/[,;\\]/g, ' ')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Village//Prototype//EN']
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@village.app`, `DTSTAMP:${fmt(e.date)}`, `DTSTART:${fmt(e.date)}`, `SUMMARY:${esc(e.title)}`)
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'village-events.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function IntegrationRow({
  icon,
  name,
  desc,
  connected,
  onToggle,
  accent,
}: {
  icon: React.ReactNode
  name: string
  desc: string
  connected: boolean
  onToggle: () => void
  accent: string
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{name}</div>
        <div className="text-sm text-ink/50">{desc}</div>
      </div>
      <button
        onClick={onToggle}
        className={`rounded-full px-4 py-2 text-sm font-bold shadow-soft transition ${
          connected ? 'bg-mint-soft text-mint' : 'bg-violet text-white hover:bg-violet/90'
        }`}
      >
        {connected ? (
          <span className="inline-flex items-center gap-1.5">
            <Check size={15} strokeWidth={3} /> Connected
          </span>
        ) : (
          'Connect'
        )}
      </button>
    </div>
  )
}

export default function Settings() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const caregivers = state.members.filter((m) => m.role === 'Caregiver')

  return (
    <>
      <Topbar title="Settings" subtitle="Connections, family, and prototype controls." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-start gap-3 rounded-3xl bg-violet-soft px-5 py-4 text-sm text-violet">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              This is an interactive prototype running on sample data in your browser. Integrations below are{' '}
              <strong>simulated</strong> — connecting them flips the buttons and “syncs” inside the app, but doesn’t
              yet touch your real Google or payment accounts.
            </p>
          </div>

          <Card className="px-5 py-2">
            <div className="pt-3">
              <SectionTitle>Connections</SectionTitle>
            </div>
            <div className="divide-y divide-black/5">
              <IntegrationRow
                icon={<MessageCircle size={22} className="text-[#0f9d58]" />}
                name="WhatsApp"
                desc={
                  state.whatsappConnected
                    ? 'Sending as +1 (555) 019-2733 · forwarding & reminders are simulated'
                    : 'Forward messages in, and send reminders out to the group.'
                }
                connected={state.whatsappConnected}
                onToggle={() =>
                  dispatch({ type: 'SET_INTEGRATION', key: 'whatsappConnected', value: !state.whatsappConnected })
                }
                accent="bg-[#25D366]/15"
              />
              <IntegrationRow
                icon={<CalendarCheck size={22} className="text-sky" />}
                name="Google Calendar"
                desc="Push group events straight onto your calendar."
                connected={state.googleConnected}
                onToggle={() =>
                  dispatch({ type: 'SET_INTEGRATION', key: 'googleConnected', value: !state.googleConnected })
                }
                accent="bg-sky-soft"
              />
              <IntegrationRow
                icon={<Wallet size={22} className="text-mint" />}
                name="Venmo & Cash App"
                desc="One-tap payments for fees and dues, auto-checked off."
                connected={state.venmoConnected}
                onToggle={() =>
                  dispatch({ type: 'SET_INTEGRATION', key: 'venmoConnected', value: !state.venmoConnected })
                }
                accent="bg-mint-soft"
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Family & caregivers</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {state.children.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-2xl bg-canvas px-4 py-2.5">
                  <Avatar emoji={c.emoji} color={c.color} size="sm" />
                  <span className="font-bold">{c.name}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${colorClasses[c.color].dot}`} />
                </div>
              ))}
            </div>
            {caregivers.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Shared caregivers</div>
                <div className="flex flex-wrap gap-3">
                  {caregivers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 rounded-2xl bg-canvas px-4 py-2.5">
                      <Avatar emoji={m.emoji} color={m.color} size="sm" />
                      <div className="leading-tight">
                        <div className="text-sm font-bold">{m.name}</div>
                        <div className="text-[11px] text-ink/45">Sees & can be assigned tasks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle>Language</SectionTitle>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-soft">
                <Languages size={22} className="text-[#B7841A]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">Auto-translate messages</div>
                <div className="text-sm text-ink/50">Show incoming messages in your language (simulated).</div>
              </div>
              <select
                value={state.translateTo}
                onChange={(e) => dispatch({ type: 'SET_TRANSLATE', to: e.target.value })}
                className="rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l === '' ? 'Off' : l}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Calendar & reminders</SectionTitle>
            <div className="space-y-3 text-sm text-ink/55">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-soft">
                  <Bell size={18} className="text-sky" />
                </span>
                <p>
                  Auto-reminders and the weekly digest are toggles on <strong>each group</strong> — open a group’s
                  settings (⚙️) to turn them on or off there.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
                <div>
                  <div className="font-bold text-ink">Export all events</div>
                  <div className="text-xs text-ink/50">Download a .ics file to import into any calendar app.</div>
                </div>
                <button
                  onClick={() => {
                    downloadICS(state.events)
                    toast('Calendar exported (.ics)', '📅')
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-violet/90"
                >
                  <Download size={16} /> Export .ics
                </button>
              </div>
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 p-5">
            <div>
              <div className="font-bold">Reset sample data</div>
              <div className="text-sm text-ink/50">Restore the demo groups, chats, tasks, and events.</div>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset everything back to the original sample data?')) dispatch({ type: 'RESET' })
              }}
              className="inline-flex items-center gap-2 rounded-full bg-canvas px-4 py-2.5 text-sm font-bold text-ink/70 transition hover:bg-tang-soft hover:text-tang"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </Card>
        </div>
      </div>
    </>
  )
}
