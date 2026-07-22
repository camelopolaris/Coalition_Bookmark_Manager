import { FormEvent, useEffect, useState } from 'react'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { FOLDER_NAME_MAX_LENGTH, validateFolderName } from '@renderer/types/folder'
import '../BookmarkModal/bookmark-modal.css'
import '../BookmarkForm/bookmark-form.css'

function RenameFolderModal() {
  const { renameTarget, closeRenameFolderModal, renameFolder } = useFolders()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (renameTarget) {
      setName(renameTarget.name)
      setError('')
      setIsSubmitting(false)
    }
  }, [renameTarget])

  if (!renameTarget) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = validateFolderName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const result = await renameFolder(renameTarget.folder_id, { name: name.trim() })

    if (!result.success) {
      setError(result.message || 'Unable to rename folder.')
      setIsSubmitting(false)
      return
    }

    closeRenameFolderModal()
  }

  return (
    <div className="bookmark-modal__backdrop" onClick={closeRenameFolderModal}>
      <div
        className="bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-folder-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="rename-folder-title" className="bookmark-modal__title">
            Rename folder
          </h2>
          <button
            type="button"
            className="bookmark-modal__close"
            aria-label="Close"
            onClick={closeRenameFolderModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <div className="bookmark-form__field">
            <label htmlFor="rename-folder-name" className="bookmark-form__label">
              Folder name
            </label>
            <input
              id="rename-folder-name"
              type="text"
              className="bookmark-form__input"
              value={name}
              maxLength={FOLDER_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <p className="bookmark-form__hint">
              {name.length}/{FOLDER_NAME_MAX_LENGTH} characters
            </p>
          </div>

          <div className="bookmark-modal__actions">
            <button
              type="button"
              className="bookmark-modal__button bookmark-modal__button--secondary"
              onClick={closeRenameFolderModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bookmark-modal__button bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenameFolderModal
