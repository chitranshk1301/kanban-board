// Hand-written to match supabase/migrations. Regenerate anytime with:
//   npm run gen:types   (requires `supabase link`)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          key: string
          description: string
          created_by: string
          next_issue_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          key: string
          description?: string
          created_by?: string
          next_issue_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          key?: string
          description?: string
          created_by?: string
          next_issue_number?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      project_members: {
        Row: {
          project_id: string
          user_id: string
          role: Database['public']['Enums']['project_role']
          created_at: string
        }
        Insert: {
          project_id: string
          user_id: string
          role?: Database['public']['Enums']['project_role']
          created_at?: string
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: Database['public']['Enums']['project_role']
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      issues: {
        Row: {
          id: string
          project_id: string
          number: number
          title: string
          description: string
          status: Database['public']['Enums']['issue_status']
          priority: number
          assignee_id: string | null
          reporter_id: string
          labels: string[]
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          number?: number
          title: string
          description?: string
          status?: Database['public']['Enums']['issue_status']
          priority?: number
          assignee_id?: string | null
          reporter_id?: string
          labels?: string[]
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          number?: number
          title?: string
          description?: string
          status?: Database['public']['Enums']['issue_status']
          priority?: number
          assignee_id?: string | null
          reporter_id?: string
          labels?: string[]
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'issues_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          id: string
          issue_id: string
          project_id: string
          author_id: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          project_id?: string
          author_id?: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          issue_id?: string
          project_id?: string
          author_id?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_issue_id_fkey'
            columns: ['issue_id']
            isOneToOne: false
            referencedRelation: 'issues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      has_project_role: {
        Args: {
          p_project: string
          min_role: Database['public']['Enums']['project_role']
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { p_project: string }
        Returns: boolean
      }
      normalize_column_positions: {
        Args: {
          p_project: string
          p_status: Database['public']['Enums']['issue_status']
        }
        Returns: undefined
      }
    }
    Enums: {
      project_role: 'viewer' | 'member' | 'manager' | 'admin'
      issue_status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type ProjectMember = Tables<'project_members'>
export type Issue = Tables<'issues'>
export type Comment = Tables<'comments'>
export type ProjectRole = Enums<'project_role'>
