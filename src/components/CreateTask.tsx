import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useStore } from '../store/store'
import { useToast } from './Toast'
import { myGroups } from '../lib/selectors'
import { groupStyles } from '../lib/ui'
import type { Priority } from '../types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-canvas/60 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-violet focus:bg-white'
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40'

export default function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const groups = myGroups(state)

  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState('')
  const [childId, setChildId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [priority, setPriority] = useState<Priority>('medium')

  useEffect(() => {
    if (open) {
      setTitle('')
      setGroupId('')
      setChildId('')
      setDate('')
      setTime('09:00')
      setPriority('medium')
    }
  }, [open])

  const group = groups.find((g) => g.id === groupId)
  // Offer the whole family, or narrow to the chosen group's kids.
  const kidOptions = group ? group.childIds : state.children.map((c) => c.id)

  const submit = () => {
    if (!title.trim()) return
    dispatch({
      type: 'ADD_TASK',
      task: {
        groupId: groupId || undefined,
        childId: childId || undefined,
        title: title.trim(),
        dueDate: date ? new Date(`${date}T${time || '09:00'}`).toISOString() : undefined,
        done: false,
        priority,
        assigneeIds: [state.currentUserId],
        createdById: state.currentUserId,
      },
    })
    toast('Task added', '✅')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>What needs doing?</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Buy cleats before Saturday"
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls}>Attach to a group?</label>
          <select
            className={inputCls}
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value)
              setChildId('')
            }}
          >
            <option value="">Just me (personal)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>For which kid? (optional)</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChildId('')}
              className={`chip ${childId === '' ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}
            >
              None
            </button>
            {kidOptions.map((cid) => {
              const child = state.children.find((c) => c.id === cid)
              if (!child) return null
              return (
                <button
                  key={cid}
                  onClick={() => setChildId(cid)}
                  className="chip"
                  style={childId === cid ? groupStyles.solid(child.color) : groupStyles.soft(child.color)}
                >
                  {child.emoji} {child.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Due date (optional)</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Priority</label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`chip flex-1 justify-center capitalize ${
                  priority === p ? 'bg-ink text-white' : 'bg-canvas text-ink/55'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-canvas py-3 text-sm font-bold text-ink/55 transition hover:bg-black/[0.05]"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="flex-1 rounded-2xl bg-violet py-3 text-sm font-bold text-white shadow-soft transition hover:bg-violet/90 disabled:opacity-40"
        >
          Add task
        </button>
      </div>
    </Modal>
  )
}
