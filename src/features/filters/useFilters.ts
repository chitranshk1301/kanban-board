import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { STATUSES, type IssueStatus } from '@/constants/status'

export const BOARD_GROUPS = ['status', 'assignee', 'priority'] as const
export type BoardGroup = (typeof BOARD_GROUPS)[number]

export const LIST_ORDERS = [
  'number',
  'title',
  'status',
  'priority',
  'assignee',
  'updated',
] as const
export type ListOrder = (typeof LIST_ORDERS)[number]

export type Filters = {
  q: string
  status: IssueStatus[]
  priority: number[]
  assignee: string[] // profile ids, or 'none' for unassigned
  labels: string[]
  group: BoardGroup
  order: ListOrder
  dir: 'asc' | 'desc'
}

const DEFAULTS: Pick<Filters, 'group' | 'order' | 'dir'> = {
  group: 'status',
  order: 'updated',
  dir: 'desc',
}

function csv(param: string | null): string[] {
  return param ? param.split(',').filter(Boolean) : []
}

export function parseFilters(params: URLSearchParams): Filters {
  const group = params.get('group')
  const order = params.get('order')
  const dir = params.get('dir')
  return {
    q: params.get('q') ?? '',
    status: csv(params.get('status')).filter((s): s is IssueStatus =>
      (STATUSES as readonly string[]).includes(s),
    ),
    priority: csv(params.get('priority'))
      .map(Number)
      .filter((p) => Number.isInteger(p) && p >= 0 && p <= 4),
    assignee: csv(params.get('assignee')),
    labels: csv(params.get('labels')),
    group: (BOARD_GROUPS as readonly string[]).includes(group ?? '')
      ? (group as BoardGroup)
      : DEFAULTS.group,
    order: (LIST_ORDERS as readonly string[]).includes(order ?? '')
      ? (order as ListOrder)
      : DEFAULTS.order,
    dir: dir === 'asc' ? 'asc' : DEFAULTS.dir,
  }
}

/** JIRA-style filter state, with the URL as the source of truth. */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const isDefault =
            (key === 'group' || key === 'order' || key === 'dir') &&
            value === DEFAULTS[key as 'group' | 'order' | 'dir']
          const serialized = Array.isArray(value)
            ? value.join(',')
            : String(value)
          if (!serialized || isDefault) next.delete(key)
          else next.set(key, serialized)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of ['q', 'status', 'priority', 'assignee', 'labels']) {
          next.delete(key)
        }
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const activeCount =
    (filters.q.trim() ? 1 : 0) +
    (filters.status.length ? 1 : 0) +
    (filters.priority.length ? 1 : 0) +
    (filters.assignee.length ? 1 : 0) +
    (filters.labels.length ? 1 : 0)

  return { filters, setFilter, clearFilters, activeCount }
}
