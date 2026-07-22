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
import { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from '@renderer/types/bookmark'

interface BookmarksContextValue {
  bookmarks: Bookmark[]
  isLoading: boolean
  isAddModalOpen: boolean
  editTarget: Bookmark | null
  deleteTarget: Bookmark | null
  openAddModal: () => void
  closeAddModal: () => void
  openEditModal: (bookmark: Bookmark) => void
  closeEditModal: () => void
  openDeleteModal: (bookmark: Bookmark) => void
  closeDeleteModal: () => void
  loadBookmarks: () => Promise<void>
  createBookmark: (input: CreateBookmarkInput) => Promise<{ success: boolean; message?: string }>
  updateBookmark: (
    bookmarkId: number,
    input: UpdateBookmarkInput,
  ) => Promise<{ success: boolean; message?: string }>
  deleteBookmark: (bookmarkId: number) => Promise<{ success: boolean; message?: string }>
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined)

export function BookmarksProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bookmark | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null)

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

  const updateBookmark = useCallback(
    async (bookmarkId: number, input: UpdateBookmarkInput) => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to update bookmark',
          }
        }

        const bookmark = responseJSON as Bookmark
        setBookmarks((current) =>
          current.map((item) => (item.bookmark_id === bookmarkId ? bookmark : item)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to update bookmark.', error)
        return { success: false, message: 'Unable to update bookmark' }
      }
    },
    [auth],
  )

  const deleteBookmark = useCallback(
    async (bookmarkId: number) => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to delete bookmark',
          }
        }

        setBookmarks((current) =>
          current.filter((bookmark) => bookmark.bookmark_id !== bookmarkId),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to delete bookmark.', error)
        return { success: false, message: 'Unable to delete bookmark' }
      }
    },
    [auth],
  )

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      isLoading,
      isAddModalOpen,
      editTarget,
      deleteTarget,
      openAddModal: () => setIsAddModalOpen(true),
      closeAddModal: () => setIsAddModalOpen(false),
      openEditModal: (bookmark) => setEditTarget(bookmark),
      closeEditModal: () => setEditTarget(null),
      openDeleteModal: (bookmark) => setDeleteTarget(bookmark),
      closeDeleteModal: () => setDeleteTarget(null),
      loadBookmarks,
      createBookmark,
      updateBookmark,
      deleteBookmark,
    }),
    [
      bookmarks,
      isLoading,
      isAddModalOpen,
      editTarget,
      deleteTarget,
      loadBookmarks,
      createBookmark,
      updateBookmark,
      deleteBookmark,
    ],
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
