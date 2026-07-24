import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'
import { Bookmark } from '@renderer/types/bookmark'
import { CreateSessionInput, RenameSessionInput, Session } from '@renderer/types/session'
import { openBookmarksInBrowser } from '@renderer/utils/openBookmarks'

interface SessionsContextValue {
  sessions: Session[]
  isLoading: boolean
  selectedSessionId: number | null
  isCreateModalOpen: boolean
  renameTarget: Session | null
  deleteTarget: Session | null
  loadSessions: () => Promise<void>
  selectSession: (sessionId: number | null) => void
  clearSelectedSession: () => void
  openCreateSessionModal: () => void
  closeCreateSessionModal: () => void
  openRenameSessionModal: (session: Session) => void
  closeRenameSessionModal: () => void
  openDeleteSessionModal: (session: Session) => void
  closeDeleteSessionModal: () => void
  createSession: (input: CreateSessionInput) => Promise<{ success: boolean; message?: string }>
  renameSession: (
    sessionId: number,
    input: RenameSessionInput,
  ) => Promise<{ success: boolean; message?: string }>
  deleteSession: (sessionId: number) => Promise<{ success: boolean; message?: string }>
  addBookmarkToSession: (
    sessionId: number,
    bookmarkId: number,
  ) => Promise<{ success: boolean; message?: string }>
  removeBookmarkFromSession: (
    sessionId: number,
    bookmarkId: number,
  ) => Promise<{ success: boolean; message?: string }>
  openAllInSession: (sessionId: number, bookmarks: Bookmark[]) => Promise<void>
}

const SessionsContext = createContext<SessionsContextValue | undefined>(undefined)

export function SessionsProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Session | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await auth.fetchWithAuth('/sessions')

      if (!response?.ok) {
        setSessions([])
        return
      }

      const data = (await response.json()) as Session[]
      setSessions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load sessions.', error)
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [auth])

  useEffect(() => {
    if (auth.isAuth) {
      loadSessions()
    } else {
      setSessions([])
      setIsLoading(false)
      setSelectedSessionId(null)
    }
  }, [auth.isAuth, loadSessions])

  const createSession = useCallback(
    async (input: CreateSessionInput) => {
      try {
        const response = await auth.fetchWithAuth('/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to create session',
          }
        }

        const session = responseJSON as Session
        setSessions((current) => [...current, session].sort((a, b) => a.name.localeCompare(b.name)))
        return { success: true }
      } catch (error) {
        console.error('Failed to create session.', error)
        return { success: false, message: 'Unable to create session' }
      }
    },
    [auth],
  )

  const renameSession = useCallback(
    async (sessionId: number, input: RenameSessionInput) => {
      try {
        const response = await auth.fetchWithAuth(`/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to rename session',
          }
        }

        const session = responseJSON as Session
        setSessions((current) =>
          current
            .map((item) => (item.session_id === sessionId ? session : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to rename session.', error)
        return { success: false, message: 'Unable to rename session' }
      }
    },
    [auth],
  )

  const deleteSession = useCallback(
    async (sessionId: number) => {
      try {
        const response = await auth.fetchWithAuth(`/sessions/${sessionId}`, {
          method: 'DELETE',
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to delete session',
          }
        }

        setSessions((current) => current.filter((session) => session.session_id !== sessionId))
        setSelectedSessionId((current) => (current === sessionId ? null : current))
        return { success: true }
      } catch (error) {
        console.error('Failed to delete session.', error)
        return { success: false, message: 'Unable to delete session' }
      }
    },
    [auth],
  )

  const addBookmarkToSession = useCallback(
    async (sessionId: number, bookmarkId: number) => {
      try {
        const response = await auth.fetchWithAuth(`/sessions/${sessionId}/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookmark_id: bookmarkId }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to add bookmark to session',
          }
        }

        const session = responseJSON as Session
        setSessions((current) =>
          current.map((item) => (item.session_id === sessionId ? session : item)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to add bookmark to session.', error)
        return { success: false, message: 'Unable to add bookmark to session' }
      }
    },
    [auth],
  )

  const removeBookmarkFromSession = useCallback(
    async (sessionId: number, bookmarkId: number) => {
      try {
        const response = await auth.fetchWithAuth(
          `/sessions/${sessionId}/bookmarks/${bookmarkId}`,
          {
            method: 'DELETE',
          },
        )

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to remove bookmark from session',
          }
        }

        const session = responseJSON as Session
        setSessions((current) =>
          current.map((item) => (item.session_id === sessionId ? session : item)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to remove bookmark from session.', error)
        return { success: false, message: 'Unable to remove bookmark from session' }
      }
    },
    [auth],
  )

  const openAllInSession = useCallback(
    async (sessionId: number, bookmarks: Bookmark[]) => {
      const session = sessions.find((item) => item.session_id === sessionId)
      if (!session) {
        return
      }

      const bookmarkMap = new Map(bookmarks.map((bookmark) => [bookmark.bookmark_id, bookmark.url]))
      const urls = session.bookmark_ids
        .map((bookmarkId) => bookmarkMap.get(bookmarkId))
        .filter((url): url is string => Boolean(url))

      await openBookmarksInBrowser(urls)
    },
    [sessions],
  )

  const value = useMemo<SessionsContextValue>(
    () => ({
      sessions,
      isLoading,
      selectedSessionId,
      isCreateModalOpen,
      renameTarget,
      deleteTarget,
      loadSessions,
      selectSession: setSelectedSessionId,
      clearSelectedSession: () => setSelectedSessionId(null),
      openCreateSessionModal: () => setIsCreateModalOpen(true),
      closeCreateSessionModal: () => setIsCreateModalOpen(false),
      openRenameSessionModal: (session) => setRenameTarget(session),
      closeRenameSessionModal: () => setRenameTarget(null),
      openDeleteSessionModal: (session) => setDeleteTarget(session),
      closeDeleteSessionModal: () => setDeleteTarget(null),
      createSession,
      renameSession,
      deleteSession,
      addBookmarkToSession,
      removeBookmarkFromSession,
      openAllInSession,
    }),
    [
      sessions,
      isLoading,
      selectedSessionId,
      isCreateModalOpen,
      renameTarget,
      deleteTarget,
      loadSessions,
      createSession,
      renameSession,
      deleteSession,
      addBookmarkToSession,
      removeBookmarkFromSession,
      openAllInSession,
    ],
  )

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>
}

export function useSessions() {
  const context = useContext(SessionsContext)

  if (!context) {
    throw new Error('useSessions requires SessionsProvider')
  }

  return context
}
