import { MouseEvent, useMemo, useState } from 'react'
import { Bookmark } from '@renderer/types/bookmark'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import { useFolders } from '@renderer/contexts/FoldersContext'
import { useSessions } from '@renderer/contexts/SessionsContext'
import { setBookmarkDragData, setFolderDragData } from '@renderer/constants/drag'
import { useFolderDropTarget } from '@renderer/hooks/useFolderDropTarget'
import { Folder, FolderTreeNode, buildFolderTree } from '@renderer/types/folder'
import FolderContextMenu from '@renderer/components/Sidebar/FolderContextMenu'
import SessionsSection from '@renderer/components/Sidebar/SessionsSection'
import './sidebar.css'
import './folder-context-menu.css'

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  )
}

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
        setBookmarkDragData(event.dataTransfer, bookmark.bookmark_id)
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
  folders: Folder[]
  onFolderContextMenu: (event: MouseEvent<HTMLDivElement>, folder: Folder) => void
  moveFolder: (
    folderId: number,
    input: { parent_id: number | null },
  ) => Promise<{ success: boolean; message?: string }>
}

function FolderTreeItem({
  node,
  depth = 0,
  bookmarks,
  folders,
  onFolderContextMenu,
  moveFolder,
}: FolderTreeItemProps) {
  const { selectedFolderId, selectFolder, openCreateFolderModal } = useFolders()
  const { clearSelectedSession } = useSessions()
  const { openAddModal, clearSelectedBookmark } = useBookmarks()

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

  const isActive = selectedFolderId === node.folder_id

  const { isDragOver, dropTargetProps } = useFolderDropTarget(node.folder_id, bookmarks, {
    folders,
    moveFolder,
    onBookmarkMoved: () => {
      selectFolder(node.folder_id)
      setIsExpanded(true)
    },
    onFolderMoved: () => {
      selectFolder(node.folder_id)
      setIsExpanded(true)
    },
  })

  const handleFolderActivate = () => {
    setIsExpanded((current) => !current)
    selectFolder(node.folder_id)
    clearSelectedSession()
    clearSelectedBookmark()
  }

  return (
    <div className="sidebar__folder-group">
      <div
        className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''} ${isDragOver ? 'sidebar__folder-row--drag-over' : ''}`}
        style={{ paddingLeft: `${0.45 + depth * 1.1}rem` }}
        draggable
        onDragStart={(event) => {
          setFolderDragData(event.dataTransfer, node.folder_id)
          event.stopPropagation()
        }}
        {...dropTargetProps}
        onContextMenu={(event) => onFolderContextMenu(event, node)}
      >
        <button
          type="button"
          className="sidebar__tree-toggle"
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          onClick={handleFolderActivate}
        >
          {isExpanded ? '▾' : '▸'}
        </button>

        <span className="sidebar__folder-icon">
          <FolderIcon />
        </span>

        <button type="button" className="sidebar__tree-label sidebar__tree-label--folder" onClick={handleFolderActivate}>
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
              folders={folders}
              onFolderContextMenu={onFolderContextMenu}
              moveFolder={moveFolder}
            />
          ))}

          {folderBookmarks.map((bookmark) => (
            <SidebarBookmarkItem key={bookmark.bookmark_id} bookmark={bookmark} depth={depth + 1} />
          ))}

          <div
            className={`sidebar__folder-slot ${isDragOver ? 'sidebar__folder-slot--drag-over' : ''}`}
            style={{ paddingLeft: `${0.75 + (depth + 1) * 1.1}rem` }}
            {...dropTargetProps}
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
  folders: Folder[]
  moveFolder: (
    folderId: number,
    input: { parent_id: number | null },
  ) => Promise<{ success: boolean; message?: string }>
}

function UncategorizedSection({ bookmarks, folders, moveFolder }: UncategorizedSectionProps) {
  const { selectedFolderId, selectFolder } = useFolders()
  const { clearSelectedSession } = useSessions()
  const { clearSelectedBookmark } = useBookmarks()
  const uncategorizedBookmarks = useMemo(
    () =>
      bookmarks
        .filter((bookmark) => bookmark.folder_id === null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [bookmarks],
  )

  const [isExpanded, setIsExpanded] = useState(uncategorizedBookmarks.length > 0)
  const isActive = selectedFolderId === null

  const { isDragOver, dropTargetProps } = useFolderDropTarget(null, bookmarks, {
    folders,
    moveFolder,
    onBookmarkMoved: () => {
      selectFolder(null)
      setIsExpanded(true)
    },
    onFolderMoved: () => {
      selectFolder(null)
      setIsExpanded(true)
    },
  })

  const handleUncategorizedActivate = () => {
    setIsExpanded((current) => !current)
    selectFolder(null)
    clearSelectedSession()
    clearSelectedBookmark()
  }

  return (
    <div className="sidebar__folder-group">
      <div
        className={`sidebar__folder-row ${isActive ? 'sidebar__folder-row--active' : ''} ${isDragOver ? 'sidebar__folder-row--drag-over' : ''}`}
        {...dropTargetProps}
      >
        <button
          type="button"
          className="sidebar__tree-toggle"
          aria-label={isExpanded ? 'Collapse uncategorized' : 'Expand uncategorized'}
          onClick={handleUncategorizedActivate}
        >
          {isExpanded ? '▾' : '▸'}
        </button>

        <span className="sidebar__folder-icon">
          <FolderIcon />
        </span>

        <button
          type="button"
          className="sidebar__tree-label sidebar__tree-label--folder"
          onClick={handleUncategorizedActivate}
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
    moveFolder,
  } = useFolders()
  const { clearSelectedSession } = useSessions()
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
          clearSelectedSession()
          clearSelectedBookmark()
        }}
      >
        All bookmarks
      </button>

      <UncategorizedSection bookmarks={bookmarks} folders={folders} moveFolder={moveFolder} />

      {isLoading ? <p className="sidebar__status">Loading folders...</p> : null}

      {!isLoading && folderTree.length === 0 ? (
        <p className="sidebar__status">No folders yet.</p>
      ) : null}

      {folderTree.map((node) => (
        <FolderTreeItem
          key={node.folder_id}
          node={node}
          bookmarks={bookmarks}
          folders={folders}
          onFolderContextMenu={handleFolderContextMenu}
          moveFolder={moveFolder}
        />
      ))}

      <SessionsSection />

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
