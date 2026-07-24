import { useEffect } from 'react'
import { Session } from '@renderer/types/session'
import '../Sidebar/folder-context-menu.css'

interface SessionContextMenuProps {
  session: Session
  position: { x: number; y: number }
  onClose: () => void
  onRename: (session: Session) => void
  onDelete: (session: Session) => void
}

function SessionContextMenu({
  session,
  position,
  onClose,
  onRename,
  onDelete,
}: SessionContextMenuProps) {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !target.closest('.sidebar__context-menu')) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', onClose, true)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  return (
    <div
      className="sidebar__context-menu"
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      <button
        type="button"
        className="sidebar__context-menu-item"
        role="menuitem"
        onClick={() => {
          onRename(session)
          onClose()
        }}
      >
        Rename session
      </button>
      <button
        type="button"
        className="sidebar__context-menu-item sidebar__context-menu-item--danger"
        role="menuitem"
        onClick={() => {
          onDelete(session)
          onClose()
        }}
      >
        Delete session
      </button>
    </div>
  )
}

export default SessionContextMenu
