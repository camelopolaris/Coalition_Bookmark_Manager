import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'

interface SearchContextValue {
  search: string
  setSearch: (value: string) => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export function SearchProvider({ children }: PropsWithChildren) {
  const [search, setSearch] = useState('')

  const value = useMemo(() => ({ search, setSearch }), [search])

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)

  if (!context) {
    throw new Error('useSearch requires SearchProvider')
  }

  return context
}
