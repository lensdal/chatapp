import { MessageSquare, Smartphone, MessageCircle, Shield } from 'lucide-react'
import Modal from './Modal'
import { Avatar } from './ui'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { memberById, displayLabel } from '../lib/selectors'
import type { Group } from '../types'

function ContactActions({ memberId, name }: { memberId: string; name: string }) {
  const { state } = useStore()
  const toast = useToast()
  const m = memberById(state, memberId)
  const phone = m?.phone ?? ''
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => toast(`Opening a Village message with ${name}`, '💬')}
        title="Message in Village"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-soft text-violet transition hover:bg-violet hover:text-white"
      >
        <MessageSquare size={15} />
      </button>
      <button
        onClick={() => toast(`Texting ${name} at ${phone}`, '📱')}
        title="Text message"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-soft text-sky transition hover:bg-sky hover:text-white"
      >
        <Smartphone size={15} />
      </button>
      <button
        onClick={() =>
          toast(
            state.whatsappConnected ? `Opening WhatsApp with ${name}` : 'Connect WhatsApp in Settings first',
            '💬',
          )
        }
        title="WhatsApp"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#0f9d58] transition hover:bg-[#25D366] hover:text-white"
      >
        <MessageCircle size={15} />
      </button>
    </div>
  )
}

export function GroupDirectory({
  group,
  open,
  onClose,
}: {
  group: Group
  open: boolean
  onClose: () => void
}) {
  const { state } = useStore()
  return (
    <Modal open={open} onClose={onClose} title={`${group.name} · Directory`}>
      <ul className="divide-y divide-black/5">
        {group.members.map((gm) => {
          const m = memberById(state, gm.memberId)
          if (!m) return null
          const { name, sub } = displayLabel(state, group, gm.memberId)
          const isSelf = m.isSelf
          return (
            <li key={gm.memberId} className="flex items-center gap-3 py-3">
              <Avatar emoji={m.emoji} color={m.color} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{name}</span>
                  {gm.role === 'admin' && (
                    <span className="chip bg-violet-soft text-violet">
                      <Shield size={11} /> Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink/50">
                  {sub}
                  {m.phone ? ` · ${m.phone}` : ''}
                </div>
              </div>
              {isSelf ? (
                <span className="text-xs font-semibold text-ink/35">You</span>
              ) : (
                <ContactActions memberId={gm.memberId} name={name} />
              )}
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

export { ContactActions }
