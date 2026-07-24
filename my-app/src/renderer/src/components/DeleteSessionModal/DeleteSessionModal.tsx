import { useEffect, useState } from 'react'
import { useSessions } from '@renderer/contexts/SessionsContext'
import './delete-session-modal.css'

function DeleteSessionModal() {
  const { deleteTarget, closeDeleteSessionModal, deleteSession } = useSessions()
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

    const result = await deleteSession(deleteTarget.session_id)

    if (!result.success) {
      setError(result.message || 'Unable to delete session.')
      setIsDeleting(false)
      return
    }

    closeDeleteSessionModal()
  }

  const handleCancel = () => {
    if (isDeleting) {
      return
    }

    setError('')
    closeDeleteSessionModal()
  }

  return (
    <div className="delete-session-modal__backdrop" onClick={handleCancel}>
      <div
        className="delete-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-session-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-session-title" className="delete-session-modal__title">
          Delete session?
        </h2>

        <p className="delete-session-modal__message">
          Are you sure you want to delete{' '}
          <span className="delete-session-modal__session-name">{deleteTarget.name}</span>? The
          bookmarks themselves will not be deleted.
        </p>

        {error ? <div className="delete-session-modal__error">{error}</div> : null}

        <div className="delete-session-modal__actions">
          <button
            type="button"
            className="delete-session-modal__button delete-session-modal__button--secondary"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-session-modal__button delete-session-modal__button--danger"
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

export default DeleteSessionModal
