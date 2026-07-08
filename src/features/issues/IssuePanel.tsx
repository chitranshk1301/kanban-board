import { useEffect, useState, type FormEvent } from 'react'
import { Avatar } from '@/components/Avatar'
import { LabelChip } from '@/components/LabelChip'
import { STATUSES, STATUS_META, type IssueStatus } from '@/constants/status'
import { PRIORITIES, PRIORITY_META } from '@/constants/priority'
import type { Project } from '@/lib/database.types'
import { useAuth } from '@/features/auth/useAuth'
import { useMembers } from '@/features/members/useMembers'
import type { Permissions } from '@/features/members/usePermissions'
import type { IssueWithProfiles } from './types'
import { useComments, useAddComment, useDeleteComment } from './useComments'
import { useIssuePanel } from './useIssuePanel'
import { useIssues } from './useIssues'
import { useDeleteIssue, useUpdateIssue } from './useIssueMutations'
import styles from './IssuePanel.module.css'

export function IssuePanel({
  project,
  permissions,
}: {
  project: Project
  permissions: Permissions
}) {
  const { issueNumber, closeIssue } = useIssuePanel()
  const { data: issues, isLoading } = useIssues(project.id)
  const issue = issues?.find((i) => i.number === issueNumber)

  return (
    <>
      <div className={styles.backdrop} onClick={closeIssue} />
      <aside className={styles.panel}>
        {isLoading && <p className={styles.muted}>Loading…</p>}
        {!isLoading && !issue && (
          <div className={styles.notFound}>
            <p className={styles.muted}>
              Issue {project.key}-{issueNumber} was not found.
            </p>
            <button type="button" className={styles.cancel} onClick={closeIssue}>
              Close
            </button>
          </div>
        )}
        {issue && (
          <IssuePanelContent
            key={issue.id}
            project={project}
            permissions={permissions}
            issue={issue}
          />
        )}
      </aside>
    </>
  )
}

type ContentProps = {
  project: Project
  permissions: Permissions
  issue: IssueWithProfiles
}

function IssuePanelContent({ project, permissions, issue }: ContentProps) {
  const { user } = useAuth()
  const { closeIssue } = useIssuePanel()
  const { data: members = [] } = useMembers(project.id)
  const updateIssue = useUpdateIssue(project.id)
  const deleteIssue = useDeleteIssue(project.id)
  const { data: comments = [] } = useComments(issue.id)
  const addComment = useAddComment(issue.id)
  const deleteComment = useDeleteComment(issue.id)

  const canEdit = permissions.canEditIssue(issue)
  const canDelete = permissions.canDeleteIssue(issue)

  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description)
  const [labelInput, setLabelInput] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(issue.title)
    setDescription(issue.description)
  }, [issue.title, issue.description])

  function patch(fields: Parameters<typeof updateIssue.mutate>[0]['patch']) {
    setError(null)
    updateIssue.mutate(
      { id: issue.id, patch: fields },
      { onError: (err) => setError(err.message) },
    )
  }

  function addLabel(e: FormEvent) {
    e.preventDefault()
    const label = labelInput.trim().toLowerCase()
    if (!label || issue.labels.includes(label)) {
      setLabelInput('')
      return
    }
    patch({ labels: [...issue.labels, label] })
    setLabelInput('')
  }

  function handleDelete() {
    if (!window.confirm(`Delete ${project.key}-${issue.number}?`)) return
    deleteIssue.mutate(issue.id, {
      onSuccess: closeIssue,
      onError: (err) => setError(err.message),
    })
  }

  function submitComment(e: FormEvent) {
    e.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    addComment.mutate(body, {
      onSuccess: () => setCommentBody(''),
      onError: (err) => setError(err.message),
    })
  }

  return (
    <div className={styles.content}>
      <div className={styles.topBar}>
        <span className={styles.issueKey}>
          {project.key}-{issue.number}
        </span>
        {!canEdit && <span className={styles.readOnly}>Read only</span>}
        <div className={styles.topActions}>
          {canDelete && (
            <button
              type="button"
              className={styles.delete}
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <button type="button" className={styles.close} onClick={closeIssue}>
            ×
          </button>
        </div>
      </div>

      {canEdit ? (
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const trimmed = title.trim()
            if (trimmed && trimmed !== issue.title) patch({ title: trimmed })
            else setTitle(issue.title)
          }}
          maxLength={300}
        />
      ) : (
        <h2 className={styles.titleStatic}>{issue.title}</h2>
      )}

      <div className={styles.fields}>
        <label className={styles.fieldRow}>
          <span>Status</span>
          <select
            value={issue.status}
            disabled={!canEdit}
            onChange={(e) => patch({ status: e.target.value as IssueStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldRow}>
          <span>Priority</span>
          <select
            value={issue.priority}
            disabled={!canEdit}
            onChange={(e) => patch({ priority: Number(e.target.value) })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldRow}>
          <span>Assignee</span>
          <select
            value={issue.assignee_id ?? ''}
            disabled={!canEdit}
            onChange={(e) => patch({ assignee_id: e.target.value || null })}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile.full_name ?? member.profile.email}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.fieldRow}>
          <span>Labels</span>
          <div className={styles.labels}>
            {issue.labels.map((label) => (
              <span key={label} className={styles.labelWrap}>
                <LabelChip label={label} />
                {canEdit && (
                  <button
                    type="button"
                    className={styles.labelRemove}
                    title={`Remove ${label}`}
                    onClick={() =>
                      patch({
                        labels: issue.labels.filter((l) => l !== label),
                      })
                    }
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {canEdit && (
              <form onSubmit={addLabel}>
                <input
                  className={styles.labelInput}
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="+ label"
                />
              </form>
            )}
          </div>
        </div>

        <div className={styles.fieldRow}>
          <span>Reporter</span>
          <div className={styles.person}>
            {issue.reporter ? (
              <>
                <Avatar
                  id={issue.reporter.id}
                  name={issue.reporter.full_name}
                  email={issue.reporter.email}
                  size={20}
                />
                {issue.reporter.full_name ?? issue.reporter.email}
              </>
            ) : (
              <span className={styles.muted}>Unknown</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Description</h3>
        {canEdit ? (
          <>
            <textarea
              className={styles.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add a description…"
            />
            {description !== issue.description && (
              <div className={styles.descActions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => setDescription(issue.description)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.save}
                  onClick={() => patch({ description })}
                >
                  Save
                </button>
              </div>
            )}
          </>
        ) : (
          <p className={styles.descriptionStatic}>
            {issue.description || (
              <span className={styles.muted}>No description.</span>
            )}
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h3>Comments ({comments.length})</h3>
        <div className={styles.comments}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                {comment.author && (
                  <Avatar
                    id={comment.author.id}
                    name={comment.author.full_name}
                    email={comment.author.email}
                    size={20}
                  />
                )}
                <span className={styles.commentAuthor}>
                  {comment.author?.full_name ??
                    comment.author?.email ??
                    'Unknown'}
                </span>
                <span className={styles.commentTime}>
                  {new Date(comment.created_at).toLocaleString()}
                </span>
                {(comment.author_id === user?.id ||
                  permissions.role === 'manager' ||
                  permissions.role === 'admin') && (
                  <button
                    type="button"
                    className={styles.commentDelete}
                    onClick={() => deleteComment.mutate(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className={styles.commentBody}>{comment.body}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className={styles.muted}>No comments yet.</p>
          )}
        </div>

        {permissions.canComment && (
          <form className={styles.commentForm} onSubmit={submitComment}>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={2}
              placeholder="Write a comment…"
            />
            <button
              type="submit"
              className={styles.save}
              disabled={!commentBody.trim() || addComment.isPending}
            >
              Comment
            </button>
          </form>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.timestamps}>
        Created {new Date(issue.created_at).toLocaleString()} · Updated{' '}
        {new Date(issue.updated_at).toLocaleString()}
      </p>
    </div>
  )
}
