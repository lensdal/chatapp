import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  emoji?: string
}

const ToastContext = createContext<(message: string, emoji?: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const push = useCallback((message: string, emoji?: string) => {
    counter.current += 1
    const id = counter.current
    setToasts((prev) => [...prev, { id, message, emoji }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card"
            style={{ animation: 'villageToast .25s ease-out' }}
          >
            {t.emoji && <span className="text-base">{t.emoji}</span>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes villageToast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </ToastContext.Provider>
  )
}
