import { useRouter } from '@tanstack/react-router'
import { useAuth } from '@renderer/contexts/AuthContext'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { useSearch } from '@renderer/contexts/SearchContext'
import './navbar.css'

function CoalitionLogo() {
  return (
    <svg
      className="navbar__logo"
      viewBox="0 0 64 64"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="8" fill="#2c2416" />
      <path
        d="M10 42 L18 22 L26 34 L34 18 L42 30 L50 14 L54 42 Z"
        fill="#fbf8f1"
        opacity="0.9"
      />
      <rect x="10" y="44" width="44" height="6" rx="1" fill="#fbf8f1" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
    </svg>
  )
}

function Navbar() {
  const { search, setSearch } = useSearch()
  const { openAddModal } = useBookmarks()
  const { selectedFolderId } = useFolders()
  const auth = useAuth()
  const router = useRouter()

  const handleAddBookmark = () => {
    if (typeof selectedFolderId === 'number') {
      openAddModal(selectedFolderId)
      return
    }

    if (selectedFolderId === null) {
      openAddModal(null)
      return
    }

    openAddModal()
  }

  const handleLogout = async () => {
    await auth.handleLogout()
    await router.navigate({ to: '/login', search: { redirect: '/' } })
  }

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <CoalitionLogo />
        <span className="navbar__title">Coalition</span>
      </div>

      <div className="navbar__search">
        <input
          type="search"
          className="navbar__search-input"
          placeholder="Search for bookmarks here..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="navbar__search-button" aria-label="Search">
          <SearchIcon />
        </button>
      </div>

      <button type="button" className="navbar__add" aria-label="Add bookmark" onClick={handleAddBookmark}>
        +
      </button>

      <div className="navbar__actions">
        <button type="button" className="navbar__icon-button" aria-label="Profile" onClick={handleLogout} title="Logout">
          <ProfileIcon />
        </button>
        <button
          type="button"
          className="navbar__icon-button"
          aria-label="Settings"
          title="Settings"
          onClick={() => router.navigate({ to: '/settings' })}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  )
}

export default Navbar
