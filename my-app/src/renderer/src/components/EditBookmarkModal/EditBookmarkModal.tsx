import { FormEvent, useEffect, useState } from 'react'
import BookmarkForm from '@renderer/components/BookmarkForm/BookmarkForm'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import {
  bookmarkToFormFields,
  createEmptyBookmarkFormFields,
  normalizeBookmarkFormFields,
  validateBookmarkFormFields,
} from '@renderer/types/bookmark'
import '../BookmarkModal/bookmark-modal.css'

function EditBookmarkModal() {
  const { editTarget, closeEditModal, updateBookmark } = useBookmarks()
  const [fields, setFields] = useState(createEmptyBookmarkFormFields())
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editTarget) {
      setFields(bookmarkToFormFields(editTarget))
      setError('')
      setIsSubmitting(false)
    }
  }, [editTarget])

  if (!editTarget) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = validateBookmarkFormFields(fields)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const result = await updateBookmark(
      editTarget.bookmark_id,
      normalizeBookmarkFormFields(fields),
    )

    if (!result.success) {
      setError(result.message || 'Unable to update bookmark.')
      setIsSubmitting(false)
      return
    }

    closeEditModal()
  }

  return (
    <div className="bookmark-modal__backdrop" onClick={closeEditModal}>
      <div
        className="bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-bookmark-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="edit-bookmark-title" className="bookmark-modal__title">
            Edit bookmark
          </h2>
          <button
            type="button"
            className="bookmark-modal__close"
            aria-label="Close"
            onClick={closeEditModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <BookmarkForm fields={fields} idPrefix="edit-bookmark" onChange={setFields} />

          <div className="bookmark-modal__actions">
            <button
              type="button"
              className="bookmark-modal__button bookmark-modal__button--secondary"
              onClick={closeEditModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bookmark-modal__button bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBookmarkModal
