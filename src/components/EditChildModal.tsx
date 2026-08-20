import { useEffect, useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { childById } from '../lib/selectors'
import { GROUP_COLORS, hexWithAlpha } from '../lib/ui'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

const KID_EMOJIS = ['🦄', '🌸', '🐢', '🐶', '🐱', '🦊', '🐼', '🐧', '🦁', '🐨', '🐰', '🐝', '🦋', '⚽', '🎨', '🎸', '🚀', '⭐', '🌈', '🦖']

export default function EditChildModal({
  open,
  onClose,
  childId,
}: {
  open: boolean
  onClose: () => void
  childId?: string
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const existing = childById(state, childId)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌈')
  const [color, setColor] = useState('#7C5CFC')

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? '')
      setEmoji(existing?.emoji ?? '🌈')
      setColor(existing?.color ?? '#7C5CFC')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = () => {
    if (!name.trim()) return
    if (existing) {
      dispatch({ type: 'UPDATE_CHILD', childId: existing.id, patch: { name: name.trim(), emoji, color } })
      toast('Kid updated', '✨')
    } else {
      dispatch({ type: 'ADD_CHILD', child: { name: name.trim(), emoji, color } })
      toast('Kid added', '🎉')
    }
    onClose()
  }

  const remove = () => {
    if (!existing) return
    dispatch({ type: 'DELETE_CHILD', childId: existing.id })
    toast('Kid removed', '🗑️')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit kid' : 'Add a kid'}>
      <div className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-4 rounded-3xl px-5 py-4" style={{ backgroundColor: hexWithAlpha(color, 0.16) }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-3xl">{emoji}</span>
          <div className="text-lg font-extrabold">{name.trim() || 'New kid'}</div>
        </div>

        <div>
          <label className={labelCls}>Name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calixta" autoFocus />
        </div>

        <div>
          <label className={labelCls}>Emoji</label>
          <div className="flex flex-wrap gap-1.5">
            {KID_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${emoji === e ? 'bg-violet-soft ring-2 ring-violet' : 'bg-canvas'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Color</label>
          <div className="flex flex-wrap items-center gap-2">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition ${color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-ink/40' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
                aria-label={`Use ${c}`}
              />
            ))}
            <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10" title="Pick any color">
              <span className="pointer-events-none absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>

        {existing && (
          <button onClick={remove} className="inline-flex items-center gap-1.5 text-sm font-semibold text-tang transition hover:opacity-80">
            <Trash2 size={14} /> Remove this kid
          </button>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 hover:bg-black/[0.05]">Cancel</button>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft hover:bg-violet/90 disabled:opacity-40"
        >
          <Check size={16} strokeWidth={3} /> {existing ? 'Save' : 'Add kid'}
        </button>
      </div>
    </Modal>
  )
}
