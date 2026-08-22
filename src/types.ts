export type ColorKey = 'violet' | 'sky' | 'blush' | 'sun' | 'tang' | 'mint'

export type Priority = 'high' | 'medium' | 'low'

export type PaymentMethod = 'venmo' | 'cashapp' | 'zelle' | 'village' | 'other'

// A creator's payment usernames/handles, keyed by method.
export type PaymentHandles = Partial<Record<PaymentMethod, string>>

export type GroupRole = 'admin' | 'member'

// Google-Calendar-style recurrence. `freq: 'none'` (or an absent value) means
// it does not repeat.
export type RepeatFreq = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurrence {
  freq: RepeatFreq
  interval: number // every N days/weeks/months/years
  weekdays?: number[] // for weekly: 0 (Sun) – 6 (Sat)
  until?: string // ISO date the repeat ends (optional)
  count?: number // or stop after N occurrences (optional)
}

export type RSVPStatus = 'going' | 'maybe' | 'no'

// An RSVP can carry a headcount (adults / children) and optional names, so
// "we're coming — 2 adults and 3 kids (the Ortiz family)" is expressible.
export interface RSVPEntry {
  status: RSVPStatus
  adults?: number
  children?: number
  names?: string
}

// A file attached to a message, task, event, or reminder.
export interface FileAttachment {
  name: string
  kind: 'pdf' | 'image' | 'doc' | 'sheet'
  dataUrl?: string
}

export interface Child {
  id: string
  name: string
  color: string // hex color
  emoji: string
}

export interface Member {
  id: string
  name: string
  role: string // global default role/label
  emoji: string
  color: string // hex color
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
  linkedReminderId?: string
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
  hasTime?: boolean // false/undefined = all-day (time is optional)
  mode?: 'inperson' | 'virtual' | 'phone' | 'hybrid' // how you attend; default in person
  location?: string // free-text address; links out to maps (in person / hybrid)
  meetingUrl?: string // join link (virtual / hybrid)
  callInfo?: string // dial-in number / access code (phone)
  note?: string
  addedToGoogle: boolean
  createdFromMessageId?: string
  createdById?: string
  recurrence?: Recurrence
  // Whether the organizer wants a headcount (adults/kids & names) with each RSVP.
  collectHeadcount?: boolean
  rsvps?: Record<string, RSVPEntry>
  carpoolOffers?: CarpoolOffer[]
  carpoolRequests?: CarpoolRequest[]
  attachment?: FileAttachment
}

export type RideDirection = 'there' | 'back' | 'both'

// A driver offering seats. Riders claim a seat, so the car fills up.
export interface CarpoolOffer {
  memberId: string
  seats: number
  riders: string[] // memberIds who claimed a seat
  direction: RideDirection
  pickup?: string // pickup spot / notes
}

export interface CarpoolRequest {
  memberId: string
  direction: RideDirection
  note?: string
}

// A lightweight heads-up — "No school", "No practice" — not a to-do or an
// event with RSVPs. Just a title, an optional note, and a day.
export interface Reminder {
  id: string
  groupId?: string
  childId?: string
  title: string
  note?: string
  date: string // ISO
  hasTime?: boolean
  recurrence?: Recurrence
  createdById?: string
  attachment?: FileAttachment
}

export interface Payment {
  amount: number
  recipient: string // display name of who's collecting (or "the group")
  recipientId?: string // member id, when the collector is a group member
  methods: PaymentMethod[] // every accepted way to pay (may include 'village')
  handles: PaymentHandles
  paid: boolean
}

export interface Task {
  id: string
  groupId?: string // optional — personal tasks aren't tied to a group
  childId?: string
  title: string
  dueDate?: string // ISO
  hasTime?: boolean // false/undefined = no specific time (time is optional)
  note?: string
  done: boolean
  priority: Priority
  assigneeIds: string[]
  payment?: Payment
  attachment?: FileAttachment
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
  reminders: Reminder[]
  tasks: Task[]
  signups: SignUpSheet[]
  polls: Poll[]
  collections: Collection[]
  signatureDocs: SignatureDoc[]
  googleConnected: boolean
  venmoConnected: boolean
  whatsappConnected: boolean
  // Whether the current user has enabled paying & collecting through Village.
  villagePayEnabled: boolean
  translateTo: string // '' = off, else a language name
  // Current user's own notification prefs, per group (defaults to on).
  notify: Record<string, { reminders: boolean; digest: boolean }>
  currentUserId: string
}
