import type { PaymentMethod } from '../types'

export interface MethodMeta {
  id: PaymentMethod
  label: string
  handleLabel: string
  placeholder: string
  /** Whether this method supports a prefilled deep link. */
  hasLink: boolean
  /** Tailwind classes for the pay button. */
  className: string
}

export const PAY_METHODS: MethodMeta[] = [
  {
    id: 'venmo',
    label: 'Venmo',
    handleLabel: 'Venmo username',
    placeholder: '@your-venmo',
    hasLink: true,
    className: 'bg-sky text-white hover:bg-sky/90',
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    handleLabel: 'Cashtag',
    placeholder: '$YourCashtag',
    hasLink: true,
    className: 'bg-mint text-white hover:bg-mint/90',
  },
  {
    id: 'zelle',
    label: 'Zelle',
    handleLabel: 'Zelle email or phone',
    placeholder: 'you@email.com',
    hasLink: false,
    className: 'bg-violet text-white hover:bg-violet/90',
  },
  {
    id: 'village',
    label: 'Village',
    handleLabel: 'Village',
    placeholder: 'Paid securely inside Village',
    hasLink: false,
    className: 'bg-gradient-to-r from-violet to-sky text-white hover:opacity-90',
  },
  {
    id: 'other',
    label: 'Other',
    handleLabel: 'Handle or instructions',
    placeholder: 'e.g. paypal.me/you',
    hasLink: false,
    className: 'bg-ink text-white hover:bg-ink/90',
  },
]

// Village needs no handle — payment happens inside the app.
export const isVillage = (m: PaymentMethod): boolean => m === 'village'

export const methodMeta = (m: PaymentMethod): MethodMeta =>
  PAY_METHODS.find((x) => x.id === m) ?? PAY_METHODS[PAY_METHODS.length - 1]

// Build a prefilled payment link that opens the platform ready to send.
// Venmo & Cash App support deep links; Zelle has no universal link (it lives
// inside each bank's app), and "Other" is free-form — both return null so the
// UI shows the handle + instructions instead.
export function buildPayLink(
  method: PaymentMethod,
  handle: string,
  amount?: number,
  note?: string,
): string | null {
  const amt = amount != null ? String(amount) : ''
  const n = encodeURIComponent(note ?? '')
  const h = handle.trim()
  if (!h) return null
  if (method === 'venmo') {
    const u = encodeURIComponent(h.replace(/^@/, ''))
    return `https://venmo.com/${u}?txn=pay&amount=${amt}&note=${n}`
  }
  if (method === 'cashapp') {
    const tag = encodeURIComponent(h.replace(/^\$/, ''))
    return amt ? `https://cash.app/$${tag}/${amt}` : `https://cash.app/$${tag}`
  }
  return null
}
