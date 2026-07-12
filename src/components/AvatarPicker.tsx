import { useEffect, useRef, useState } from 'react'
import { Upload, Check, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { Avatar } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById } from '../lib/selectors'
import { AVATAR_PRESETS } from '../lib/avatars'
import { colorClasses } from '../lib/ui'
import type { ColorKey } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'

// Downscale + center-crop an uploaded image to a small square data URL so it
// renders crisply and stays small enough for localStorage.
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AvatarPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const me = memberById(state, state.currentUserId)!
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(me.emoji)
  const [color, setColor] = useState<ColorKey>(me.color)
  const [image, setImage] = useState<string | undefined>(me.avatarImage)

  useEffect(() => {
    if (open) {
      setName(me.name === 'You' ? '' : me.name)
      setEmoji(me.emoji)
      setColor(me.color)
      setImage(me.avatarImage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const pickPreset = (p: { emoji: string; color: ColorKey }) => {
    setEmoji(p.emoji)
    setColor(p.color)
    setImage(undefined)
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImage(await fileToAvatar(file))
    } catch {
      toast('Could not read that image', '⚠️')
    }
    e.target.value = ''
  }

  const save = () => {
    dispatch({ type: 'SET_PROFILE', name, emoji, color, avatarImage: image })
    toast('Profile updated', '✨')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose your avatar">
      {/* Live preview */}
      <div className="mb-5 flex items-center gap-4 rounded-3xl bg-canvas px-5 py-4">
        <Avatar emoji={emoji} color={color} image={image} size="lg" />
        <div className="min-w-0">
          <div className="text-lg font-extrabold leading-tight">{name.trim() || 'You'}</div>
          <div className="text-sm text-ink/45">{me.role}</div>
        </div>
      </div>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">
        Display name
      </label>
      <input
        className={inputCls}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />

      <div className="mb-2 mt-5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Pick an avatar</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1.5 text-xs font-bold text-violet transition hover:bg-violet/20"
        >
          <Upload size={14} /> Upload a photo
        </button>
      </div>

      {image && (
        <button
          onClick={() => setImage(undefined)}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/45 transition hover:text-tang"
        >
          <Trash2 size={13} /> Remove photo &amp; use an icon
        </button>
      )}

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {AVATAR_PRESETS.map((p, i) => {
          const selected = !image && p.emoji === emoji && p.color === color
          return (
            <button
              key={i}
              onClick={() => pickPreset(p)}
              className={`flex aspect-square items-center justify-center rounded-2xl text-xl transition ${colorClasses[p.color].soft} ${
                selected ? 'ring-2 ring-violet ring-offset-2' : 'hover:scale-105'
              }`}
            >
              {p.emoji}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90"
        >
          <Check size={16} strokeWidth={3} /> Save
        </button>
      </div>
    </Modal>
  )
}
