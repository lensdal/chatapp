import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  AppState,
  ColorKey,
  Collection,
  EventItem,
  Group,
  GroupMember,
  GroupRole,
  PaymentMethod,
  Poll,
  RSVPStatus,
  Task,
} from '../types'
import { makeSeed } from './seed'

function genJoinCode(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'GROUP'
  let n = 0
  for (const ch of name) n = (n * 31 + ch.charCodeAt(0)) % 1000
  return `${base}-${n.toString().padStart(2, '0')}`
}

const STORAGE_KEY = 'village.state.v6'

let idCounter = 0
export function uid(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

type Action =
  | {
      type: 'SEND_MESSAGE'
      groupId: string
      text: string
      attachment?: { name: string; kind: 'pdf' | 'image' | 'doc' | 'sheet'; dataUrl?: string }
      requireAck?: boolean
      replyToId?: string
    }
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
  | { type: 'TOGGLE_PIN'; messageId: string }
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
  | { type: 'SET_TRANSLATE'; to: string }
  | { type: 'ADD_FORWARD'; text: string; source?: 'whatsapp' | 'sms' | 'email' }
  | { type: 'HANDLE_FORWARD'; id: string }
  | { type: 'DISMISS_FORWARD'; id: string }
  | { type: 'SET_NOTIFY'; groupId: string; key: 'reminders' | 'digest'; value: boolean }
  | { type: 'SET_NOTIFY_ALL'; groupIds: string[]; key: 'reminders' | 'digest'; value: boolean }
  // groups & membership
  | {
      type: 'CREATE_GROUP'
      name: string
      category: string
      emoji: string
      color: ColorKey
      childName?: string
      relationship?: string
      announcementsOnly: boolean
    }
  | {
      type: 'JOIN_GROUP'
      groupId: string
      childName?: string
      relationship?: string
      displayName?: string
    }
  | { type: 'LEAVE_GROUP'; groupId: string }
  | {
      type: 'UPDATE_GROUP'
      groupId: string
      patch: Partial<Pick<Group, 'name' | 'announcementsOnly' | 'joinCode'>>
    }
  | { type: 'SET_MEMBER_ROLE'; groupId: string; memberId: string; role: GroupRole }
  | {
      type: 'UPDATE_MEMBERSHIP'
      groupId: string
      memberId: string
      patch: Partial<Pick<GroupMember, 'childName' | 'relationship' | 'displayName'>>
    }
  // events
  | { type: 'UPDATE_EVENT'; eventId: string; patch: Partial<EventItem> }
  | { type: 'SET_RSVP'; eventId: string; status: RSVPStatus }
  | { type: 'CARPOOL_OFFER'; eventId: string; seats: number }
  | { type: 'CARPOOL_CANCEL'; eventId: string }
  | { type: 'CARPOOL_TOGGLE_REQUEST'; eventId: string }
  // tasks
  | { type: 'UPDATE_TASK'; taskId: string; patch: Partial<Task> }
  // chat extras
  | { type: 'REACT'; messageId: string; emoji: string }
  | { type: 'ACK_MESSAGE'; messageId: string }
  // polls
  | {
      type: 'ADD_POLL'
      groupId: string
      question: string
      options: { label: string; amount?: number }[]
      multi: boolean
    }
  | { type: 'VOTE_POLL'; pollId: string; optionId: string }
  // collections (group payment pooling)
  | {
      type: 'ADD_COLLECTION'
      groupId: string
      title: string
      note?: string
      suggested?: number
      goal?: number
      method: PaymentMethod
      recipient: string
      childName?: string
    }
  | { type: 'CONTRIBUTE'; collectionId: string; amount: number }
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
            attachment: action.attachment,
            requireAck: action.requireAck,
            acks: action.requireAck ? [] : undefined,
            replyToId: action.replyToId,
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

    case 'TOGGLE_PIN':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, pinned: !m.pinned } : m,
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

    case 'SET_TRANSLATE':
      return { ...state, translateTo: action.to }

    case 'ADD_FORWARD':
      return {
        ...state,
        forwards: [
          { id: uid('fwd'), text: action.text, source: action.source ?? 'whatsapp', at: new Date().toISOString() },
          ...state.forwards,
        ],
      }

    case 'HANDLE_FORWARD':
      return {
        ...state,
        forwards: state.forwards.map((f) => (f.id === action.id ? { ...f, handled: true } : f)),
      }

    case 'DISMISS_FORWARD':
      return { ...state, forwards: state.forwards.filter((f) => f.id !== action.id) }

    case 'SET_NOTIFY': {
      const cur = state.notify[action.groupId] ?? { reminders: true, digest: true }
      return {
        ...state,
        notify: { ...state.notify, [action.groupId]: { ...cur, [action.key]: action.value } },
      }
    }

    case 'SET_NOTIFY_ALL': {
      const next = { ...state.notify }
      for (const gid of action.groupIds) {
        const cur = next[gid] ?? { reminders: true, digest: true }
        next[gid] = { ...cur, [action.key]: action.value }
      }
      return { ...state, notify: next }
    }

    // ---- groups & membership ----
    case 'CREATE_GROUP': {
      const id = uid('g')
      const me: GroupMember = {
        memberId: state.currentUserId,
        role: 'admin',
        childName: action.childName || undefined,
        relationship: action.relationship || undefined,
      }
      const group: Group = {
        id,
        name: action.name,
        category: action.category,
        emoji: action.emoji,
        color: action.color,
        childIds: [],
        members: [me],
        joinCode: genJoinCode(action.name),
        announcementsOnly: action.announcementsOnly,
      }
      return { ...state, groups: [...state.groups, group] }
    }

    case 'JOIN_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id !== action.groupId || g.members.some((m) => m.memberId === state.currentUserId)
            ? g
            : {
                ...g,
                members: [
                  ...g.members,
                  {
                    memberId: state.currentUserId,
                    role: 'member',
                    childName: action.childName || undefined,
                    relationship: action.relationship || undefined,
                    displayName: action.displayName || undefined,
                  },
                ],
              },
        ),
      }

    case 'LEAVE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id !== action.groupId
            ? g
            : { ...g, members: g.members.filter((m) => m.memberId !== state.currentUserId) },
        ),
      }

    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) => (g.id === action.groupId ? { ...g, ...action.patch } : g)),
      }

    case 'SET_MEMBER_ROLE':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id !== action.groupId
            ? g
            : {
                ...g,
                members: g.members.map((m) =>
                  m.memberId === action.memberId ? { ...m, role: action.role } : m,
                ),
              },
        ),
      }

    case 'UPDATE_MEMBERSHIP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id !== action.groupId
            ? g
            : {
                ...g,
                members: g.members.map((m) =>
                  m.memberId === action.memberId ? { ...m, ...action.patch } : m,
                ),
              },
        ),
      }

    // ---- events ----
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.eventId ? { ...e, ...action.patch } : e)),
      }

    case 'SET_RSVP':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id !== action.eventId
            ? e
            : { ...e, rsvps: { ...(e.rsvps ?? {}), [state.currentUserId]: action.status } },
        ),
      }

    case 'CARPOOL_OFFER':
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e
          const offers = (e.carpoolOffers ?? []).filter((o) => o.memberId !== state.currentUserId)
          return { ...e, carpoolOffers: [...offers, { memberId: state.currentUserId, seats: action.seats }] }
        }),
      }

    case 'CARPOOL_CANCEL':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id !== action.eventId
            ? e
            : { ...e, carpoolOffers: (e.carpoolOffers ?? []).filter((o) => o.memberId !== state.currentUserId) },
        ),
      }

    case 'CARPOOL_TOGGLE_REQUEST':
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.eventId) return e
          const reqs = e.carpoolRequests ?? []
          return {
            ...e,
            carpoolRequests: reqs.includes(state.currentUserId)
              ? reqs.filter((r) => r !== state.currentUserId)
              : [...reqs, state.currentUserId],
          }
        }),
      }

    // ---- tasks ----
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, ...action.patch } : t)),
      }

    // ---- chat extras ----
    case 'REACT':
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.id !== action.messageId) return m
          const reactions = { ...(m.reactions ?? {}) }
          const who = reactions[action.emoji] ?? []
          reactions[action.emoji] = who.includes(state.currentUserId)
            ? who.filter((x) => x !== state.currentUserId)
            : [...who, state.currentUserId]
          if (reactions[action.emoji].length === 0) delete reactions[action.emoji]
          return { ...m, reactions }
        }),
      }

    case 'ACK_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id !== action.messageId || (m.acks ?? []).includes(state.currentUserId)
            ? m
            : { ...m, acks: [...(m.acks ?? []), state.currentUserId] },
        ),
      }

    // ---- polls ----
    case 'ADD_POLL': {
      const pollId = uid('poll')
      const poll: Poll = {
        id: pollId,
        groupId: action.groupId,
        question: action.question,
        multi: action.multi,
        createdById: state.currentUserId,
        options: action.options.map((o) => ({ id: uid('po'), label: o.label, amount: o.amount, votes: [] })),
      }
      return {
        ...state,
        polls: [...state.polls, poll],
        messages: [
          ...state.messages,
          {
            id: uid('m'),
            groupId: action.groupId,
            senderId: state.currentUserId,
            text: `📊 New poll: ${action.question}`,
            at: new Date().toISOString(),
            linkedPollId: pollId,
          },
        ],
      }
    }

    case 'VOTE_POLL':
      return {
        ...state,
        polls: state.polls.map((p) => {
          if (p.id !== action.pollId) return p
          const me = state.currentUserId
          return {
            ...p,
            options: p.options.map((o) => {
              const has = o.votes.includes(me)
              if (o.id === action.optionId) {
                return { ...o, votes: has ? o.votes.filter((v) => v !== me) : [...o.votes, me] }
              }
              // single-choice: clear my vote from other options
              return p.multi ? o : { ...o, votes: o.votes.filter((v) => v !== me) }
            }),
          }
        }),
      }

    // ---- collections ----
    case 'ADD_COLLECTION': {
      const colId = uid('col')
      const col: Collection = {
        id: colId,
        groupId: action.groupId,
        title: action.title,
        note: action.note,
        suggested: action.suggested,
        goal: action.goal,
        method: action.method,
        recipient: action.recipient,
        childName: action.childName,
        createdById: state.currentUserId,
        contributions: [],
      }
      return {
        ...state,
        collections: [...state.collections, col],
        messages: [
          ...state.messages,
          {
            id: uid('m'),
            groupId: action.groupId,
            senderId: state.currentUserId,
            text: `💰 Collecting money: ${action.title}`,
            at: new Date().toISOString(),
            linkedCollectionId: colId,
          },
        ],
      }
    }

    case 'CONTRIBUTE':
      return {
        ...state,
        collections: state.collections.map((c) => {
          if (c.id !== action.collectionId) return c
          const rest = c.contributions.filter((x) => x.memberId !== state.currentUserId)
          return { ...c, contributions: [...rest, { memberId: state.currentUserId, amount: action.amount }] }
        }),
      }

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
