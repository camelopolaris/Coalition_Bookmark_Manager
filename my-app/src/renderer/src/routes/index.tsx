import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo } from 'react'
import Sidebar from '@renderer/components/Sidebar/Sidebar'
import { BookmarkGrid } from '@renderer/components/BookmarkCard/BookmarkCard'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
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
  const { bookmarks, isLoading } = useBookmarks()
  const { search } = useSearch()

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return bookmarks
    }

    return bookmarks.filter(
      (bookmark) =>
        bookmark.name.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query),
    )
  }, [bookmarks, search])

  return (
    <div className="home-layout">
      <Sidebar />
      <main className="home-main">
        <BookmarkGrid bookmarks={filteredBookmarks} isLoading={isLoading} />
      </main>
    </div>
  )
}
