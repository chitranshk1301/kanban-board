import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/Modal'
import { STATUSES, STATUS_META, type IssueStatus } from '@/constants/status'
import { PRIORITIES, PRIORITY_META } from '@/constants/priority'
import type { Project } from '@/lib/database.types'
import { useMembers } from '@/features/members/useMembers'
import { POSITION_GAP } from './position'
import { useIssues } from './useIssues'
import { useCreateIssue } from './useIssueMutations'
import styles from './CreateIssueDialog.module.css'

export function CreateIssueDialog({
  project,
  initialStatus = 'todo',
  onClose,
}: {
  project: Project
  initialStatus?: IssueStatus
  onClose: () => void
}) {
  const { data: members = [] } = useMembers(project.id)
  const { data: issues = [] } = useIssues(project.id)
  const createIssue = useCreateIssue(project.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>(initialStatus)
  const [priority, setPriority] = useState(0)
  const [assigneeId, setAssigneeId] = useState('')
  const [labelsInput, setLabelsInput] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const columnPositions = issues
      .filter((issue) => issue.status === status)
      .map((issue) => issue.position)
    const position =
      (columnPositions.length ? Math.max(...columnPositions) : 0) +
      POSITION_GAP
    const labels = [
      ...new Set(
        labelsInput
          .split(',')
          .map((label) => label.trim().toLowerCase())
          .filter(Boolean),
      ),
    ]

    createIssue.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee_id: assigneeId || null,
        labels,
        position,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal title={`New issue in ${project.key}`} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the issue"
            required
            maxLength={300}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add more detail…"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Assignee</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profile.full_name ?? member.profile.email}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Labels</span>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="bug, frontend, …"
            />
          </label>
        </div>

        {createIssue.error && (
          <p className={styles.error}>{createIssue.error.message}</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submit}
            disabled={!title.trim() || createIssue.isPending}
          >
            {createIssue.isPending ? 'Creating…' : 'Create issue'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
