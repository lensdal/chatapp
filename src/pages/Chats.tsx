import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Send,
  Plus,
  Wand2,
  ListChecks,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Pin,
  X,
  Settings2,
  UserPlus,
  BarChart3,
  PiggyBank,
  Paperclip,
  BookUser,
  Smile,
  Check,
  Globe,
  FileText,
  Lock,
  Pencil,
} from 'lucide-react'
import Topbar from '../components/Topbar'
import { Card, Avatar, AvatarStack, EmptyState, Pill } from '../components/ui'
import { EventRow, TaskRow, KidTag } from '../components/items'
import PromoteModal from '../components/PromoteModal'
import { SignupCard, CreateSignupModal } from '../components/Signup'
import { PollCard, CreatePollModal } from '../components/Poll'
import { CollectionCard, CreateCollectionModal } from '../components/Collection'
import {
  CreateGroupModal,
  JoinGroupModal,
  InviteModal,
  GroupSettingsModal,
  EditMembershipModal,
} from '../components/Groups'
import { GroupDirectory } from '../components/Directory'
import { useStore } from '../store/store'
import {
  groupById,
  memberById,
  messagesForGroup,
  lastMessage,
  eventsForGroup,
  tasksForGroup,
  signupsForGroup,
  slotsRemaining,
  myGroups,
  displayLabel,
  isAdmin,
} from '../lib/selectors'
import { colorClasses } from '../lib/ui'
import { fmtMessageTime, fmtAgo } from '../lib/dates'
import { useToast } from '../components/Toast'
import type { ChatMessage } from '../types'

const REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏']

function GroupGrid() {
  const { state } = useStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const groups = myGroups(state)

  return (
    <>
      <Topbar title="Chats" subtitle="Every organization your family is part of." />
      <div className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setJoinOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-violet shadow-soft ring-1 ring-violet/20 transition hover:bg-violet-soft"
          >
            <UserPlus size={16} /> Join with a code
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-violet px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
          >
            <Plus size={16} /> New group
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const last = lastMessage(state, g.id)
            const sender = memberById(state, last?.senderId)
            const openTasks = tasksForGroup(state, g.id).filter((t) => !t.done).length
            const members = g.members.map((gm) => memberById(state, gm.memberId)!).filter(Boolean)
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
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}

function ReactionBar({ msg }: { msg: ChatMessage }) {
  const { state, dispatch } = useStore()
  const [pick, setPick] = useState(false)
  const entries = Object.entries(msg.reactions ?? {}).filter(([, who]) => who.length > 0)
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {entries.map(([emoji, who]) => {
        const mine = who.includes(state.currentUserId)
        return (
          <button
            key={emoji}
            onClick={() => dispatch({ type: 'REACT', messageId: msg.id, emoji })}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
              mine ? 'bg-violet-soft text-violet ring-1 ring-violet/30' : 'bg-black/[0.05] text-ink/60'
            }`}
          >
            {emoji} {who.length}
          </button>
        )
      })}
      <div className="relative">
        <button
          onClick={() => setPick((p) => !p)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.04] text-ink/40 opacity-0 transition hover:text-violet group-hover:opacity-100"
        >
          <Smile size={13} />
        </button>
        {pick && (
          <div className="absolute bottom-8 left-0 z-20 flex gap-1 rounded-full bg-white p-1.5 shadow-card">
            {REACTIONS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  dispatch({ type: 'REACT', messageId: msg.id, emoji: e })
                  setPick(false)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-black/[0.05]"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  onPromote,
}: {
  msg: ChatMessage
  onPromote: (m: ChatMessage) => void
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const sender = memberById(state, msg.senderId)!
  const mine = msg.senderId === state.currentUserId
  const linkedTask = state.tasks.find((t) => t.id === msg.linkedTaskId)
  const linkedEvent = state.events.find((e) => e.id === msg.linkedEventId)
  const acks = msg.acks ?? []
  const iAcked = acks.includes(state.currentUserId)

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
          {!mine && state.translateTo && (
            <span className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-ink/35">
              <Globe size={11} /> Translated to {state.translateTo}
            </span>
          )}
        </div>

        {msg.attachment && (
          <button
            onClick={() => toast(`Downloading ${msg.attachment!.name}`, '📎')}
            className={`mt-1.5 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-soft ${
              mine ? 'bg-violet/80 text-white' : 'bg-white text-ink/70'
            }`}
          >
            <FileText size={16} /> {msg.attachment.name}
          </button>
        )}

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

        {msg.requireAck && (
          <div className="mt-1.5 flex items-center gap-2">
            {iAcked ? (
              <span className="chip bg-mint-soft text-mint">
                <Check size={12} strokeWidth={3} /> You confirmed
              </span>
            ) : (
              <button
                onClick={() => dispatch({ type: 'ACK_MESSAGE', messageId: msg.id })}
                className="chip bg-violet text-white shadow-soft"
              >
                Got it 👍
              </button>
            )}
            <span className="text-[10px] font-semibold text-ink/40">{acks.length} confirmed</span>
          </div>
        )}

        <ReactionBar msg={msg} />

        <div className={`mt-0.5 flex items-center gap-2 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-ink/35">{fmtMessageTime(msg.at)}</span>
          {!linkedTask && !linkedEvent && (
            <button
              onClick={() => onPromote(msg)}
              className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-bold text-violet opacity-0 transition group-hover:opacity-100"
            >
              <Wand2 size={11} /> Make task / event
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PIN', messageId: msg.id })}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
              msg.pinned
                ? 'bg-tang-soft text-tang'
                : 'bg-black/[0.04] text-ink/50 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Pin size={11} /> {msg.pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ComposerAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:bg-violet-soft hover:text-violet"
    >
      {icon} {label}
    </button>
  )
}

function ChatView({ groupId }: { groupId: string }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const group = groupById(state, groupId)
  const [text, setText] = useState('')
  const [modalMsg, setModalMsg] = useState<ChatMessage | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [collectOpen, setCollectOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dirOpen, setDirOpen] = useState(false)
  const [meOpen, setMeOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const msgs = useMemo(() => messagesForGroup(state, groupId), [state, groupId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs.length, groupId])

  if (!group) {
    navigate('/chats')
    return null
  }

  const me = state.currentUserId
  const admin = isAdmin(group, me)
  const canPost = !group.announcementsOnly || admin
  const events = eventsForGroup(state, groupId).filter(
    (e) => new Date(e.date) >= new Date(new Date().toDateString()),
  )
  const openTasks = tasksForGroup(state, groupId).filter((t) => !t.done)
  const signups = signupsForGroup(state, groupId)
  const pinned = msgs.filter((m) => m.pinned)
  const files = msgs.filter((m) => m.attachment)

  const send = () => {
    if (!text.trim()) return
    dispatch({ type: 'SEND_MESSAGE', groupId, text: text.trim() })
    setText('')
  }

  return (
    <>
      <Topbar
        title={`${group.emoji} ${group.name}`}
        subtitle={`${group.category} · ${group.members.length} members`}
      />
      <div className="flex min-h-0 flex-1 gap-6 px-8 pb-6 pt-4">
        {/* Chat column */}
        <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-5 py-3">
            <div className="flex items-center gap-2">
              {group.childIds.map((cid) => (
                <KidTag key={cid} childId={cid} />
              ))}
              {group.announcementsOnly && (
                <Pill className="bg-sun-soft text-[#B7841A]"><Lock size={11} /> Announcements</Pill>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setDirOpen(true)} title="Directory" className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-violet-soft hover:text-violet">
                <BookUser size={17} />
              </button>
              <button onClick={() => setInviteOpen(true)} title="Invite" className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-violet-soft hover:text-violet">
                <UserPlus size={17} />
              </button>
              <button onClick={() => setSettingsOpen(true)} title="Group settings" className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-violet-soft hover:text-violet">
                <Settings2 size={17} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="relative flex-1 overflow-y-auto bg-canvas/40">
            {pinned.length > 0 && (
              <div className="sticky top-0 z-10 space-y-1.5 border-b border-black/5 bg-canvas/90 px-5 py-2.5 backdrop-blur">
                {pinned.map((pm) => {
                  const s = memberById(state, pm.senderId)
                  return (
                    <div key={pm.id} className="flex items-center gap-2">
                      <Pin size={13} className="shrink-0 text-tang" strokeWidth={2.4} />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-tang">Pinned</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-ink/70">
                        <span className="font-semibold">{s?.isSelf ? 'You' : s?.name.split(' ')[0]}: </span>
                        {pm.text}
                      </span>
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_PIN', messageId: pm.id })}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink/35 transition hover:bg-black/10 hover:text-tang"
                        title="Unpin"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="space-y-4 px-5 py-5">
              {msgs.map((m) => {
                if (m.linkedSignupId) {
                  const sheet = state.signups.find((s) => s.id === m.linkedSignupId)
                  if (sheet) return <SignupCard key={m.id} sheet={sheet} />
                }
                if (m.linkedPollId) {
                  const poll = state.polls.find((p) => p.id === m.linkedPollId)
                  if (poll) return <PollCard key={m.id} poll={poll} />
                }
                if (m.linkedCollectionId) {
                  const col = state.collections.find((c) => c.id === m.linkedCollectionId)
                  if (col) return <CollectionCard key={m.id} collection={col} />
                }
                return <MessageBubble key={m.id} msg={m} onPromote={setModalMsg} />
              })}
            </div>
          </div>

          {canPost ? (
            <div className="border-t border-black/5">
              <div className="flex items-center gap-1.5 overflow-x-auto px-4 pt-3">
                <ComposerAction icon={<Plus size={13} />} label="Task / event" onClick={() => setCreateOpen(true)} />
                <ComposerAction icon={<ClipboardList size={13} />} label="Sign-up" onClick={() => setSignupOpen(true)} />
                <ComposerAction icon={<BarChart3 size={13} />} label="Poll" onClick={() => setPollOpen(true)} />
                <ComposerAction icon={<PiggyBank size={13} />} label="Collect" onClick={() => setCollectOpen(true)} />
                <ComposerAction
                  icon={<Paperclip size={13} />}
                  label="Attach"
                  onClick={() => {
                    dispatch({
                      type: 'SEND_MESSAGE',
                      groupId,
                      text: 'Shared a file 📎',
                      attachment: { name: 'Team roster.pdf', kind: 'pdf' },
                    })
                    toast('File shared to the group', '📎')
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
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
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 border-t border-black/5 px-4 py-4 text-sm text-ink/45">
              <Lock size={15} /> Only admins can post in this group.
            </div>
          )}
        </Card>

        {/* Info panel */}
        <div className="hidden w-[320px] shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink/40">Members</h3>
              <button onClick={() => setDirOpen(true)} className="text-xs font-bold text-violet">Directory</button>
            </div>
            <ul className="space-y-2.5">
              {group.members.map((gm) => {
                const m = memberById(state, gm.memberId)!
                const { name, sub } = displayLabel(state, group, gm.memberId)
                return (
                  <li key={gm.memberId} className="flex items-center gap-3">
                    <Avatar emoji={m.emoji} color={m.color} size="sm" />
                    <div className="min-w-0 leading-tight">
                      <div className="flex items-center gap-1 text-sm font-bold">
                        {name}
                        {gm.role === 'admin' && <span className="text-[10px] font-bold text-violet">· Admin</span>}
                        {m.isSelf && (
                          <button onClick={() => setMeOpen(true)} className="text-ink/30 hover:text-violet" title="Edit how you appear">
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-ink/45">{sub}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {signups.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center justify-between px-2 py-1">
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold">
                  <ClipboardList size={16} className="text-blush" /> Sign-up lists
                </h3>
              </div>
              <ul className="space-y-1 px-1 pb-1">
                {signups.map((su) => {
                  const remaining = slotsRemaining(su)
                  return (
                    <li key={su.id} className="flex items-center gap-2 rounded-2xl px-2 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{su.title}</span>
                      <Pill className={remaining > 0 ? 'bg-tang-soft text-tang' : 'bg-mint-soft text-mint'}>
                        {remaining > 0 ? `${remaining} left` : 'Full'}
                      </Pill>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

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

          {files.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold"><Paperclip size={16} className="text-ink/50" /> Files</h3>
              </div>
              <ul className="space-y-1 px-1 pb-1">
                {files.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => toast(`Downloading ${m.attachment!.name}`, '📎')}
                      className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm hover:bg-black/[0.03]"
                    >
                      <FileText size={16} className="shrink-0 text-ink/40" />
                      <span className="truncate font-semibold">{m.attachment!.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <PromoteModal open={!!modalMsg} onClose={() => setModalMsg(null)} groupId={groupId} messageId={modalMsg?.id} defaultText={modalMsg?.text ?? ''} />
      <PromoteModal open={createOpen} onClose={() => setCreateOpen(false)} groupId={groupId} />
      <CreateSignupModal open={signupOpen} onClose={() => setSignupOpen(false)} groupId={groupId} />
      <CreatePollModal open={pollOpen} onClose={() => setPollOpen(false)} groupId={groupId} />
      <CreateCollectionModal open={collectOpen} onClose={() => setCollectOpen(false)} groupId={groupId} />
      <InviteModal group={group} open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <GroupSettingsModal group={group} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <GroupDirectory group={group} open={dirOpen} onClose={() => setDirOpen(false)} />
      <EditMembershipModal group={group} open={meOpen} onClose={() => setMeOpen(false)} />
    </>
  )
}

export default function Chats() {
  const { groupId } = useParams()
  if (!groupId) return <GroupGrid />
  return <ChatView groupId={groupId} />
}
