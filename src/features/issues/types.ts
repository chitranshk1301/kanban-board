import type { Issue } from '@/lib/database.types'
import type { ProfileLite } from '@/features/members/useMembers'

export type IssueWithProfiles = Issue & {
  assignee: ProfileLite | null
  reporter: ProfileLite | null
}
