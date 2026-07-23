export interface User {
  user_id: number
  username: string
}

export interface AccountSettingsFields {
  username: string
  password: string
  confirmPassword: string
  currentPassword: string
}

export interface UpdateAccountInput {
  username?: string
  password?: string
  current_password?: string
}

export const USERNAME_MAX_LENGTH = 255

export function createEmptyAccountSettingsFields(username = ''): AccountSettingsFields {
  return {
    username,
    password: '',
    confirmPassword: '',
    currentPassword: '',
  }
}

export function validateAccountSettingsFields(
  fields: AccountSettingsFields,
  currentUsername: string,
): string | null {
  const trimmedUsername = fields.username.trim()
  const trimmedPassword = fields.password.trim()
  const trimmedConfirmPassword = fields.confirmPassword.trim()
  const trimmedCurrentPassword = fields.currentPassword.trim()

  const isUsernameChanged = trimmedUsername !== currentUsername
  const isPasswordChanged = trimmedPassword.length > 0

  if (!isUsernameChanged && !isPasswordChanged) {
    return 'Update your username, password, or both.'
  }

  if (isUsernameChanged) {
    if (!trimmedUsername) {
      return 'Username is required.'
    }

    if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
      return `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`
    }
  }

  if (isPasswordChanged) {
    if (!trimmedCurrentPassword) {
      return 'Current password is required to change your password.'
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return 'New passwords do not match.'
    }
  }

  return null
}

export function buildUpdateAccountInput(
  fields: AccountSettingsFields,
  currentUsername: string,
): UpdateAccountInput {
  const input: UpdateAccountInput = {}
  const trimmedUsername = fields.username.trim()
  const trimmedPassword = fields.password.trim()
  const trimmedCurrentPassword = fields.currentPassword.trim()

  if (trimmedUsername !== currentUsername) {
    input.username = trimmedUsername
  }

  if (trimmedPassword) {
    input.password = trimmedPassword
    input.current_password = trimmedCurrentPassword
  }

  return input
}
