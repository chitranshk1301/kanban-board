import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '@/components/Avatar'
import type { Project, ProjectRole } from '@/lib/database.types'
import { useAuth } from '@/features/auth/useAuth'
import type { Permissions } from './usePermissions'
import {
  useAddMember,
  useMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from './useMembers'
import styles from './MembersTab.module.css'

const ROLES: ProjectRole[] = ['viewer', 'member', 'manager', 'admin']

const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  viewer: 'Read-only access',
  member: 'Create issues, edit own issues, comment',
  manager: 'Edit and delete any issue',
  admin: 'Manage members, roles and the project',
}

export function MembersTab({
  project,
  permissions,
}: {
  project: Project
  permissions: Permissions
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: members = [], isLoading } = useMembers(project.id)
  const addMember = useAddMember(project.id)
  const updateRole = useUpdateMemberRole(project.id)
  const removeMember = useRemoveMember(project.id)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')
  const [error, setError] = useState<string | null>(null)

  const adminCount = members.filter((m) => m.role === 'admin').length

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    addMember.mutate(
      { email, role },
      {
        onSuccess: () => setEmail(''),
        onError: (err) => setError(err.message),
      },
    )
  }

  function handleRemove(userId: string, isSelf: boolean) {
    const message = isSelf
      ? 'Leave this project? You will lose access to it.'
      : 'Remove this member from the project?'
    if (!window.confirm(message)) return
    setError(null)
    removeMember.mutate(userId, {
      onSuccess: () => {
        if (isSelf) void navigate('/projects')
      },
      onError: (err) => setError(err.message),
    })
  }

  return (
    <div className={styles.tab}>
      {permissions.canManageMembers && (
        <form className={styles.addForm} onSubmit={handleAdd}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={styles.addButton}
            disabled={addMember.isPending}
          >
            {addMember.isPending ? 'Adding…' : 'Add member'}
          </button>
        </form>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p className={styles.muted}>Loading members…</p>}

      <ul className={styles.list}>
        {members.map((member) => {
          const isSelf = member.user_id === user?.id
          const isLastAdmin = member.role === 'admin' && adminCount === 1
          return (
            <li key={member.user_id} className={styles.row}>
              <Avatar
                id={member.user_id}
                name={member.profile.full_name}
                email={member.profile.email}
                size={32}
              />
              <div className={styles.identity}>
                <span className={styles.name}>
                  {member.profile.full_name ?? member.profile.email}
                  {isSelf && <span className={styles.you}> (you)</span>}
                </span>
                <span className={styles.emailText}>
                  {member.profile.email}
                </span>
              </div>

              {permissions.canManageMembers ? (
                <select
                  className={styles.roleSelect}
                  value={member.role}
                  disabled={isLastAdmin}
                  title={
                    isLastAdmin
                      ? 'A project must keep at least one admin'
                      : undefined
                  }
                  onChange={(e) => {
                    setError(null)
                    updateRole.mutate(
                      {
                        userId: member.user_id,
                        role: e.target.value as ProjectRole,
                      },
                      { onError: (err) => setError(err.message) },
                    )
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={styles.roleBadge}>{member.role}</span>
              )}

              {(permissions.canManageMembers || isSelf) &&
                !(isLastAdmin && isSelf) && (
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => handleRemove(member.user_id, isSelf)}
                  >
                    {isSelf ? 'Leave' : 'Remove'}
                  </button>
                )}
            </li>
          )
        })}
      </ul>

      <div className={styles.legend}>
        <h4>Roles</h4>
        <ul>
          {ROLES.map((r) => (
            <li key={r}>
              <strong>{r}</strong> — {ROLE_DESCRIPTIONS[r]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
