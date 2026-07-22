import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@renderer/components/Sidebar/Sidebar'
import { BookmarkGrid } from '@renderer/components/BookmarkCard/BookmarkCard'
import { useSearch } from '@renderer/contexts/SearchContext'
import { Bookmark, MOCK_BOOKMARKS } from '@renderer/types/bookmark'
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
  const { auth } = Route.useRouteContext()
  const { search } = useSearch()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadBookmarks() {
      setIsLoading(true)

      try {
        const response = await auth.fetchWithAuth('/bookmarks')

        if (response?.ok) {
          const data = (await response.json()) as Bookmark[]
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setBookmarks(data)
            return
          }
        }
      } catch (error) {
        console.error('Failed to load bookmarks.', error)
      }

      if (isMounted) {
        setBookmarks(MOCK_BOOKMARKS)
      }
    }

    loadBookmarks().finally(() => {
      if (isMounted) {
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [auth])

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
