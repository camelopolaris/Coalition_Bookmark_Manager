import { Bookmark } from '@renderer/types/bookmark'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import './bookmark-card.css'

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  )
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function getInitial(name: string) {
  return name.trim().charAt(0) || '?'
}

interface BookmarkCardProps {
  bookmark: Bookmark
}

function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const { openDeleteModal } = useBookmarks()
  const hostname = getHostname(bookmark.url)

  return (
    <article className="bookmark-card">
      <div className="bookmark-card__preview">
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            const fallback = event.currentTarget.nextElementSibling
            if (fallback instanceof HTMLElement) {
              fallback.style.display = 'flex'
            }
          }}
        />
        <span className="bookmark-card__fallback" style={{ display: 'none' }}>
          {getInitial(bookmark.name)}
        </span>
      </div>

      <div className="bookmark-card__body">
        <div className="bookmark-card__info">
          <h3 className="bookmark-card__title">{bookmark.name}</h3>
          <p className="bookmark-card__url">{bookmark.url}</p>
        </div>

        <div className="bookmark-card__actions">
          <button type="button" className="bookmark-card__action" aria-label={`Edit ${bookmark.name}`}>
            <EditIcon />
          </button>
          <button
            type="button"
            className="bookmark-card__action"
            aria-label={`Delete ${bookmark.name}`}
            onClick={() => openDeleteModal(bookmark)}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </article>
  )
}

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  isLoading?: boolean
}

export function BookmarkGrid({ bookmarks, isLoading }: BookmarkGridProps) {
  if (isLoading) {
    return <p className="bookmark-grid__loading">Loading bookmarks...</p>
  }

  if (bookmarks.length === 0) {
    return <p className="bookmark-grid__empty">No bookmarks found.</p>
  }

  return (
    <div className="bookmark-grid">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.bookmark_id} bookmark={bookmark} />
      ))}
    </div>
  )
}

export default BookmarkCard
