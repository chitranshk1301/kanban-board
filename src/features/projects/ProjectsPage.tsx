import { useState } from 'react'
import { Link } from 'react-router'
import addIcon from '@/assets/icons/add.svg'
import { useAuth } from '@/features/auth/useAuth'
import { CreateProjectDialog } from './CreateProjectDialog'
import { useProjects } from './useProjects'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const { user, signOut } = useAuth()
  const { data: projects, isLoading, error } = useProjects()
  const [creating, setCreating] = useState(false)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Kanban Board</h1>
        <div className={styles.headerRight}>
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

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h2>Projects</h2>
          <button
            type="button"
            className={styles.newProject}
            onClick={() => setCreating(true)}
          >
            <img src={addIcon} alt="" width={14} height={14} />
            New project
          </button>
        </div>

        {isLoading && <p className={styles.muted}>Loading projects…</p>}
        {error && (
          <p className={styles.error}>
            Failed to load projects: {error.message}
          </p>
        )}

        {projects && projects.length === 0 && (
          <div className={styles.empty}>
            <p>No projects yet.</p>
            <p className={styles.muted}>
              Create your first project to get started — you will be its
              admin.
            </p>
          </div>
        )}

        <div className={styles.grid}>
          {projects?.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}/board`}
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span className={styles.key}>{project.key}</span>
                <span className={styles.role}>{project.role}</span>
              </div>
              <h3 className={styles.cardName}>{project.name}</h3>
              {project.description && (
                <p className={styles.cardDescription}>{project.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>

      {creating && <CreateProjectDialog onClose={() => setCreating(false)} />}
    </div>
  )
}
