import { useEffect, useState } from 'react'
import { ListChecks, CalendarDays, DollarSign } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { groupById } from '../lib/selectors'
import { colorClasses } from '../lib/ui'
import type { PaymentMethod, Priority } from '../types'
import { format } from 'date-fns'

type Kind = 'task' | 'event'

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

  const [kind, setKind] = useState<Kind>(defaultKind)
  const [title, setTitle] = useState(defaultText)
  const [childId, setChildId] = useState<string>(group?.childIds[0] ?? '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('09:00')
  const [priority, setPriority] = useState<Priority>('medium')
  const [location, setLocation] = useState('')
  const [hasPayment, setHasPayment] = useState(false)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('venmo')

  // Reset the form each time the modal opens for a new message/kind.
  useEffect(() => {
    if (open) {
      setKind(defaultKind)
      setTitle(defaultText)
      setChildId(group?.childIds[0] ?? '')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime(defaultKind === 'event' ? '10:00' : '09:00')
      setPriority('medium')
      setLocation('')
      setHasPayment(false)
      setAmount('')
      setRecipient('')
      setMethod('venmo')
    }
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
        payment:
          hasPayment && amount
            ? {
                amount: Number(amount),
                recipient: recipient.trim() || 'the organizer',
                method,
                paid: false,
              }
            : undefined,
      }
      if (messageId) dispatch({ type: 'PROMOTE_TO_TASK', messageId, task })
      else dispatch({ type: 'ADD_TASK', task })
    } else {
      const event = {
        groupId,
        childId: childId || undefined,
        title: cleanTitle,
        date: toISO(date, time),
        location: location.trim() || undefined,
        addedToGoogle: false,
      }
      if (messageId) dispatch({ type: 'PROMOTE_TO_EVENT', messageId, event })
      else dispatch({ type: 'ADD_EVENT', event })
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

      <div className="mb-5 grid grid-cols-2 gap-2">
        {(['task', 'event'] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
              kind === k
                ? 'bg-violet text-white shadow-soft'
                : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
            }`}
          >
            {k === 'task' ? <ListChecks size={18} /> : <CalendarDays size={18} />}
            {k === 'task' ? 'A task' : 'An event'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>{kind === 'task' ? 'What needs doing?' : 'Event name'}</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'task' ? 'e.g. Bring a red shirt' : 'e.g. Home game vs Northgate'}
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
                    className={`chip ${
                      childId === cid ? colorClasses[child.color].solid : colorClasses[child.color].softText
                    }`}
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
              {hasPayment && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input
                    className={inputCls}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="Amount ($)"
                    inputMode="decimal"
                  />
                  <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                    <option value="venmo">Venmo</option>
                    <option value="cashapp">Cash App</option>
                  </select>
                  <input
                    className={`${inputCls} col-span-2`}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Pay who? (e.g. Coach Dave)"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            <label className={labelCls}>Location (optional)</label>
            <input
              className={inputCls}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Field 4, Westside Park"
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
          {kind === 'task' ? 'Create task' : 'Add event'}
          {kind === 'task' ? ' for everyone' : ''}
        </button>
      </div>
    </Modal>
  )
}
