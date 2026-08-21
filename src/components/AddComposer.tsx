import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ListChecks, Bell, MapPin, Paperclip, X, PenLine, Video, Phone } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { myGroups } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import { NO_REPEAT, isRepeating } from '../lib/recurrence'
import { readAsAttachment } from '../lib/files'
import { usePaymentFields } from './usePaymentFields'
import RepeatPicker from './RepeatPicker'
import type { FileAttachment, Priority, Recurrence } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

type Kind = 'event' | 'task' | 'reminder'

const KINDS: { id: Kind; label: string; icon: typeof CalendarDays }[] = [
  { id: 'event', label: 'Event', icon: CalendarDays },
  { id: 'task', label: 'Task', icon: ListChecks },
  { id: 'reminder', label: 'Reminder', icon: Bell },
]

export default function AddComposer({
  open,
  onClose,
  initialKind = 'event',
  initialGroupId = '',
}: {
  open: boolean
  onClose: () => void
  initialKind?: Kind
  initialGroupId?: string
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const groups = myGroups(state)

  const [kind, setKind] = useState<Kind>(initialKind)
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(initialGroupId)
  const [childId, setChildId] = useState('')
  const [date, setDate] = useState('')
  const [addTime, setAddTime] = useState(false)
  const [time, setTime] = useState('10:00')
  const [mode, setMode] = useState<'inperson' | 'virtual' | 'phone'>('inperson')
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [callInfo, setCallInfo] = useState('')
  const [note, setNote] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [repeat, setRepeat] = useState<Recurrence>(NO_REPEAT)
  const [includePayment, setIncludePayment] = useState(false)
  const [attachment, setAttachment] = useState<FileAttachment | undefined>(undefined)
  const [requestSignature, setRequestSignature] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pay = usePaymentFields(groupId)

  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAttachment(await readAsAttachment(file))
    } catch {
      toast('Could not read that file', '⚠️')
    }
    e.target.value = ''
  }

  useEffect(() => {
    if (open) {
      setKind(initialKind)
      setTitle('')
      setGroupId(initialGroupId)
      setChildId('')
      setDate('')
      setAddTime(false)
      setTime('10:00')
      setMode('inperson')
      setLocation('')
      setMeetingUrl('')
      setCallInfo('')
      setNote('')
      setPriority('medium')
      setRepeat(NO_REPEAT)
      setIncludePayment(false)
      setAttachment(undefined)
      setRequestSignature(false)
      pay.reset({ amount: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const group = groups.find((g) => g.id === groupId)
  const kidOptions = group ? group.childIds : state.children.map((c) => c.id)

  const combine = (): string | undefined => {
    if (!date) return undefined
    return new Date(`${date}T${addTime ? time || '10:00' : '00:00'}`).toISOString()
  }
  const rec = isRepeating(repeat) ? repeat : undefined

  const canSubmit =
    kind === 'event'
      ? !!title.trim() && !!groupId && !!date
      : kind === 'reminder'
        ? !!title.trim() && !!date
        : !!title.trim()

  const submit = () => {
    if (!canSubmit) return
    const iso = combine()
    if (kind === 'event') {
      dispatch({
        type: 'ADD_EVENT',
        event: {
          groupId,
          childId: childId || undefined,
          title: title.trim(),
          date: iso ?? new Date().toISOString(),
          hasTime: addTime,
          mode,
          location: mode === 'inperson' ? location.trim() || undefined : undefined,
          meetingUrl: mode === 'virtual' ? meetingUrl.trim() || undefined : undefined,
          callInfo: mode === 'phone' ? callInfo.trim() || undefined : undefined,
          note: note.trim() || undefined,
          recurrence: rec,
          addedToGoogle: false,
          createdById: state.currentUserId,
          attachment,
        },
      })
    } else if (kind === 'task') {
      dispatch({
        type: 'ADD_TASK',
        task: {
          groupId: groupId || undefined,
          childId: childId || undefined,
          title: title.trim(),
          dueDate: iso,
          hasTime: !!date && addTime,
          note: note.trim() || undefined,
          done: false,
          priority,
          assigneeIds: [state.currentUserId],
          payment: includePayment ? pay.build() : undefined,
          recurrence: rec,
          createdById: state.currentUserId,
          attachment,
        },
      })
    } else {
      dispatch({
        type: 'ADD_REMINDER',
        reminder: {
          groupId: groupId || undefined,
          childId: childId || undefined,
          title: title.trim(),
          note: note.trim() || undefined,
          date: iso ?? new Date().toISOString(),
          hasTime: addTime,
          recurrence: rec,
          createdById: state.currentUserId,
          attachment,
        },
      })
    }

    // If they asked for signatures on the attached file, also post a signature
    // request for it (people sign it; each gets a "Sign" to-do).
    if (requestSignature && attachment) {
      dispatch({
        type: 'ADD_SIGNATURE_DOC',
        groupId: groupId || undefined,
        childId: childId || undefined,
        title: title.trim() || attachment.name,
        note: note.trim() || undefined,
        dueDate: iso,
        fileName: attachment.name,
        fileKind: attachment.kind,
        fileDataUrl: attachment.dataUrl,
      })
    }

    toast(
      kind === 'event' ? 'Event added' : kind === 'task' ? 'Task added' : 'Reminder added',
      kind === 'event' ? '📅' : kind === 'task' ? '✅' : '🔔',
    )
    onClose()
  }

  const titleLabel = kind === 'event' ? 'Event name' : kind === 'task' ? 'What needs doing?' : 'Reminder'
  const titlePlaceholder =
    kind === 'event'
      ? 'e.g. Home game vs Northgate'
      : kind === 'task'
        ? 'e.g. Bring a red shirt'
        : 'e.g. No school Friday'
  const dateLabel = kind === 'task' ? 'Due date (optional)' : 'Date'

  return (
    <Modal open={open} onClose={onClose} title="Add to Village">
      <div className="space-y-4">
        {/* Kind tabs */}
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => {
            const Icon = k.icon
            return (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                  kind === k.id ? 'bg-violet text-white shadow-soft' : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
                }`}
              >
                <Icon size={16} /> {k.label}
              </button>
            )
          })}
        </div>

        <div>
          <label className={labelCls}>{titleLabel}</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={titlePlaceholder} autoFocus />
        </div>

        <div>
          <label className={labelCls}>{kind === 'event' ? 'Which group?' : 'Attach to a group?'}</label>
          <select
            className={inputCls}
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value)
              setChildId('')
            }}
          >
            <option value="">{kind === 'event' ? 'Choose a group…' : 'Just me (personal)'}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
        </div>

        {kidOptions.length > 0 && (
          <div>
            <label className={labelCls}>For which kid? (optional)</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChildId('')}
                className={`chip ${childId === '' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
              >
                {group ? 'Whole group' : 'None'}
              </button>
              {kidOptions.map((cid) => {
                const child = state.children.find((c) => c.id === cid)
                if (!child) return null
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

        {/* Date + optional time */}
        <div>
          <label className={labelCls}>{dateLabel}</label>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={addTime} onChange={(e) => setAddTime(e.target.checked)} className="h-4.5 w-4.5 accent-violet" />
            <span className="font-medium text-ink/70">Add a time</span>
            {addTime && (
              <input type="time" className="ml-1 rounded-xl border border-black/10 bg-canvas/60 px-3 py-1.5 text-sm font-medium outline-none focus:border-violet" value={time} onChange={(e) => setTime(e.target.value)} />
            )}
          </label>
        </div>

        {kind === 'event' && (
          <div>
            <label className={labelCls}>How do people attend?</label>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {([
                { id: 'inperson', label: 'In person', icon: MapPin },
                { id: 'virtual', label: 'Virtual', icon: Video },
                { id: 'phone', label: 'Phone', icon: Phone },
              ] as const).map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-sm font-bold transition ${
                      mode === m.id ? 'bg-violet text-white shadow-soft' : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Icon size={15} /> {m.label}
                  </button>
                )
              })}
            </div>
            {mode === 'inperson' && (
              <div className="relative">
                <MapPin size={15} className="pointer-events-none absolute left-3.5 top-3 text-ink/35" />
                <input
                  className={`${inputCls} pl-9`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or place — links to Google & Apple Maps"
                />
              </div>
            )}
            {mode === 'virtual' && (
              <div className="relative">
                <Video size={15} className="pointer-events-none absolute left-3.5 top-3 text-ink/35" />
                <input
                  className={`${inputCls} pl-9`}
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="Meeting link — e.g. https://meet.google.com/…"
                />
              </div>
            )}
            {mode === 'phone' && (
              <div className="relative">
                <Phone size={15} className="pointer-events-none absolute left-3.5 top-3 text-ink/35" />
                <input
                  className={`${inputCls} pl-9`}
                  value={callInfo}
                  onChange={(e) => setCallInfo(e.target.value)}
                  placeholder="Dial-in number — e.g. +1 555-123-4567 (code 8842)"
                />
              </div>
            )}
          </div>
        )}

        {kind === 'task' && (
          <div>
            <label className={labelCls}>Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`chip flex-1 justify-center capitalize ${priority === p ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Repeat */}
        <RepeatPicker value={repeat} onChange={setRepeat} />

        {/* Note */}
        <div>
          <label className={labelCls}>Note</label>
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              kind === 'event'
                ? 'e.g. Child-only event · Parents welcome · Siblings welcome'
                : kind === 'reminder'
                  ? 'e.g. Campus closed — no aftercare'
                  : 'Anything worth adding'
            }
          />
        </div>

        {/* Attachment (all kinds) */}
        <div>
          <label className={labelCls}>Attachment</label>
          <input ref={fileRef} type="file" className="hidden" onChange={onAttach} />
          {attachment ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl bg-canvas px-3 py-2.5">
                <Paperclip size={15} className="shrink-0 text-violet" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink/70">{attachment.name}</span>
                <button
                  onClick={() => {
                    setAttachment(undefined)
                    setRequestSignature(false)
                  }}
                  className="rounded-full p-1 text-ink/40 hover:text-tang"
                  title="Remove"
                >
                  <X size={15} />
                </button>
              </div>
              {/* Turn the attached file into something people sign */}
              <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl bg-canvas px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={requestSignature}
                  onChange={(e) => setRequestSignature(e.target.checked)}
                  className="mt-0.5 h-5 w-5 accent-violet"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <PenLine size={15} /> Request signatures on this
                  </span>
                  <span className="block text-xs text-ink/50">
                    Everyone can sign it{groupId ? ' in the group' : ''}, and each gets a “Sign” to-do — great for
                    permission slips &amp; waivers.
                  </span>
                </span>
              </label>
            </>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-canvas px-4 py-2.5 text-sm font-bold text-ink/60 transition hover:bg-black/[0.05]"
            >
              <Paperclip size={15} /> Attach a file
            </button>
          )}
        </div>

        {/* Payment (tasks only) */}
        {kind === 'task' && (
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
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          Add {kind}
        </button>
      </div>
    </Modal>
  )
}
