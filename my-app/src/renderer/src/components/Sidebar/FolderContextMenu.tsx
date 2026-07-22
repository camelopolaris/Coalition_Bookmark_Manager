import { useEffect } from 'react'
import { Folder } from '@renderer/types/folder'
import './folder-context-menu.css'

interface FolderContextMenuProps {
  folder: Folder
  position: { x: number; y: number }
  onClose: () => void
  onRename: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

function FolderContextMenu({ folder, position, onClose, onRename, onDelete }: FolderContextMenuProps) {
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
          onRename(folder)
          onClose()
        }}
      >
        Rename folder
      </button>
      <button
        type="button"
        className="sidebar__context-menu-item sidebar__context-menu-item--danger"
        role="menuitem"
        onClick={() => {
          onDelete(folder)
          onClose()
        }}
      >
        Delete folder
      </button>
    </div>
  )
}

export default FolderContextMenu
