export interface Session {
  session_id: number
  name: string
  user_id: number
  bookmark_ids: number[]
}

export interface CreateSessionInput {
  name: string
}

export interface RenameSessionInput {
  name: string
}

export const SESSION_NAME_MAX_LENGTH = 255

export function validateSessionName(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'Session name is required.'
  }

  if (trimmed.length > SESSION_NAME_MAX_LENGTH) {
    return `Session name must be ${SESSION_NAME_MAX_LENGTH} characters or fewer.`
  }

  return null
}
