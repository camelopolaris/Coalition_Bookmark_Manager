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
import { Bookmark, CreateBookmarkInput } from '@renderer/types/bookmark'

interface BookmarksContextValue {
  bookmarks: Bookmark[]
  isLoading: boolean
  isAddModalOpen: boolean
  openAddModal: () => void
  closeAddModal: () => void
  loadBookmarks: () => Promise<void>
  createBookmark: (input: CreateBookmarkInput) => Promise<{ success: boolean; message?: string }>
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined)

export function BookmarksProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await auth.fetchWithAuth('/bookmarks')

      if (!response?.ok) {
        setBookmarks([])
        return
      }

      const data = (await response.json()) as Bookmark[]
      setBookmarks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load bookmarks.', error)
      setBookmarks([])
    } finally {
      setIsLoading(false)
    }
  }, [auth])

  useEffect(() => {
    if (auth.isAuth) {
      loadBookmarks()
    } else {
      setBookmarks([])
      setIsLoading(false)
    }
  }, [auth.isAuth, loadBookmarks])

  const createBookmark = useCallback(
    async (input: CreateBookmarkInput) => {
      try {
        const response = await auth.fetchWithAuth('/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to create bookmark',
          }
        }

        const bookmark = responseJSON as Bookmark
        setBookmarks((current) => [bookmark, ...current])
        return { success: true }
      } catch (error) {
        console.error('Failed to create bookmark.', error)
        return { success: false, message: 'Unable to create bookmark' }
      }
    },
    [auth],
  )

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      isLoading,
      isAddModalOpen,
      openAddModal: () => setIsAddModalOpen(true),
      closeAddModal: () => setIsAddModalOpen(false),
      loadBookmarks,
      createBookmark,
    }),
    [bookmarks, isLoading, isAddModalOpen, loadBookmarks, createBookmark],
  )

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>
}

export function useBookmarks() {
  const context = useContext(BookmarksContext)

  if (!context) {
    throw new Error('useBookmarks requires BookmarksProvider')
  }

  return context
}
