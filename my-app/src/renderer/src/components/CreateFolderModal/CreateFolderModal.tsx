import { FormEvent, useEffect, useState } from 'react'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { FOLDER_NAME_MAX_LENGTH, validateFolderName } from '@renderer/types/folder'
import '../BookmarkModal/bookmark-modal.css'
import '../BookmarkForm/bookmark-form.css'

function CreateFolderModal() {
  const {
    createFolderTargetParentId,
    closeCreateFolderModal,
    createFolder,
    folders,
  } = useFolders()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOpen = createFolderTargetParentId !== undefined
  const parentFolder =
    createFolderTargetParentId === null || createFolderTargetParentId === undefined
      ? null
      : folders.find((folder) => folder.folder_id === createFolderTargetParentId) ?? null

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) {
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

    const result = await createFolder({
      name: name.trim(),
      parent_id: createFolderTargetParentId ?? null,
    })

    if (!result.success) {
      setError(result.message || 'Unable to create folder.')
      setIsSubmitting(false)
      return
    }

    closeCreateFolderModal()
  }

  return (
    <div className="bookmark-modal__backdrop" onClick={closeCreateFolderModal}>
      <div
        className="bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-folder-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="create-folder-title" className="bookmark-modal__title">
            {parentFolder ? `New folder in ${parentFolder.name}` : 'New folder'}
          </h2>
          <button
            type="button"
            className="bookmark-modal__close"
            aria-label="Close"
            onClick={closeCreateFolderModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <div className="bookmark-form__field">
            <label htmlFor="folder-name" className="bookmark-form__label">
              Folder name
            </label>
            <input
              id="folder-name"
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
              onClick={closeCreateFolderModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bookmark-modal__button bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFolderModal
