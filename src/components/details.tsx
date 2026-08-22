import { useState } from 'react'
import {
  MapPin,
  CalendarPlus,
  CalendarCheck,
  Repeat,
  Car,
  Bell,
  Check,
  Video,
  Phone,
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
import { rsvpsByStatus, headcount } from '../lib/rsvp'
import { fmtDay, fmtTime } from '../lib/dates'
import { AttachmentChip } from './items'
import type { EventItem, RSVPStatus, RideDirection, Task } from '../types'

function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-ink/60">{label}</span>
      <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-black/10">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="px-1.5 font-bold text-ink/50">−</button>
        <span className="w-6 text-center text-sm font-bold tabular-nums">{value}</span>
        <button onClick={() => onChange(value + 1)} className="px-1.5 font-bold text-ink/50">+</button>
      </div>
    </div>
  )
}

const RSVP_META: { key: RSVPStatus; label: string; cls: string }[] = [
  { key: 'going', label: 'Going', cls: 'bg-mint text-white' },
  { key: 'maybe', label: 'Maybe', cls: 'bg-sun text-white' },
  { key: 'no', label: "Can't", cls: 'bg-tang text-white' },
]

const DIR_META: { key: RideDirection; label: string }[] = [
  { key: 'there', label: 'There' },
  { key: 'back', label: 'Back' },
  { key: 'both', label: 'Round trip' },
]
const dirLabel = (d: RideDirection) => DIR_META.find((x) => x.key === d)?.label ?? 'Round trip'

function DirChips({ value, onChange }: { value: RideDirection; onChange: (d: RideDirection) => void }) {
  return (
    <div className="flex gap-1">
      {DIR_META.map((d) => (
        <button
          key={d.key}
          onClick={() => onChange(d.key)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
            value === d.key ? 'bg-violet text-white shadow-soft' : 'bg-white text-ink/55 ring-1 ring-black/10'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

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
  const [dir, setDir] = useState<RideDirection>('both')
  const [pickup, setPickup] = useState('')
  const [reqDir, setReqDir] = useState<RideDirection>('both')
  const group = groupById(state, event.groupId)
  if (!group) return null

  const me = state.currentUserId
  const canManage = isAdmin(group, me) || event.createdById === me
  const rsvps = event.rsvps ?? {}
  const myEntry = rsvps[me]
  const myRsvp = myEntry?.status
  const byStatus = (s: RSVPStatus) => rsvpsByStatus(event, s)
  const heads = headcount(event)
  const setRsvp = (status: RSVPStatus, patch: { adults?: number; children?: number; names?: string } = {}) =>
    dispatch({ type: 'SET_RSVP', eventId: event.id, status, ...patch })
  const offers = event.carpoolOffers ?? []
  const requests = event.carpoolRequests ?? []
  const myOffer = offers.find((o) => o.memberId === me)
  const myRide = offers.find((o) => o.riders.includes(me))
  const myReq = requests.find((r) => r.memberId === me)

  const name = (id: string) => displayLabel(state, group, id).name

  const collect = event.collectHeadcount ?? true
  // Group members who haven't said yes / maybe / no yet.
  const pending = group.members.map((gm) => gm.memberId).filter((id) => !rsvps[id])
  const nudge = () =>
    toast(
      state.whatsappConnected
        ? `Nudged ${pending.length} ${pending.length === 1 ? 'person' : 'people'} who haven't replied`
        : 'Connect WhatsApp in Settings to send nudges',
      '👋',
    )

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
          {((event.mode ?? 'inperson') === 'inperson' || event.mode === 'hybrid') && event.location && (
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
          {(event.mode === 'virtual' || event.mode === 'hybrid') && event.meetingUrl && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="inline-flex min-w-0 items-center gap-1 text-ink/60">
                <Video size={14} /> <span className="truncate">{event.meetingUrl}</span>
              </span>
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="chip bg-violet text-white shadow-soft">
                Join
              </a>
            </div>
          )}
          {event.mode === 'phone' && event.callInfo && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1 text-ink/60">
                <Phone size={14} /> {event.callInfo}
              </span>
              <a href={`tel:${event.callInfo.replace(/[^0-9+]/g, '')}`} className="chip bg-violet text-white shadow-soft">
                Call in
              </a>
            </div>
          )}
          {event.note && <p className="mt-2 text-sm text-ink/60">{event.note}</p>}
          {event.attachment && <AttachmentChip attachment={event.attachment} />}
        </div>

        {/* RSVP */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Who's going?</span>
            {collect && heads.total > 0 ? (
              <span className="text-xs font-semibold text-mint">
                {heads.total} coming · {heads.adults} adult{heads.adults === 1 ? '' : 's'}, {heads.children} kid{heads.children === 1 ? '' : 's'}
              </span>
            ) : (
              heads.responders > 0 && (
                <span className="text-xs font-semibold text-mint">{heads.responders} going</span>
              )
            )}
          </div>

          {/* Nudge to respond — shown until you've RSVP'd */}
          {!myRsvp && (
            <div className="mb-2.5 flex items-start gap-2 rounded-2xl bg-sun-soft px-3 py-2.5 text-xs font-semibold text-[#8a6413]">
              <span className="text-sm leading-none">👋</span>
              <span>Don't forget to let the organizer know who's going to this event.</span>
            </div>
          )}

          <div className="flex gap-2">
            {RSVP_META.map((r) => {
              const people = byStatus(r.key)
              const mine = myRsvp === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => setRsvp(r.key, collect && r.key === 'going' && !myEntry?.adults && !myEntry?.children ? { adults: 1, children: 0 } : {})}
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

          {/* Headcount editor (only when I'm going, and the organizer asked for it) */}
          {collect && myRsvp === 'going' && (
            <div className="mt-3 space-y-3 rounded-2xl bg-canvas p-3">
              <div className="flex items-center gap-4">
                <Stepper label="Adults" value={myEntry?.adults ?? 1} onChange={(v) => setRsvp('going', { adults: v })} min={0} />
                <Stepper label="Kids" value={myEntry?.children ?? 0} onChange={(v) => setRsvp('going', { children: v })} min={0} />
              </div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet"
                value={myEntry?.names ?? ''}
                onChange={(e) => setRsvp('going', { names: e.target.value })}
                placeholder="Names (optional) — e.g. Sam, Calixta, Grandma Rosa"
              />
            </div>
          )}

          {byStatus('going').length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-ink/55">
              {byStatus('going').map((id) => {
                const e = rsvps[id]
                const bits = [
                  e.adults ? `${e.adults} adult${e.adults === 1 ? '' : 's'}` : null,
                  e.children ? `${e.children} kid${e.children === 1 ? '' : 's'}` : null,
                ].filter(Boolean).join(', ')
                return (
                  <li key={id}>
                    <span className="font-semibold text-mint">{name(id)}</span>
                    {bits && <span className="text-ink/45"> · {bits}</span>}
                    {e.names && <span className="text-ink/45"> ({e.names})</span>}
                  </li>
                )
              })}
            </ul>
          )}

          {/* Organizer view: who still hasn't replied, with a nudge */}
          {canManage && pending.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-canvas px-3 py-2.5 text-xs">
              <span className="font-bold text-ink/55">
                Waiting on {pending.length}:
              </span>
              <span className="min-w-0 flex-1 truncate text-ink/45">
                {pending.map(name).join(', ')}
              </span>
              <button onClick={nudge} className="chip shrink-0 bg-white text-violet ring-1 ring-violet/25">
                <Bell size={12} /> Nudge
              </button>
            </div>
          )}
        </div>

        {/* Carpool */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold">
              <Car size={16} className="text-violet" /> Carpool
            </span>
            {offers.length > 0 && (
              <span className="text-xs font-semibold text-ink/45">
                {offers.reduce((s, o) => s + Math.max(0, o.seats - o.riders.length), 0)} seat
                {offers.reduce((s, o) => s + Math.max(0, o.seats - o.riders.length), 0) === 1 ? '' : 's'} left
              </span>
            )}
          </div>

          {/* Cars on offer */}
          {offers.length > 0 && (
            <ul className="mb-3 space-y-2">
              {offers.map((o) => {
                const driver = memberById(state, o.memberId)
                const left = Math.max(0, o.seats - o.riders.length)
                const full = left === 0
                const isMine = o.memberId === me
                const iAmRiding = o.riders.includes(me)
                return (
                  <li key={o.memberId} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <Avatar emoji={driver?.emoji ?? '🚗'} color={driver?.color ?? 'violet'} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          {isMine ? 'You' : name(o.memberId)} <span className="text-ink/40">driving</span>
                        </div>
                        <div className="text-[11px] font-semibold text-ink/45">
                          {dirLabel(o.direction)}
                          {o.pickup ? ` · from ${o.pickup}` : ''}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          full ? 'bg-tang-soft text-tang' : 'bg-mint-soft text-mint'
                        }`}
                      >
                        {full ? 'Full' : `${left} of ${o.seats} open`}
                      </span>
                    </div>
                    {/* Riders */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {Array.from({ length: o.seats }).map((_, i) => {
                        const rid = o.riders[i]
                        const rm = rid ? memberById(state, rid) : null
                        return rid ? (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-ink/70">
                            <Avatar emoji={rm?.emoji ?? '🧑'} color={rm?.color ?? 'violet'} size="xs" />
                            {rid === me ? 'You' : name(rid)}
                          </span>
                        ) : (
                          <span key={i} className="inline-flex h-6 items-center rounded-full border border-dashed border-black/15 px-2.5 text-[11px] font-semibold text-ink/30">
                            open
                          </span>
                        )
                      })}
                    </div>
                    {/* Actions on this car */}
                    {!isMine && (
                      <div className="mt-2">
                        {iAmRiding ? (
                          <button
                            onClick={() => dispatch({ type: 'CARPOOL_UNCLAIM', eventId: event.id, driverId: o.memberId })}
                            className="chip bg-mint text-white"
                          >
                            <Check size={13} /> You're in — leave seat
                          </button>
                        ) : (
                          <button
                            onClick={() => dispatch({ type: 'CARPOOL_CLAIM', eventId: event.id, driverId: o.memberId })}
                            disabled={full}
                            className={`chip ${full ? 'bg-canvas text-ink/30' : 'bg-white text-violet ring-1 ring-violet/30'}`}
                          >
                            {full ? 'No seats left' : 'Grab a seat'}
                          </button>
                        )}
                      </div>
                    )}
                    {isMine && (
                      <div className="mt-2">
                        <button
                          onClick={() => dispatch({ type: 'CARPOOL_CANCEL', eventId: event.id })}
                          className="chip bg-white text-tang ring-1 ring-tang/30"
                        >
                          Cancel my ride
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {/* People still looking for a ride */}
          {requests.length > 0 && (
            <ul className="mb-3 space-y-1">
              {requests.map((r) => (
                <li key={r.memberId} className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tang" />
                  <span className="font-semibold text-ink/70">{r.memberId === me ? 'You' : name(r.memberId)}</span>
                  <span className="text-ink/45">need{r.memberId === me ? '' : 's'} a ride · {dirLabel(r.direction)}</span>
                  {r.note && <span className="text-ink/40">· {r.note}</span>}
                </li>
              ))}
            </ul>
          )}

          {/* My controls */}
          {myRide ? null : myOffer ? null : (
            <div className="space-y-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Offer a ride</span>
                <div className="flex items-center gap-1 rounded-full bg-canvas px-2 py-1">
                  <button onClick={() => setSeats((s) => Math.max(1, s - 1))} className="px-1.5 font-bold text-ink/50">−</button>
                  <span className="w-14 text-center text-sm font-bold">{seats} seat{seats === 1 ? '' : 's'}</span>
                  <button onClick={() => setSeats((s) => Math.min(8, s + 1))} className="px-1.5 font-bold text-ink/50">+</button>
                </div>
              </div>
              <DirChips value={dir} onChange={setDir} />
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup spot or notes (optional)"
              />
              <button
                onClick={() => dispatch({ type: 'CARPOOL_OFFER', eventId: event.id, seats, direction: dir, pickup })}
                className="chip w-full justify-center bg-violet py-2.5 text-white shadow-soft"
              >
                <Car size={14} /> I can drive
              </button>
            </div>
          )}

          {/* Ride request — only when I'm neither driving nor riding */}
          {!myOffer && !myRide && (
            <div className="mt-3">
              {myReq ? (
                <button
                  onClick={() => dispatch({ type: 'CARPOOL_CANCEL_REQUEST', eventId: event.id })}
                  className="chip bg-tang text-white"
                >
                  Asking for a ride ({dirLabel(myReq.direction)}) — cancel
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <DirChips value={reqDir} onChange={setReqDir} />
                  <button
                    onClick={() => dispatch({ type: 'CARPOOL_REQUEST', eventId: event.id, direction: reqDir })}
                    className="chip bg-white text-tang ring-1 ring-tang/30"
                  >
                    I need a ride
                  </button>
                </div>
              )}
            </div>
          )}
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
          {task.attachment && <AttachmentChip attachment={task.attachment} />}
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
