import { useEffect, useState } from 'react'
import { ClipboardList, Check, X, Plus, Trash2, CalendarClock, MessageCircle } from 'lucide-react'
import Modal from './Modal'
import { Avatar, Pill } from './ui'
import { KidTag } from './items'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById, groupById } from '../lib/selectors'
import { colorClasses, groupStyles } from '../lib/ui'
import { fmtDay } from '../lib/dates'
import type { SignUpSheet } from '../types'
import { format } from 'date-fns'

export function SignupCard({ sheet }: { sheet: SignUpSheet }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const me = state.currentUserId
  const creator = memberById(state, sheet.createdById)
  const group = groupById(state, sheet.groupId)
  const accentHex = group ? group.color : '#7C5CFC'

  const filled = sheet.slots.filter((s) => s.claims.length >= s.qty).length
  const remaining = sheet.slots.reduce((n, s) => n + Math.max(0, s.qty - s.claims.length), 0)

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex items-start gap-3 px-5 py-4" style={groupStyles.softBg(accentHex)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <ClipboardList size={20} style={groupStyles.text(accentHex)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Sign-up list</span>
            {creator && <span className="text-xs text-ink/40">· by {creator.isSelf ? 'you' : creator.name}</span>}
          </div>
          <h4 className="text-base font-extrabold leading-tight">{sheet.title}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <KidTag childId={sheet.childId} plain />
            <Pill className="bg-white/70 text-ink/60">
              <CalendarClock size={12} /> by {fmtDay(sheet.dueDate)}
            </Pill>
            <Pill className="bg-white/70 text-ink/60">
              {filled}/{sheet.slots.length} covered
            </Pill>
          </div>
        </div>
      </div>

      {sheet.note && <p className="px-5 pt-3 text-sm text-ink/55">{sheet.note}</p>}

      <ul className="space-y-1 p-3">
        {sheet.slots.map((slot) => {
          const mine = slot.claims.some((c) => c.memberId === me)
          const full = slot.claims.length >= slot.qty
          const claimants = slot.claims
            .map((c) => memberById(state, c.memberId))
            .filter((m): m is NonNullable<typeof m> => Boolean(m))

          return (
            <li key={slot.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-black/[0.02]">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{slot.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-ink/40">
                    {slot.claims.length}/{slot.qty} signed up
                  </span>
                  {claimants.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {claimants.map((m, i) => (
                        <Avatar key={i} emoji={m.emoji} color={m.color} image={m.avatarImage} size="xs" ring />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {mine ? (
                <div className="flex items-center gap-1">
                  <span className="chip bg-mint-soft text-mint">
                    <Check size={13} strokeWidth={3} /> You're in
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'UNCLAIM_SLOT', sheetId: sheet.id, slotId: slot.id })}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink/35 transition hover:bg-black/10 hover:text-tang"
                    title="Remove me from this"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : full ? (
                <span className="chip bg-black/[0.04] text-ink/40">Filled</span>
              ) : (
                <button
                  onClick={() => dispatch({ type: 'CLAIM_SLOT', sheetId: sheet.id, slotId: slot.id })}
                  className="chip bg-violet text-white shadow-soft transition hover:bg-violet/90"
                >
                  <Plus size={13} strokeWidth={2.6} /> I'll bring this
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t border-black/5 px-5 py-2.5">
        <span className="text-[11px] text-ink/40">Signing up adds it to your Tasks with the due date.</span>
        {remaining > 0 && (
          <button
            onClick={() =>
              toast(
                state.whatsappConnected
                  ? `Nudged the group on WhatsApp about ${remaining} open item${remaining === 1 ? '' : 's'}`
                  : 'Connect WhatsApp in Settings to send reminders',
                '💬',
              )
            }
            className="chip shrink-0 bg-[#25D366]/12 text-[#0f9d58] ring-1 ring-[#25D366]/30 transition hover:bg-[#25D366]/20"
          >
            <MessageCircle size={13} /> Nudge on WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

export function CreateSignupModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean
  onClose: () => void
  groupId: string
}) {
  const { state, dispatch } = useStore()
  const group = groupById(state, groupId)

  const [title, setTitle] = useState('')
  const [childId, setChildId] = useState(group?.childIds[0] ?? '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('12:00')
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<{ label: string; qty: string }[]>([
    { label: '', qty: '1' },
    { label: '', qty: '1' },
  ])

  useEffect(() => {
    if (open) {
      setTitle('')
      setChildId(group?.childIds[0] ?? '')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime('12:00')
      setNote('')
      setSlots([
        { label: '', qty: '1' },
        { label: '', qty: '1' },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!group) return null

  const setSlot = (i: number, patch: Partial<{ label: string; qty: string }>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  const cleanSlots = slots
    .map((s) => ({ label: s.label.trim(), qty: Math.max(1, Number(s.qty) || 1) }))
    .filter((s) => s.label)

  const submit = () => {
    if (!title.trim() || cleanSlots.length === 0) return
    dispatch({
      type: 'ADD_SIGNUP',
      groupId,
      childId: childId || undefined,
      title: title.trim(),
      note: note.trim() || undefined,
      dueDate: new Date(`${date}T${time || '12:00'}`).toISOString(),
      slots: cleanSlots,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New sign-up list">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>What's it for?</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Class Halloween party"
            autoFocus
          />
        </div>

        {group.childIds.length > 0 && (
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
            <label className={labelCls}>Deadline date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Items to sign up for</label>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={s.label}
                  onChange={(e) => setSlot(i, { label: e.target.value })}
                  placeholder={`Item ${i + 1} — e.g. Cupcakes`}
                />
                <div className="flex items-center gap-1 rounded-2xl bg-canvas px-2 py-1" title="How many people needed">
                  <span className="text-[10px] font-bold uppercase text-ink/35">need</span>
                  <input
                    className="w-10 bg-transparent text-center text-sm font-bold outline-none"
                    value={s.qty}
                    onChange={(e) => setSlot(i, { qty: e.target.value.replace(/[^0-9]/g, '') })}
                    inputMode="numeric"
                  />
                </div>
                {slots.length > 1 && (
                  <button
                    onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/35 transition hover:bg-black/10 hover:text-tang"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setSlots((prev) => [...prev, { label: '', qty: '1' }])}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3.5 py-2 text-sm font-bold text-violet transition hover:bg-violet-soft"
          >
            <Plus size={15} /> Add another item
          </button>
        </div>

        <div>
          <label className={labelCls}>Note (optional)</label>
          <input
            className={inputCls}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else the group should know"
          />
        </div>
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
          disabled={!title.trim() || cleanSlots.length === 0}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          Post to group
        </button>
      </div>
    </Modal>
  )
}
