export interface Folder {
  folder_id: number
  name: string
  parent_id: number | null
  user_id?: number
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[]
}

export interface CreateFolderInput {
  name: string
  parent_id?: number | null
}

export interface RenameFolderInput {
  name: string
}

export interface MoveFolderInput {
  parent_id: number | null
}

export const FOLDER_NAME_MAX_LENGTH = 255

export function collectDescendantFolderIds(folders: Folder[], rootFolderId: number) {
  const ids = new Set<number>([rootFolderId])
  let changed = true

  while (changed) {
    changed = false

    for (const folder of folders) {
      if (
        folder.parent_id !== null &&
        ids.has(folder.parent_id) &&
        !ids.has(folder.folder_id)
      ) {
        ids.add(folder.folder_id)
        changed = true
      }
    }
  }

  return [...ids]
}

export function canMoveFolderToParent(
  folders: Folder[],
  folderId: number,
  parentId: number | null,
) {
  if (parentId === folderId) {
    return false
  }

  if (parentId === null) {
    return true
  }

  const descendantIds = collectDescendantFolderIds(folders, folderId)
  return !descendantIds.includes(parentId)
}

export function validateFolderName(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'Folder name is required.'
  }

  if (trimmed.length > FOLDER_NAME_MAX_LENGTH) {
    return `Folder name must be ${FOLDER_NAME_MAX_LENGTH} characters or fewer.`
  }

  return null
}

export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const nodes = new Map<number, FolderTreeNode>()

  for (const folder of folders) {
    nodes.set(folder.folder_id, { ...folder, children: [] })
  }

  const roots: FolderTreeNode[] = []

  for (const folder of folders) {
    const node = nodes.get(folder.folder_id)
    if (!node) {
      continue
    }

    if (folder.parent_id === null) {
      roots.push(node)
      continue
    }

    const parent = nodes.get(folder.parent_id)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
