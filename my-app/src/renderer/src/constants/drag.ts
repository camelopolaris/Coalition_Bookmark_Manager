export const BOOKMARK_DRAG_MIME = 'application/x-coalition-bookmark-id'
export const FOLDER_DRAG_MIME = 'application/x-coalition-folder-id'

export function setBookmarkDragData(dataTransfer: DataTransfer, bookmarkId: number) {
  dataTransfer.setData(BOOKMARK_DRAG_MIME, String(bookmarkId))
  dataTransfer.setData('text/plain', `bookmark:${bookmarkId}`)
  dataTransfer.effectAllowed = 'copyMove'
}

export function setFolderDragData(dataTransfer: DataTransfer, folderId: number) {
  dataTransfer.setData(FOLDER_DRAG_MIME, String(folderId))
  dataTransfer.setData('text/plain', `folder:${folderId}`)
  dataTransfer.effectAllowed = 'move'
}

export function readBookmarkDragId(dataTransfer: DataTransfer): number | null {
  const customType = dataTransfer.getData(BOOKMARK_DRAG_MIME)
  if (customType) {
    const id = Number(customType)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  const plain = dataTransfer.getData('text/plain')
  if (plain.startsWith('bookmark:')) {
    const id = Number(plain.slice('bookmark:'.length))
    return Number.isInteger(id) && id > 0 ? id : null
  }

  return null
}

export function readFolderDragId(dataTransfer: DataTransfer): number | null {
  const customType = dataTransfer.getData(FOLDER_DRAG_MIME)
  if (customType) {
    const id = Number(customType)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  const plain = dataTransfer.getData('text/plain')
  if (plain.startsWith('folder:')) {
    const id = Number(plain.slice('folder:'.length))
    return Number.isInteger(id) && id > 0 ? id : null
  }

  return null
}

export function isBookmarkDragEvent(event: DragEvent) {
  const types = event.dataTransfer?.types

  if (!types) {
    return false
  }

  const typeList = Array.from(types)

  if (typeList.includes(BOOKMARK_DRAG_MIME)) {
    return true
  }

  if (typeList.includes(FOLDER_DRAG_MIME)) {
    return false
  }

  return typeList.includes('text/plain')
}

export function isFolderDragEvent(event: DragEvent) {
  const types = event.dataTransfer?.types

  if (!types) {
    return false
  }

  return Array.from(types).includes(FOLDER_DRAG_MIME)
}

export function isOrganizeDragEvent(event: DragEvent) {
  return isBookmarkDragEvent(event) || isFolderDragEvent(event)
}
