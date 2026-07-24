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
  const { search, semanticBookmarkIds, isSearchLoading } = useSearch()

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
    const query = search.trim()
    if (!query) {
      return folderFilteredBookmarks
    }

    if (semanticBookmarkIds !== null) {
      const rankById = new Map(semanticBookmarkIds.map((id, index) => [id, index]))

      return folderFilteredBookmarks
        .filter((bookmark) => rankById.has(bookmark.bookmark_id))
        .sort(
          (left, right) =>
            (rankById.get(left.bookmark_id) ?? 0) - (rankById.get(right.bookmark_id) ?? 0),
        )
    }

    const normalizedQuery = query.toLowerCase()
    return folderFilteredBookmarks.filter(
      (bookmark) =>
        bookmark.name.toLowerCase().includes(normalizedQuery) ||
        bookmark.url.toLowerCase().includes(normalizedQuery),
    )
  }, [folderFilteredBookmarks, search, semanticBookmarkIds])

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
          <BookmarkGrid
            bookmarks={filteredBookmarks}
            isLoading={isLoading || isSearchLoading}
          />
        )}
      </main>
    </div>
  )
}
