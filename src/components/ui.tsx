import type { CSSProperties, ReactNode } from 'react'
import { hexWithAlpha } from '../lib/ui'

// A group's icon: an uploaded photo, or its emoji on a soft tint of its color.
export function GroupIcon({
  emoji,
  color,
  image,
  size = 'md',
}: {
  emoji: string
  color: string
  image?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  const dims = {
    xs: 'h-7 w-7 text-sm rounded-lg',
    sm: 'h-9 w-9 text-base rounded-xl',
    md: 'h-11 w-11 text-xl rounded-2xl',
    lg: 'h-12 w-12 text-xl rounded-2xl',
  }[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${dims}`}
      style={image ? undefined : { backgroundColor: hexWithAlpha(color, 0.16) }}
    >
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : emoji}
    </span>
  )
}

export function Avatar({
  emoji,
  color,
  size = 'md',
  ring = false,
  image,
}: {
  emoji: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  ring?: boolean
  image?: string
}) {
  const dims = {
    xs: 'h-7 w-7 text-sm',
    sm: 'h-9 w-9 text-base',
    md: 'h-11 w-11 text-xl',
    lg: 'h-14 w-14 text-2xl',
  }[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${dims} ${
        ring ? 'ring-2 ring-white' : ''
      }`}
      style={image ? undefined : { backgroundColor: hexWithAlpha(color, 0.16) }}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        emoji
      )}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: { emoji: string; color: string; image?: string }[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2.5">
        {shown.map((p, i) => (
          <Avatar key={i} emoji={p.emoji} color={p.color} image={p.image} size="sm" ring />
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 inline-flex h-9 items-center rounded-full bg-ink px-2.5 text-xs font-semibold text-white">
          +{extra}
        </span>
      )}
    </div>
  )
}

export function Pill({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return <span className={`chip ${className}`} style={style}>{children}</span>
}

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer transition hover:shadow-soft' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-ink/45">
      <span className="text-3xl">{emoji}</span>
      <span>{text}</span>
    </div>
  )
}

export function Donut({
  segments,
  size = 128,
  thickness = 20,
  center,
}: {
  segments: { value: number; color: string }[]
  size?: number
  thickness?: number
  center?: ReactNode
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEAF7" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += len
          return el
        })}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>}
    </div>
  )
}
