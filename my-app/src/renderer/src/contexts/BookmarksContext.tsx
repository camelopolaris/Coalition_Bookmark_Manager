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
  selectedBookmarkId: number | null
  openAddModal: (folderId?: number | null) => void
  closeAddModal: () => void
  openEditModal: (bookmark: Bookmark) => void
  closeEditModal: () => void
  openDeleteModal: (bookmark: Bookmark) => void
  closeDeleteModal: () => void
  selectBookmark: (bookmarkId: number) => void
  clearSelectedBookmark: () => void
  loadBookmarks: () => Promise<void>
  createBookmark: (input: CreateBookmarkInput) => Promise<{ success: boolean; message?: string }>
  updateBookmark: (
    bookmarkId: number,
    input: UpdateBookmarkInput,
  ) => Promise<{ success: boolean; message?: string }>
  deleteBookmark: (bookmarkId: number) => Promise<{ success: boolean; message?: string }>
  moveBookmarkToFolder: (
    bookmarkId: number,
    folderId: number | null,
  ) => Promise<{ success: boolean; message?: string }>
  uncategorizeBookmarksInFolders: (folderIds: number[]) => void
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined)

export function BookmarksProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bookmark | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null)
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<number | null>(null)
  const [addBookmarkFolderId, setAddBookmarkFolderId] = useState<number | null | undefined>(
    undefined,
  )

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
      setSelectedBookmarkId(null)
    }
  }, [auth.isAuth, loadBookmarks])

  const createBookmark = useCallback(
    async (input: CreateBookmarkInput) => {
      try {
        const payload = {
          ...input,
          ...(addBookmarkFolderId !== undefined ? { folder_id: addBookmarkFolderId } : {}),
        }

        const response = await auth.fetchWithAuth('/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
    [auth, addBookmarkFolderId],
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
        setSelectedBookmarkId((current) => (current === bookmarkId ? null : current))
        return { success: true }
      } catch (error) {
        console.error('Failed to delete bookmark.', error)
        return { success: false, message: 'Unable to delete bookmark' }
      }
    },
    [auth],
  )

  const moveBookmarkToFolder = useCallback(
    async (bookmarkId: number, folderId: number | null) => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_id: folderId }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to move bookmark',
          }
        }

        const bookmark = responseJSON as Bookmark
        setBookmarks((current) =>
          current.map((item) => (item.bookmark_id === bookmarkId ? bookmark : item)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to move bookmark.', error)
        return { success: false, message: 'Unable to move bookmark' }
      }
    },
    [auth],
  )

  const uncategorizeBookmarksInFolders = useCallback((folderIds: number[]) => {
    const folderIdSet = new Set(folderIds)
    setBookmarks((current) =>
      current.map((bookmark) =>
        bookmark.folder_id !== null && folderIdSet.has(bookmark.folder_id)
          ? { ...bookmark, folder_id: null }
          : bookmark,
      ),
    )
  }, [])

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      isLoading,
      isAddModalOpen,
      editTarget,
      deleteTarget,
      selectedBookmarkId,
      openAddModal: (folderId?: number | null) => {
        setAddBookmarkFolderId(folderId)
        setIsAddModalOpen(true)
      },
      closeAddModal: () => {
        setIsAddModalOpen(false)
        setAddBookmarkFolderId(undefined)
      },
      openEditModal: (bookmark) => setEditTarget(bookmark),
      closeEditModal: () => setEditTarget(null),
      openDeleteModal: (bookmark) => setDeleteTarget(bookmark),
      closeDeleteModal: () => setDeleteTarget(null),
      selectBookmark: (bookmarkId) => setSelectedBookmarkId(bookmarkId),
      clearSelectedBookmark: () => setSelectedBookmarkId(null),
      loadBookmarks,
      createBookmark,
      updateBookmark,
      deleteBookmark,
      moveBookmarkToFolder,
      uncategorizeBookmarksInFolders,
    }),
    [
      bookmarks,
      isLoading,
      isAddModalOpen,
      editTarget,
      deleteTarget,
      selectedBookmarkId,
      loadBookmarks,
      createBookmark,
      updateBookmark,
      deleteBookmark,
      moveBookmarkToFolder,
      uncategorizeBookmarksInFolders,
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
