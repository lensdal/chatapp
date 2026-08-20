import type { ColorKey } from '../types'

// Full literal class strings so Tailwind's content scanner keeps them.
export const colorClasses: Record<
  ColorKey,
  { soft: string; softText: string; solid: string; dot: string; ring: string; text: string }
> = {
  violet: {
    soft: 'bg-violet-soft',
    softText: 'bg-violet-soft text-violet',
    solid: 'bg-violet text-white',
    dot: 'bg-violet',
    ring: 'ring-violet',
    text: 'text-violet',
  },
  sky: {
    soft: 'bg-sky-soft',
    softText: 'bg-sky-soft text-sky',
    solid: 'bg-sky text-white',
    dot: 'bg-sky',
    ring: 'ring-sky',
    text: 'text-sky',
  },
  blush: {
    soft: 'bg-blush-soft',
    softText: 'bg-blush-soft text-blush',
    solid: 'bg-blush text-white',
    dot: 'bg-blush',
    ring: 'ring-blush',
    text: 'text-blush',
  },
  sun: {
    soft: 'bg-sun-soft',
    softText: 'bg-sun-soft text-[#B7841A]',
    solid: 'bg-sun text-white',
    dot: 'bg-sun',
    ring: 'ring-sun',
    text: 'text-[#B7841A]',
  },
  tang: {
    soft: 'bg-tang-soft',
    softText: 'bg-tang-soft text-tang',
    solid: 'bg-tang text-white',
    dot: 'bg-tang',
    ring: 'ring-tang',
    text: 'text-tang',
  },
  mint: {
    soft: 'bg-mint-soft',
    softText: 'bg-mint-soft text-mint',
    solid: 'bg-mint text-white',
    dot: 'bg-mint',
    ring: 'ring-mint',
    text: 'text-mint',
  },
}

export const priorityChip: Record<string, string> = {
  high: 'bg-tang-soft text-tang',
  medium: 'bg-sun-soft text-[#B7841A]',
  low: 'bg-mint-soft text-mint',
}

export const priorityLabel: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// ---- Group colors ----
// Groups now carry a free-form hex color (chosen from a wheel), so their
// styling is computed at runtime rather than pulled from the fixed palette.

// Hex values for the six legacy named colors, so old data / child colors that
// still use ColorKey names resolve to a real hex.
const NAMED_HEX: Record<string, string> = {
  violet: '#7C5CFC',
  sky: '#5B8DEF',
  blush: '#E45FCF',
  sun: '#F5B93E',
  tang: '#F07E3E',
  mint: '#3FB984',
}

// Accept either a hex string or a legacy color name and always return a hex.
export function toHex(color: string): string {
  if (color.startsWith('#')) return color
  return NAMED_HEX[color] ?? '#7C5CFC'
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const h = toHex(hex).replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Inline-style builders for group color, mirroring the class variants above.
export const groupStyles = {
  softBg: (hex: string) => ({ backgroundColor: hexWithAlpha(hex, 0.16) }),
  soft: (hex: string) => ({ backgroundColor: hexWithAlpha(hex, 0.16), color: toHex(hex) }),
  text: (hex: string) => ({ color: toHex(hex) }),
  dot: (hex: string) => ({ backgroundColor: toHex(hex) }),
  solid: (hex: string) => ({ backgroundColor: toHex(hex), color: '#fff' }),
}

// A curated ring around the color wheel shown as quick swatches; the native
// color input still lets people pick anything else.
export const GROUP_COLORS: string[] = [
  '#7C5CFC', '#6366F1', '#5B8DEF', '#0EA5E9', '#06B6D4', '#14B8A6',
  '#3FB984', '#22C55E', '#84CC16', '#F5B93E', '#F59E0B', '#F07E3E',
  '#EF4444', '#EC4899', '#E45FCF', '#A855F7', '#8B5CF6', '#64748B',
]
