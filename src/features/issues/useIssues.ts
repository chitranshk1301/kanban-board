import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { IssueWithProfiles } from './types'

const ISSUE_SELECT =
  '*, assignee:profiles!issues_assignee_id_fkey(id, email, full_name, avatar_url), reporter:profiles!issues_reporter_id_fkey(id, email, full_name, avatar_url)'

/** All issues of a project (shared cache for board + list views). */
export function useIssues(projectId: string) {
  return useQuery({
    queryKey: ['issues', projectId],
    queryFn: async (): Promise<IssueWithProfiles[]> => {
      const { data, error } = await supabase
        .from('issues')
        .select(ISSUE_SELECT)
        .eq('project_id', projectId)
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as IssueWithProfiles[]
    },
  })
}
