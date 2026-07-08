import { PRIORITY_META, type IssuePriority } from '@/constants/priority'

export function PriorityIcon({
  priority,
  size = 16,
}: {
  priority: number
  size?: number
}) {
  const meta = PRIORITY_META[priority as IssuePriority] ?? PRIORITY_META[0]
  return (
    <img
      src={meta.icon}
      alt={meta.label}
      title={meta.label}
      width={size}
      height={size}
    />
  )
}
