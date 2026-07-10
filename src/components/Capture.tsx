import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Forward, ListChecks, CalendarDays, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import Modal from './Modal'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { colorClasses } from '../lib/ui'
import { parseForward, detectChild } from '../lib/parse'
import { usePaymentFields } from './usePaymentFields'
import type { Priority } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

const SAMPLE =
  'Hi all! Jersey fees are due — $45, Venmo Coach Dave by this Friday please. 🙏'

export function ForwardCaptureModal({
  open,
  onClose,
  initialText = '',
  onDone,
}: {
  open: boolean
  onClose: () => void
  initialText?: string
  onDone?: () => void
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()

  const [text, setText] = useState('')
  const [type, setType] = useState<'task' | 'event'>('task')
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState('')
  const [childId, setChildId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [includePayment, setIncludePayment] = useState(false)
  const [postToChat, setPostToChat] = useState(true)
  const pay = usePaymentFields(groupId)

  const parsed = useMemo(() => (text.trim() ? parseForward(text) : null), [text])

  // Reset everything when the modal opens.
  useEffect(() => {
    if (open) {
      setText(initialText)
      setType('task')
      setTitle('')
      setGroupId('')
      setChildId('')
      setDate('')
      setTime('')
      setIncludePayment(false)
      pay.reset({ amount: '' })
      setPostToChat(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Apply parse results whenever the pasted text changes.
  useEffect(() => {
    if (!parsed) return
    setType(parsed.type)
    setTitle(parsed.title)
    if (parsed.dateISO) {
      const d = new Date(parsed.dateISO)
      setDate(format(d, 'yyyy-MM-dd'))
      setTime(parsed.hasTime ? format(d, 'HH:mm') : parsed.type === 'event' ? '10:00' : '09:00')
    }
    if (parsed.amount) {
      setIncludePayment(true)
      pay.reset({ amount: String(parsed.amount), method: parsed.method })
    } else {
      setIncludePayment(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const group = state.groups.find((g) => g.id === groupId)
  const onPickGroup = (id: string) => {
    setGroupId(id)
    const kids = state.groups.find((x) => x.id === id)?.childIds ?? []
    const detected = detectChild(text, state.children)
    setChildId(detected && kids.includes(detected) ? detected : kids.length === 1 ? kids[0] : '')
  }

  const canSubmit = text.trim() && title.trim() && groupId

  const submit = () => {
    if (!canSubmit) return
    const dateISO =
      date ? new Date(`${date}T${time || (type === 'event' ? '10:00' : '09:00')}`).toISOString() : undefined

    if (postToChat) {
      dispatch({ type: 'SEND_MESSAGE', groupId, text: `↪️ Forwarded: ${text.trim()}` })
    }

    if (type === 'task') {
      dispatch({
        type: 'ADD_TASK',
        task: {
          groupId,
          childId: childId || undefined,
          title: title.trim(),
          dueDate: dateISO,
          done: false,
          priority: 'medium' as Priority,
          assigneeIds: [state.currentUserId],
          payment: includePayment ? pay.build() : undefined,
        },
      })
    } else {
      dispatch({
        type: 'ADD_EVENT',
        event: {
          groupId,
          childId: childId || undefined,
          title: title.trim(),
          date: dateISO ?? new Date().toISOString(),
          addedToGoogle: false,
        },
      })
    }
    toast(`Added to ${group?.name ?? 'your list'}`, type === 'task' ? '✅' : '📅')
    onDone?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Forward a message to Village">
      <div className="space-y-4">
        <div className="rounded-2xl bg-mint-soft px-4 py-3 text-sm text-[#1f7a56]">
          Paste a message from WhatsApp (or a text or email) and Village will pull out the task,
          event, or payment for you to confirm.
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + ' mb-0'}>Pasted message</label>
            <button
              onClick={() => setText(SAMPLE)}
              className="text-xs font-bold text-violet hover:underline"
            >
              Try an example
            </button>
          </div>
          <textarea
            className={`${inputCls} min-h-[92px] resize-y`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Don't forget red shirts by Saturday, and jersey fees are $45 on Venmo"
            autoFocus
          />
        </div>

        {parsed && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-violet">
                <Sparkles size={13} /> Detected
              </span>
              {parsed.cues.map((c, i) => (
                <span key={i} className="chip bg-violet-soft text-violet">
                  {c}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['task', 'event'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    type === k ? 'bg-violet text-white shadow-soft' : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
                  }`}
                >
                  {k === 'task' ? <ListChecks size={17} /> : <CalendarDays size={17} />}
                  {k === 'task' ? 'A task' : 'An event'}
                </button>
              ))}
            </div>

            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>Which group?</label>
              <select className={inputCls} value={groupId} onChange={(e) => onPickGroup(e.target.value)}>
                <option value="">Choose a group…</option>
                {state.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            </div>

            {group && group.childIds.length > 0 && (
              <div>
                <label className={labelCls}>For which kid?</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setChildId('')}
                    className={`chip ${childId === '' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
                  >
                    Whole group
                  </button>
                  {group.childIds.map((cid) => {
                    const child = state.children.find((c) => c.id === cid)!
                    return (
                      <button
                        key={cid}
                        onClick={() => setChildId(cid)}
                        className={`chip ${childId === cid ? colorClasses[child.color].solid : colorClasses[child.color].softText}`}
                      >
                        {child.emoji} {child.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{type === 'task' ? 'Due date' : 'Date'}</label>
                <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {type === 'task' && (
              <div className="rounded-2xl bg-canvas p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includePayment}
                    onChange={(e) => setIncludePayment(e.target.checked)}
                    className="h-5 w-5 accent-violet"
                  />
                  <span className="text-sm font-bold">Attach a payment</span>
                </label>
                {includePayment && <div className="mt-3">{pay.node}</div>}
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={postToChat}
                onChange={(e) => setPostToChat(e.target.checked)}
                className="h-5 w-5 accent-violet"
              />
              <span className="font-medium text-ink/70">Also post the original message in the group chat</span>
            </label>
          </>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          Add to Village
        </button>
      </div>
    </Modal>
  )
}

export function CaptureButton({ variant = 'topbar' }: { variant?: 'topbar' | 'hero' }) {
  const navigate = useNavigate()
  const { state } = useStore()
  const count = state.forwards.filter((f) => !f.handled).length
  const go = () => navigate('/inbox')
  if (variant === 'topbar') {
    return (
      <button
        onClick={go}
        className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-mint/90"
      >
        <Forward size={16} /> Forwarding inbox
        {count > 0 && (
          <span className="rounded-full bg-white/25 px-1.5 text-xs font-bold">{count}</span>
        )}
      </button>
    )
  }
  return (
    <button
      onClick={go}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-mint shadow-soft ring-1 ring-mint/30 transition hover:bg-mint-soft"
    >
      <Forward size={16} /> Open forwarding inbox
    </button>
  )
}
