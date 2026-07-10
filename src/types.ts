export type ColorKey = 'violet' | 'sky' | 'blush' | 'sun' | 'tang' | 'mint'

export type Priority = 'high' | 'medium' | 'low'

export type PaymentMethod = 'venmo' | 'cashapp'

export type GroupRole = 'admin' | 'member'

export type Recurrence = 'none' | 'weekly' | 'monthly'

export type RSVPStatus = 'going' | 'maybe' | 'no'

export interface Child {
  id: string
  name: string
  color: ColorKey
  emoji: string
}

export interface Member {
  id: string
  name: string
  role: string // global default role/label
  emoji: string
  color: ColorKey
  phone?: string
  isSelf?: boolean
}

// Per-group membership: role, and the identity shown *in this group*.
export interface GroupMember {
  memberId: string
  role: GroupRole
  childName?: string // their kid's name in this group (free text)
  relationship?: string // e.g. "Mom", "Dad", "Coach"
  displayName?: string // custom override; wins over the auto label
}

export interface Group {
  id: string
  name: string
  category: string
  color: ColorKey
  emoji: string
  childIds: string[]
  members: GroupMember[]
  joinCode: string
  announcementsOnly: boolean // roles toggle: only admins can post to everyone
  remindersOn: boolean // auto-remind before due dates / events
  digestOn: boolean // weekly digest for this group
  description?: string
}

export interface ChatMessage {
  id: string
  groupId: string
  senderId: string
  text: string
  at: string // ISO
  linkedTaskId?: string
  linkedEventId?: string
  linkedSignupId?: string
  linkedPollId?: string
  linkedCollectionId?: string
  pinned?: boolean
  replyToId?: string // message this one is replying to
  reactions?: Record<string, string[]> // emoji -> memberIds
  requireAck?: boolean
  acks?: string[] // memberIds who tapped "Got it"
  attachment?: { name: string; kind: 'pdf' | 'image' | 'doc' | 'sheet'; dataUrl?: string }
}

export interface SignUpClaim {
  memberId: string
  taskId?: string // task generated on the claimer's list (self only in this prototype)
}

export interface SignUpSlot {
  id: string
  label: string
  qty: number // how many people are needed for this item
  claims: SignUpClaim[]
}

export interface SignUpSheet {
  id: string
  groupId: string
  childId?: string
  title: string
  note?: string
  dueDate: string // ISO — the deadline that lands on claimers' task lists
  createdById: string
  createdAt: string
  slots: SignUpSlot[]
}

export interface PollOption {
  id: string
  label: string
  votes: string[] // memberIds
}

export interface Poll {
  id: string
  groupId: string
  question: string
  multi: boolean
  options: PollOption[]
  createdById: string
}

export interface Contribution {
  memberId: string
  amount: number
}

export interface Collection {
  id: string
  groupId: string
  childName?: string
  title: string
  note?: string
  goal?: number
  suggested?: number
  method: PaymentMethod
  recipient: string
  createdById: string
  contributions: Contribution[]
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
  createdById?: string
  recurrence?: Recurrence
  rsvps?: Record<string, RSVPStatus>
  carpoolOffers?: { memberId: string; seats: number }[]
  carpoolRequests?: string[] // memberIds needing a ride
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
  fromSignup?: { sheetId: string; slotId: string }
  createdById?: string
  recurrence?: Recurrence
}

export interface AppState {
  children: Child[]
  members: Member[]
  groups: Group[]
  messages: ChatMessage[]
  events: EventItem[]
  tasks: Task[]
  signups: SignUpSheet[]
  polls: Poll[]
  collections: Collection[]
  googleConnected: boolean
  venmoConnected: boolean
  whatsappConnected: boolean
  translateTo: string // '' = off, else a language name
  currentUserId: string
}
