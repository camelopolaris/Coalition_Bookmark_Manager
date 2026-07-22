import { FormEvent, useEffect, useState } from 'react'
import {
  BookmarkTimestamp,
  TimestampFormFields,
  createEmptyTimestampFormFields,
  formatTimestampLabel,
  normalizeTimestampFormFields,
  timestampToFormFields,
  validateTimestampFormFields,
} from '@renderer/types/bookmarkAnnotation'
import '../BookmarkModal/bookmark-modal.css'
import '../BookmarkForm/bookmark-form.css'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  )
}

interface TimestampModalProps {
  title: string
  initialFields: TimestampFormFields
  submitLabel: string
  onClose: () => void
  onSubmit: (fields: TimestampFormFields) => Promise<{ success: boolean; message?: string }>
}

function TimestampModal({
  title,
  initialFields,
  submitLabel,
  onClose,
  onSubmit,
}: TimestampModalProps) {
  const [fields, setFields] = useState(initialFields)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFields(initialFields)
    setError('')
    setIsSubmitting(false)
  }, [initialFields])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = validateTimestampFormFields(fields)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(normalizeTimestampFormFields(fields))

    if (!result.success) {
      setError(result.message || 'Unable to save timestamp.')
      setIsSubmitting(false)
      return
    }

    onClose()
  }

  return (
    <div className="bookmark-modal__backdrop" onClick={onClose}>
      <div
        className="bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timestamp-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="timestamp-modal-title" className="bookmark-modal__title">
            {title}
          </h2>
          <button type="button" className="bookmark-modal__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <div className="bookmark-form__field">
            <label htmlFor="timestamp-value" className="bookmark-form__label">
              Timestamp
            </label>
            <input
              id="timestamp-value"
              type="text"
              className="bookmark-form__input"
              placeholder="HH:MM:SS or MM:SS"
              value={fields.timestamp_value}
              onChange={(event) =>
                setFields((current) => ({ ...current, timestamp_value: event.target.value }))
              }
              required
            />
            <p className="bookmark-form__hint">Examples: 1:23:45, 05:30, or 330</p>
          </div>

          <div className="bookmark-form__field">
            <label htmlFor="timestamp-note" className="bookmark-form__label">
              Note
            </label>
            <textarea
              id="timestamp-note"
              className="bookmark-form__textarea"
              value={fields.note_content}
              onChange={(event) =>
                setFields((current) => ({ ...current, note_content: event.target.value }))
              }
            />
          </div>

          <div className="bookmark-modal__actions">
            <button
              type="button"
              className="bookmark-modal__button bookmark-modal__button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bookmark-modal__button bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface BookmarkTimestampsSectionProps {
  timestamps: BookmarkTimestamp[]
  isLoading: boolean
  onCreate: (fields: TimestampFormFields) => Promise<{ success: boolean; message?: string }>
  onUpdate: (
    originalTimestampValue: string,
    fields: Partial<TimestampFormFields>,
  ) => Promise<{ success: boolean; message?: string }>
  onDelete: (timestampValue: string) => Promise<{ success: boolean; message?: string }>
}

function BookmarkTimestampsSection({
  timestamps,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: BookmarkTimestampsSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BookmarkTimestamp | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BookmarkTimestamp | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeleteError('')
    setIsDeleting(true)

    const result = await onDelete(deleteTarget.timestamp_value)

    if (!result.success) {
      setDeleteError(result.message || 'Unable to delete timestamp.')
      setIsDeleting(false)
      return
    }

    setDeleteTarget(null)
    setIsDeleting(false)
  }

  return (
    <section className="bookmark-detail__section bookmark-detail__annotations">
      <div className="bookmark-detail__section-header">
        <h2 className="bookmark-detail__section-title">Timestamps</h2>
        <button
          type="button"
          className="bookmark-detail__section-action"
          onClick={() => setIsAddOpen(true)}
        >
          + Add timestamp
        </button>
      </div>

      {isLoading ? <p className="bookmark-detail__annotation-status">Loading timestamps...</p> : null}

      {!isLoading && timestamps.length === 0 ? (
        <p className="bookmark-detail__annotation-empty">No timestamps yet.</p>
      ) : null}

      {!isLoading && timestamps.length > 0 ? (
        <ul className="bookmark-detail__annotation-list">
          {timestamps.map((timestamp) => (
            <li key={timestamp.timestamp_value} className="bookmark-detail__annotation-item">
              <div className="bookmark-detail__annotation-main">
                <span className="bookmark-detail__annotation-badge">
                  {formatTimestampLabel(timestamp.timestamp_value)}
                </span>
                {timestamp.note_content ? (
                  <p className="bookmark-detail__annotation-note">{timestamp.note_content}</p>
                ) : (
                  <p className="bookmark-detail__annotation-note bookmark-detail__annotation-note--empty">
                    No note
                  </p>
                )}
              </div>

              <div className="bookmark-detail__annotation-actions">
                <button
                  type="button"
                  className="bookmark-detail__annotation-action"
                  aria-label={`Edit timestamp ${formatTimestampLabel(timestamp.timestamp_value)}`}
                  onClick={() => setEditTarget(timestamp)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="bookmark-detail__annotation-action"
                  aria-label={`Delete timestamp ${formatTimestampLabel(timestamp.timestamp_value)}`}
                  onClick={() => {
                    setDeleteError('')
                    setDeleteTarget(timestamp)
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {isAddOpen ? (
        <TimestampModal
          title="Add timestamp"
          initialFields={createEmptyTimestampFormFields()}
          submitLabel="Add timestamp"
          onClose={() => setIsAddOpen(false)}
          onSubmit={onCreate}
        />
      ) : null}

      {editTarget ? (
        <TimestampModal
          title="Edit timestamp"
          initialFields={timestampToFormFields(editTarget)}
          submitLabel="Save changes"
          onClose={() => setEditTarget(null)}
          onSubmit={(fields) =>
            onUpdate(editTarget.timestamp_value, {
              timestamp_value: fields.timestamp_value,
              note_content: fields.note_content,
            })
          }
        />
      ) : null}

      {deleteTarget ? (
        <div className="bookmark-modal__backdrop" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div
            className="bookmark-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-timestamp-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bookmark-modal__header">
              <h2 id="delete-timestamp-title" className="bookmark-modal__title">
                Delete timestamp?
              </h2>
              <button
                type="button"
                className="bookmark-modal__close"
                aria-label="Close"
                onClick={() => !isDeleting && setDeleteTarget(null)}
              >
                ×
              </button>
            </div>

            <p className="bookmark-detail__delete-message">
              Remove timestamp{' '}
              <strong>{formatTimestampLabel(deleteTarget.timestamp_value)}</strong>?
            </p>

            {deleteError ? <div className="bookmark-modal__error">{deleteError}</div> : null}

            <div className="bookmark-modal__actions">
              <button
                type="button"
                className="bookmark-modal__button bookmark-modal__button--secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bookmark-modal__button bookmark-modal__button--primary"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default BookmarkTimestampsSection
