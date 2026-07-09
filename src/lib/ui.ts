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
