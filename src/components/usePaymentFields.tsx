import { useState } from 'react'
import { useStore } from '../store/store'
import { groupById, memberById } from '../lib/selectors'
import { PAY_METHODS, methodMeta } from '../lib/pay'
import type { Member, Payment, PaymentHandles, PaymentMethod } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

const handleMethods = (h?: PaymentHandles): PaymentMethod[] =>
  (Object.keys(h ?? {}) as PaymentMethod[]).filter((k) => (h?.[k] ?? '').trim())

// A reusable payment sub-form. The recipient is usually a group member, so we
// reuse their saved handles/methods; otherwise you can enter someone else's.
export function usePaymentFields(groupId: string) {
  const { state } = useStore()
  const group = groupById(state, groupId)
  const members: Member[] = (group?.members ?? [])
    .map((gm) => memberById(state, gm.memberId))
    .filter((m): m is Member => Boolean(m) && m!.id !== state.currentUserId)

  const [amount, setAmount] = useState('')
  const [payTo, setPayTo] = useState<string>('other')
  const [recipientText, setRecipientText] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('venmo')
  const [handle, setHandle] = useState('')

  const reset = (o: { amount?: string; method?: PaymentMethod }) => {
    setAmount(o.amount ?? '')
    setMethod(o.method ?? 'venmo')
    setRecipientText('')
    setHandle('')
    // Default to the first member who has saved payment info (usually a coach).
    const withHandles = members.find((m) => handleMethods(m.handles).length)
    setPayTo(withHandles?.id ?? 'other')
  }

  const selectedMember = payTo !== 'other' ? members.find((m) => m.id === payTo) : undefined
  const memberMethods = handleMethods(selectedMember?.handles)

  const build = (): Payment | undefined => {
    if (!amount) return undefined
    if (payTo === 'other') {
      return {
        amount: Number(amount),
        recipient: recipientText.trim() || 'the organizer',
        methods: [method],
        handles: handle.trim() ? { [method]: handle.trim() } : {},
        paid: false,
      }
    }
    const handles = selectedMember?.handles ?? {}
    return {
      amount: Number(amount),
      recipient: selectedMember?.name ?? 'the organizer',
      methods: memberMethods.length ? memberMethods : [method],
      handles,
      paid: false,
    }
  }

  const node = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Amount ($)</label>
          <input
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className={labelCls}>Pay to</label>
          <select className={inputCls} value={payTo} onChange={(e) => setPayTo(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
            <option value="other">Someone else…</option>
          </select>
        </div>
      </div>

      {payTo !== 'other' ? (
        memberMethods.length ? (
          <div className="text-[11px] font-medium text-ink/50">
            Uses {selectedMember?.name}'s saved{' '}
            {memberMethods.map((m) => methodMeta(m).label).join(', ')} — the payer taps to send.
          </div>
        ) : (
          <div className="text-[11px] font-medium text-tang">
            {selectedMember?.name} hasn't saved payment info yet — you can still track this, or pick “Someone
            else” to add a handle.
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <input
            className={`${inputCls} col-span-2`}
            value={recipientText}
            onChange={(e) => setRecipientText(e.target.value)}
            placeholder="Pay who? (e.g. Coach Dave)"
          />
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAY_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={methodMeta(method).placeholder}
          />
        </div>
      )}
    </div>
  )

  return { amount, node, build, reset }
}
