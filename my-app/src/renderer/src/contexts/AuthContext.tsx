import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'

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
  handleLoginAttempt: (username: string, password: string) => Promise<boolean>
  handleSignup: (username: string, password: string) => Promise<boolean>
  handleLogout: () => Promise<void>
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
      if (nextToken) {
        window.localStorage.setItem(STORAGE_KEY, nextToken)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
      setToken(nextToken)
      setIsAuth(Boolean(nextToken || responseJSON?.success))
      return Boolean(nextToken || responseJSON?.success)
    } catch (error) {
      console.error('Failed to login.', error)
      window.localStorage.removeItem(STORAGE_KEY)
      setToken(null)
      setIsAuth(false)
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
      if (nextToken) {
        window.localStorage.setItem(STORAGE_KEY, nextToken)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
      setToken(nextToken)
      setIsAuth(Boolean(nextToken || responseJSON?.success))
      return Boolean(nextToken || responseJSON?.success)
    } catch (error) {
      console.error('Failed to signup.', error)
      window.localStorage.removeItem(STORAGE_KEY)
      setToken(null)
      setIsAuth(false)
      return false
    }
  }

  async function handleLogout() {
    window.localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setIsAuth(false)
  }

  async function fetchWithAuth(endpoint: RequestInfo, options: RequestInit = {}) {
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
        await handleLogout()
        return undefined
      }
      return response
    } catch (error) {
      console.error('Request failed.', error)
      return undefined
    }
  }

  const value = useMemo<AuthState>(
    () => ({
      isAuth,
      token,
      handleLoginAttempt,
      handleSignup,
      handleLogout,
      fetchWithAuth,
    }),
    [isAuth, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
