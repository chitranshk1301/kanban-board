import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectRole } from '@/lib/database.types'
import { useAuth } from '@/features/auth/useAuth'

export type ProjectWithRole = Project & { role: ProjectRole }

/** All projects the current user is a member of, with their role in each. */
export function useProjects() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['projects'],
    enabled: !!user,
    queryFn: async (): Promise<ProjectWithRole[]> => {
      const { data: memberships, error: mErr } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', user!.id)
      if (mErr) throw mErr
      if (memberships.length === 0) return []

      const roleByProject = new Map(
        memberships.map((m) => [m.project_id, m.role]),
      )
      const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .in('id', [...roleByProject.keys()])
        .order('created_at', { ascending: true })
      if (pErr) throw pErr

      return projects.map((p) => ({ ...p, role: roleByProject.get(p.id)! }))
    },
  })
}

/** A single project by id (returns null when it doesn't exist / no access). */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      key: string
      description?: string
    }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: { name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', projectId)
        .select()
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Only project admins can edit the project.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
