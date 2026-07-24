import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'

const SEARCH_DEBOUNCE_MS = 300

interface SearchContextValue {
  search: string
  setSearch: (value: string) => void
  semanticBookmarkIds: number[] | null
  isSearchLoading: boolean
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export function SearchProvider({ children }: PropsWithChildren) {
  const { fetchWithAuth, isAuth } = useAuth()
  const [search, setSearch] = useState('')
  const [semanticBookmarkIds, setSemanticBookmarkIds] = useState<number[] | null>(null)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const query = search.trim()

    if (!query) {
      setSemanticBookmarkIds(null)
      setIsSearchLoading(false)
      return
    }

    if (!isAuth) {
      return
    }

    setSemanticBookmarkIds(null)
    setIsSearchLoading(true)

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current

      try {
        const response = await fetchWithAuth(
          `/bookmarks/semantic-search?q=${encodeURIComponent(query)}`,
        )

        if (requestId !== requestIdRef.current) {
          return
        }

        if (!response?.ok) {
          setSemanticBookmarkIds(null)
          return
        }

        const results: { bookmark_id: number }[] = await response.json()
        setSemanticBookmarkIds(results.map((item) => item.bookmark_id))
      } catch {
        if (requestId === requestIdRef.current) {
          setSemanticBookmarkIds(null)
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearchLoading(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search, fetchWithAuth, isAuth])

  const value = useMemo(
    () => ({
      search,
      setSearch,
      semanticBookmarkIds,
      isSearchLoading,
    }),
    [search, semanticBookmarkIds, isSearchLoading],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)

  if (!context) {
    throw new Error('useSearch requires SearchProvider')
  }

  return context
}
