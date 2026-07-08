import { useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router'
import addIcon from '@/assets/icons/add.svg'
import type { Project } from '@/lib/database.types'
import { useAuth } from '@/features/auth/useAuth'
import { FilterBar } from '@/features/filters/FilterBar'
import { CreateIssueDialog } from '@/features/issues/CreateIssueDialog'
import { IssuePanel } from '@/features/issues/IssuePanel'
import { useIssuePanel } from '@/features/issues/useIssuePanel'
import {
  usePermissions,
  type Permissions,
} from '@/features/members/usePermissions'
import { useProject } from './useProjects'
import styles from './ProjectLayout.module.css'

export type ProjectContext = {
  project: Project
  permissions: Permissions
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjectContext() {
  return useOutletContext<ProjectContext>()
}

export function ProjectLayout() {
  const { projectId = '' } = useParams()
  const { user, signOut } = useAuth()
  const { data: project, isLoading } = useProject(projectId)
  const permissions = usePermissions(projectId)
  const { issueNumber } = useIssuePanel()
  const location = useLocation()
  const [creatingIssue, setCreatingIssue] = useState(false)

  const isSettings = location.pathname.endsWith('/settings')
  const view = location.pathname.endsWith('/list') ? 'list' : 'board'

  if (isLoading || permissions.isLoading) {
    return <div className={styles.centered}>Loading…</div>
  }

  if (!project) {
    return (
      <div className={styles.centered}>
        <p>Project not found, or you don't have access to it.</p>
        <Link to="/projects" className={styles.backLink}>
          ← Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/projects" className={styles.back} title="All projects">
            ←
          </Link>
          <span className={styles.key}>{project.key}</span>
          <h1 className={styles.name}>{project.name}</h1>
          {permissions.role && (
            <span className={styles.roleBadge}>{permissions.role}</span>
          )}
        </div>

        <nav className={styles.tabs}>
          <NavLink
            to={`/projects/${project.id}/board`}
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
          >
            Board
          </NavLink>
          <NavLink
            to={`/projects/${project.id}/list`}
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
          >
            List
          </NavLink>
          <NavLink
            to={`/projects/${project.id}/settings`}
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
            }
          >
            Settings
          </NavLink>
        </nav>

        <div className={styles.headerRight}>
          {permissions.canCreateIssue && !isSettings && (
            <button
              type="button"
              className={styles.newIssue}
              onClick={() => setCreatingIssue(true)}
            >
              <img src={addIcon} alt="" width={13} height={13} />
              New issue
            </button>
          )}
          <span className={styles.email}>{user?.email}</span>
          <button
            type="button"
            className={styles.signOut}
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      {!isSettings && <FilterBar projectId={project.id} view={view} />}

      <main className={styles.main}>
        <Outlet
          context={{ project, permissions } satisfies ProjectContext}
        />
      </main>

      {issueNumber !== null && (
        <IssuePanel project={project} permissions={permissions} />
      )}

      {creatingIssue && (
        <CreateIssueDialog
          project={project}
          onClose={() => setCreatingIssue(false)}
        />
      )}
    </div>
  )
}
