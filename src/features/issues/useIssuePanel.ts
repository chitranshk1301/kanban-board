import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/** The issue side panel is driven by the ?issue=<number> search param. */
export function useIssuePanel() {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get('issue')
  const issueNumber = raw && /^\d+$/.test(raw) ? Number(raw) : null

  const openIssue = useCallback(
    (number: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('issue', String(number))
        return next
      })
    },
    [setSearchParams],
  )

  const closeIssue = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('issue')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  return { issueNumber, openIssue, closeIssue }
}
