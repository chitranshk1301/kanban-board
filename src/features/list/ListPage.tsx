import { useMemo } from 'react'
import { filterIssues, sortIssues } from '@/features/filters/filterIssues'
import { useFilters, type ListOrder } from '@/features/filters/useFilters'
import { useIssuePanel } from '@/features/issues/useIssuePanel'
import { useIssues } from '@/features/issues/useIssues'
import { useProjectContext } from '@/features/projects/ProjectLayout'
import { IssueTable } from './IssueTable'
import styles from './ListPage.module.css'

export function ListPage() {
  const { project } = useProjectContext()
  const { data: issues = [], isLoading, error } = useIssues(project.id)
  const { filters, setFilter } = useFilters()
  const { openIssue } = useIssuePanel()

  const visible = useMemo(
    () => sortIssues(filterIssues(issues, filters), filters.order, filters.dir),
    [issues, filters],
  )

  function handleSort(column: ListOrder) {
    if (filters.order === column) {
      setFilter('dir', filters.dir === 'asc' ? 'desc' : 'asc')
    } else {
      setFilter('order', column)
      setFilter('dir', 'asc')
    }
  }

  if (isLoading) {
    return <div className={styles.state}>Loading issues…</div>
  }
  if (error) {
    return (
      <div className={styles.stateError}>
        Failed to load issues: {error.message}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <IssueTable
        issues={visible}
        projectKey={project.key}
        order={filters.order}
        dir={filters.dir}
        onSort={handleSort}
        onRowClick={(issue) => openIssue(issue.number)}
      />
    </div>
  )
}
