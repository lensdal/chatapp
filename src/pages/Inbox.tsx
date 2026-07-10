import { useState } from 'react'
import { MessageCircle, Smartphone, Mail, Copy, Wand2, X, Sparkles, Info } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, EmptyState } from '../components/ui'
import { ForwardCaptureModal } from '../components/Capture'
import { useStore } from '../store/store'
import { useToast } from '../components/Toast'
import { fmtAgo } from '../lib/dates'
import type { ForwardItem } from '../types'

const FORWARD_NUMBER = '+1 (833) 555-0199'
const FORWARD_EMAIL = 'you-4821@in.village.app'

const sourceMeta = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, cls: 'bg-[#25D366]/15 text-[#0f9d58]' },
  sms: { label: 'Text', icon: Smartphone, cls: 'bg-sky-soft text-sky' },
  email: { label: 'Email', icon: Mail, cls: 'bg-blush-soft text-blush' },
} as const

export default function Inbox() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [sim, setSim] = useState('')
  const [active, setActive] = useState<ForwardItem | null>(null)

  const items = state.forwards.filter((f) => !f.handled)

  const SAMPLE = "Reminder: class dues are $15, please Venmo Ms. Chen by Friday. Also picture day is next Tuesday!"

  return (
    <>
      <Topbar title="Forwarding inbox" subtitle="Forward messages from anywhere — turn them into tasks & events." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* How it works */}
          <Card className="p-5">
            <h2 className="mb-1 text-lg font-extrabold">Forward messages to Village</h2>
            <p className="mb-4 text-sm text-ink/55">
              See something in a WhatsApp group or a text? Forward it to your personal Village number
              or email and it lands right here — no retyping. Then tap it to turn it into a task, event,
              or payment for the right group and kid.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                    <MessageCircle size={12} className="text-[#0f9d58]" /> Forward / text to
                  </div>
                  <div className="truncate font-bold">{FORWARD_NUMBER}</div>
                </div>
                <button onClick={() => toast('Number copied', '📋')} className="chip bg-violet text-white shadow-soft">
                  <Copy size={13} /> Copy
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                    <Mail size={12} className="text-blush" /> Email to
                  </div>
                  <div className="truncate font-bold">{FORWARD_EMAIL}</div>
                </div>
                <button onClick={() => toast('Email copied', '📋')} className="chip bg-violet text-white shadow-soft">
                  <Copy size={13} /> Copy
                </button>
              </div>
            </div>
          </Card>

          {/* Simulate (demo only) */}
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-violet">
              <Sparkles size={16} /> Try it — simulate a forwarded message
            </div>
            <p className="mb-3 flex items-start gap-2 rounded-2xl bg-violet-soft px-3 py-2 text-xs text-violet">
              <Info size={14} className="mt-0.5 shrink-0" />
              In the real app this happens automatically when you forward from WhatsApp/Messages. Here,
              type or paste a message to see it arrive in your inbox.
            </p>
            <textarea
              value={sim}
              onChange={(e) => setSim(e.target.value)}
              placeholder="Paste any message…"
              className="min-h-[70px] w-full resize-y rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm outline-none focus:border-violet focus:bg-white"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setSim(SAMPLE)} className="text-xs font-bold text-violet hover:underline">Use an example</button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  if (!sim.trim()) return
                  dispatch({ type: 'ADD_FORWARD', text: sim.trim(), source: 'whatsapp' })
                  setSim('')
                  toast('Message arrived in your inbox', '📨')
                }}
                disabled={!sim.trim()}
                className="rounded-full bg-mint px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-mint/90 disabled:opacity-40"
              >
                Send to inbox
              </button>
            </div>
          </Card>

          {/* Inbox list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Waiting for you {items.length > 0 && <span className="text-ink/40">({items.length})</span>}</h2>
            </div>
            {items.length === 0 ? (
              <Card className="p-4"><EmptyState emoji="📭" text="Inbox zero! Forwarded messages will show up here." /></Card>
            ) : (
              <div className="space-y-3">
                {items.map((f) => {
                  const meta = sourceMeta[f.source]
                  const Icon = meta.icon
                  return (
                    <Card key={f.id} className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`chip ${meta.cls}`}>
                          <Icon size={12} /> {meta.label}
                        </span>
                        <span className="text-[11px] text-ink/40">Forwarded {fmtAgo(f.at)}</span>
                      </div>
                      <p className="text-sm text-ink/80">{f.text}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setActive(f)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-violet px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
                        >
                          <Wand2 size={14} /> Turn into task / event
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'DISMISS_FORWARD', id: f.id })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-4 py-2 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
                        >
                          <X size={14} /> Dismiss
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ForwardCaptureModal
        open={!!active}
        initialText={active?.text ?? ''}
        onClose={() => setActive(null)}
        onDone={() => active && dispatch({ type: 'HANDLE_FORWARD', id: active.id })}
      />
    </>
  )
}
