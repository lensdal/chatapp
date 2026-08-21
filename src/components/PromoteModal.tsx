import { useEffect, useMemo, useState } from 'react'
import { ListChecks, CalendarDays, DollarSign, Sparkles, Bell } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { groupById } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import { parseForward, detectChild } from '../lib/parse'
import { usePaymentFields } from './usePaymentFields'
import type { Priority } from '../types'
import { format } from 'date-fns'

type Kind = 'task' | 'event' | 'reminder'

const KINDS: { id: Kind; label: string; icon: typeof ListChecks }[] = [
  { id: 'task', label: 'A task', icon: ListChecks },
  { id: 'event', label: 'An event', icon: CalendarDays },
  { id: 'reminder', label: 'A reminder', icon: Bell },
]

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

function toISO(date: string, time: string): string {
  const t = time || '09:00'
  return new Date(`${date}T${t}`).toISOString()
}

export default function PromoteModal({
  open,
  onClose,
  groupId,
  messageId,
  defaultText = '',
  defaultKind = 'task',
}: {
  open: boolean
  onClose: () => void
  groupId: string
  messageId?: string
  defaultText?: string
  defaultKind?: Kind
}) {
  const { state, dispatch } = useStore()
  const group = groupById(state, groupId)

  // Auto-detect task/event details from the message being promoted.
  const parsed = useMemo(
    () => (defaultText.trim() ? parseForward(defaultText) : null),
    [defaultText],
  )

  const [kind, setKind] = useState<Kind>(defaultKind)
  const [title, setTitle] = useState(defaultText)
  const [childId, setChildId] = useState<string>(group?.childIds[0] ?? '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('09:00')
  const [priority, setPriority] = useState<Priority>('medium')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [hasPayment, setHasPayment] = useState(false)
  const pay = usePaymentFields(groupId)

  // Reset + auto-fill each time the modal opens for a new message/kind.
  useEffect(() => {
    if (!open) return
    const kids = group?.childIds ?? []
    // Auto-pick the kid if the message names one; otherwise default sensibly.
    const detected = parsed ? detectChild(defaultText, state.children) : undefined
    const detectedInGroup = detected && kids.includes(detected) ? detected : undefined

    if (parsed) {
      setKind(parsed.type)
      setTitle(parsed.title)
      setPriority(parsed.priority)
      setLocation(parsed.location ?? '')
      setNote('')
      if (parsed.dateISO) {
        const d = new Date(parsed.dateISO)
        setDate(format(d, 'yyyy-MM-dd'))
        setTime(parsed.hasTime ? format(d, 'HH:mm') : parsed.type === 'event' ? '10:00' : '09:00')
      } else {
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setTime(parsed.type === 'event' ? '10:00' : '09:00')
      }
      setHasPayment(!!parsed.amount)
      pay.reset({ amount: parsed.amount ? String(parsed.amount) : '', method: parsed.method })
    } else {
      setKind(defaultKind)
      setTitle(defaultText)
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime(defaultKind === 'event' ? '10:00' : '09:00')
      setPriority('medium')
      setLocation('')
      setNote('')
      setHasPayment(false)
      pay.reset({ amount: '' })
    }
    setChildId(detectedInGroup ?? (kids.length === 1 ? kids[0] : ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!group) return null

  const kidMembers = group.childIds
  const submit = () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    if (kind === 'task') {
      const task = {
        groupId,
        childId: childId || undefined,
        title: cleanTitle,
        dueDate: toISO(date, time),
        done: false,
        priority,
        assigneeIds: [state.currentUserId],
        payment: hasPayment ? pay.build() : undefined,
      }
      if (messageId) dispatch({ type: 'PROMOTE_TO_TASK', messageId, task })
      else dispatch({ type: 'ADD_TASK', task })
    } else if (kind === 'event') {
      const event = {
        groupId,
        childId: childId || undefined,
        title: cleanTitle,
        date: toISO(date, time),
        hasTime: true,
        location: location.trim() || undefined,
        addedToGoogle: false,
      }
      if (messageId) dispatch({ type: 'PROMOTE_TO_EVENT', messageId, event })
      else dispatch({ type: 'ADD_EVENT', event })
    } else {
      const reminder = {
        groupId,
        childId: childId || undefined,
        title: cleanTitle,
        note: note.trim() || undefined,
        date: toISO(date, time),
        hasTime: true,
      }
      if (messageId) dispatch({ type: 'PROMOTE_TO_REMINDER', messageId, reminder })
      else dispatch({ type: 'ADD_REMINDER', reminder })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={messageId ? 'Turn this into…' : 'Add to the group'}>
      {messageId && defaultText && (
        <div className="mb-4 rounded-2xl bg-canvas px-4 py-3 text-sm italic text-ink/55">
          “{defaultText}”
        </div>
      )}

      {parsed && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet">
            <Sparkles size={13} /> Auto-filled
          </span>
          {parsed.cues.map((c, i) => (
            <span key={i} className="chip bg-violet-soft text-violet">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2">
        {KINDS.map((k) => {
          const Icon = k.icon
          return (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                kind === k.id
                  ? 'bg-violet text-white shadow-soft'
                  : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
              }`}
            >
              <Icon size={17} />
              {k.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>
            {kind === 'task' ? 'What needs doing?' : kind === 'event' ? 'Event name' : 'Reminder'}
          </label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === 'task'
                ? 'e.g. Bring a red shirt'
                : kind === 'event'
                  ? 'e.g. Home game vs Northgate'
                  : 'e.g. No school Friday'
            }
            autoFocus
          />
        </div>

        {kidMembers.length > 0 && (
          <div>
            <label className={labelCls}>For which kid?</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChildId('')}
                className={`chip ${childId === '' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
              >
                Whole group
              </button>
              {kidMembers.map((cid) => {
                const child = state.children.find((c) => c.id === cid)!
                return (
                  <button
                    key={cid}
                    onClick={() => setChildId(cid)}
                    className="chip"
                    style={childId === cid ? groupStyles.solid(child.color) : groupStyles.soft(child.color)}
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
            <label className={labelCls}>{kind === 'task' ? 'Due date' : 'Date'}</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        {kind === 'task' ? (
          <>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`chip flex-1 justify-center capitalize ${
                      priority === p ? 'bg-ink text-white' : 'bg-canvas text-ink/55'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-canvas p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasPayment}
                  onChange={(e) => setHasPayment(e.target.checked)}
                  className="h-5 w-5 accent-violet"
                />
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <DollarSign size={16} /> This needs a payment
                </span>
              </label>
              {hasPayment && <div className="mt-3">{pay.node}</div>}
            </div>
          </>
        ) : kind === 'event' ? (
          <div>
            <label className={labelCls}>Location (optional)</label>
            <input
              className={inputCls}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Field 4, Westside Park"
            />
          </div>
        ) : (
          <div>
            <label className={labelCls}>Note (optional)</label>
            <textarea
              className={`${inputCls} min-h-[72px] resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Campus closed — no drop-off or aftercare"
            />
          </div>
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
          disabled={!title.trim()}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          Add {kind}
        </button>
      </div>
    </Modal>
  )
}
