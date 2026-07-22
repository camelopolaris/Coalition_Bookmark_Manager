import { useEffect, useState } from 'react'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import '../DeleteBookmarkModal/delete-bookmark-modal.css'

function DeleteFolderModal() {
  const { deleteTarget, closeDeleteFolderModal, deleteFolder } = useFolders()
  const { uncategorizeBookmarksInFolders } = useBookmarks()
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

    const result = await deleteFolder(deleteTarget.folder_id)

    if (!result.success) {
      setError(result.message || 'Unable to delete folder.')
      setIsDeleting(false)
      return
    }

    if (result.deletedFolderIds?.length) {
      uncategorizeBookmarksInFolders(result.deletedFolderIds)
    }

    closeDeleteFolderModal()
  }

  const handleCancel = () => {
    if (isDeleting) {
      return
    }

    setError('')
    closeDeleteFolderModal()
  }

  return (
    <div className="delete-bookmark-modal__backdrop" onClick={handleCancel}>
      <div
        className="delete-bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-folder-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-folder-title" className="delete-bookmark-modal__title">
          Delete folder?
        </h2>

        <p className="delete-bookmark-modal__message">
          Are you sure you want to delete{' '}
          <span className="delete-bookmark-modal__bookmark-name">{deleteTarget.name}</span>? Any
          subfolders will also be removed and bookmarks inside will become uncategorized.
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
            {isDeleting ? 'Deleting...' : 'Delete folder'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteFolderModal
