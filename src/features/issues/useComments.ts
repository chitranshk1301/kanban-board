import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/lib/database.types'
import type { ProfileLite } from '@/features/members/useMembers'

export type CommentWithAuthor = Comment & { author: ProfileLite | null }

export function useComments(issueId: string | null) {
  return useQuery({
    queryKey: ['comments', issueId],
    enabled: !!issueId,
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(id, email, full_name, avatar_url)')
        .eq('issue_id', issueId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as CommentWithAuthor[]
    },
  })
}

export function useAddComment(issueId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from('comments')
        .insert({ issue_id: issueId, body })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', issueId] })
    },
  })
}

export function useDeleteComment(issueId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .select()
      if (error) throw error
      if (data.length === 0) {
        throw new Error("You don't have permission to delete this comment.")
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', issueId] })
    },
  })
}
