import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Avatar } from '@/components/Avatar'
import { PriorityIcon } from '@/components/PriorityIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { PRIORITIES, PRIORITY_META } from '@/constants/priority'
import { STATUSES, STATUS_META, type IssueStatus } from '@/constants/status'
import { filterIssues } from '@/features/filters/filterIssues'
import { useFilters } from '@/features/filters/useFilters'
import { CreateIssueDialog } from '@/features/issues/CreateIssueDialog'
import { gapExhausted, positionBetween } from '@/features/issues/position'
import type { IssueWithProfiles } from '@/features/issues/types'
import { useIssuePanel } from '@/features/issues/useIssuePanel'
import { useIssues } from '@/features/issues/useIssues'
import {
  useNormalizePositions,
  useUpdateIssue,
} from '@/features/issues/useIssueMutations'
import { useMembers } from '@/features/members/useMembers'
import { useProjectContext } from '@/features/projects/ProjectLayout'
import { BoardColumn, type Column } from './BoardColumn'
import { IssueCard } from './IssueCard'
import styles from './BoardPage.module.css'

export function BoardPage() {
  const { project, permissions } = useProjectContext()
  const { data: issues = [], isLoading, error } = useIssues(project.id)
  const { data: members = [] } = useMembers(project.id)
  const { filters } = useFilters()
  const { openIssue } = useIssuePanel()
  const updateIssue = useUpdateIssue(project.id)
  const normalize = useNormalizePositions(project.id)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [dndError, setDndError] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<IssueStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const visible = useMemo(
    () => filterIssues(issues, filters),
    [issues, filters],
  )

  const columns = useMemo<Column[]>(() => {
    const sorted = [...visible].sort((a, b) => a.position - b.position)

    if (filters.group === 'status') {
      return STATUSES.map((status) => ({
        id: status,
        title: STATUS_META[status].label,
        icon: <StatusIcon status={status} size={16} />,
        status,
        issues: sorted.filter((issue) => issue.status === status),
      }))
    }

    if (filters.group === 'priority') {
      return PRIORITIES.map((priority) => ({
        id: `priority-${priority}`,
        title: PRIORITY_META[priority].label,
        icon: <PriorityIcon priority={priority} size={16} />,
        issues: sorted.filter((issue) => issue.priority === priority),
      }))
    }

    const memberIds = new Set(members.map((member) => member.user_id))
    return [
      {
        id: 'unassigned',
        title: 'Unassigned',
        issues: sorted.filter(
          (issue) => !issue.assignee_id || !memberIds.has(issue.assignee_id),
        ),
      },
      ...members.map((member) => ({
        id: member.user_id,
        title: member.profile.full_name ?? member.profile.email,
        icon: (
          <Avatar
            id={member.user_id}
            name={member.profile.full_name}
            email={member.profile.email}
            size={18}
          />
        ),
        issues: sorted.filter((issue) => issue.assignee_id === member.user_id),
      })),
    ]
  }, [visible, filters.group, members])

  const dndEnabled = filters.group === 'status'
  const activeIssue = activeId
    ? (issues.find((issue) => issue.id === activeId) ?? null)
    : null

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    if (!dndEnabled) return

    const { active, over } = event
    if (!over || active.id === over.id) return
    const issue = issues.find((i) => i.id === active.id)
    if (!issue) return

    let targetStatus: IssueStatus
    let overIssue: IssueWithProfiles | undefined
    const overId = String(over.id)

    if (overId.startsWith('column:')) {
      targetStatus = overId.slice('column:'.length) as IssueStatus
    } else {
      overIssue = issues.find((i) => i.id === overId)
      if (!overIssue) return
      targetStatus = overIssue.status
    }

    // Neighbours are computed against the *visible* target column,
    // excluding the dragged issue itself.
    const column = visible
      .filter((i) => i.status === targetStatus && i.id !== issue.id)
      .sort((a, b) => a.position - b.position)

    let before: number | undefined
    let after: number | undefined

    if (!overIssue) {
      // Dropped on the column itself → append to the end.
      before = column[column.length - 1]?.position
    } else {
      const j = column.findIndex((i) => i.id === overIssue.id)
      if (j === -1) return
      const movingDown =
        issue.status === targetStatus && issue.position < overIssue.position
      if (movingDown) {
        before = column[j].position
        after = column[j + 1]?.position
      } else {
        before = column[j - 1]?.position
        after = column[j].position
      }
    }

    if (gapExhausted(before, after)) {
      // Float precision ran out in this gap — rebuild the column's
      // positions; the user can simply drag again.
      normalize.mutate(targetStatus)
      return
    }

    const position = positionBetween(before, after)
    if (issue.status === targetStatus && position === issue.position) return

    setDndError(null)
    updateIssue.mutate(
      { id: issue.id, patch: { status: targetStatus, position } },
      { onError: (err) => setDndError(err.message) },
    )
  }

  if (isLoading) {
    return <div className={styles.state}>Loading board…</div>
  }
  if (error) {
    return (
      <div className={styles.stateError}>
        Failed to load issues: {error.message}
      </div>
    )
  }

  return (
    <>
      {dndError && (
        <div className={styles.errorBanner}>
          {dndError}
          <button type="button" onClick={() => setDndError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              projectKey={project.key}
              dndEnabled={dndEnabled}
              canDrag={(issue) => permissions.canEditIssue(issue)}
              canCreate={permissions.canCreateIssue}
              onCardClick={(issue) => openIssue(issue.number)}
              onAddIssue={(status) => setCreateStatus(status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue ? (
            <IssueCard
              issue={activeIssue}
              projectKey={project.key}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {createStatus && (
        <CreateIssueDialog
          project={project}
          initialStatus={createStatus}
          onClose={() => setCreateStatus(null)}
        />
      )}
    </>
  )
}
