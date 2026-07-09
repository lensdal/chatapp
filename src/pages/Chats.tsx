import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, Plus, Wand2, ListChecks, CalendarDays, CheckCircle2, ChevronRight } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, Avatar, AvatarStack, EmptyState, Pill } from '../components/ui'
import { EventRow, TaskRow, KidTag } from '../components/items'
import PromoteModal from '../components/PromoteModal'
import { useStore } from '../store/store'
import {
  groupById,
  memberById,
  messagesForGroup,
  lastMessage,
  eventsForGroup,
  tasksForGroup,
} from '../lib/selectors'
import { colorClasses } from '../lib/ui'
import { fmtMessageTime, fmtAgo } from '../lib/dates'
import type { ChatMessage } from '../types'

function GroupGrid() {
  const { state } = useStore()
  return (
    <>
      <Topbar title="Chats" subtitle="Every organization your family is part of." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.groups.map((g) => {
            const last = lastMessage(state, g.id)
            const sender = memberById(state, last?.senderId)
            const openTasks = tasksForGroup(state, g.id).filter((t) => !t.done).length
            const members = g.memberIds
              .map((id) => memberById(state, id)!)
              .filter(Boolean)
            return (
              <Link key={g.id} to={`/chats/${g.id}`}>
                <Card className="h-full p-5 transition hover:shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${colorClasses[g.color].soft}`}>
                      {g.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold leading-tight">{g.name}</div>
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {g.childIds.map((cid) => (
                          <KidTag key={cid} childId={cid} plain />
                        ))}
                      </div>
                    </div>
                  </div>
                  {last && (
                    <p className="mt-4 line-clamp-2 text-sm text-ink/55">
                      <span className="font-semibold text-ink/70">{sender?.name.split(' ')[0]}: </span>
                      {last.text}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <AvatarStack people={members.map((m) => ({ emoji: m.emoji, color: m.color }))} max={4} />
                    <div className="flex items-center gap-2">
                      {openTasks > 0 && (
                        <Pill className={colorClasses[g.color].softText}>
                          <ListChecks size={12} /> {openTasks}
                        </Pill>
                      )}
                      {last && <span className="text-[11px] text-ink/40">{fmtAgo(last.at)}</span>}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

function MessageBubble({
  msg,
  onPromote,
}: {
  msg: ChatMessage
  onPromote: (m: ChatMessage) => void
}) {
  const { state } = useStore()
  const sender = memberById(state, msg.senderId)!
  const mine = msg.senderId === state.currentUserId
  const linkedTask = state.tasks.find((t) => t.id === msg.linkedTaskId)
  const linkedEvent = state.events.find((e) => e.id === msg.linkedEventId)

  return (
    <div className={`group flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
      {!mine && <Avatar emoji={sender.emoji} color={sender.color} size="sm" />}
      <div className={`flex max-w-[76%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && (
          <span className="mb-1 px-1 text-xs font-bold text-ink/60">
            {sender.name} <span className="font-medium text-ink/35">· {sender.role}</span>
          </span>
        )}
        <div
          className={`rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft ${
            mine ? 'rounded-tr-md bg-violet text-white' : 'rounded-tl-md bg-white text-ink'
          }`}
        >
          {msg.text}
        </div>

        {(linkedTask || linkedEvent) && (
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
              linkedTask ? 'bg-mint-soft text-mint' : 'bg-sky-soft text-sky'
            }`}
          >
            {linkedTask ? <CheckCircle2 size={13} /> : <CalendarDays size={13} />}
            {linkedTask ? 'Added as a task' : 'Added to calendar'}
          </div>
        )}

        <div className={`mt-1 flex items-center gap-2 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-ink/35">{fmtMessageTime(msg.at)}</span>
          {!linkedTask && !linkedEvent && (
            <button
              onClick={() => onPromote(msg)}
              className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-bold text-violet opacity-0 transition group-hover:opacity-100"
            >
              <Wand2 size={11} /> Make task / event
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatView({ groupId }: { groupId: string }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const group = groupById(state, groupId)
  const [text, setText] = useState('')
  const [modalMsg, setModalMsg] = useState<ChatMessage | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const msgs = useMemo(() => messagesForGroup(state, groupId), [state, groupId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs.length, groupId])

  if (!group) {
    navigate('/chats')
    return null
  }

  const members = group.memberIds.map((id) => memberById(state, id)!).filter(Boolean)
  const events = eventsForGroup(state, groupId).filter(
    (e) => new Date(e.date) >= new Date(new Date().toDateString()),
  )
  const openTasks = tasksForGroup(state, groupId).filter((t) => !t.done)

  const send = () => {
    if (!text.trim()) return
    dispatch({ type: 'SEND_MESSAGE', groupId, text: text.trim() })
    setText('')
  }

  return (
    <>
      <Topbar
        title={`${group.emoji} ${group.name}`}
        subtitle={`${group.category} · ${members.length} members`}
      />
      <div className="flex min-h-0 flex-1 gap-6 px-8 pb-6 pt-4">
        {/* Chat column */}
        <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
            <div className="flex items-center gap-2">
              {group.childIds.map((cid) => (
                <KidTag key={cid} childId={cid} />
              ))}
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet px-3.5 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-violet/90"
            >
              <Plus size={15} /> New task / event
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-canvas/40 px-5 py-5">
            {msgs.map((m) => (
              <MessageBubble key={m.id} msg={m} onPromote={setModalMsg} />
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-black/5 px-4 py-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${group.name}…`}
              className="flex-1 rounded-full bg-canvas px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet/30"
            />
            <button
              onClick={send}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-violet text-white shadow-soft transition hover:bg-violet/90"
            >
              <Send size={18} />
            </button>
          </div>
        </Card>

        {/* Info panel */}
        <div className="hidden w-[320px] shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink/40">Members</h3>
            <ul className="space-y-2.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar emoji={m.emoji} color={m.color} size="sm" />
                  <div className="leading-tight">
                    <div className="text-sm font-bold">{m.isSelf ? 'You' : m.name}</div>
                    <div className="text-[11px] text-ink/45">{m.role}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between px-2 py-1">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold"><CalendarDays size={16} className="text-sky" /> Upcoming</h3>
              <Link to="/calendar" className="text-ink/30"><ChevronRight size={16} /></Link>
            </div>
            {events.length === 0 ? (
              <EmptyState emoji="📅" text="No events yet." />
            ) : (
              <div className="divide-y divide-black/5">
                {events.slice(0, 3).map((e) => (
                  <EventRow key={e.id} event={e} showGroup={false} showKid={false} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between px-2 py-1">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold"><ListChecks size={16} className="text-violet" /> To-dos</h3>
              <Link to="/tasks" className="text-ink/30"><ChevronRight size={16} /></Link>
            </div>
            {openTasks.length === 0 ? (
              <EmptyState emoji="✅" text="All caught up!" />
            ) : (
              <div className="divide-y divide-black/5">
                {openTasks.slice(0, 4).map((t) => (
                  <TaskRow key={t.id} task={t} showGroup={false} showKid={false} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <PromoteModal
        open={!!modalMsg}
        onClose={() => setModalMsg(null)}
        groupId={groupId}
        messageId={modalMsg?.id}
        defaultText={modalMsg?.text ?? ''}
      />
      <PromoteModal open={createOpen} onClose={() => setCreateOpen(false)} groupId={groupId} />
    </>
  )
}

export default function Chats() {
  const { groupId } = useParams()
  if (!groupId) return <GroupGrid />
  return <ChatView groupId={groupId} />
}
