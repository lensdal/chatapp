import { useState } from 'react'
import { Check, MapPin, CalendarPlus, CalendarCheck, DollarSign, MessageCircle, Repeat, Users, ExternalLink, Bell, X, FileText, Paperclip, Video, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EventItem, FileAttachment, Reminder, Task, PaymentMethod } from '../types'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { childById, groupById } from '../lib/selectors'
import { methodMeta, buildPayLink } from '../lib/pay'
import { groupStyles, priorityChip, priorityLabel } from '../lib/ui'
import { isRepeating, recurrenceShort } from '../lib/recurrence'
import { headcount } from '../lib/rsvp'
import { fmtDay, fmtTime, fmtRelativeDue } from '../lib/dates'
import { Pill } from './ui'
import { format } from 'date-fns'
import { EventDetailModal, TaskDetailModal } from './details'

export function AttachmentChip({ attachment }: { attachment: FileAttachment }) {
  const toast = useToast()
  if (attachment.kind === 'image' && attachment.dataUrl) {
    return (
      <img
        src={attachment.dataUrl}
        alt={attachment.name}
        className="mt-1 max-h-52 w-full rounded-2xl object-cover"
      />
    )
  }
  return (
    <button
      onClick={() => toast(`Downloading ${attachment.name}`, '📎')}
      className="mt-1 inline-flex items-center gap-2 rounded-2xl bg-canvas px-3 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/[0.05]"
    >
      <FileText size={16} className="text-violet" /> {attachment.name}
    </button>
  )
}

export function KidTag({ childId, plain = false }: { childId?: string; plain?: boolean }) {
  const { state } = useStore()
  const child = childById(state, childId)
  if (!child) return null
  const pill = (
    <Pill className="hover:opacity-80" style={groupStyles.soft(child.color)}>
      <span>{child.emoji}</span>
      {child.name}
    </Pill>
  )
  return plain ? pill : <Link to={`/kids/${child.id}`}>{pill}</Link>
}

export function GroupTag({ groupId, plain = false }: { groupId?: string; plain?: boolean }) {
  const { state } = useStore()
  const group = groupById(state, groupId)
  if (!group) return null
  const pill = (
    <Pill className="bg-black/[0.04] text-ink/60 hover:bg-black/[0.07]">
      <span>{group.emoji}</span>
      <span className="max-w-[130px] truncate">{group.name}</span>
    </Pill>
  )
  return plain ? pill : <Link to={`/chats/${group.id}`}>{pill}</Link>
}

export function PaymentButton({ task }: { task: Task }) {
  const { dispatch } = useStore()
  const toast = useToast()
  if (!task.payment) return null
  const { amount, recipient, methods, handles, paid } = task.payment
  if (paid) {
    return (
      <span className="chip bg-mint-soft text-mint">
        <Check size={13} strokeWidth={3} /> Paid ${amount}
      </span>
    )
  }
  const list = methods?.length ? methods : (['venmo'] as PaymentMethod[])
  const pay = (m: PaymentMethod) => {
    const handle = handles?.[m] ?? ''
    const meta = methodMeta(m)
    const link = buildPayLink(m, handle, amount, task.title)
    if (link) {
      window.open(link, '_blank', 'noopener')
      toast(`Opening ${meta.label} to pay ${recipient} $${amount}`, '💸')
    } else {
      toast(
        handle ? `Send $${amount} to ${handle} via ${meta.label}` : `Pay ${recipient} $${amount} via ${meta.label}`,
        '💸',
      )
    }
    dispatch({ type: 'PAY_TASK', taskId: task.id })
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {list.map((m) => {
        const meta = methodMeta(m)
        return (
          <button
            key={m}
            onClick={() => pay(m)}
            className={`chip ${meta.className} shadow-soft transition`}
            title={handles?.[m] ? `Send to ${handles[m]}` : `Pay ${recipient} via ${meta.label}`}
          >
            {meta.hasLink ? <ExternalLink size={12} /> : <DollarSign size={12} strokeWidth={2.6} />}${amount} · {meta.label}
          </button>
        )
      })}
    </div>
  )
}

export function TaskRow({
  task,
  showGroup = true,
  showKid = true,
}: {
  task: Task
  showGroup?: boolean
  showKid?: boolean
}) {
  const { state, dispatch } = useStore()
  const [detail, setDetail] = useState(false)
  const due = task.dueDate ? fmtRelativeDue(task.dueDate) : null
  const dueTone =
    due?.tone === 'overdue'
      ? 'text-tang'
      : due?.tone === 'soon'
        ? 'text-[#B7841A]'
        : 'text-ink/45'
  const others = task.assigneeIds.filter((id) => id !== state.currentUserId)

  return (
    <div className="flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/[0.02]">
      <button
        onClick={() => dispatch({ type: 'TOGGLE_TASK', taskId: task.id })}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.done
            ? 'border-mint bg-mint text-white'
            : 'border-black/15 text-transparent hover:border-violet'
        }`}
        aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => setDetail(true)}
          className={`block text-left text-sm font-semibold leading-snug hover:text-violet ${
            task.done ? 'text-ink/35 line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {due && !task.done && (
            <span className={`text-xs font-semibold ${dueTone}`}>{due.label}</span>
          )}
          {showKid && <KidTag childId={task.childId} />}
          {showGroup && <GroupTag groupId={task.groupId} />}
          {isRepeating(task.recurrence) && (
            <Pill className="bg-violet-soft text-violet"><Repeat size={11} /> {recurrenceShort(task.recurrence)}</Pill>
          )}
          {task.attachment && (
            <Pill className="bg-black/[0.04] text-ink/55"><Paperclip size={11} /></Pill>
          )}
          {others.length > 0 && (
            <Pill className="bg-black/[0.04] text-ink/55"><Users size={11} /> +{others.length}</Pill>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {task.payment ? (
          <PaymentButton task={task} />
        ) : (
          !task.done && (
            <span className={`chip ${priorityChip[task.priority]}`}>
              {priorityLabel[task.priority]}
            </span>
          )
        )}
      </div>
      <TaskDetailModal task={task} open={detail} onClose={() => setDetail(false)} />
    </div>
  )
}

export function ReminderRow({
  reminder,
  showGroup = true,
  showKid = true,
}: {
  reminder: Reminder
  showGroup?: boolean
  showKid?: boolean
}) {
  const { state, dispatch } = useStore()
  const mine = reminder.createdById === state.currentUserId
  return (
    <div className="flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/[0.02]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sun-soft text-[#B7841A]">
        <Bell size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold leading-snug">{reminder.title}</div>
        <div className="mt-0.5 text-xs font-semibold text-ink/50">
          {fmtDay(reminder.date)}
          {reminder.hasTime ? ` · ${fmtTime(reminder.date)}` : ''}
        </div>
        {reminder.note && <p className="mt-1 text-xs text-ink/55">{reminder.note}</p>}
        {reminder.attachment && <AttachmentChip attachment={reminder.attachment} />}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {showKid && <KidTag childId={reminder.childId} />}
          {showGroup && <GroupTag groupId={reminder.groupId} />}
          {isRepeating(reminder.recurrence) && (
            <Pill className="bg-violet-soft text-violet"><Repeat size={11} /> {recurrenceShort(reminder.recurrence)}</Pill>
          )}
        </div>
      </div>
      {mine && (
        <button
          onClick={() => dispatch({ type: 'DELETE_REMINDER', reminderId: reminder.id })}
          className="shrink-0 rounded-full p-1.5 text-ink/35 transition hover:bg-black/[0.05] hover:text-tang"
          title="Delete reminder"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export function WhatsAppRemindButton({
  groupId,
  what,
}: {
  groupId: string
  what: string
}) {
  const { state } = useStore()
  const toast = useToast()
  const group = groupById(state, groupId)
  if (!group) return null
  const recipients = Math.max(1, group.members.length - 1)
  const onClick = () => {
    if (!state.whatsappConnected) {
      toast('Connect WhatsApp in Settings to send reminders', '💬')
      return
    }
    toast(`WhatsApp reminder sent to ${recipients} in ${group.name}`, '💬')
  }
  return (
    <button
      onClick={onClick}
      className="chip shrink-0 bg-[#25D366]/12 text-[#0f9d58] ring-1 ring-[#25D366]/30 transition hover:bg-[#25D366]/20"
      title={`Send a WhatsApp reminder about "${what}" to the group`}
    >
      <MessageCircle size={13} /> Remind
    </button>
  )
}

export function EventRow({
  event,
  showGroup = true,
  showKid = true,
}: {
  event: EventItem
  showGroup?: boolean
  showKid?: boolean
}) {
  const { state, dispatch } = useStore()
  const [detail, setDetail] = useState(false)
  const d = new Date(event.date)
  const group = groupById(state, event.groupId)
  const goingCount = headcount(event).total
  return (
    <div className="flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/[0.02]">
      <button
        onClick={() => setDetail(true)}
        className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${group ? '' : 'bg-canvas'}`}
        style={group ? groupStyles.softBg(group.color) : undefined}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink/50">
          {format(d, 'MMM')}
        </span>
        <span className="text-xl font-extrabold leading-none">{format(d, 'd')}</span>
      </button>

      <div className="min-w-0 flex-1">
        <button onClick={() => setDetail(true)} className="block text-left text-sm font-bold leading-snug hover:text-violet">
          {event.title}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
          <span className="font-semibold">{event.hasTime ? fmtTime(event.date) : 'All day'}</span>
          {(event.mode ?? 'inperson') === 'inperson' && event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {event.location}
            </span>
          )}
          {event.mode === 'virtual' && event.meetingUrl && (
            <span className="inline-flex items-center gap-1 font-semibold text-violet">
              <Video size={12} /> Virtual
            </span>
          )}
          {event.mode === 'phone' && event.callInfo && (
            <span className="inline-flex items-center gap-1">
              <Phone size={12} /> {event.callInfo}
            </span>
          )}
          {goingCount > 0 && <span className="font-semibold text-mint">{goingCount} going</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {showKid && <KidTag childId={event.childId} />}
          {showGroup && <GroupTag groupId={event.groupId} />}
          {isRepeating(event.recurrence) && (
            <Pill className="bg-violet-soft text-violet"><Repeat size={11} /> {recurrenceShort(event.recurrence)}</Pill>
          )}
          {event.attachment && (
            <Pill className="bg-black/[0.04] text-ink/55"><Paperclip size={11} /></Pill>
          )}
        </div>
      </div>
      <EventDetailModal event={event} open={detail} onClose={() => setDetail(false)} />

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_EVENT_GOOGLE', eventId: event.id })}
          className={`chip shadow-soft transition ${
            event.addedToGoogle
              ? 'bg-mint-soft text-mint'
              : 'bg-white text-ink/60 ring-1 ring-black/10 hover:text-violet'
          }`}
          title={fmtDay(event.date)}
        >
          {event.addedToGoogle ? (
            <>
              <CalendarCheck size={13} /> On calendar
            </>
          ) : (
            <>
              <CalendarPlus size={13} /> Add to Google
            </>
          )}
        </button>
        <WhatsAppRemindButton groupId={event.groupId} what={event.title} />
      </div>
    </div>
  )
}
