import { useState } from 'react'
import { CalendarCheck, Wallet, RotateCcw, Info, Check, MessageCircle, Download, Languages, Bell, Pencil } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, SectionTitle, Avatar, GroupIcon } from '../components/ui'
import { useStore } from '../store/store'
import { PAY_METHODS } from '../lib/pay'
import { useToast } from '../components/Toast'
import { myGroups, notifyFor, memberById } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import type { EventItem } from '../types'
import AvatarPicker from '../components/AvatarPicker'

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-violet' : 'bg-black/15'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

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
  const meHandles = state.members.find((m) => m.id === state.currentUserId)?.handles ?? {}
  const me = memberById(state, state.currentUserId)!
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <Topbar title="Settings" subtitle="Connections, family, and prototype controls." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Your profile */}
          <Card className="flex items-center gap-4 p-5">
            <Avatar emoji={me.emoji} color={me.color} image={me.avatarImage} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold leading-tight">
                {me.name === 'You' ? 'You' : me.name}
              </div>
              <div className="text-sm text-ink/45">Your Village profile · pick an avatar or upload a photo</div>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
            >
              <Pencil size={15} /> Edit avatar
            </button>
          </Card>

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
                  <span className="h-2.5 w-2.5 rounded-full" style={groupStyles.dot(c.color)} />
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
            <SectionTitle>Your payment handles</SectionTitle>
            <p className="mb-3 text-sm text-ink/50">
              Saved once and reused whenever you collect money. When someone pays, Venmo & Cash App open
              prefilled; Zelle & Other just show people where to send it.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PAY_METHODS.map((m) => (
                <div key={m.id}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">
                    {m.label}
                  </label>
                  <input
                    className="w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white"
                    value={meHandles[m.id] ?? ''}
                    onChange={(e) => dispatch({ type: 'SET_HANDLES', handles: { [m.id]: e.target.value } })}
                    placeholder={m.placeholder}
                  />
                </div>
              ))}
            </div>
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
            <SectionTitle>Notifications</SectionTitle>
            <p className="-mt-1 mb-3 text-sm text-ink/50">
              Your own choice — get a reminder before things are due and a weekly summary. Set it for
              all groups at once, then fine-tune any group below.
            </p>
            {(() => {
              const groups = myGroups(state)
              const ids = groups.map((g) => g.id)
              const allRemind = groups.length > 0 && groups.every((g) => notifyFor(state, g.id).reminders)
              const allDigest = groups.length > 0 && groups.every((g) => notifyFor(state, g.id).digest)
              return (
                <>
                  <div className="space-y-1 rounded-2xl bg-canvas p-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Bell size={18} className="text-sky" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">Auto-reminders — all groups</div>
                        <div className="text-xs text-ink/50">A nudge before events and due dates.</div>
                      </div>
                      <Switch on={allRemind} onChange={(v) => dispatch({ type: 'SET_NOTIFY_ALL', groupIds: ids, key: 'reminders', value: v })} />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <CalendarCheck size={18} className="text-blush" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">Weekly digest — all groups</div>
                        <div className="text-xs text-ink/50">A Sunday summary of the week ahead.</div>
                      </div>
                      <Switch on={allDigest} onChange={(v) => dispatch({ type: 'SET_NOTIFY_ALL', groupIds: ids, key: 'digest', value: v })} />
                    </div>
                  </div>

                  <div className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Per group</div>
                  <div className="divide-y divide-black/5">
                    {groups.map((g) => {
                      const n = notifyFor(state, g.id)
                      return (
                        <div key={g.id} className="flex items-center gap-3 py-2.5">
                          <GroupIcon emoji={g.emoji} color={g.color} image={g.image} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{g.name}</span>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink/45">
                            Reminders
                            <Switch on={n.reminders} onChange={(v) => dispatch({ type: 'SET_NOTIFY', groupId: g.id, key: 'reminders', value: v })} />
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink/45">
                            Digest
                            <Switch on={n.digest} onChange={(v) => dispatch({ type: 'SET_NOTIFY', groupId: g.id, key: 'digest', value: v })} />
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </Card>

          <Card className="flex items-center justify-between gap-4 p-5">
            <div>
              <div className="font-bold">Export all events</div>
              <div className="text-sm text-ink/50">Download a .ics file to import into any calendar app.</div>
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
      <AvatarPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
