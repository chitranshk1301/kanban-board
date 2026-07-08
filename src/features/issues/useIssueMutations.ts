import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { IssueWithProfiles } from './types'

type IssueInsert = Database['public']['Tables']['issues']['Insert']
type IssueUpdate = Database['public']['Tables']['issues']['Update']

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<IssueInsert, 'project_id'>) => {
      const { data, error } = await supabase
        .from('issues')
        .insert({ ...input, project_id: projectId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })
}

/**
 * Patches an issue with an optimistic cache update (used for both DnD
 * moves and panel edits). If RLS blocks the update, Supabase returns
 * zero rows — we surface that as an error and roll the cache back.
 */
export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['issues', projectId]

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: IssueUpdate }) => {
      const { data, error } = await supabase
        .from('issues')
        .update(patch)
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw error
      if (!data) {
        throw new Error("You don't have permission to edit this issue.")
      }
      return data
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<IssueWithProfiles[]>(queryKey)
      queryClient.setQueryData<IssueWithProfiles[]>(queryKey, (old) =>
        old?.map((issue) =>
          issue.id === id ? { ...issue, ...patch } : issue,
        ),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id)
        .select()
      if (error) throw error
      if (data.length === 0) {
        throw new Error("You don't have permission to delete this issue.")
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })
}

/** Repairs a column whose float positions have degenerated. */
export function useNormalizePositions(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      status: Database['public']['Enums']['issue_status'],
    ) => {
      const { error } = await supabase.rpc('normalize_column_positions', {
        p_project: projectId,
        p_status: status,
      })
      if (error) throw error
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })
}
