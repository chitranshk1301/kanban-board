import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProjectRole } from '@/lib/database.types'

export type ProfileLite = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export type MemberWithProfile = {
  project_id: string
  user_id: string
  role: ProjectRole
  created_at: string
  profile: ProfileLite
}

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: async (): Promise<MemberWithProfile[]> => {
      const { data, error } = await supabase
        .from('project_members')
        .select(
          '*, profile:profiles(id, email, full_name, avatar_url)',
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as MemberWithProfile[]
    },
  })
}

export function useAddMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string
      role: ProjectRole
    }) => {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email.trim())
        .maybeSingle()
      if (pErr) throw pErr
      if (!profile) {
        throw new Error(
          'No user with that email — they need to sign up first.',
        )
      }

      const { error } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: profile.id, role })
      if (error) {
        if (error.code === '23505') {
          throw new Error('That user is already a member of this project.')
        }
        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', projectId] })
    },
  })
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string
      role: ProjectRole
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()
      if (error) throw error
      if (data.length === 0) {
        throw new Error('Only project admins can change roles.')
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['membership'] })
    },
  })
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
