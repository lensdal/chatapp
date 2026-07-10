import { useEffect, useState } from 'react'
import { PiggyBank, Check } from 'lucide-react'
import Modal from './Modal'
import { Avatar } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById } from '../lib/selectors'
import type { Collection, PaymentMethod } from '../types'

export function CollectionCard({ collection }: { collection: Collection }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const me = state.currentUserId
  const total = collection.contributions.reduce((n, c) => n + c.amount, 0)
  const mine = collection.contributions.find((c) => c.memberId === me)
  const goal = collection.goal
  const pct = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0
  const suggested = collection.suggested ?? 20

  const chipIn = () => {
    dispatch({ type: 'CONTRIBUTE', collectionId: collection.id, amount: suggested })
    toast(`Chipped in $${suggested} via ${collection.method === 'venmo' ? 'Venmo' : 'Cash App'}`, '💰')
  }

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex items-start gap-3 bg-mint-soft px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <PiggyBank size={20} className="text-mint" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wide text-ink/40">Group collection</div>
          <h4 className="text-base font-extrabold leading-tight">{collection.title}</h4>
        </div>
      </div>

      {collection.note && <p className="px-5 pt-3 text-sm text-ink/55">{collection.note}</p>}

      <div className="p-5">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-extrabold">
            ${total}
            {goal ? <span className="text-sm font-semibold text-ink/40"> / ${goal}</span> : null}
          </div>
          <div className="text-xs font-semibold text-ink/45">
            {collection.contributions.length} contributor{collection.contributions.length === 1 ? '' : 's'}
          </div>
        </div>
        {goal ? (
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-1.5">
          {collection.contributions.slice(0, 6).map((c) => {
            const m = memberById(state, c.memberId)
            return m ? <Avatar key={c.memberId} emoji={m.emoji} color={m.color} size="xs" ring /> : null
          })}
        </div>

        <div className="mt-4">
          {mine ? (
            <span className="chip bg-mint-soft text-mint">
              <Check size={13} strokeWidth={3} /> You chipped in ${mine.amount}
            </span>
          ) : (
            <button
              onClick={chipIn}
              className="chip bg-mint text-white shadow-soft transition hover:bg-mint/90"
            >
              Chip in ${suggested} · {collection.method === 'venmo' ? 'Venmo' : 'Cash App'}
            </button>
          )}
          <span className="ml-2 text-[11px] text-ink/40">to {collection.recipient}</span>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

export function CreateCollectionModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean
  onClose: () => void
  groupId: string
}) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [suggested, setSuggested] = useState('20')
  const [goal, setGoal] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('venmo')
  const [recipient, setRecipient] = useState('')

  useEffect(() => {
    if (open) {
      setTitle('')
      setNote('')
      setSuggested('20')
      setGoal('')
      setMethod('venmo')
      setRecipient('')
    }
  }, [open])

  const canSubmit = title.trim() && recipient.trim()

  return (
    <Modal open={open} onClose={onClose} title="Collect money">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>What's it for?</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. End-of-season coach gift" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Suggested each ($)</label>
            <input className={inputCls} value={suggested} onChange={(e) => setSuggested(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>Goal ($, optional)</label>
            <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="e.g. 200" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Method</label>
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="venmo">Venmo</option>
              <option value="cashapp">Cash App</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Collected by</label>
            <input className={inputCls} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Jenna" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Note (optional)</label>
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else" />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={() => {
            if (!canSubmit) return
            dispatch({
              type: 'ADD_COLLECTION',
              groupId,
              title: title.trim(),
              note: note.trim() || undefined,
              suggested: suggested ? Number(suggested) : undefined,
              goal: goal ? Number(goal) : undefined,
              method,
              recipient: recipient.trim(),
            })
            onClose()
          }}
          disabled={!canSubmit}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          Post collection
        </button>
      </div>
    </Modal>
  )
}
