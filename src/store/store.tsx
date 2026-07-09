import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { AppState, EventItem, Task } from '../types'
import { makeSeed } from './seed'

const STORAGE_KEY = 'huddle.state.v1'

let idCounter = 0
export function uid(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

type Action =
  | { type: 'SEND_MESSAGE'; groupId: string; text: string }
  | { type: 'ADD_TASK'; task: Omit<Task, 'id'> }
  | { type: 'ADD_EVENT'; event: Omit<EventItem, 'id'> }
  | {
      type: 'PROMOTE_TO_TASK'
      messageId: string
      task: Omit<Task, 'id' | 'createdFromMessageId'>
    }
  | {
      type: 'PROMOTE_TO_EVENT'
      messageId: string
      event: Omit<EventItem, 'id' | 'createdFromMessageId'>
    }
  | { type: 'TOGGLE_TASK'; taskId: string }
  | { type: 'PAY_TASK'; taskId: string }
  | { type: 'TOGGLE_EVENT_GOOGLE'; eventId: string }
  | { type: 'SET_INTEGRATION'; key: 'googleConnected' | 'venmoConnected'; value: boolean }
  | { type: 'RESET' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: uid('m'),
            groupId: action.groupId,
            senderId: state.currentUserId,
            text: action.text,
            at: new Date().toISOString(),
          },
        ],
      }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, { ...action.task, id: uid('t') }] }

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, { ...action.event, id: uid('ev') }] }

    case 'PROMOTE_TO_TASK': {
      const taskId = uid('t')
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { ...action.task, id: taskId, createdFromMessageId: action.messageId },
        ],
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, linkedTaskId: taskId } : m,
        ),
      }
    }

    case 'PROMOTE_TO_EVENT': {
      const eventId = uid('ev')
      return {
        ...state,
        events: [
          ...state.events,
          { ...action.event, id: eventId, createdFromMessageId: action.messageId },
        ],
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, linkedEventId: eventId } : m,
        ),
      }
    }

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, done: !t.done } : t,
        ),
      }

    case 'PAY_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId && t.payment
            ? { ...t, done: true, payment: { ...t.payment, paid: true } }
            : t,
        ),
      }

    case 'TOGGLE_EVENT_GOOGLE':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.eventId ? { ...e, addedToGoogle: !e.addedToGoogle } : e,
        ),
      }

    case 'SET_INTEGRATION':
      return { ...state, [action.key]: action.value }

    case 'RESET':
      return makeSeed()

    default:
      return state
  }
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore */
  }
  return makeSeed()
}

interface StoreContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
