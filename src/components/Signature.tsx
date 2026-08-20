import { useEffect, useRef, useState } from 'react'
import { PenLine, Check, Upload, FileText, CalendarClock, Eraser, Eye } from 'lucide-react'
import Modal from './Modal'
import { Avatar, Pill } from './ui'
import { KidTag } from './items'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById, groupById } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import { fmtDay } from '../lib/dates'
import { readAsAttachment } from '../lib/files'
import type { SignatureDoc } from '../types'
import { format } from 'date-fns'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

/* ---------- Signature pad ---------- */
function SignModal({ open, onClose, docId }: { open: boolean; onClose: () => void; docId: string }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const [typed, setTyped] = useState('')

  const reset = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    setHasInk(false)
    setTyped('')
  }

  useEffect(() => {
    if (open) requestAnimationFrame(reset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const posOf = (e: React.PointerEvent) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const down = (e: React.PointerEvent) => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    drawing.current = true
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1B1526'
    const p = posOf(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    c.setPointerCapture?.(e.pointerId)
    setHasInk(true)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const p = posOf(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  const up = () => {
    drawing.current = false
  }

  const typeSign = (v: string) => {
    setTyped(v)
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    if (v.trim()) {
      ctx.fillStyle = '#1B1526'
      ctx.font = 'italic 46px "Segoe Script", "Snell Roundhand", "Brush Script MT", cursive'
      ctx.textBaseline = 'middle'
      ctx.fillText(v, 24, c.height / 2)
    }
    setHasInk(!!v.trim())
  }

  const apply = () => {
    if (!hasInk) return
    const url = canvasRef.current!.toDataURL('image/png')
    dispatch({ type: 'SIGN_DOC', docId, dataUrl: url, name: typed.trim() || undefined })
    toast('Signed ✓', '✍️')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add your signature">
      <p className="mb-3 text-sm text-ink/55">Draw with your finger or mouse — or type your name below.</p>
      <div className="overflow-hidden rounded-2xl border border-black/10">
        <canvas
          ref={canvasRef}
          width={480}
          height={170}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="w-full touch-none bg-white"
          style={{ cursor: 'crosshair' }}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          className={`${inputCls} flex-1`}
          value={typed}
          onChange={(e) => typeSign(e.target.value)}
          placeholder="…or type your name"
        />
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-canvas px-4 py-2.5 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          <Eraser size={15} /> Clear
        </button>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          Cancel
        </button>
        <button
          onClick={apply}
          disabled={!hasInk}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          <Check size={16} strokeWidth={3} /> Apply signature
        </button>
      </div>
    </Modal>
  )
}

/* ---------- Card shown in the chat ---------- */
export function SignatureCard({ doc }: { doc: SignatureDoc }) {
  const { state } = useStore()
  const [signOpen, setSignOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const requester = memberById(state, doc.requestedById)
  const group = groupById(state, doc.groupId)
  const accentHex = group ? group.color : '#7C5CFC'
  const mine = doc.signatures.find((s) => s.memberId === state.currentUserId)

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex items-start gap-3 px-5 py-4" style={groupStyles.softBg(accentHex)}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <PenLine size={20} style={groupStyles.text(accentHex)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/40">Signature request</span>
            {requester && <span className="text-xs text-ink/40">· by {requester.isSelf ? 'you' : requester.name}</span>}
          </div>
          <h4 className="text-base font-extrabold leading-tight">{doc.title}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <KidTag childId={doc.childId} plain />
            {doc.dueDate && (
              <Pill className="bg-white/70 text-ink/60">
                <CalendarClock size={12} /> by {fmtDay(doc.dueDate)}
              </Pill>
            )}
          </div>
        </div>
      </div>

      {doc.note && <p className="px-5 pt-3 text-sm text-ink/55">{doc.note}</p>}

      {/* Document */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky">
            <FileText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{doc.fileName}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink/40">{doc.fileKind}</div>
          </div>
          {doc.fileDataUrl && doc.fileKind === 'image' && (
            <button
              onClick={() => setPreview(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink/60 shadow-soft transition hover:text-violet"
            >
              <Eye size={13} /> View
            </button>
          )}
        </div>
      </div>

      {/* Signatures */}
      {doc.signatures.length > 0 && (
        <ul className="space-y-2 px-5 pb-1">
          {doc.signatures.map((s) => {
            const m = memberById(state, s.memberId)
            return (
              <li key={s.memberId} className="flex items-center gap-3">
                {m && <Avatar emoji={m.emoji} color={m.color} image={m.avatarImage} size="xs" />}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{m?.isSelf ? 'You' : m?.name}</div>
                  <div className="text-[11px] text-ink/40">Signed {format(new Date(s.signedAt), 'MMM d, h:mm a')}</div>
                </div>
                <img src={s.dataUrl} alt="signature" className="h-9 w-24 rounded-lg border border-black/10 bg-white object-contain" />
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-black/5 px-5 py-3">
        <span className="text-[11px] text-ink/40">
          {mine ? 'Thanks — your signature is on file.' : 'Signing marks your “Sign” task complete.'}
        </span>
        <button
          onClick={() => setSignOpen(true)}
          className={`chip shrink-0 shadow-soft transition ${
            mine ? 'bg-mint-soft text-mint' : 'bg-violet text-white hover:bg-violet/90'
          }`}
        >
          {mine ? (
            <>
              <Check size={13} strokeWidth={3} /> Signed · re-sign
            </>
          ) : (
            <>
              <PenLine size={13} /> Sign document
            </>
          )}
        </button>
      </div>

      <SignModal open={signOpen} onClose={() => setSignOpen(false)} docId={doc.id} />

      {preview && doc.fileDataUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6" onClick={() => setPreview(false)}>
          <img src={doc.fileDataUrl} alt={doc.fileName} className="max-h-[85vh] max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  )
}

/* ---------- Create / upload modal ---------- */
export function CreateSignatureModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean
  onClose: () => void
  groupId: string
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const group = groupById(state, groupId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [childId, setChildId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [file, setFile] = useState<{ name: string; kind: 'pdf' | 'image' | 'doc' | 'sheet'; dataUrl?: string } | null>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setChildId('')
      setNote('')
      setDate('')
      setFile(null)
    }
  }, [open])

  if (!group) return null

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const att = await readAsAttachment(f)
      setFile(att)
      if (!title.trim()) setTitle(att.name.replace(/\.[^.]+$/, ''))
    } catch {
      toast('Could not read that file', '⚠️')
    }
    e.target.value = ''
  }

  const submit = () => {
    if (!title.trim() || !file) return
    dispatch({
      type: 'ADD_SIGNATURE_DOC',
      groupId,
      childId: childId || undefined,
      title: title.trim(),
      note: note.trim() || undefined,
      dueDate: date ? new Date(`${date}T12:00`).toISOString() : undefined,
      fileName: file.name,
      fileKind: file.kind,
      fileDataUrl: file.dataUrl,
    })
    toast('Signature request posted', '✍️')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Request a signature">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Document</label>
          <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
          {file ? (
            <div className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-soft text-sky">
                <FileText size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{file.name}</span>
              <button onClick={() => fileRef.current?.click()} className="text-xs font-bold text-violet">
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 py-6 text-sm font-bold text-ink/55 transition hover:border-violet hover:text-violet"
            >
              <Upload size={17} /> Upload a document
            </button>
          )}
        </div>

        <div>
          <label className={labelCls}>What is it?</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Field trip permission slip"
          />
        </div>

        {group.childIds.length > 0 && (
          <div>
            <label className={labelCls}>For which kid? (optional)</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChildId('')}
                className={`chip ${childId === '' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
              >
                None
              </button>
              {group.childIds.map((cid) => {
                const child = state.children.find((c) => c.id === cid)
                if (!child) return null
                return (
                  <button
                    key={cid}
                    onClick={() => setChildId(cid)}
                    className="chip"
                    style={childId === cid ? groupStyles.solid(child.color) : groupStyles.soft(child.color)}
                  >
                    {child.emoji} {child.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sign by (optional)</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Note (optional)</label>
          <input
            className={inputCls}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the group should know"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!title.trim() || !file}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          Post to group
        </button>
      </div>
    </Modal>
  )
}
