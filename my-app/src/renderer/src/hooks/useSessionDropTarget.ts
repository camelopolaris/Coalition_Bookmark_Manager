import { DragEvent, useCallback, useRef, useState } from 'react'
import { isBookmarkDragEvent, readBookmarkDragId } from '@renderer/constants/drag'

export function useSessionDropTarget(
  sessionId: number,
  bookmarkIds: number[],
  onBookmarkAdded: () => void,
  addBookmarkToSession: (
    sessionId: number,
    bookmarkId: number,
  ) => Promise<{ success: boolean; message?: string }>,
) {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragDepthRef = useRef(0)

  const resetDragState = useCallback(() => {
    dragDepthRef.current = 0
    setIsDragOver(false)
  }, [])

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isBookmarkDragEvent(event)) {
      return
    }

    event.preventDefault()
    dragDepthRef.current += 1
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isBookmarkDragEvent(event)) {
      return
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)

    if (dragDepthRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isBookmarkDragEvent(event)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      if (!isBookmarkDragEvent(event)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      resetDragState()

      const bookmarkId = readBookmarkDragId(event.dataTransfer)
      if (bookmarkId === null) {
        return
      }

      if (bookmarkIds.includes(bookmarkId)) {
        onBookmarkAdded()
        return
      }

      const result = await addBookmarkToSession(sessionId, bookmarkId)
      if (result.success) {
        onBookmarkAdded()
      }
    },
    [addBookmarkToSession, bookmarkIds, onBookmarkAdded, resetDragState, sessionId],
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
