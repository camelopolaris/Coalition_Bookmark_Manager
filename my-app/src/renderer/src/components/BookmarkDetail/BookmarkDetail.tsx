import { Bookmark } from '@renderer/types/bookmark'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import './bookmark-detail.css'

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

interface BookmarkDetailProps {
  bookmark: Bookmark
}

function BookmarkDetail({ bookmark }: BookmarkDetailProps) {
  const { clearSelectedBookmark, openEditModal, openDeleteModal } = useBookmarks()
  const hostname = getHostname(bookmark.url)

  return (
    <div className="bookmark-detail">
      <button type="button" className="bookmark-detail__back" onClick={clearSelectedBookmark}>
        ← Back to bookmarks
      </button>

      <article className="bookmark-detail__panel">
        <div className="bookmark-detail__preview">
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
          <span className="bookmark-detail__fallback" style={{ display: 'none' }}>
            {getInitial(bookmark.name)}
          </span>
        </div>

        <div className="bookmark-detail__content">
          <div className="bookmark-detail__header">
            <h1 className="bookmark-detail__title">{bookmark.name}</h1>

            <div className="bookmark-detail__actions">
              <button
                type="button"
                className="bookmark-detail__action"
                aria-label={`Edit ${bookmark.name}`}
                onClick={() => openEditModal(bookmark)}
              >
                <EditIcon />
              </button>
              <button
                type="button"
                className="bookmark-detail__action"
                aria-label={`Delete ${bookmark.name}`}
                onClick={() => openDeleteModal(bookmark)}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>

          <section className="bookmark-detail__section">
            <h2 className="bookmark-detail__section-title">URL</h2>
            <a
              href={bookmark.url}
              className="bookmark-detail__url"
              target="_blank"
              rel="noreferrer"
            >
              {bookmark.url}
            </a>
            <p className="bookmark-detail__meta">{hostname}</p>
          </section>

          <a
            href={bookmark.url}
            className="bookmark-detail__open-link"
            target="_blank"
            rel="noreferrer"
          >
            Open bookmark
          </a>
        </div>
      </article>
    </div>
  )
}

export default BookmarkDetail
