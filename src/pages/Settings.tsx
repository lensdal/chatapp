import { CalendarCheck, Wallet, RotateCcw, Info, Check } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, SectionTitle, Avatar } from '../components/ui'
import { useStore } from '../store/store'
import { colorClasses } from '../lib/ui'

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
            <SectionTitle>Family</SectionTitle>
            <div className="flex flex-wrap gap-4">
              {state.children.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-2xl bg-canvas px-4 py-2.5">
                  <Avatar emoji={c.emoji} color={c.color} size="sm" />
                  <span className="font-bold">{c.name}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${colorClasses[c.color].dot}`} />
                </div>
              ))}
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
