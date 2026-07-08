import statusBacklog from '@/assets/icons/status-backlog.svg'
import statusTodo from '@/assets/icons/status-todo.svg'
import statusInProgress from '@/assets/icons/status-in-progress.svg'
import statusDone from '@/assets/icons/status-done.svg'
import statusCancelled from '@/assets/icons/status-cancelled.svg'

export const STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'done',
  'cancelled',
] as const

export type IssueStatus = (typeof STATUSES)[number]

export const STATUS_META: Record<IssueStatus, { label: string; icon: string }> =
  {
    backlog: { label: 'Backlog', icon: statusBacklog },
    todo: { label: 'Todo', icon: statusTodo },
    in_progress: { label: 'In Progress', icon: statusInProgress },
    done: { label: 'Done', icon: statusDone },
    cancelled: { label: 'Cancelled', icon: statusCancelled },
  }
