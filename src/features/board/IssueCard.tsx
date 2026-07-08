import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '@/components/Avatar'
import { LabelChip } from '@/components/LabelChip'
import { PriorityIcon } from '@/components/PriorityIcon'
import type { IssueWithProfiles } from '@/features/issues/types'
import styles from './IssueCard.module.css'

type IssueCardProps = {
  issue: IssueWithProfiles
  projectKey: string
  onClick?: () => void
  isOverlay?: boolean
}

export function IssueCard({
  issue,
  projectKey,
  onClick,
  isOverlay,
}: IssueCardProps) {
  return (
    <div
      className={`${styles.card} ${isOverlay ? styles.overlay : ''}`}
      onClick={onClick}
    >
      <div className={styles.top}>
        <span className={styles.key}>
          {projectKey}-{issue.number}
        </span>
        {issue.assignee && (
          <Avatar
            id={issue.assignee.id}
            name={issue.assignee.full_name}
            email={issue.assignee.email}
            size={22}
          />
        )}
      </div>
      <p className={styles.title}>{issue.title}</p>
      <div className={styles.bottom}>
        <span className={styles.iconBox}>
          <PriorityIcon priority={issue.priority} size={14} />
        </span>
        {issue.labels.map((label) => (
          <LabelChip key={label} label={label} />
        ))}
      </div>
    </div>
  )
}

export function SortableIssueCard({
  issue,
  projectKey,
  disabled,
  onClick,
}: IssueCardProps & { disabled: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, disabled })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <IssueCard issue={issue} projectKey={projectKey} onClick={onClick} />
    </div>
  )
}
