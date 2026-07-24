import { MouseEvent, useMemo, useState } from 'react'
import { Bookmark } from '@renderer/types/bookmark'
import { Session } from '@renderer/types/session'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { useSessions } from '@renderer/contexts/SessionsContext'
import { setBookmarkDragData } from '@renderer/constants/drag'
import { useSessionDropTarget } from '@renderer/hooks/useSessionDropTarget'
import SessionContextMenu from '@renderer/components/Sidebar/SessionContextMenu'

function SessionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v2H8v-2zm0 3h5v2H8v-2z" />
    </svg>
  )
}

interface SessionContextMenuState {
  session: Session
  x: number
  y: number
}

interface SessionBookmarkItemProps {
  bookmark: Bookmark
  sessionId: number
  onRemove: (sessionId: number, bookmarkId: number) => void
}

function SessionBookmarkItem({ bookmark, sessionId, onRemove }: SessionBookmarkItemProps) {
  const { selectedBookmarkId, selectBookmark } = useBookmarks()
  const isActive = selectedBookmarkId === bookmark.bookmark_id

  return (
    <button
      type="button"
      className={`sidebar__tree-item sidebar__tree-item--bookmark ${isActive ? 'sidebar__tree-item--active' : ''}`}
      style={{ paddingLeft: '1.85rem' }}
      draggable
      onDragStart={(event) => {
        setBookmarkDragData(event.dataTransfer, bookmark.bookmark_id)
        event.stopPropagation()
      }}
      onClick={() => selectBookmark(bookmark.bookmark_id)}
      onContextMenu={(event) => {
        event.preventDefault()
        onRemove(sessionId, bookmark.bookmark_id)
      }}
      title="Right-click to remove from session"
    >
      <span className="sidebar__tree-toggle-spacer" aria-hidden="true" />
      <span className="sidebar__tree-label">{bookmark.name}</span>
    </button>
  )
}

interface SessionTreeItemProps {
  session: Session
  bookmarks: Bookmark[]
  onContextMenu: (event: MouseEvent<HTMLDivElement>, session: Session) => void
}

function SessionTreeItem({ session, bookmarks, onContextMenu }: SessionTreeItemProps) {
  const { selectedSessionId, selectSession, addBookmarkToSession, removeBookmarkFromSession, openAllInSession } =
    useSessions()
  const { clearSelectedBookmark } = useBookmarks()
  const { selectFolder } = useFolders()

  const sessionBookmarks = useMemo(() => {
    const bookmarkMap = new Map(bookmarks.map((bookmark) => [bookmark.bookmark_id, bookmark]))

    return session.bookmark_ids
      .map((bookmarkId) => bookmarkMap.get(bookmarkId))
      .filter((bookmark): bookmark is Bookmark => Boolean(bookmark))
  }, [bookmarks, session.bookmark_ids])

  const [isExpanded, setIsExpanded] = useState(sessionBookmarks.length > 0)
  const isActive = selectedSessionId === session.session_id

  const { isDragOver, dropTargetProps } = useSessionDropTarget(
    session.session_id,
    session.bookmark_ids,
    () => {
      selectSession(session.session_id)
      selectFolder('all')
      setIsExpanded(true)
    },
    addBookmarkToSession,
  )

  const handleSessionActivate = () => {
    setIsExpanded((current) => !current)
    selectSession(session.session_id)
    selectFolder('all')
    clearSelectedBookmark()
  }

  const handleOpenAll = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    selectSession(session.session_id)
    selectFolder('all')
    clearSelectedBookmark()
    await openAllInSession(sessionBookmarks)
  }

  return (
    <div className="sidebar__folder-group">
      <div
        className={`sidebar__session-drop-zone ${isDragOver ? 'sidebar__session-drop-zone--drag-over' : ''}`}
        {...dropTargetProps}
      >
        <div
          className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''}`}
          onContextMenu={(event) => onContextMenu(event, session)}
        >
          <button
            type="button"
            className="sidebar__tree-toggle"
            aria-label={isExpanded ? 'Collapse session' : 'Expand session'}
            onClick={handleSessionActivate}
          >
            {isExpanded ? '▾' : '▸'}
          </button>

          <span className="sidebar__folder-icon sidebar__folder-icon--session">
            <SessionIcon />
          </span>

          <button
            type="button"
            className="sidebar__tree-label sidebar__tree-label--folder"
            onClick={handleSessionActivate}
          >
            {session.name}
          </button>
        </div>

        {isExpanded ? (
          <div className="sidebar__folder-children">
            {sessionBookmarks.map((bookmark) => (
              <SessionBookmarkItem
                key={bookmark.bookmark_id}
                bookmark={bookmark}
                sessionId={session.session_id}
                onRemove={removeBookmarkFromSession}
              />
            ))}

            {sessionBookmarks.length === 0 ? (
              <p className="sidebar__session-empty">Drag bookmarks here to add them.</p>
            ) : null}

            <div className="sidebar__session-actions">
              <button
                type="button"
                className="sidebar__session-open-all"
                onClick={handleOpenAll}
                disabled={sessionBookmarks.length === 0}
              >
                Open all
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SessionsSection() {
  const {
    sessions,
    isLoading,
    openCreateSessionModal,
    openRenameSessionModal,
    openDeleteSessionModal,
  } = useSessions()
  const { bookmarks } = useBookmarks()
  const [contextMenu, setContextMenu] = useState<SessionContextMenuState | null>(null)

  const handleSessionContextMenu = (event: MouseEvent<HTMLDivElement>, session: Session) => {
    event.preventDefault()
    setContextMenu({
      session,
      x: event.clientX,
      y: event.clientY,
    })
  }

  return (
    <section className="sidebar__sessions">
      <div className="sidebar__sessions-header">
        <h2 className="sidebar__sessions-title">Sessions</h2>
        <button type="button" className="sidebar__new-folder" onClick={openCreateSessionModal}>
          + New session
        </button>
      </div>

      {isLoading ? <p className="sidebar__status">Loading sessions...</p> : null}

      {!isLoading && sessions.length === 0 ? (
        <p className="sidebar__status">No sessions yet.</p>
      ) : null}

      {sessions.map((session) => (
        <SessionTreeItem
          key={session.session_id}
          session={session}
          bookmarks={bookmarks}
          onContextMenu={handleSessionContextMenu}
        />
      ))}

      {contextMenu ? (
        <SessionContextMenu
          session={contextMenu.session}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={openRenameSessionModal}
          onDelete={openDeleteSessionModal}
        />
      ) : null}
    </section>
  )
}

export default SessionsSection
