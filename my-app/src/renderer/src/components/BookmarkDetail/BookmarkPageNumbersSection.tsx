import { FormEvent, useEffect, useState } from 'react'
import {
  BookmarkPageNumber,
  PageNumberFormFields,
  createEmptyPageNumberFormFields,
  normalizePageNumberFormFields,
  pageNumberToFormFields,
  validatePageNumberFormFields,
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

interface PageNumberModalProps {
  title: string
  initialFields: PageNumberFormFields
  submitLabel: string
  onClose: () => void
  onSubmit: (fields: PageNumberFormFields) => Promise<{ success: boolean; message?: string }>
}

function PageNumberModal({
  title,
  initialFields,
  submitLabel,
  onClose,
  onSubmit,
}: PageNumberModalProps) {
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

    const validationError = validatePageNumberFormFields(fields)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    const normalized = normalizePageNumberFormFields(fields)
    const result = await onSubmit(normalized)

    if (!result.success) {
      setError(result.message || 'Unable to save page number.')
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
        aria-labelledby="page-number-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="page-number-modal-title" className="bookmark-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="bookmark-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <div className="bookmark-form__field">
            <label htmlFor="page-number-value" className="bookmark-form__label">
              Page number
            </label>
            <input
              id="page-number-value"
              type="number"
              min={1}
              step={1}
              className="bookmark-form__input"
              value={fields.page_number}
              onChange={(event) =>
                setFields((current) => ({ ...current, page_number: event.target.value }))
              }
              required
            />
          </div>

          <div className="bookmark-form__field">
            <label htmlFor="page-number-note" className="bookmark-form__label">
              Note
            </label>
            <textarea
              id="page-number-note"
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

interface BookmarkPageNumbersSectionProps {
  pageNumbers: BookmarkPageNumber[]
  isLoading: boolean
  onCreate: (fields: {
    page_number: number
    note_content: string
  }) => Promise<{ success: boolean; message?: string }>
  onUpdate: (
    originalPageNumber: number,
    fields: Partial<{ page_number: number; note_content: string }>,
  ) => Promise<{ success: boolean; message?: string }>
  onDelete: (pageNumber: number) => Promise<{ success: boolean; message?: string }>
}

function BookmarkPageNumbersSection({
  pageNumbers,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: BookmarkPageNumbersSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BookmarkPageNumber | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BookmarkPageNumber | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeleteError('')
    setIsDeleting(true)

    const result = await onDelete(deleteTarget.page_number)

    if (!result.success) {
      setDeleteError(result.message || 'Unable to delete page number.')
      setIsDeleting(false)
      return
    }

    setDeleteTarget(null)
    setIsDeleting(false)
  }

  return (
    <section className="bookmark-detail__section bookmark-detail__annotations">
      <div className="bookmark-detail__section-header">
        <h2 className="bookmark-detail__section-title">Page numbers</h2>
        <button
          type="button"
          className="bookmark-detail__section-action"
          onClick={() => setIsAddOpen(true)}
        >
          + Add page number
        </button>
      </div>

      {isLoading ? <p className="bookmark-detail__annotation-status">Loading page numbers...</p> : null}

      {!isLoading && pageNumbers.length === 0 ? (
        <p className="bookmark-detail__annotation-empty">No page numbers yet.</p>
      ) : null}

      {!isLoading && pageNumbers.length > 0 ? (
        <ul className="bookmark-detail__annotation-list">
          {pageNumbers.map((pageNumber) => (
            <li key={pageNumber.page_number} className="bookmark-detail__annotation-item">
              <div className="bookmark-detail__annotation-main">
                <span className="bookmark-detail__annotation-badge">Page {pageNumber.page_number}</span>
                {pageNumber.note_content ? (
                  <p className="bookmark-detail__annotation-note">{pageNumber.note_content}</p>
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
                  aria-label={`Edit page ${pageNumber.page_number}`}
                  onClick={() => setEditTarget(pageNumber)}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="bookmark-detail__annotation-action"
                  aria-label={`Delete page ${pageNumber.page_number}`}
                  onClick={() => {
                    setDeleteError('')
                    setDeleteTarget(pageNumber)
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
        <PageNumberModal
          title="Add page number"
          initialFields={createEmptyPageNumberFormFields()}
          submitLabel="Add page number"
          onClose={() => setIsAddOpen(false)}
          onSubmit={async (fields) =>
            onCreate({
              page_number: Number(fields.page_number),
              note_content: fields.note_content,
            })
          }
        />
      ) : null}

      {editTarget ? (
        <PageNumberModal
          title="Edit page number"
          initialFields={pageNumberToFormFields(editTarget)}
          submitLabel="Save changes"
          onClose={() => setEditTarget(null)}
          onSubmit={async (fields) =>
            onUpdate(editTarget.page_number, {
              page_number: Number(fields.page_number),
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
            aria-labelledby="delete-page-number-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bookmark-modal__header">
              <h2 id="delete-page-number-title" className="bookmark-modal__title">
                Delete page number?
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
              Remove page <strong>{deleteTarget.page_number}</strong>?
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

export default BookmarkPageNumbersSection
