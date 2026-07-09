export type ColorKey = 'violet' | 'sky' | 'blush' | 'sun' | 'tang' | 'mint'

export type Priority = 'high' | 'medium' | 'low'

export type PaymentMethod = 'venmo' | 'cashapp'

export interface Child {
  id: string
  name: string
  color: ColorKey
  emoji: string
}

export interface Member {
  id: string
  name: string
  role: string
  emoji: string
  color: ColorKey
  isSelf?: boolean
}

export interface Group {
  id: string
  name: string
  category: string
  color: ColorKey
  emoji: string
  childIds: string[]
  memberIds: string[]
}

export interface ChatMessage {
  id: string
  groupId: string
  senderId: string
  text: string
  at: string // ISO
  linkedTaskId?: string
  linkedEventId?: string
}

export interface EventItem {
  id: string
  groupId: string
  childId?: string
  title: string
  date: string // ISO (start)
  location?: string
  note?: string
  addedToGoogle: boolean
  createdFromMessageId?: string
}

export interface Payment {
  amount: number
  recipient: string
  method: PaymentMethod
  paid: boolean
}

export interface Task {
  id: string
  groupId: string
  childId?: string
  title: string
  dueDate?: string // ISO
  done: boolean
  priority: Priority
  assigneeIds: string[]
  payment?: Payment
  createdFromMessageId?: string
}

export interface AppState {
  children: Child[]
  members: Member[]
  groups: Group[]
  messages: ChatMessage[]
  events: EventItem[]
  tasks: Task[]
  googleConnected: boolean
  venmoConnected: boolean
  currentUserId: string
}
