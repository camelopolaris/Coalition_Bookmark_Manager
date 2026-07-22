import { DragEvent, MouseEvent, useMemo, useState } from 'react'
import { Bookmark } from '@renderer/types/bookmark'
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

interface SidebarBookmarkItemProps {
  bookmark: Bookmark
  depth: number
}

function SidebarBookmarkItem({ bookmark, depth }: SidebarBookmarkItemProps) {
  const { selectedBookmarkId, selectBookmark } = useBookmarks()
  const isActive = selectedBookmarkId === bookmark.bookmark_id

  return (
    <button
      type="button"
      className={`sidebar__tree-item sidebar__tree-item--bookmark ${isActive ? 'sidebar__tree-item--active' : ''}`}
      style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(BOOKMARK_DRAG_MIME, String(bookmark.bookmark_id))
        event.dataTransfer.effectAllowed = 'move'
        event.stopPropagation()
      }}
      onClick={() => selectBookmark(bookmark.bookmark_id)}
    >
      <span className="sidebar__tree-toggle-spacer" aria-hidden="true" />
      <span className="sidebar__tree-label">{bookmark.name}</span>
    </button>
  )
}

interface FolderTreeItemProps {
  node: FolderTreeNode
  depth?: number
  bookmarks: Bookmark[]
  onFolderContextMenu: (event: MouseEvent<HTMLDivElement>, folder: Folder) => void
}

function FolderTreeItem({
  node,
  depth = 0,
  bookmarks,
  onFolderContextMenu,
}: FolderTreeItemProps) {
  const { selectedFolderId, selectFolder, openCreateFolderModal } = useFolders()
  const { openAddModal, moveBookmarkToFolder, clearSelectedBookmark } = useBookmarks()

  const folderBookmarks = useMemo(
    () =>
      bookmarks
        .filter((bookmark) => bookmark.folder_id === node.folder_id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [bookmarks, node.folder_id],
  )

  const hasSubfolders = node.children.length > 0
  const hasBookmarks = folderBookmarks.length > 0
  const [isExpanded, setIsExpanded] = useState(hasSubfolders || hasBookmarks)
  const [isDragOver, setIsDragOver] = useState(false)

  const isActive = selectedFolderId === node.folder_id

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
    setIsExpanded(true)
  }

  const handleSelectFolder = () => {
    selectFolder(node.folder_id)
    clearSelectedBookmark()
    setIsExpanded(true)
  }

  return (
    <div className="sidebar__folder-group">
      <div
        className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''} ${isDragOver ? 'sidebar__folder-row--drag-over' : ''}`}
        style={{ paddingLeft: `${0.45 + depth * 1.1}rem` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={(event) => onFolderContextMenu(event, node)}
      >
        <button
          type="button"
          className="sidebar__tree-toggle"
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? '▾' : '▸'}
        </button>

        <button type="button" className="sidebar__tree-label sidebar__tree-label--folder" onClick={handleSelectFolder}>
          {node.name}
        </button>
      </div>

      {isExpanded ? (
        <div className="sidebar__folder-children">
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.folder_id}
              node={child}
              depth={depth + 1}
              bookmarks={bookmarks}
              onFolderContextMenu={onFolderContextMenu}
            />
          ))}

          {folderBookmarks.map((bookmark) => (
            <SidebarBookmarkItem key={bookmark.bookmark_id} bookmark={bookmark} depth={depth + 1} />
          ))}

          <div
            className={`sidebar__folder-slot ${isDragOver ? 'sidebar__folder-slot--drag-over' : ''}`}
            style={{ paddingLeft: `${0.75 + (depth + 1) * 1.1}rem` }}
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
      ) : null}
    </div>
  )
}

interface UncategorizedSectionProps {
  bookmarks: Bookmark[]
}

function UncategorizedSection({ bookmarks }: UncategorizedSectionProps) {
  const { selectedFolderId, selectFolder } = useFolders()
  const { moveBookmarkToFolder, clearSelectedBookmark } = useBookmarks()
  const uncategorizedBookmarks = useMemo(
    () =>
      bookmarks
        .filter((bookmark) => bookmark.folder_id === null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [bookmarks],
  )

  const [isExpanded, setIsExpanded] = useState(uncategorizedBookmarks.length > 0)
  const [isDragOver, setIsDragOver] = useState(false)
  const isActive = selectedFolderId === null

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(BOOKMARK_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const bookmarkId = Number(event.dataTransfer.getData(BOOKMARK_DRAG_MIME))
    if (!Number.isInteger(bookmarkId)) {
      return
    }

    await moveBookmarkToFolder(bookmarkId, null)
    selectFolder(null)
    setIsExpanded(true)
  }

  return (
    <div className="sidebar__folder-group">
      <div
        className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''} ${isDragOver ? 'sidebar__folder-row--drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className="sidebar__tree-toggle"
          aria-label={isExpanded ? 'Collapse uncategorized' : 'Expand uncategorized'}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? '▾' : '▸'}
        </button>

        <button
          type="button"
          className="sidebar__tree-label sidebar__tree-label--folder"
          onClick={() => {
            selectFolder(null)
            clearSelectedBookmark()
          }}
        >
          Uncategorized
        </button>
      </div>

      {isExpanded
        ? uncategorizedBookmarks.map((bookmark) => (
            <SidebarBookmarkItem key={bookmark.bookmark_id} bookmark={bookmark} depth={1} />
          ))
        : null}
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
  const { bookmarks, clearSelectedBookmark } = useBookmarks()
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
        onClick={() => {
          selectFolder('all')
          clearSelectedBookmark()
        }}
      >
        All bookmarks
      </button>

      <UncategorizedSection bookmarks={bookmarks} />

      {isLoading ? <p className="sidebar__status">Loading folders...</p> : null}

      {!isLoading && folderTree.length === 0 ? (
        <p className="sidebar__status">No folders yet.</p>
      ) : null}

      {folderTree.map((node) => (
        <FolderTreeItem
          key={node.folder_id}
          node={node}
          bookmarks={bookmarks}
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
