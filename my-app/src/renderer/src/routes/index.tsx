import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo } from 'react'
import Sidebar from '@renderer/components/Sidebar/Sidebar'
import { BookmarkGrid } from '@renderer/components/BookmarkCard/BookmarkCard'
import BookmarkDetail from '@renderer/components/BookmarkDetail/BookmarkDetail'
import '@renderer/components/BookmarkDetail/bookmark-detail.css'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { useSessions } from '@renderer/contexts/SessionsContext'
import { useSearch } from '@renderer/contexts/SearchContext'
import './home.css'

export const Route = createFileRoute('/')({
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
  component: HomePage,
})

function HomePage() {
  const { bookmarks, isLoading, selectedBookmarkId, clearSelectedBookmark } = useBookmarks()
  const { selectedFolderId } = useFolders()
  const { selectedSessionId, sessions } = useSessions()
  const { search } = useSearch()

  const folderFilteredBookmarks = useMemo(() => {
    if (selectedSessionId !== null) {
      const session = sessions.find((item) => item.session_id === selectedSessionId)
      if (!session) {
        return []
      }

      const bookmarkIdSet = new Set(session.bookmark_ids)
      return bookmarks.filter((bookmark) => bookmarkIdSet.has(bookmark.bookmark_id))
    }

    if (selectedFolderId === 'all') {
      return bookmarks
    }

    if (selectedFolderId === null) {
      return bookmarks.filter((bookmark) => bookmark.folder_id === null)
    }

    return bookmarks.filter((bookmark) => bookmark.folder_id === selectedFolderId)
  }, [bookmarks, selectedFolderId, selectedSessionId, sessions])

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return folderFilteredBookmarks
    }

    return folderFilteredBookmarks.filter(
      (bookmark) =>
        bookmark.name.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query),
    )
  }, [folderFilteredBookmarks, search])

  const selectedBookmark = useMemo(
    () => bookmarks.find((bookmark) => bookmark.bookmark_id === selectedBookmarkId) ?? null,
    [bookmarks, selectedBookmarkId],
  )

  return (
    <div className="home-layout">
      <Sidebar />
      <main className="home-main">
        {selectedBookmarkId !== null ? (
          selectedBookmark ? (
            <BookmarkDetail bookmark={selectedBookmark} />
          ) : (
            <div className="bookmark-detail__not-found">
              <p>Bookmark not found.</p>
              <button type="button" className="bookmark-detail__back" onClick={clearSelectedBookmark}>
                ← Back to bookmarks
              </button>
            </div>
          )
        ) : (
          <BookmarkGrid bookmarks={filteredBookmarks} isLoading={isLoading} />
        )}
      </main>
    </div>
  )
}
