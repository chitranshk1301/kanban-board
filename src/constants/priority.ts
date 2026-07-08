import priorityNone from '@/assets/icons/priority-none.svg'
import priorityLow from '@/assets/icons/priority-low.svg'
import priorityMedium from '@/assets/icons/priority-medium.svg'
import priorityHigh from '@/assets/icons/priority-high.svg'
import priorityUrgent from '@/assets/icons/priority-urgent.svg'

/** Display order: Urgent first, like JIRA. */
export const PRIORITIES = [4, 3, 2, 1, 0] as const

export type IssuePriority = (typeof PRIORITIES)[number]

export const PRIORITY_META: Record<
  IssuePriority,
  { label: string; icon: string }
> = {
  0: { label: 'No priority', icon: priorityNone },
  1: { label: 'Low', icon: priorityLow },
  2: { label: 'Medium', icon: priorityMedium },
  3: { label: 'High', icon: priorityHigh },
  4: { label: 'Urgent', icon: priorityUrgent },
}
