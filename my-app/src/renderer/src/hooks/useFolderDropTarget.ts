import { DragEvent, useCallback, useRef, useState } from 'react'
import { Bookmark } from '@renderer/types/bookmark'
import { Folder, canMoveFolderToParent } from '@renderer/types/folder'
import { useBookmarks } from '@renderer/contexts/BookmarksContext'
import {
  isBookmarkDragEvent,
  isFolderDragEvent,
  isOrganizeDragEvent,
  readBookmarkDragId,
  readFolderDragId,
} from '@renderer/constants/drag'

interface UseFolderDropTargetOptions {
  folders: Folder[]
  onBookmarkMoved?: () => void
  onFolderMoved?: () => void
  moveFolder?: (
    folderId: number,
    input: { parent_id: number | null },
  ) => Promise<{ success: boolean; message?: string }>
}

export function useFolderDropTarget(
  targetFolderId: number | null,
  bookmarks: Bookmark[],
  options: UseFolderDropTargetOptions,
) {
  const { moveBookmarkToFolder } = useBookmarks()
  const { folders, onBookmarkMoved, onFolderMoved, moveFolder } = options
  const [isDragOver, setIsDragOver] = useState(false)
  const dragDepthRef = useRef(0)

  const resetDragState = useCallback(() => {
    dragDepthRef.current = 0
    setIsDragOver(false)
  }, [])

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isOrganizeDragEvent(event)) {
      return
    }

    event.preventDefault()
    dragDepthRef.current += 1
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isOrganizeDragEvent(event)) {
      return
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)

    if (dragDepthRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isOrganizeDragEvent(event)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      if (!isOrganizeDragEvent(event)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      resetDragState()

      if (isFolderDragEvent(event) && moveFolder) {
        const folderId = readFolderDragId(event.dataTransfer)
        if (folderId === null) {
          return
        }

        if (!canMoveFolderToParent(folders, folderId, targetFolderId)) {
          return
        }

        const folder = folders.find((item) => item.folder_id === folderId)
        if (folder?.parent_id === targetFolderId) {
          onFolderMoved?.()
          return
        }

        const result = await moveFolder(folderId, { parent_id: targetFolderId })
        if (result.success) {
          onFolderMoved?.()
        }
        return
      }

      if (!isBookmarkDragEvent(event)) {
        return
      }

      const bookmarkId = readBookmarkDragId(event.dataTransfer)
      if (bookmarkId === null) {
        return
      }

      const bookmark = bookmarks.find((item) => item.bookmark_id === bookmarkId)
      if (bookmark?.folder_id === targetFolderId) {
        onBookmarkMoved?.()
        return
      }

      const result = await moveBookmarkToFolder(bookmarkId, targetFolderId)
      if (result.success) {
        onBookmarkMoved?.()
      }
    },
    [
      bookmarks,
      folders,
      moveBookmarkToFolder,
      moveFolder,
      onBookmarkMoved,
      onFolderMoved,
      resetDragState,
      targetFolderId,
    ],
  )

  return {
    isDragOver,
    dropTargetProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  }
}
