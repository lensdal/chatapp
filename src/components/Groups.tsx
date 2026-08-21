import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, RefreshCw, Shield, LogOut, Users, Upload, Trash2, Plus, Globe, Lock } from 'lucide-react'
import Modal from './Modal'
import { Avatar, GroupIcon } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { groupByCode, memberById, displayLabel, isAdmin } from '../lib/selectors'
import { GROUP_COLORS, groupStyles } from '../lib/ui'
import { fileToSquareDataUrl } from '../lib/image'
import type { Group } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'
const EMOJIS = ['⚽', '🏀', '⚾', '🏊', '🏕️', '📚', '🎨', '🎭', '🎵', '♟️', '🏫', '🎉', '🐝', '🚌', '🩰', '🥋']

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

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

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [color, setColor] = useState('#7C5CFC')
  const [kidIds, setKidIds] = useState<string[]>([])
  const [groupTag, setGroupTag] = useState('')
  const [announcementsOnly, setAnnouncementsOnly] = useState(false)
  const [joinPrivacy, setJoinPrivacy] = useState<'open' | 'approval'>('open')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setEmoji('🎉')
      setImage(undefined)
      setColor('#7C5CFC')
      setKidIds([])
      setGroupTag('')
      setAnnouncementsOnly(false)
      setJoinPrivacy('open')
    }
  }, [open])

  const words = countWords(description)
  const canCreate = name.trim().length > 0 && words >= 50
  const toggleKid = (id: string) => setKidIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImage(await fileToSquareDataUrl(file))
    } catch {
      toast('Could not read that image', '⚠️')
    }
    e.target.value = ''
  }

  const submit = () => {
    if (!canCreate) return
    dispatch({
      type: 'CREATE_GROUP',
      name: name.trim(),
      description: description.trim(),
      emoji,
      image,
      color,
      childIds: kidIds,
      groupTag: groupTag.trim() || undefined,
      announcementsOnly,
      joinPrivacy,
    })
    toast('Group created — share the join code to invite people', '🎉')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a new group">
      <div className="space-y-5">
        {/* Name + live icon preview */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <GroupIcon emoji={emoji} color={color} image={image} size="lg" />
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name — e.g. Calixta's Ballet" autoFocus />
        </div>

        {/* Icon: emoji or uploaded photo */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>Icon</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1.5 text-xs font-bold text-violet transition hover:bg-violet/20"
            >
              <Upload size={14} /> Upload a photo
            </button>
          </div>
          {image ? (
            <button
              onClick={() => setImage(undefined)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-tang"
            >
              <Trash2 size={13} /> Remove photo &amp; use an emoji
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${emoji === e ? 'bg-violet-soft ring-2 ring-violet' : 'bg-canvas'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color: swatches + full color wheel */}
        <div>
          <label className={labelCls}>Color</label>
          <div className="flex flex-wrap items-center gap-2">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition ${
                  color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-ink/40' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Use ${c}`}
              />
            ))}
            <label
              className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10"
              title="Pick any color"
            >
              <span className="pointer-events-none absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
              <Plus size={14} className="relative text-white drop-shadow" />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        {/* Description with a 50-word minimum */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>Description</label>
            <span className={`text-xs font-bold ${words >= 50 ? 'text-mint' : 'text-ink/40'}`}>{words} / 50 words</span>
          </div>
          <textarea
            className={`${inputCls} min-h-[110px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell members what this group is for — who it's for, what you'll use it for, when you meet, and anything new joiners should know. (50 words minimum.)"
          />
          {name.trim() && words < 50 && (
            <p className="mt-1 text-xs font-semibold text-tang">
              Add {50 - words} more word{50 - words === 1 ? '' : 's'} to continue.
            </p>
          )}
        </div>

        {/* Which kid is this group for? */}
        {state.children.length > 0 && (
          <div>
            <label className={labelCls}>Which kid is this group for?</label>
            <div className="flex flex-wrap gap-2">
              {state.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => toggleKid(child.id)}
                  className="chip"
                  style={kidIds.includes(child.id) ? groupStyles.solid(child.color) : groupStyles.soft(child.color)}
                >
                  {child.emoji} {child.name}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/45">Pick one or more — or none for a whole-family group.</p>
          </div>
        )}

        {/* Your group tag */}
        <div>
          <label className={labelCls}>Your group tag</label>
          <input
            className={inputCls}
            value={groupTag}
            onChange={(e) => setGroupTag(e.target.value)}
            placeholder="How you show up here — e.g. Callie's Dad, David's Grandma, Elle's Nanny"
          />
        </div>

        {/* Join privacy */}
        <div>
          <label className={labelCls}>Who can join?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setJoinPrivacy('open')}
              className={`flex items-start gap-2 rounded-2xl border p-3 text-left transition ${
                joinPrivacy === 'open' ? 'border-violet bg-violet-soft' : 'border-black/10 bg-canvas'
              }`}
            >
              <Globe size={18} className={joinPrivacy === 'open' ? 'text-violet' : 'text-ink/40'} />
              <span>
                <span className="block text-sm font-bold">Anyone with the code</span>
                <span className="block text-xs text-ink/50">People join instantly with the link or code.</span>
              </span>
            </button>
            <button
              onClick={() => setJoinPrivacy('approval')}
              className={`flex items-start gap-2 rounded-2xl border p-3 text-left transition ${
                joinPrivacy === 'approval' ? 'border-violet bg-violet-soft' : 'border-black/10 bg-canvas'
              }`}
            >
              <Lock size={18} className={joinPrivacy === 'approval' ? 'text-violet' : 'text-ink/40'} />
              <span>
                <span className="block text-sm font-bold">Approval required</span>
                <span className="block text-xs text-ink/50">An admin approves each new member.</span>
              </span>
            </button>
          </div>
        </div>

        <Toggle on={announcementsOnly} onChange={setAnnouncementsOnly} title="Announcements only" desc="Only admins can post to everyone (great for coaches & schools)." />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={submit}
          disabled={!canCreate}
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
  const [kidIds, setKidIds] = useState<string[]>([])
  const [groupTag, setGroupTag] = useState('')

  useEffect(() => {
    if (open) {
      setCode('')
      setKidIds([])
      setGroupTag('')
    }
  }, [open])

  const found = code.trim() ? groupByCode(state, code) : undefined
  const alreadyIn = found?.members.some((m) => m.memberId === state.currentUserId)
  const toggleKid = (id: string) => setKidIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

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
              <GroupIcon emoji={found.emoji} color={found.color} image={found.image} size="md" />
              <div>
                <div className="font-extrabold">{found.name}</div>
                <div className="text-xs text-ink/50">{found.category} · {found.members.length} members</div>
              </div>
            </div>

            {alreadyIn ? (
              <div className="text-sm font-semibold text-mint">You're already in this group.</div>
            ) : (
              <div className="rounded-2xl bg-canvas p-4">
                {state.children.length > 0 && (
                  <>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Which kid is this group for?</div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {state.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => toggleKid(child.id)}
                          className="chip"
                          style={kidIds.includes(child.id) ? groupStyles.solid(child.color) : groupStyles.soft(child.color)}
                        >
                          {child.emoji} {child.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Your group tag</div>
                <input
                  className={inputCls}
                  value={groupTag}
                  onChange={(e) => setGroupTag(e.target.value)}
                  placeholder="How you show up here — e.g. Callie's Dad, David's Grandma, Elle's Nanny"
                />
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
              childIds: kidIds,
              groupTag: groupTag.trim() || undefined,
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
            </div>
            <p className="rounded-2xl bg-canvas px-4 py-3 text-xs text-ink/50">
              Reminders and the weekly digest are each member’s own choice — everyone sets those in
              their own Settings.
            </p>
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
  const currentTag =
    mine?.displayName || (mine?.childName ? `${mine.childName}'s ${mine.relationship ?? ''}`.trim() : mine?.relationship ?? '')
  const [groupTag, setGroupTag] = useState(currentTag)

  useEffect(() => {
    if (open) setGroupTag(currentTag)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="How you appear in this group">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-2xl bg-violet-soft px-4 py-3 text-sm text-violet">
          <Users size={16} /> This only changes your name inside <strong>{group.name}</strong>.
        </div>
        <div>
          <label className={labelCls}>Your group tag</label>
          <input
            className={inputCls}
            value={groupTag}
            onChange={(e) => setGroupTag(e.target.value)}
            placeholder="e.g. Callie's Dad, David's Grandma, Elle's Nanny"
            autoFocus
          />
        </div>
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
                childName: undefined,
                relationship: undefined,
                displayName: groupTag.trim() || undefined,
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
