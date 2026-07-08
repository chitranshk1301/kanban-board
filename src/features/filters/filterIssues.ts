import { STATUSES } from '@/constants/status'
import type { IssueWithProfiles } from '@/features/issues/types'
import type { Filters, ListOrder } from './useFilters'

export function filterIssues(
  issues: IssueWithProfiles[],
  filters: Filters,
): IssueWithProfiles[] {
  const q = filters.q.trim().toLowerCase()

  return issues.filter((issue) => {
    if (filters.status.length && !filters.status.includes(issue.status)) {
      return false
    }
    if (filters.priority.length && !filters.priority.includes(issue.priority)) {
      return false
    }
    if (
      filters.assignee.length &&
      !filters.assignee.includes(issue.assignee_id ?? 'none')
    ) {
      return false
    }
    if (
      filters.labels.length &&
      !filters.labels.some((label) => issue.labels.includes(label))
    ) {
      return false
    }
    if (q) {
      const haystack =
        `${issue.title} ${issue.labels.join(' ')} ${issue.number}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

function assigneeName(issue: IssueWithProfiles): string {
  return issue.assignee
    ? (issue.assignee.full_name ?? issue.assignee.email)
    : '￿' // unassigned sorts last
}

const COMPARATORS: Record<
  ListOrder,
  (a: IssueWithProfiles, b: IssueWithProfiles) => number
> = {
  number: (a, b) => a.number - b.number,
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  status: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status),
  priority: (a, b) => a.priority - b.priority,
  assignee: (a, b) => assigneeName(a).localeCompare(assigneeName(b)),
  updated: (a, b) =>
    new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
}

export function sortIssues(
  issues: IssueWithProfiles[],
  order: ListOrder,
  dir: 'asc' | 'desc',
): IssueWithProfiles[] {
  const compare = COMPARATORS[order]
  const sign = dir === 'asc' ? 1 : -1
  return [...issues].sort((a, b) => sign * compare(a, b))
}
