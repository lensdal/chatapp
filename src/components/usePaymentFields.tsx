import { useState } from 'react'
import { useStore } from '../store/store'
import { groupById, memberById } from '../lib/selectors'
import { PAY_METHODS, methodMeta, isVillage } from '../lib/pay'
import type { Member, Payment, PaymentHandles, PaymentMethod } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

const handleMethods = (h?: PaymentHandles): PaymentMethod[] =>
  (Object.keys(h ?? {}) as PaymentMethod[]).filter((k) => (h?.[k] ?? '').trim())

const emptyAccepted = (): Record<PaymentMethod, boolean> => ({
  venmo: false,
  cashapp: false,
  zelle: false,
  village: false,
  other: false,
})

// A reusable payment sub-form. First you say WHO is collecting (a group member,
// the group itself, or someone else), then check every way they'll accept it —
// including Village, which is paid inside the app and needs no handle.
export function usePaymentFields(groupId: string) {
  const { state } = useStore()
  const group = groupById(state, groupId)
  const villageOn = state.villagePayEnabled
  const members: Member[] = (group?.members ?? [])
    .map((gm) => memberById(state, gm.memberId))
    .filter((m): m is Member => Boolean(m) && m!.id !== state.currentUserId)

  const [amount, setAmount] = useState('')
  // 'group' = the whole group, or a member id, or 'other'.
  const [payTo, setPayTo] = useState<string>('other')
  const [recipientText, setRecipientText] = useState('')
  const [accepted, setAccepted] = useState<Record<PaymentMethod, boolean>>(emptyAccepted())
  const [handles, setHandles] = useState<PaymentHandles>({})

  // Prefill accepted methods + handles from whoever is collecting.
  const applyRecipientDefaults = (id: string) => {
    const acc = emptyAccepted()
    const h: PaymentHandles = {}
    if (id !== 'other' && id !== 'group') {
      const m = members.find((x) => x.id === id)
      for (const k of handleMethods(m?.handles)) {
        acc[k] = true
        h[k] = m!.handles![k]!
      }
    }
    if (villageOn) acc.village = true
    setAccepted(acc)
    setHandles(h)
  }

  const reset = (o: { amount?: string; method?: PaymentMethod }) => {
    setAmount(o.amount ?? '')
    setRecipientText('')
    // Default to the first member who has saved payment info (usually a coach).
    const withHandles = members.find((m) => handleMethods(m.handles).length)
    const initial = withHandles?.id ?? 'other'
    setPayTo(initial)
    applyRecipientDefaults(initial)
    if (o.method) setAccepted((a) => ({ ...a, [o.method!]: true }))
  }

  const pickRecipient = (id: string) => {
    setPayTo(id)
    applyRecipientDefaults(id)
  }

  const recipientName = (): string => {
    if (payTo === 'group') return group ? group.name : 'the group'
    if (payTo === 'other') return recipientText.trim() || 'the organizer'
    return members.find((m) => m.id === payTo)?.name ?? 'the organizer'
  }

  const chosen = (Object.keys(accepted) as PaymentMethod[]).filter((k) => accepted[k])

  const build = (): Payment | undefined => {
    if (!amount) return undefined
    const methods = chosen.length ? chosen : (['village'] as PaymentMethod[])
    const finalHandles: PaymentHandles = {}
    for (const m of methods) if (!isVillage(m) && (handles[m] ?? '').trim()) finalHandles[m] = handles[m]!.trim()
    return {
      amount: Number(amount),
      recipient: recipientName(),
      recipientId: payTo !== 'other' && payTo !== 'group' ? payTo : undefined,
      methods,
      handles: finalHandles,
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
          <label className={labelCls}>Who's collecting?</label>
          <select className={inputCls} value={payTo} onChange={(e) => pickRecipient(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.name}
              </option>
            ))}
            <option value="group">The whole group</option>
            <option value="other">Someone else…</option>
          </select>
        </div>
      </div>

      {payTo === 'other' && (
        <input
          className={inputCls}
          value={recipientText}
          onChange={(e) => setRecipientText(e.target.value)}
          placeholder="Their name — e.g. Coach Dave"
        />
      )}

      <div>
        <label className={labelCls}>Ways to pay (pick any)</label>
        <div className="space-y-2">
          {PAY_METHODS.map((m) => {
            if (isVillage(m.id) && !villageOn) return null
            const on = accepted[m.id]
            return (
              <div key={m.id} className="rounded-2xl bg-canvas px-3 py-2.5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setAccepted((a) => ({ ...a, [m.id]: e.target.checked }))}
                    className="h-5 w-5 accent-violet"
                  />
                  <span className="text-sm font-bold">{m.label}</span>
                  {isVillage(m.id) && <span className="text-[10px] font-semibold text-violet">(in-app · no handle needed)</span>}
                </label>
                {on && !isVillage(m.id) && (
                  <input
                    className={`${inputCls} mt-2`}
                    value={handles[m.id] ?? ''}
                    onChange={(e) => setHandles((h) => ({ ...h, [m.id]: e.target.value }))}
                    placeholder={methodMeta(m.id).placeholder}
                  />
                )}
              </div>
            )
          })}
        </div>
        {!villageOn && (
          <p className="mt-2 text-[11px] text-ink/40">
            Turn on Village Payments in Settings to let people pay through Village.
          </p>
        )}
      </div>
    </div>
  )

  return { amount, node, build, reset }
}
