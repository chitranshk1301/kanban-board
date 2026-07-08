import { Avatar } from '@/components/Avatar'
import { LabelChip } from '@/components/LabelChip'
import { PriorityIcon } from '@/components/PriorityIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { PRIORITY_META, type IssuePriority } from '@/constants/priority'
import { STATUS_META } from '@/constants/status'
import type { ListOrder } from '@/features/filters/useFilters'
import type { IssueWithProfiles } from '@/features/issues/types'
import styles from './IssueTable.module.css'

const COLUMNS: { key: ListOrder; label: string }[] = [
  { key: 'number', label: 'Key' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'updated', label: 'Updated' },
]

type IssueTableProps = {
  issues: IssueWithProfiles[]
  projectKey: string
  order: ListOrder
  dir: 'asc' | 'desc'
  onSort: (column: ListOrder) => void
  onRowClick: (issue: IssueWithProfiles) => void
}

export function IssueTable({
  issues,
  projectKey,
  order,
  dir,
  onSort,
  onRowClick,
}: IssueTableProps) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key}>
                <button
                  type="button"
                  className={`${styles.sortButton} ${
                    order === column.key ? styles.sorted : ''
                  }`}
                  onClick={() => onSort(column.key)}
                >
                  {column.label}
                  {order === column.key && (
                    <span className={styles.dir}>
                      {dir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
            ))}
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} onClick={() => onRowClick(issue)}>
              <td className={styles.key}>
                {projectKey}-{issue.number}
              </td>
              <td className={styles.title}>{issue.title}</td>
              <td>
                <span className={styles.cellWithIcon}>
                  <StatusIcon status={issue.status} size={14} />
                  {STATUS_META[issue.status].label}
                </span>
              </td>
              <td>
                <span className={styles.cellWithIcon}>
                  <PriorityIcon priority={issue.priority} size={14} />
                  {PRIORITY_META[issue.priority as IssuePriority]?.label}
                </span>
              </td>
              <td>
                {issue.assignee ? (
                  <span className={styles.cellWithIcon}>
                    <Avatar
                      id={issue.assignee.id}
                      name={issue.assignee.full_name}
                      email={issue.assignee.email}
                      size={18}
                    />
                    {issue.assignee.full_name ?? issue.assignee.email}
                  </span>
                ) : (
                  <span className={styles.muted}>Unassigned</span>
                )}
              </td>
              <td className={styles.muted}>
                {new Date(issue.updated_at).toLocaleDateString()}
              </td>
              <td>
                <span className={styles.labels}>
                  {issue.labels.map((label) => (
                    <LabelChip key={label} label={label} />
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {issues.length === 0 && (
        <div className={styles.empty}>No issues match the current filters.</div>
      )}
    </div>
  )
}
