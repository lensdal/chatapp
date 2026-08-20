export type ColorKey = 'violet' | 'sky' | 'blush' | 'sun' | 'tang' | 'mint'

export type Priority = 'high' | 'medium' | 'low'

export type PaymentMethod = 'venmo' | 'cashapp' | 'zelle' | 'other'

// A creator's payment usernames/handles, keyed by method.
export type PaymentHandles = Partial<Record<PaymentMethod, string>>

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
  handles?: PaymentHandles
  avatarImage?: string // data URL when the member uploaded a photo
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
  color: string // hex color chosen from the wheel
  emoji: string
  image?: string // data URL when the creator uploaded a photo icon
  childIds: string[]
  members: GroupMember[]
  joinCode: string
  announcementsOnly: boolean // roles toggle: only admins can post to everyone
  description?: string
  joinPrivacy?: 'open' | 'approval' // open link vs admin approval for new members
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
  linkedSignatureId?: string
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
  amount?: number // optional cost, e.g. a uniform choice you can collect for
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
  acceptedMethods: PaymentMethod[]
  handles: PaymentHandles
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
  methods: PaymentMethod[]
  handles: PaymentHandles
  paid: boolean
}

export interface Task {
  id: string
  groupId?: string // optional — personal tasks aren't tied to a group
  childId?: string
  title: string
  dueDate?: string // ISO
  done: boolean
  priority: Priority
  assigneeIds: string[]
  payment?: Payment
  createdFromMessageId?: string
  fromSignup?: { sheetId: string; slotId: string }
  fromSignature?: { docId: string }
  createdById?: string
  recurrence?: Recurrence
}

// A document sent out to collect signatures (e.g. a permission slip).
export interface Signature {
  memberId: string
  dataUrl: string // the drawn/typed signature image
  name?: string
  signedAt: string
}

export interface SignatureDoc {
  id: string
  groupId?: string
  childId?: string
  title: string
  fileName: string
  fileKind: 'pdf' | 'image' | 'doc' | 'sheet'
  fileDataUrl?: string
  note?: string
  dueDate?: string
  requestedById: string
  createdAt: string
  signatures: Signature[]
}

export interface ForwardItem {
  id: string
  text: string
  source: 'whatsapp' | 'sms' | 'email'
  at: string // ISO
  handled?: boolean
}

export interface AppState {
  children: Child[]
  members: Member[]
  groups: Group[]
  forwards: ForwardItem[]
  messages: ChatMessage[]
  events: EventItem[]
  tasks: Task[]
  signups: SignUpSheet[]
  polls: Poll[]
  collections: Collection[]
  signatureDocs: SignatureDoc[]
  googleConnected: boolean
  venmoConnected: boolean
  whatsappConnected: boolean
  translateTo: string // '' = off, else a language name
  // Current user's own notification prefs, per group (defaults to on).
  notify: Record<string, { reminders: boolean; digest: boolean }>
  currentUserId: string
}
