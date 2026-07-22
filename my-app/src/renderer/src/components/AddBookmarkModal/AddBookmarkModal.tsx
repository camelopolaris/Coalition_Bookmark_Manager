import { FormEvent, useEffect, useState } from 'react'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { BOOKMARK_NAME_MAX_LENGTH } from '@renderer/types/bookmark'
import './add-bookmark-modal.css'

function AddBookmarkModal() {
  const { isAddModalOpen, closeAddModal, createBookmark } = useBookmarks()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAddModalOpen) {
      setName('')
      setUrl('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isAddModalOpen])

  if (!isAddModalOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName || !trimmedUrl) {
      setError('Name and URL are required.')
      return
    }

    if (trimmedName.length > BOOKMARK_NAME_MAX_LENGTH) {
      setError(`Name must be ${BOOKMARK_NAME_MAX_LENGTH} characters or fewer.`)
      return
    }

    setIsSubmitting(true)

    const result = await createBookmark({ name: trimmedName, url: trimmedUrl })

    if (!result.success) {
      setError(result.message || 'Unable to create bookmark.')
      setIsSubmitting(false)
      return
    }

    closeAddModal()
  }

  return (
    <div className="add-bookmark-modal__backdrop" onClick={closeAddModal}>
      <div
        className="add-bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bookmark-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-bookmark-modal__header">
          <h2 id="add-bookmark-title" className="add-bookmark-modal__title">
            Add bookmark
          </h2>
          <button
            type="button"
            className="add-bookmark-modal__close"
            aria-label="Close"
            onClick={closeAddModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="add-bookmark-modal__error">{error}</div> : null}

          <div className="add-bookmark-modal__field">
            <label htmlFor="bookmark-name" className="add-bookmark-modal__label">
              Name
            </label>
            <input
              id="bookmark-name"
              type="text"
              className="add-bookmark-modal__input"
              value={name}
              maxLength={BOOKMARK_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <p className="add-bookmark-modal__hint">
              {name.length}/{BOOKMARK_NAME_MAX_LENGTH} characters
            </p>
          </div>

          <div className="add-bookmark-modal__field">
            <label htmlFor="bookmark-url" className="add-bookmark-modal__label">
              URL
            </label>
            <textarea
              id="bookmark-url"
              className="add-bookmark-modal__textarea"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
          </div>

          <div className="add-bookmark-modal__actions">
            <button
              type="button"
              className="add-bookmark-modal__button add-bookmark-modal__button--secondary"
              onClick={closeAddModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-bookmark-modal__button add-bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookmarkModal
