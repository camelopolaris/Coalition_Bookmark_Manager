import { FormEvent, useEffect, useState } from 'react'
import { useSessions } from '@renderer/contexts/SessionsContext'
import { SESSION_NAME_MAX_LENGTH, validateSessionName } from '@renderer/types/session'
import '../BookmarkModal/bookmark-modal.css'
import '../BookmarkForm/bookmark-form.css'

function CreateSessionModal() {
  const { isCreateModalOpen, closeCreateSessionModal, createSession } = useSessions()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isCreateModalOpen) {
      setName('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isCreateModalOpen])

  if (!isCreateModalOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = validateSessionName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const result = await createSession({ name: name.trim() })

    if (!result.success) {
      setError(result.message || 'Unable to create session.')
      setIsSubmitting(false)
      return
    }

    closeCreateSessionModal()
  }

  return (
    <div className="bookmark-modal__backdrop" onClick={closeCreateSessionModal}>
      <div
        className="bookmark-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bookmark-modal__header">
          <h2 id="create-session-title" className="bookmark-modal__title">
            New session
          </h2>
          <button
            type="button"
            className="bookmark-modal__close"
            aria-label="Close"
            onClick={closeCreateSessionModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? <div className="bookmark-modal__error">{error}</div> : null}

          <div className="bookmark-form__field">
            <label htmlFor="session-name" className="bookmark-form__label">
              Session name
            </label>
            <input
              id="session-name"
              type="text"
              className="bookmark-form__input"
              value={name}
              maxLength={SESSION_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder="Session 1"
              required
            />
            <p className="bookmark-form__hint">
              {name.length}/{SESSION_NAME_MAX_LENGTH} characters
            </p>
          </div>

          <div className="bookmark-modal__actions">
            <button
              type="button"
              className="bookmark-modal__button bookmark-modal__button--secondary"
              onClick={closeCreateSessionModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bookmark-modal__button bookmark-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSessionModal
