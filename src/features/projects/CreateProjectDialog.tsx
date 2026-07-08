import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Modal } from '@/components/Modal'
import { useCreateProject } from './useProjects'
import styles from './CreateProjectDialog.module.css'

function suggestKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 3)
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 6)
}

export function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const createProject = useCreateProject()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)
  const [description, setDescription] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    createProject.mutate(
      { name: name.trim(), key, description: description.trim() },
      {
        onSuccess: (project) => {
          onClose()
          void navigate(`/projects/${project.id}/board`)
        },
      },
    )
  }

  const keyValid = /^[A-Z]{2,6}$/.test(key)
  const errorMessage = createProject.error
    ? createProject.error.message.includes('duplicate')
      ? `The key "${key}" is already taken — pick another.`
      : createProject.error.message
    : null

  return (
    <Modal title="New project" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!keyTouched) setKey(suggestKey(e.target.value))
            }}
            placeholder="Website Redesign"
            required
            maxLength={100}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span>Key</span>
          <input
            type="text"
            value={key}
            onChange={(e) => {
              setKeyTouched(true)
              setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
            }}
            placeholder="WEB"
            required
            maxLength={6}
          />
          <small className={styles.hint}>
            2–6 uppercase letters. Issues are numbered like{' '}
            {keyValid ? key : 'KEY'}-1, {keyValid ? key : 'KEY'}-2, …
          </small>
        </label>

        <label className={styles.field}>
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this project about?"
          />
        </label>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submit}
            disabled={!name.trim() || !keyValid || createProject.isPending}
          >
            {createProject.isPending ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
