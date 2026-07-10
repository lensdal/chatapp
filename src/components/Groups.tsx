import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, RefreshCw, Shield, LogOut, Users } from 'lucide-react'
import Modal from './Modal'
import { Avatar } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { groupByCode, memberById, displayLabel, isAdmin } from '../lib/selectors'
import { colorClasses } from '../lib/ui'
import type { ColorKey, Group } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'
const EMOJIS = ['⚽', '🏀', '⚾', '🏊', '🏕️', '📚', '🎨', '🎭', '🎵', '♟️', '🏫', '🎉', '🐝', '🚌', '🩰', '🥋']
const COLORS: ColorKey[] = ['violet', 'sky', 'blush', 'sun', 'tang', 'mint']
const RELATIONSHIPS = ['Mom', 'Dad', 'Parent', 'Guardian', 'Grandparent', 'Coach', 'Teacher']

function Toggle({
  on,
  onChange,
  title,
  desc,
}: {
  on: boolean
  onChange: (v: boolean) => void
  title: string
  desc: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas px-4 py-3">
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-violet' : 'bg-black/15'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-ink/50">{desc}</span>
      </span>
    </label>
  )
}

function RelationshipPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {RELATIONSHIPS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`chip ${value === r ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [color, setColor] = useState<ColorKey>('violet')
  const [childName, setChildName] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [announcementsOnly, setAnnouncementsOnly] = useState(false)
  const [remindersOn, setRemindersOn] = useState(true)
  const [digestOn, setDigestOn] = useState(true)

  useEffect(() => {
    if (open) {
      setName('')
      setCategory('')
      setEmoji('🎉')
      setColor('violet')
      setChildName('')
      setRelationship('Parent')
      setAnnouncementsOnly(false)
      setRemindersOn(true)
      setDigestOn(true)
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Start a new group">
      <div className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div className={`flex h-[46px] w-[46px] items-center justify-center rounded-2xl text-2xl ${colorClasses[color].soft}`}>{emoji}</div>
          <div>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name — e.g. Calixta's Ballet" autoFocus />
          </div>
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Dance, School, Sports" />
        </div>
        <div>
          <label className={labelCls}>Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${emoji === e ? 'bg-violet-soft ring-2 ring-violet' : 'bg-canvas'}`}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full ${colorClasses[c].dot} ${color === c ? 'ring-2 ring-offset-2 ring-ink/40' : ''}`} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-canvas p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">How should you show up here?</div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Your child (optional)" />
            <div />
          </div>
          <div className="mt-2"><RelationshipPicker value={relationship} onChange={setRelationship} /></div>
        </div>

        <div className="space-y-2">
          <Toggle on={announcementsOnly} onChange={setAnnouncementsOnly} title="Announcements only" desc="Only admins can post to everyone (great for coaches & schools)." />
          <Toggle on={remindersOn} onChange={setRemindersOn} title="Auto-reminders" desc="Nudge members before events and due dates." />
          <Toggle on={digestOn} onChange={setDigestOn} title="Weekly digest" desc="A weekly summary of what's coming up." />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={() => {
            if (!name.trim()) return
            dispatch({
              type: 'CREATE_GROUP',
              name: name.trim(),
              category: category.trim() || 'Group',
              emoji,
              color,
              childName: childName.trim() || undefined,
              relationship,
              announcementsOnly,
              remindersOn,
              digestOn,
            })
            toast('Group created — share the join code to invite people', '🎉')
            onClose()
          }}
          disabled={!name.trim()}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          Create group
        </button>
      </div>
    </Modal>
  )
}

export function JoinGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [childName, setChildName] = useState('')
  const [relationship, setRelationship] = useState('Parent')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (open) {
      setCode('')
      setChildName('')
      setRelationship('Parent')
      setDisplayName('')
    }
  }, [open])

  const found = code.trim() ? groupByCode(state, code) : undefined
  const alreadyIn = found?.members.some((m) => m.memberId === state.currentUserId)

  return (
    <Modal open={open} onClose={onClose} title="Join a group">
      <div className="space-y-4">
        <div className="rounded-2xl bg-violet-soft px-4 py-3 text-sm text-violet">
          Got a code from a coach, teacher, or another parent? Enter it below — no phone numbers needed.
          <div className="mt-1 text-xs text-violet/70">Try the sample code <strong>CHESS-42</strong>.</div>
        </div>
        <div>
          <label className={labelCls}>Join code</label>
          <input
            className={`${inputCls} font-mono uppercase tracking-wider`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. CHESS-42"
            autoFocus
          />
        </div>

        {code.trim() && !found && <div className="text-sm font-semibold text-tang">No group found for that code.</div>}

        {found && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${colorClasses[found.color].soft}`}>{found.emoji}</span>
              <div>
                <div className="font-extrabold">{found.name}</div>
                <div className="text-xs text-ink/50">{found.category} · {found.members.length} members</div>
              </div>
            </div>

            {alreadyIn ? (
              <div className="text-sm font-semibold text-mint">You're already in this group.</div>
            ) : (
              <div className="rounded-2xl bg-canvas p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">A couple quick questions</div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Your child's name" />
                  <div />
                </div>
                <div className="mt-2"><RelationshipPicker value={relationship} onChange={setRelationship} /></div>
                <input className={`${inputCls} mt-3`} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Custom name (optional) — e.g. Team treasurer" />
                <p className="mt-2 text-xs text-ink/45">
                  If left blank, you'll show as <strong>{childName ? `${childName}'s ${relationship}` : `"${relationship}"`}</strong> in this group.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={() => {
            if (!found || alreadyIn) return
            dispatch({
              type: 'JOIN_GROUP',
              groupId: found.id,
              childName: childName.trim() || undefined,
              relationship,
              displayName: displayName.trim() || undefined,
            })
            onClose()
            navigate(`/chats/${found.id}`)
          }}
          disabled={!found || alreadyIn}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          Join group
        </button>
      </div>
    </Modal>
  )
}

export function InviteModal({ group, open, onClose }: { group: Group; open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const admin = isAdmin(group, useStore().state.currentUserId)
  return (
    <Modal open={open} onClose={onClose} title="Invite to this group">
      <div className="space-y-4">
        <p className="text-sm text-ink/60">Share this code (or link) — people join themselves, no phone numbers required.</p>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink/40">Join code</div>
            <div className="font-mono text-2xl font-extrabold tracking-wider">{group.joinCode}</div>
          </div>
          <button
            onClick={() => toast('Join code copied', '📋')}
            className="chip bg-violet text-white shadow-soft"
          >
            <Copy size={13} /> Copy
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-5 py-3">
          <span className="truncate font-mono text-sm text-ink/60">village.app/j/{group.joinCode.toLowerCase()}</span>
          <button onClick={() => toast('Invite link copied', '🔗')} className="chip bg-white text-ink/60 ring-1 ring-black/10">
            <Copy size={13} /> Copy link
          </button>
        </div>
        {admin && (
          <button
            onClick={() => {
              dispatch({ type: 'UPDATE_GROUP', groupId: group.id, patch: { joinCode: `${group.joinCode.split('-')[0]}-${Math.floor((group.name.length * 37) % 100).toString().padStart(2, '0')}X` } })
              toast('New join code generated', '🔁')
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet"
          >
            <RefreshCw size={14} /> Regenerate code
          </button>
        )}
      </div>
    </Modal>
  )
}

export function GroupSettingsModal({ group, open, onClose }: { group: Group; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const admin = isAdmin(group, state.currentUserId)

  return (
    <Modal open={open} onClose={onClose} title={`${group.name} · Settings`}>
      <div className="space-y-4">
        {admin ? (
          <>
            <div>
              <label className={labelCls}>Group name</label>
              <input className={inputCls} value={group.name} onChange={(e) => dispatch({ type: 'UPDATE_GROUP', groupId: group.id, patch: { name: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Toggle on={group.announcementsOnly} onChange={(v) => dispatch({ type: 'UPDATE_GROUP', groupId: group.id, patch: { announcementsOnly: v } })} title="Announcements only" desc="Only admins can post to everyone." />
              <Toggle on={group.remindersOn} onChange={(v) => dispatch({ type: 'UPDATE_GROUP', groupId: group.id, patch: { remindersOn: v } })} title="Auto-reminders" desc="Nudge members before events and due dates." />
              <Toggle on={group.digestOn} onChange={(v) => dispatch({ type: 'UPDATE_GROUP', groupId: group.id, patch: { digestOn: v } })} title="Weekly digest" desc="A weekly summary of what's coming up." />
            </div>
            <div>
              <div className={labelCls}>Members & roles</div>
              <ul className="divide-y divide-black/5">
                {group.members.map((gm) => {
                  const m = memberById(state, gm.memberId)!
                  const { name, sub } = displayLabel(state, group, gm.memberId)
                  return (
                    <li key={gm.memberId} className="flex items-center gap-3 py-2.5">
                      <Avatar emoji={m.emoji} color={m.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{name}</div>
                        <div className="text-xs text-ink/45">{sub}</div>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'SET_MEMBER_ROLE', groupId: group.id, memberId: gm.memberId, role: gm.role === 'admin' ? 'member' : 'admin' })}
                        className={`chip ${gm.role === 'admin' ? 'bg-violet text-white' : 'bg-canvas text-ink/55'}`}
                      >
                        <Shield size={12} /> {gm.role === 'admin' ? 'Admin' : 'Member'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-ink/55">
            Only admins can change group settings. You can edit how you appear here, or leave the group.
          </div>
        )}

        <button
          onClick={() => {
            dispatch({ type: 'LEAVE_GROUP', groupId: group.id })
            onClose()
            navigate('/chats')
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-tang"
        >
          <LogOut size={14} /> Leave group
        </button>
      </div>
    </Modal>
  )
}

export function EditMembershipModal({ group, open, onClose }: { group: Group; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const mine = group.members.find((m) => m.memberId === state.currentUserId)
  const [childName, setChildName] = useState(mine?.childName ?? '')
  const [relationship, setRelationship] = useState(mine?.relationship ?? 'Parent')
  const [displayName, setDisplayName] = useState(mine?.displayName ?? '')

  useEffect(() => {
    if (open) {
      setChildName(mine?.childName ?? '')
      setRelationship(mine?.relationship ?? 'Parent')
      setDisplayName(mine?.displayName ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="How you appear in this group">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-2xl bg-violet-soft px-4 py-3 text-sm text-violet">
          <Users size={16} /> This only changes your name inside <strong>{group.name}</strong>.
        </div>
        <div>
          <label className={labelCls}>Your child's name (in this group)</label>
          <input className={inputCls} value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Calixta" />
        </div>
        <div>
          <label className={labelCls}>Your relationship</label>
          <RelationshipPicker value={relationship} onChange={setRelationship} />
        </div>
        <div>
          <label className={labelCls}>Or a custom name (optional)</label>
          <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Team treasurer" />
        </div>
        <p className="text-xs text-ink/45">
          You'll show as{' '}
          <strong>{displayName.trim() || (childName.trim() ? `${childName.trim()}'s ${relationship}` : relationship)}</strong>.
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={() => {
            dispatch({
              type: 'UPDATE_MEMBERSHIP',
              groupId: group.id,
              memberId: state.currentUserId,
              patch: {
                childName: childName.trim() || undefined,
                relationship,
                displayName: displayName.trim() || undefined,
              },
            })
            onClose()
          }}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90"
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
