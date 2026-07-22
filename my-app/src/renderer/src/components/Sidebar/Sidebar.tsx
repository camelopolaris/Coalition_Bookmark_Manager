import { DragEvent, MouseEvent, useMemo, useState } from 'react'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { BOOKMARK_DRAG_MIME } from '@renderer/constants/drag'
import { Folder, FolderTreeNode, buildFolderTree } from '@renderer/types/folder'
import FolderContextMenu from '@renderer/components/Sidebar/FolderContextMenu'
import './sidebar.css'
import './folder-context-menu.css'

interface FolderContextMenuState {
  folder: Folder
  x: number
  y: number
}

interface FolderTreeItemProps {
  node: FolderTreeNode
  depth?: number
  onFolderContextMenu: (event: MouseEvent<HTMLDivElement>, folder: Folder) => void
}

function FolderTreeItem({ node, depth = 0, onFolderContextMenu }: FolderTreeItemProps) {
  const {
    selectedFolderId,
    selectFolder,
    openCreateFolderModal,
    openRenameFolderModal,
  } = useFolders()
  const { openAddModal, moveBookmarkToFolder } = useBookmarks()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const isActive = selectedFolderId === node.folder_id
  const hasChildren = node.children.length > 0

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(BOOKMARK_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const bookmarkId = Number(event.dataTransfer.getData(BOOKMARK_DRAG_MIME))
    if (!Number.isInteger(bookmarkId)) {
      return
    }

    await moveBookmarkToFolder(bookmarkId, node.folder_id)
    selectFolder(node.folder_id)
  }

  return (
    <div className="sidebar__folder-group" style={{ paddingLeft: `${depth * 0.75}rem` }}>
      <div
        className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''} ${isDragOver ? 'sidebar__folder-row--drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={(event) => onFolderContextMenu(event, node)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="sidebar__folder-toggle"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="sidebar__folder-toggle-spacer" />
        )}

        <button
          type="button"
          className="sidebar__folder-name"
          onClick={() => selectFolder(node.folder_id)}
        >
          {node.name}
        </button>

        <button
          type="button"
          className="sidebar__folder-action"
          aria-label={`Rename ${node.name}`}
          title="Rename folder"
          onClick={() => openRenameFolderModal(node)}
        >
          ✎
        </button>
      </div>

      {isExpanded && hasChildren
        ? node.children.map((child) => (
            <FolderTreeItem
              key={child.folder_id}
              node={child}
              depth={depth + 1}
              onFolderContextMenu={onFolderContextMenu}
            />
          ))
        : null}

      <div
        className={`sidebar__folder-slot ${isDragOver ? 'sidebar__folder-slot--drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className="sidebar__folder-slot-button"
          onClick={() => openAddModal(node.folder_id)}
        >
          + Add bookmark
        </button>
        <button
          type="button"
          className="sidebar__folder-slot-button sidebar__folder-slot-button--secondary"
          onClick={() => openCreateFolderModal(node.folder_id)}
        >
          + New subfolder
        </button>
      </div>
    </div>
  )
}

function Sidebar() {
  const {
    folders,
    isLoading,
    selectedFolderId,
    selectFolder,
    openCreateFolderModal,
    openRenameFolderModal,
    openDeleteFolderModal,
  } = useFolders()
  const { moveBookmarkToFolder } = useBookmarks()
  const [uncategorizedDragOver, setUncategorizedDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState<FolderContextMenuState | null>(null)

  const folderTree = useMemo(() => buildFolderTree(folders), [folders])

  const handleFolderContextMenu = (event: MouseEvent<HTMLDivElement>, folder: Folder) => {
    event.preventDefault()
    setContextMenu({
      folder,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleUncategorizedDragOver = (event: DragEvent<HTMLButtonElement>) => {
    if (!event.dataTransfer.types.includes(BOOKMARK_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setUncategorizedDragOver(true)
  }

  const handleUncategorizedDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setUncategorizedDragOver(false)

    const bookmarkId = Number(event.dataTransfer.getData(BOOKMARK_DRAG_MIME))
    if (!Number.isInteger(bookmarkId)) {
      return
    }

    await moveBookmarkToFolder(bookmarkId, null)
    selectFolder(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Folders</h2>
        <button
          type="button"
          className="sidebar__new-folder"
          onClick={() => openCreateFolderModal(null)}
        >
          + New folder
        </button>
      </div>

      <button
        type="button"
        className={`sidebar__nav-item ${selectedFolderId === 'all' ? 'sidebar__nav-item--active' : ''}`}
        onClick={() => selectFolder('all')}
      >
        All bookmarks
      </button>

      <button
        type="button"
        className={`sidebar__nav-item ${selectedFolderId === null ? 'sidebar__nav-item--active' : ''} ${uncategorizedDragOver ? 'sidebar__nav-item--drag-over' : ''}`}
        onClick={() => selectFolder(null)}
        onDragOver={handleUncategorizedDragOver}
        onDragLeave={() => setUncategorizedDragOver(false)}
        onDrop={handleUncategorizedDrop}
      >
        Uncategorized
      </button>

      {isLoading ? <p className="sidebar__status">Loading folders...</p> : null}

      {!isLoading && folderTree.length === 0 ? (
        <p className="sidebar__status">No folders yet.</p>
      ) : null}

      {folderTree.map((node) => (
        <FolderTreeItem
          key={node.folder_id}
          node={node}
          onFolderContextMenu={handleFolderContextMenu}
        />
      ))}

      {contextMenu ? (
        <FolderContextMenu
          folder={contextMenu.folder}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={openRenameFolderModal}
          onDelete={openDeleteFolderModal}
        />
      ) : null}
    </aside>
  )
}

export default Sidebar
