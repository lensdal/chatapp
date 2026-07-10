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

const STORAGE_KEY = 'village.state.v1'

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
  | {
      type: 'ADD_SIGNUP'
      groupId: string
      childId?: string
      title: string
      note?: string
      dueDate: string
      slots: { label: string; qty: number }[]
    }
  | { type: 'CLAIM_SLOT'; sheetId: string; slotId: string }
  | { type: 'UNCLAIM_SLOT'; sheetId: string; slotId: string }
  | {
      type: 'SET_INTEGRATION'
      key: 'googleConnected' | 'venmoConnected' | 'whatsappConnected'
      value: boolean
    }
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

    case 'ADD_SIGNUP': {
      const sheetId = uid('su')
      const now = new Date().toISOString()
      const sheet = {
        id: sheetId,
        groupId: action.groupId,
        childId: action.childId,
        title: action.title,
        note: action.note,
        dueDate: action.dueDate,
        createdById: state.currentUserId,
        createdAt: now,
        slots: action.slots.map((s) => ({
          id: uid('slot'),
          label: s.label,
          qty: s.qty,
          claims: [],
        })),
      }
      return {
        ...state,
        signups: [...state.signups, sheet],
        messages: [
          ...state.messages,
          {
            id: uid('m'),
            groupId: action.groupId,
            senderId: state.currentUserId,
            text: `📋 Started a sign-up list: ${action.title}`,
            at: now,
            linkedSignupId: sheetId,
          },
        ],
      }
    }

    case 'CLAIM_SLOT': {
      const sheet = state.signups.find((s) => s.id === action.sheetId)
      const slot = sheet?.slots.find((sl) => sl.id === action.slotId)
      if (!sheet || !slot) return state
      if (slot.claims.some((c) => c.memberId === state.currentUserId)) return state

      const taskId = uid('t')
      const task: Task = {
        id: taskId,
        groupId: sheet.groupId,
        childId: sheet.childId,
        title: slot.label,
        dueDate: sheet.dueDate,
        done: false,
        priority: 'medium',
        assigneeIds: [state.currentUserId],
        fromSignup: { sheetId: sheet.id, slotId: slot.id },
      }
      return {
        ...state,
        tasks: [...state.tasks, task],
        signups: state.signups.map((s) =>
          s.id !== action.sheetId
            ? s
            : {
                ...s,
                slots: s.slots.map((sl) =>
                  sl.id !== action.slotId
                    ? sl
                    : { ...sl, claims: [...sl.claims, { memberId: state.currentUserId, taskId }] },
                ),
              },
        ),
      }
    }

    case 'UNCLAIM_SLOT': {
      const sheet = state.signups.find((s) => s.id === action.sheetId)
      const slot = sheet?.slots.find((sl) => sl.id === action.slotId)
      const claim = slot?.claims.find((c) => c.memberId === state.currentUserId)
      if (!sheet || !slot) return state
      return {
        ...state,
        tasks: claim?.taskId ? state.tasks.filter((t) => t.id !== claim.taskId) : state.tasks,
        signups: state.signups.map((s) =>
          s.id !== action.sheetId
            ? s
            : {
                ...s,
                slots: s.slots.map((sl) =>
                  sl.id !== action.slotId
                    ? sl
                    : { ...sl, claims: sl.claims.filter((c) => c.memberId !== state.currentUserId) },
                ),
              },
        ),
      }
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
