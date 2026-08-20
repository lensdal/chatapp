import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, RefreshCw, Shield, LogOut, Users, Upload, Trash2, Plus, X, Globe, Lock } from 'lucide-react'
import Modal from './Modal'
import { Avatar, GroupIcon } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { groupByCode, memberById, displayLabel, isAdmin } from '../lib/selectors'
import { GROUP_COLORS } from '../lib/ui'
import { fileToSquareDataUrl } from '../lib/image'
import type { Group } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'
const EMOJIS = ['⚽', '🏀', '⚾', '🏊', '🏕️', '📚', '🎨', '🎭', '🎵', '♟️', '🏫', '🎉', '🐝', '🚌', '🩰', '🥋']
const RELATIONSHIPS = ['Mom', 'Dad', 'Parent', 'Guardian', 'Grandparent', 'Coach', 'Teacher']

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
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [image, setImage] = useState<string | undefined>(undefined)
  const [color, setColor] = useState('#7C5CFC')
  const [childNames, setChildNames] = useState<string[]>([''])
  const [relationship, setRelationship] = useState('Parent')
  const [relationshipOther, setRelationshipOther] = useState('')
  const [announcementsOnly, setAnnouncementsOnly] = useState(false)
  const [joinPrivacy, setJoinPrivacy] = useState<'open' | 'approval'>('open')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setEmoji('🎉')
      setImage(undefined)
      setColor('#7C5CFC')
      setChildNames([''])
      setRelationship('Parent')
      setRelationshipOther('')
      setAnnouncementsOnly(false)
      setJoinPrivacy('open')
    }
  }, [open])

  const words = countWords(description)
  const canCreate = name.trim().length > 0 && words >= 50
  const roleOptions = [...RELATIONSHIPS, 'Other']
  const finalRelationship = relationship === 'Other' ? relationshipOther.trim() || 'Other' : relationship

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
      childNames: childNames.map((c) => c.trim()).filter(Boolean),
      relationship: finalRelationship,
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

        {/* How you show up + kids */}
        <div className="rounded-2xl bg-canvas p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">How should you show up here?</div>
          <div className="space-y-2">
            {childNames.map((cn, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={cn}
                  onChange={(e) => setChildNames((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
                  placeholder={i === 0 ? 'Your child (optional)' : 'Another child'}
                />
                {childNames.length > 1 && (
                  <button
                    onClick={() => setChildNames((arr) => arr.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-xl bg-white p-2 text-ink/40 ring-1 ring-black/10 transition hover:text-tang"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setChildNames((arr) => [...arr, ''])} className="inline-flex items-center gap-1.5 text-xs font-bold text-violet">
              <Plus size={14} /> Add another child
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {roleOptions.map((r) => (
              <button key={r} onClick={() => setRelationship(r)} className={`chip ${relationship === r ? 'bg-ink text-white' : 'bg-white text-ink/55'}`}>
                {r}
              </button>
            ))}
          </div>
          {relationship === 'Other' && (
            <input
              className={`${inputCls} mt-2`}
              value={relationshipOther}
              onChange={(e) => setRelationshipOther(e.target.value)}
              placeholder="Describe your role — e.g. Nanny, Neighbor, Team manager"
              autoFocus
            />
          )}
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
