import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useProjectContext } from '@/features/projects/ProjectLayout'
import {
  useDeleteProject,
  useUpdateProject,
} from '@/features/projects/useProjects'
import { MembersTab } from './MembersTab'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { project, permissions } = useProjectContext()
  const [tab, setTab] = useState<'members' | 'details'>('members')

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === 'members' ? styles.tabActive : styles.tab}
          onClick={() => setTab('members')}
        >
          Members
        </button>
        <button
          type="button"
          className={tab === 'details' ? styles.tabActive : styles.tab}
          onClick={() => setTab('details')}
        >
          Details
        </button>
      </div>

      <div className={styles.card}>
        {tab === 'members' ? (
          <MembersTab project={project} permissions={permissions} />
        ) : (
          <DetailsTab />
        )}
      </div>
    </div>
  )
}

function DetailsTab() {
  const { project, permissions } = useProjectContext()
  const navigate = useNavigate()
  const updateProject = useUpdateProject(project.id)
  const deleteProject = useDeleteProject()

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canEdit = permissions.canEditProject
  const dirty =
    name.trim() !== project.name || description.trim() !== project.description

  function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    updateProject.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setError(err.message),
      },
    )
  }

  function handleDelete() {
    const confirmation = window.prompt(
      `This permanently deletes "${project.name}" and ALL of its issues.\nType the project key (${project.key}) to confirm:`,
    )
    if (confirmation !== project.key) return
    deleteProject.mutate(project.id, {
      onSuccess: () => void navigate('/projects'),
      onError: (err) => setError(err.message),
    })
  }

  return (
    <form className={styles.details} onSubmit={handleSave}>
      {!canEdit && (
        <p className={styles.muted}>
          Only project admins can edit these settings.
        </p>
      )}

      <label className={styles.field}>
        <span>Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          required
          maxLength={100}
        />
      </label>

      <label className={styles.field}>
        <span>Key</span>
        <input type="text" value={project.key} disabled />
        <small className={styles.muted}>
          The key cannot be changed — issue numbers like {project.key}-1
          depend on it.
        </small>
      </label>

      <label className={styles.field}>
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          rows={3}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}
      {saved && !dirty && <p className={styles.success}>Saved.</p>}

      {canEdit && (
        <>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.save}
              disabled={!dirty || !name.trim() || updateProject.isPending}
            >
              {updateProject.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <div className={styles.dangerZone}>
            <h4>Danger zone</h4>
            <p className={styles.muted}>
              Deleting a project permanently removes all of its issues and
              comments.
            </p>
            <button
              type="button"
              className={styles.delete}
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Deleting…' : 'Delete project'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
