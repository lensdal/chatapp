import { useState } from 'react'
import {
  MapPin,
  CalendarPlus,
  CalendarCheck,
  Repeat,
  Car,
  Bell,
  Check,
} from 'lucide-react'
import Modal from './Modal'
import { Avatar, Pill } from './ui'
import { KidTag, GroupTag, PaymentButton } from './items'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { groupById, memberById, displayLabel, isAdmin } from '../lib/selectors'
import { groupStyles, priorityChip, priorityLabel } from '../lib/ui'
import { isRepeating, recurrenceSummary } from '../lib/recurrence'
import { mapsLinks } from '../lib/maps'
import { fmtDay, fmtTime } from '../lib/dates'
import type { EventItem, RSVPStatus, Task } from '../types'

const RSVP_META: { key: RSVPStatus; label: string; cls: string }[] = [
  { key: 'going', label: 'Going', cls: 'bg-mint text-white' },
  { key: 'maybe', label: 'Maybe', cls: 'bg-sun text-white' },
  { key: 'no', label: "Can't", cls: 'bg-tang text-white' },
]

export function EventDetailModal({
  event,
  open,
  onClose,
}: {
  event: EventItem
  open: boolean
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [seats, setSeats] = useState(3)
  const group = groupById(state, event.groupId)
  if (!group) return null

  const me = state.currentUserId
  const canManage = isAdmin(group, me) || event.createdById === me
  const rsvps = event.rsvps ?? {}
  const myRsvp = rsvps[me]
  const byStatus = (s: RSVPStatus) => Object.keys(rsvps).filter((k) => rsvps[k] === s)
  const myOffer = (event.carpoolOffers ?? []).find((o) => o.memberId === me)
  const iNeedRide = (event.carpoolRequests ?? []).includes(me)

  const name = (id: string) => displayLabel(state, group, id).name

  return (
    <Modal open={open} onClose={onClose} title="Event">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <KidTag childId={event.childId} plain />
            <GroupTag groupId={event.groupId} plain />
            {isRepeating(event.recurrence) && (
              <Pill className="bg-violet-soft text-violet">
                <Repeat size={12} /> {recurrenceSummary(event.recurrence)}
              </Pill>
            )}
          </div>
          <h3 className="mt-2 text-xl font-extrabold">{event.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/55">
            <span className="font-semibold">
              {fmtDay(event.date)}
              {event.hasTime ? ` · ${fmtTime(event.date)}` : ' · All day'}
            </span>
          </div>
          {event.location && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1 text-ink/60">
                <MapPin size={14} /> {event.location}
              </span>
              <a href={mapsLinks(event.location).google} target="_blank" rel="noopener noreferrer" className="chip bg-canvas text-violet">
                Google Maps
              </a>
              <a href={mapsLinks(event.location).apple} target="_blank" rel="noopener noreferrer" className="chip bg-canvas text-violet">
                Apple Maps
              </a>
            </div>
          )}
          {event.note && <p className="mt-2 text-sm text-ink/60">{event.note}</p>}
        </div>

        {/* RSVP */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Who's going?</div>
          <div className="flex gap-2">
            {RSVP_META.map((r) => {
              const people = byStatus(r.key)
              const mine = myRsvp === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => dispatch({ type: 'SET_RSVP', eventId: event.id, status: r.key })}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-sm font-bold transition ${
                    mine ? r.cls + ' shadow-soft' : 'bg-canvas text-ink/55 hover:bg-black/[0.05]'
                  }`}
                >
                  <span>{r.label}</span>
                  <span className={`text-xs ${mine ? 'text-white/80' : 'text-ink/40'}`}>{people.length}</span>
                </button>
              )
            })}
          </div>
          {byStatus('going').length > 0 && (
            <div className="mt-2 text-xs text-ink/50">
              <span className="font-semibold text-mint">Going: </span>
              {byStatus('going').map(name).join(', ')}
            </div>
          )}
        </div>

        {/* Carpool */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <Car size={16} className="text-violet" /> Carpool
          </div>
          {(event.carpoolOffers ?? []).length > 0 && (
            <ul className="mb-2 space-y-1">
              {(event.carpoolOffers ?? []).map((o) => (
                <li key={o.memberId} className="flex items-center gap-2 text-sm">
                  <Avatar emoji={memberById(state, o.memberId)?.emoji ?? '🚗'} color={memberById(state, o.memberId)?.color ?? 'violet'} size="xs" />
                  <span className="font-semibold">{name(o.memberId)}</span>
                  <span className="text-ink/50">can drive · {o.seats} seats</span>
                </li>
              ))}
            </ul>
          )}
          {(event.carpoolRequests ?? []).length > 0 && (
            <div className="mb-2 text-xs text-ink/50">
              <span className="font-semibold text-tang">Needs a ride: </span>
              {(event.carpoolRequests ?? []).map(name).join(', ')}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {myOffer ? (
              <button
                onClick={() => dispatch({ type: 'CARPOOL_CANCEL', eventId: event.id })}
                className="chip bg-violet text-white"
              >
                <Check size={13} /> Driving ({myOffer.seats} seats) — cancel
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-black/10">
                  <button onClick={() => setSeats((s) => Math.max(1, s - 1))} className="px-1 font-bold text-ink/50">−</button>
                  <span className="w-10 text-center text-sm font-bold">{seats} seat{seats === 1 ? '' : 's'}</span>
                  <button onClick={() => setSeats((s) => Math.min(8, s + 1))} className="px-1 font-bold text-ink/50">+</button>
                </div>
                <button
                  onClick={() => dispatch({ type: 'CARPOOL_OFFER', eventId: event.id, seats })}
                  className="chip bg-violet text-white shadow-soft"
                >
                  <Car size={13} /> I can drive
                </button>
              </div>
            )}
            <button
              onClick={() => dispatch({ type: 'CARPOOL_TOGGLE_REQUEST', eventId: event.id })}
              className={`chip ${iNeedRide ? 'bg-tang text-white' : 'bg-white text-ink/60 ring-1 ring-black/10'}`}
            >
              {iNeedRide ? 'Cancel ride request' : 'I need a ride'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EVENT_GOOGLE', eventId: event.id })}
            className={`chip shadow-soft ${event.addedToGoogle ? 'bg-mint-soft text-mint' : 'bg-white text-ink/60 ring-1 ring-black/10'}`}
          >
            {event.addedToGoogle ? <><CalendarCheck size={13} /> On Google Calendar</> : <><CalendarPlus size={13} /> Add to Google</>}
          </button>
          {canManage && (
            <button
              onClick={() =>
                toast(
                  state.whatsappConnected
                    ? `Reminder sent to the group in ${group.name}`
                    : 'Connect WhatsApp in Settings first',
                  '💬',
                )
              }
              className="chip bg-[#25D366]/12 text-[#0f9d58] ring-1 ring-[#25D366]/30"
            >
              <Bell size={13} /> Send reminder
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function TaskDetailModal({
  task,
  open,
  onClose,
}: {
  task: Task
  open: boolean
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const group = groupById(state, task.groupId)
  if (!group) return null
  const me = state.currentUserId
  const canManage = isAdmin(group, me) || task.createdById === me

  const toggleAssignee = (memberId: string) => {
    const has = task.assigneeIds.includes(memberId)
    dispatch({
      type: 'UPDATE_TASK',
      taskId: task.id,
      patch: {
        assigneeIds: has
          ? task.assigneeIds.filter((x) => x !== memberId)
          : [...task.assigneeIds, memberId],
      },
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Task">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <KidTag childId={task.childId} plain />
            <GroupTag groupId={task.groupId} plain />
            <Pill className={priorityChip[task.priority]}>{priorityLabel[task.priority]}</Pill>
            {isRepeating(task.recurrence) && (
              <Pill className="bg-violet-soft text-violet"><Repeat size={12} /> {recurrenceSummary(task.recurrence)}</Pill>
            )}
          </div>
          <h3 className={`mt-2 text-xl font-extrabold ${task.done ? 'text-ink/40 line-through' : ''}`}>{task.title}</h3>
          {task.dueDate && (
            <div className="mt-1 text-sm font-semibold text-ink/55">
              Due {fmtDay(task.dueDate)}{task.hasTime ? ` · ${fmtTime(task.dueDate)}` : ''}
            </div>
          )}
          {task.note && <p className="mt-2 text-sm text-ink/60">{task.note}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TASK', taskId: task.id })}
            className={`chip shadow-soft ${task.done ? 'bg-mint text-white' : 'bg-white text-ink/60 ring-1 ring-black/10'}`}
          >
            <Check size={13} strokeWidth={3} /> {task.done ? 'Done' : 'Mark done'}
          </button>
          {task.payment && <PaymentButton task={task} />}
        </div>

        {/* Assignees */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">
            Who's responsible?
          </div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((gm) => {
              const m = memberById(state, gm.memberId)!
              const on = task.assigneeIds.includes(gm.memberId)
              return (
                <button
                  key={gm.memberId}
                  onClick={() => toggleAssignee(gm.memberId)}
                  className={`chip ${on ? '' : 'bg-canvas text-ink/55'}`}
                  style={on ? groupStyles.solid(m.color) : undefined}
                >
                  {m.emoji} {m.isSelf ? 'You' : m.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                toast(
                  state.whatsappConnected ? `Reminder sent to the group in ${group.name}` : 'Connect WhatsApp in Settings first',
                  '💬',
                )
              }
              className="chip bg-[#25D366]/12 text-[#0f9d58] ring-1 ring-[#25D366]/30"
            >
              <Bell size={13} /> Send reminder
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
