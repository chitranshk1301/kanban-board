import { STATUS_META, type IssueStatus } from '@/constants/status'

export function StatusIcon({
  status,
  size = 16,
}: {
  status: IssueStatus
  size?: number
}) {
  const meta = STATUS_META[status]
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
