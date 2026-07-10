import { useRef, useState } from 'react'
import { FileText, Download, X, Image as ImageIcon, Camera, Paperclip } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById, messagesForGroup } from '../lib/selectors'
import { fmtMessageTime } from '../lib/dates'
import { readAsAttachment, type Attachment } from '../lib/files'
import type { Group } from '../types'

function DocRow({
  att,
  who,
  when,
  onDownload,
}: {
  att: Attachment
  who: string
  when: string
  onDownload: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-black/[0.03]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky">
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{att.name}</div>
        <div className="text-[11px] text-ink/45">{who} · {when}</div>
      </div>
      <button onClick={onDownload} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 hover:bg-black/10 hover:text-violet" title="Download">
        <Download size={16} />
      </button>
    </div>
  )
}

export function GroupFiles({ group, open, onClose }: { group: Group; open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'all' | 'photos' | 'docs'>('all')
  const [preview, setPreview] = useState<string | null>(null)

  const items = messagesForGroup(state, group.id)
    .filter((m) => m.attachment)
    .map((m) => ({ m, att: m.attachment!, sender: memberById(state, m.senderId) }))
    .reverse()
  const photos = items.filter((i) => i.att.kind === 'image')
  const docs = items.filter((i) => i.att.kind !== 'image')

  const TabBtn = ({ id, label, n }: { id: typeof tab; label: string; n: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${tab === id ? 'bg-violet text-white' : 'text-ink/55 hover:text-violet'}`}
    >
      {label} <span className={tab === id ? 'text-white/70' : 'text-ink/35'}>{n}</span>
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} title={`${group.name} · Files`}>
      <div className="mb-4 flex items-center gap-1 rounded-full bg-canvas p-1">
        <TabBtn id="all" label="All" n={items.length} />
        <TabBtn id="photos" label="Photos" n={photos.length} />
        <TabBtn id="docs" label="Documents" n={docs.length} />
      </div>

      {items.length === 0 && (
        <div className="py-10 text-center text-sm text-ink/45">No files shared yet.</div>
      )}

      {tab !== 'docs' && photos.length > 0 && (
        <>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Photos</div>
          <div className="mb-5 grid grid-cols-3 gap-2">
            {photos.map(({ m, att }) => (
              <button
                key={m.id}
                onClick={() => att.dataUrl && setPreview(att.dataUrl)}
                className="aspect-square overflow-hidden rounded-2xl bg-canvas"
              >
                {att.dataUrl ? (
                  <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-ink/30"><ImageIcon size={22} /></span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {tab !== 'photos' && docs.length > 0 && (
        <>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/40">Documents</div>
          <div className="divide-y divide-black/5">
            {docs.map(({ m, att, sender }) => (
              <DocRow
                key={m.id}
                att={att}
                who={sender?.isSelf ? 'You' : sender?.name ?? 'Someone'}
                when={fmtMessageTime(m.at)}
                onDownload={() => toast(`Downloading ${att.name}`, '📎')}
              />
            ))}
          </div>
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="max-h-[85vh] max-w-full rounded-2xl" />
          <button className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white" onClick={() => setPreview(null)}>
            <X size={20} />
          </button>
        </div>
      )}
    </Modal>
  )
}

// Composer control: opens the phone camera / photo library / document picker.
export function AttachButton({ onAdd }: { onAdd: (att: Attachment) => void }) {
  const toast = useToast()
  const [openMenu, setOpenMenu] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  const handle = async (file?: File | null) => {
    setOpenMenu(false)
    if (!file) return
    try {
      const att = await readAsAttachment(file)
      onAdd(att)
      toast(att.kind === 'image' ? 'Photo shared to the group' : 'File shared to the group', '📎')
    } catch {
      toast('Could not read that file', '⚠️')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu((o) => !o)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:bg-violet-soft hover:text-violet"
      >
        <Paperclip size={13} /> Attach
      </button>
      {openMenu && (
        <div className="absolute bottom-9 left-0 z-20 w-44 overflow-hidden rounded-2xl bg-white p-1 shadow-card">
          <button onClick={() => photoRef.current?.click()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.04]">
            <Camera size={16} className="text-violet" /> Photo / camera
          </button>
          <button onClick={() => docRef.current?.click()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-black/[0.04]">
            <FileText size={16} className="text-sky" /> Document
          </button>
        </div>
      )}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <input
        ref={docRef}
        type="file"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  )
}
