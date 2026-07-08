import { useMemo } from 'react'
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown'
import { StatusIcon } from '@/components/StatusIcon'
import { PriorityIcon } from '@/components/PriorityIcon'
import { Avatar } from '@/components/Avatar'
import { STATUSES, STATUS_META } from '@/constants/status'
import { PRIORITIES, PRIORITY_META } from '@/constants/priority'
import { useMembers } from '@/features/members/useMembers'
import { useIssues } from '@/features/issues/useIssues'
import { BOARD_GROUPS, useFilters, type BoardGroup } from './useFilters'
import type { IssueStatus } from '@/constants/status'
import styles from './FilterBar.module.css'

const GROUP_LABELS: Record<BoardGroup, string> = {
  status: 'Status',
  assignee: 'Assignee',
  priority: 'Priority',
}

export function FilterBar({
  projectId,
  view,
}: {
  projectId: string
  view: 'board' | 'list'
}) {
  const { filters, setFilter, clearFilters, activeCount } = useFilters()
  const { data: members = [] } = useMembers(projectId)
  const { data: issues = [] } = useIssues(projectId)

  const labelOptions = useMemo(
    () =>
      [...new Set(issues.flatMap((issue) => issue.labels))]
        .sort()
        .map((label) => ({ value: label, label })),
    [issues],
  )

  return (
    <div className={styles.bar}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search issues…"
        value={filters.q}
        onChange={(e) => setFilter('q', e.target.value)}
      />

      <MultiSelectDropdown
        label="Status"
        options={STATUSES.map((status) => ({
          value: status,
          label: STATUS_META[status].label,
          icon: <StatusIcon status={status} size={14} />,
        }))}
        selected={filters.status}
        onChange={(selected) => setFilter('status', selected as IssueStatus[])}
      />

      <MultiSelectDropdown
        label="Priority"
        options={PRIORITIES.map((priority) => ({
          value: String(priority),
          label: PRIORITY_META[priority].label,
          icon: <PriorityIcon priority={priority} size={14} />,
        }))}
        selected={filters.priority.map(String)}
        onChange={(selected) => setFilter('priority', selected.map(Number))}
      />

      <MultiSelectDropdown
        label="Assignee"
        options={[
          { value: 'none', label: 'Unassigned' },
          ...members.map((member) => ({
            value: member.user_id,
            label: member.profile.full_name ?? member.profile.email,
            icon: (
              <Avatar
                id={member.user_id}
                name={member.profile.full_name}
                email={member.profile.email}
                size={16}
              />
            ),
          })),
        ]}
        selected={filters.assignee}
        onChange={(selected) => setFilter('assignee', selected)}
      />

      <MultiSelectDropdown
        label="Labels"
        options={labelOptions}
        selected={filters.labels}
        onChange={(selected) => setFilter('labels', selected)}
      />

      {activeCount > 0 && (
        <button type="button" className={styles.clear} onClick={clearFilters}>
          Clear filters ({activeCount})
        </button>
      )}

      <div className={styles.spacer} />

      {view === 'board' && (
        <label className={styles.groupBy}>
          <span>Group by</span>
          <select
            value={filters.group}
            onChange={(e) => setFilter('group', e.target.value as BoardGroup)}
          >
            {BOARD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {GROUP_LABELS[group]}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
