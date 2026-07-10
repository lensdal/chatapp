import { useEffect, useState } from 'react'
import { BarChart3, Check, Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { memberById } from '../lib/selectors'
import type { Poll } from '../types'

export function PollCard({ poll }: { poll: Poll }) {
  const { state, dispatch } = useStore()
  const me = state.currentUserId
  const creator = memberById(state, poll.createdById)
  const total = poll.options.reduce((n, o) => n + o.votes.length, 0)

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex items-start gap-3 bg-sun-soft px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <BarChart3 size={20} className="text-[#B7841A]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wide text-ink/40">
            Poll {creator && `· by ${creator.isSelf ? 'you' : creator.name}`}
          </div>
          <h4 className="text-base font-extrabold leading-tight">{poll.question}</h4>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {poll.options.map((o) => {
          const pct = total ? Math.round((o.votes.length / total) * 100) : 0
          const mine = o.votes.includes(me)
          return (
            <button
              key={o.id}
              onClick={() => dispatch({ type: 'VOTE_POLL', pollId: poll.id, optionId: o.id })}
              className="relative block w-full overflow-hidden rounded-2xl border border-black/10 px-4 py-2.5 text-left transition hover:border-violet"
            >
              <div
                className={`absolute inset-y-0 left-0 ${mine ? 'bg-violet/20' : 'bg-black/[0.04]'}`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  {mine && <Check size={14} className="text-violet" strokeWidth={3} />}
                  {o.label}
                </span>
                <span className="font-bold text-ink/50">{pct}%</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="border-t border-black/5 px-5 py-2.5 text-[11px] text-ink/40">
        {total} vote{total === 1 ? '' : 's'}
        {poll.multi ? ' · pick as many as you like' : ' · tap to vote, tap again to remove'}
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'

export function CreatePollModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean
  onClose: () => void
  groupId: string
}) {
  const { dispatch } = useStore()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multi, setMulti] = useState(false)

  useEffect(() => {
    if (open) {
      setQuestion('')
      setOptions(['', ''])
      setMulti(false)
    }
  }, [open])

  const clean = options.map((o) => o.trim()).filter(Boolean)
  const canSubmit = question.trim() && clean.length >= 2

  return (
    <Modal open={open} onClose={onClose} title="New poll">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Question</label>
          <input className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Best day for the team dinner?" autoFocus />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Options</label>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={o}
                  onChange={(e) => setOptions((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                  placeholder={`Option ${i + 1}`}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions((p) => p.filter((_, idx) => idx !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/35 hover:bg-black/10 hover:text-tang"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setOptions((p) => [...p, ''])}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3.5 py-2 text-sm font-bold text-violet hover:bg-violet-soft"
          >
            <Plus size={15} /> Add option
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} className="h-5 w-5 accent-violet" />
          <span className="font-medium text-ink/70">Allow multiple selections</span>
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={() => {
            if (!canSubmit) return
            dispatch({ type: 'ADD_POLL', groupId, question: question.trim(), options: clean, multi })
            onClose()
          }}
          disabled={!canSubmit}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          Post poll
        </button>
      </div>
    </Modal>
  )
}
