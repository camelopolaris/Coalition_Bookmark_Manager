import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'
import {
  AccountSettingsFields,
  buildUpdateAccountInput,
  createEmptyAccountSettingsFields,
  USERNAME_MAX_LENGTH,
  validateAccountSettingsFields,
} from '@renderer/types/user'
import './settings.css'

export const Route = createFileRoute('/settings')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth?.isAuth) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { user, isUserLoading, updateAccount } = useAuth()
  const [fields, setFields] = useState<AccountSettingsFields>(createEmptyAccountSettingsFields())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFields(createEmptyAccountSettingsFields(user.username))
      setError('')
      setSuccess('')
    }
  }, [user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!user) {
      setError('Unable to load your account.')
      return
    }

    const validationError = validateAccountSettingsFields(fields, user.username)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const result = await updateAccount(buildUpdateAccountInput(fields, user.username))

    if (!result.success) {
      setError(result.message || 'Unable to update account.')
      setIsSubmitting(false)
      return
    }

    setFields(createEmptyAccountSettingsFields(result.user?.username ?? fields.username.trim()))
    setSuccess('Account updated successfully.')
    setIsSubmitting(false)
  }

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <Link to="/" className="settings-page__back">
          ← Back to bookmarks
        </Link>
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">Update your username and password.</p>
      </div>

      <section className="settings-panel">
        {isUserLoading ? <p className="settings-panel__status">Loading account...</p> : null}

        {!isUserLoading && !user ? (
          <p className="settings-panel__status settings-panel__status--error">
            Unable to load your account.
          </p>
        ) : null}

        {!isUserLoading && user ? (
          <form className="settings-form" onSubmit={handleSubmit}>
            {error ? <div className="settings-form__error">{error}</div> : null}
            {success ? <div className="settings-form__success">{success}</div> : null}

            <div className="settings-form__field">
              <label htmlFor="settings-username" className="settings-form__label">
                Username
              </label>
              <input
                id="settings-username"
                type="text"
                className="settings-form__input"
                value={fields.username}
                maxLength={USERNAME_MAX_LENGTH}
                onChange={(event) =>
                  setFields((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </div>

            <div className="settings-form__section">
              <h2 className="settings-form__section-title">Change password</h2>
              <p className="settings-form__section-hint">
                Leave blank to keep your current password. Your current password is required when
                setting a new one.
              </p>

              <div className="settings-form__field">
                <label htmlFor="settings-current-password" className="settings-form__label">
                  Current password
                </label>
                <input
                  id="settings-current-password"
                  type="password"
                  className="settings-form__input"
                  value={fields.currentPassword}
                  onChange={(event) =>
                    setFields((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                />
              </div>

              <div className="settings-form__field">
                <label htmlFor="settings-new-password" className="settings-form__label">
                  New password
                </label>
                <input
                  id="settings-new-password"
                  type="password"
                  className="settings-form__input"
                  value={fields.password}
                  onChange={(event) =>
                    setFields((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </div>

              <div className="settings-form__field">
                <label htmlFor="settings-confirm-password" className="settings-form__label">
                  Confirm new password
                </label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  className="settings-form__input"
                  value={fields.confirmPassword}
                  onChange={(event) =>
                    setFields((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="settings-form__actions">
              <button
                type="submit"
                className="settings-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}
