import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Issue, ProjectRole } from '@/lib/database.types'
import { useAuth } from '@/features/auth/useAuth'

const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 1,
  member: 2,
  manager: 3,
  admin: 4,
}

export type Permissions = {
  role: ProjectRole | null
  isLoading: boolean
  canCreateIssue: boolean
  canComment: boolean
  canManageMembers: boolean
  canEditProject: boolean
  canEditIssue: (issue: Pick<Issue, 'reporter_id' | 'assignee_id'>) => boolean
  canDeleteIssue: (issue: Pick<Issue, 'reporter_id'>) => boolean
}

/**
 * The current user's role in a project, mapped to UI capabilities.
 * This only gates the UI — RLS policies are the actual enforcement.
 */
export function usePermissions(projectId: string): Permissions {
  const { user } = useAuth()

  const { data: role = null, isLoading } = useQuery({
    queryKey: ['membership', projectId, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProjectRole | null> => {
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data?.role ?? null
    },
  })

  const atLeast = (min: ProjectRole) =>
    role !== null && ROLE_RANK[role] >= ROLE_RANK[min]

  return {
    role,
    isLoading,
    canCreateIssue: atLeast('member'),
    canComment: atLeast('member'),
    canManageMembers: atLeast('admin'),
    canEditProject: atLeast('admin'),
    canEditIssue: (issue) =>
      atLeast('manager') ||
      (atLeast('member') &&
        (issue.reporter_id === user?.id || issue.assignee_id === user?.id)),
    canDeleteIssue: (issue) =>
      atLeast('manager') ||
      (atLeast('member') && issue.reporter_id === user?.id),
  }
}
