import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { UpdateAccountInput, User } from '@renderer/types/user'

const API_BASE_URL = (window.api as { getApiBaseUrl?: () => string } | undefined)?.getApiBaseUrl?.() || 'http://localhost:3000'
const STORAGE_KEY = 'coalition.auth.token'

function readStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(STORAGE_KEY)
}

export interface AuthState {
  isAuth: boolean
  token: string | null
  user: User | null
  isUserLoading: boolean
  handleLoginAttempt: (username: string, password: string) => Promise<boolean>
  handleSignup: (username: string, password: string) => Promise<boolean>
  handleLogout: () => Promise<void>
  updateAccount: (
    input: UpdateAccountInput,
  ) => Promise<{ success: boolean; message?: string; user?: User }>
  fetchWithAuth: (
    endpoint: RequestInfo,
    options?: RequestInit,
  ) => Promise<Response | undefined>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function useAuth() {
  const authObject = useContext(AuthContext)

  if (!authObject) {
    throw new Error('useAuth requires this component to have a wrapped AuthProvider')
  }

  return authObject
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [isAuth, setIsAuth] = useState(Boolean(readStoredToken()))
  const [user, setUser] = useState<User | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(Boolean(readStoredToken()))

  const persistSession = useCallback((nextToken: string | null, nextUser: User | null) => {
    if (nextToken) {
      window.localStorage.setItem(STORAGE_KEY, nextToken)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    setToken(nextToken)
    setIsAuth(Boolean(nextToken))
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setIsAuth(false)
    setUser(null)
    setIsUserLoading(false)
  }, [])

  const fetchWithAuth = useCallback(
    async (endpoint: RequestInfo, options: RequestInit = {}) => {
      if (!token) {
        return undefined
      }

      const requestUrl =
        typeof endpoint === 'string'
          ? `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
          : endpoint

      const headers = new Headers(options.headers ?? {})
      headers.set('Authorization', `Bearer ${token}`)

      try {
        const response = await fetch(requestUrl, { ...options, headers })
        if (response.status === 401) {
          clearSession()
          return undefined
        }
        return response
      } catch (error) {
        console.error('Request failed.', error)
        return undefined
      }
    },
    [clearSession, token],
  )

  const loadCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      setIsUserLoading(false)
      return null
    }

    setIsUserLoading(true)

    try {
      const response = await fetchWithAuth('/users/me')

      if (!response?.ok) {
        setUser(null)
        return null
      }

      const nextUser = (await response.json()) as User
      setUser(nextUser)
      return nextUser
    } catch (error) {
      console.error('Failed to load current user.', error)
      setUser(null)
      return null
    } finally {
      setIsUserLoading(false)
    }
  }, [fetchWithAuth, token])

  useEffect(() => {
    if (token) {
      loadCurrentUser()
      return
    }

    setUser(null)
    setIsUserLoading(false)
  }, [loadCurrentUser, token])

  async function handleLoginAttempt(username: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const responseJSON = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(responseJSON?.message || 'Login failed')
      }

      const nextToken = responseJSON?.token ?? null
      const nextUser = (responseJSON?.user as User | undefined) ?? null

      if (!nextToken) {
        clearSession()
        return false
      }

      persistSession(nextToken, nextUser)
      setIsUserLoading(false)
      return true
    } catch (error) {
      console.error('Failed to login.', error)
      clearSession()
      return false
    }
  }

  async function handleSignup(username: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const responseJSON = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(responseJSON?.message || 'Signup failed')
      }

      const nextToken = responseJSON?.token ?? null
      const nextUser = (responseJSON?.user as User | undefined) ?? null

      if (!nextToken) {
        clearSession()
        return false
      }

      persistSession(nextToken, nextUser)
      setIsUserLoading(false)
      return true
    } catch (error) {
      console.error('Failed to signup.', error)
      clearSession()
      return false
    }
  }

  async function handleLogout() {
    clearSession()
  }

  const updateAccount = useCallback(
    async (input: UpdateAccountInput) => {
      try {
        const response = await fetchWithAuth('/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to update account',
          }
        }

        const nextToken = (responseJSON?.token as string | undefined) ?? token
        const nextUser = (responseJSON?.user as User | undefined) ?? user

        if (nextToken && nextUser) {
          persistSession(nextToken, nextUser)
        } else if (nextUser) {
          setUser(nextUser)
        }

        return { success: true, user: nextUser ?? undefined }
      } catch (error) {
        console.error('Failed to update account.', error)
        return { success: false, message: 'Unable to update account' }
      }
    },
    [fetchWithAuth, persistSession, token, user],
  )

  const value = useMemo<AuthState>(
    () => ({
      isAuth,
      token,
      user,
      isUserLoading,
      handleLoginAttempt,
      handleSignup,
      handleLogout,
      updateAccount,
      fetchWithAuth,
    }),
    [isAuth, token, user, isUserLoading, updateAccount, fetchWithAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
