import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import addIcon from '@/assets/icons/add.svg'
import type { IssueStatus } from '@/constants/status'
import type { IssueWithProfiles } from '@/features/issues/types'
import { IssueCard, SortableIssueCard } from './IssueCard'
import styles from './BoardColumn.module.css'

export type Column = {
  id: string
  title: string
  icon?: ReactNode
  /** Set only when grouping by status — enables drag-and-drop. */
  status?: IssueStatus
  issues: IssueWithProfiles[]
}

type BoardColumnProps = {
  column: Column
  projectKey: string
  dndEnabled: boolean
  canDrag: (issue: IssueWithProfiles) => boolean
  canCreate: boolean
  onCardClick: (issue: IssueWithProfiles) => void
  onAddIssue: (status: IssueStatus) => void
}

export function BoardColumn({
  column,
  projectKey,
  dndEnabled,
  canDrag,
  canCreate,
  onCardClick,
  onAddIssue,
}: BoardColumnProps) {
  const droppable = dndEnabled && !!column.status
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.status ?? column.id}`,
    disabled: !droppable,
  })

  const cards = column.issues.map((issue) =>
    droppable ? (
      <SortableIssueCard
        key={issue.id}
        issue={issue}
        projectKey={projectKey}
        disabled={!canDrag(issue)}
        onClick={() => onCardClick(issue)}
      />
    ) : (
      <IssueCard
        key={issue.id}
        issue={issue}
        projectKey={projectKey}
        onClick={() => onCardClick(issue)}
      />
    ),
  )

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        {column.icon}
        <span className={styles.title}>{column.title}</span>
        <span className={styles.count}>{column.issues.length}</span>
        {canCreate && column.status && (
          <button
            type="button"
            className={styles.add}
            title={`Add issue to ${column.title}`}
            onClick={() => onAddIssue(column.status!)}
          >
            <img src={addIcon} alt="Add" width={14} height={14} />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`${styles.cards} ${isOver ? styles.over : ''}`}
      >
        {droppable ? (
          <SortableContext
            items={column.issues.map((issue) => issue.id)}
            strategy={verticalListSortingStrategy}
          >
            {cards}
          </SortableContext>
        ) : (
          cards
        )}
        {column.issues.length === 0 && (
          <div className={styles.empty}>No issues</div>
        )}
      </div>
    </div>
  )
}
