import { useEffect, useState } from 'react'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import './delete-bookmark-modal.css'

function DeleteBookmarkModal() {
  const { deleteTarget, closeDeleteModal, deleteBookmark } = useBookmarks()
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!deleteTarget) {
      setError('')
      setIsDeleting(false)
    }
  }, [deleteTarget])

  if (!deleteTarget) {
    return null
  }

  const handleConfirm = async () => {
    setError('')
    setIsDeleting(true)

    const result = await deleteBookmark(deleteTarget.bookmark_id)

    if (!result.success) {
      setError(result.message || 'Unable to delete bookmark.')
      setIsDeleting(false)
      return
    }

    closeDeleteModal()
  }

  const handleCancel = () => {
    if (isDeleting) {
      return
    }

    setError('')
    closeDeleteModal()
  }

  return (
    <div className="delete-bookmark-modal__backdrop" onClick={handleCancel}>
      <div
        className="delete-bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-bookmark-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-bookmark-title" className="delete-bookmark-modal__title">
          Delete bookmark?
        </h2>

        <p className="delete-bookmark-modal__message">
          Are you sure you want to delete{' '}
          <span className="delete-bookmark-modal__bookmark-name">{deleteTarget.name}</span>? This
          action cannot be undone.
        </p>

        {error ? <div className="delete-bookmark-modal__error">{error}</div> : null}

        <div className="delete-bookmark-modal__actions">
          <button
            type="button"
            className="delete-bookmark-modal__button delete-bookmark-modal__button--secondary"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-bookmark-modal__button delete-bookmark-modal__button--danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteBookmarkModal
