import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'
import {
  CreateFolderInput,
  Folder,
  MoveFolderInput,
  RenameFolderInput,
} from '@renderer/types/folder'

interface FoldersContextValue {
  folders: Folder[]
  isLoading: boolean
  selectedFolderId: number | null | 'all'
  createFolderTargetParentId: number | null | undefined
  renameTarget: Folder | null
  deleteTarget: Folder | null
  loadFolders: () => Promise<void>
  selectFolder: (folderId: number | null | 'all') => void
  openCreateFolderModal: (parentId?: number | null) => void
  closeCreateFolderModal: () => void
  openRenameFolderModal: (folder: Folder) => void
  closeRenameFolderModal: () => void
  openDeleteFolderModal: (folder: Folder) => void
  closeDeleteFolderModal: () => void
  createFolder: (input: CreateFolderInput) => Promise<{ success: boolean; message?: string }>
  renameFolder: (
    folderId: number,
    input: RenameFolderInput,
  ) => Promise<{ success: boolean; message?: string }>
  moveFolder: (
    folderId: number,
    input: MoveFolderInput,
  ) => Promise<{ success: boolean; message?: string }>
  deleteFolder: (
    folderId: number,
  ) => Promise<{ success: boolean; message?: string; deletedFolderIds?: number[] }>
}

const FoldersContext = createContext<FoldersContextValue | undefined>(undefined)

export function FoldersProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | 'all'>('all')
  const [createFolderTargetParentId, setCreateFolderTargetParentId] = useState<
    number | null | undefined
  >(undefined)
  const [renameTarget, setRenameTarget] = useState<Folder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null)

  const loadFolders = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await auth.fetchWithAuth('/folders')

      if (!response?.ok) {
        setFolders([])
        return
      }

      const data = (await response.json()) as Folder[]
      setFolders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load folders.', error)
      setFolders([])
    } finally {
      setIsLoading(false)
    }
  }, [auth])

  useEffect(() => {
    if (auth.isAuth) {
      loadFolders()
    } else {
      setFolders([])
      setIsLoading(false)
      setSelectedFolderId('all')
    }
  }, [auth.isAuth, loadFolders])

  const createFolder = useCallback(
    async (input: CreateFolderInput) => {
      try {
        const response = await auth.fetchWithAuth('/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to create folder',
          }
        }

        const folder = responseJSON as Folder
        setFolders((current) => [...current, folder].sort((a, b) => a.name.localeCompare(b.name)))
        return { success: true }
      } catch (error) {
        console.error('Failed to create folder.', error)
        return { success: false, message: 'Unable to create folder' }
      }
    },
    [auth],
  )

  const renameFolder = useCallback(
    async (folderId: number, input: RenameFolderInput) => {
      try {
        const response = await auth.fetchWithAuth(`/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to rename folder',
          }
        }

        const folder = responseJSON as Folder
        setFolders((current) =>
          current
            .map((item) => (item.folder_id === folderId ? folder : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to rename folder.', error)
        return { success: false, message: 'Unable to rename folder' }
      }
    },
    [auth],
  )

  const moveFolder = useCallback(
    async (folderId: number, input: MoveFolderInput) => {
      try {
        const response = await auth.fetchWithAuth(`/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to move folder',
          }
        }

        const folder = responseJSON as Folder
        setFolders((current) =>
          current
            .map((item) => (item.folder_id === folderId ? folder : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        return { success: true }
      } catch (error) {
        console.error('Failed to move folder.', error)
        return { success: false, message: 'Unable to move folder' }
      }
    },
    [auth],
  )

  const deleteFolder = useCallback(
    async (folderId: number) => {
      try {
        const response = await auth.fetchWithAuth(`/folders/${folderId}`, {
          method: 'DELETE',
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to delete folder',
          }
        }

        const deletedFolderIds = Array.isArray(responseJSON?.deletedFolderIds)
          ? (responseJSON.deletedFolderIds as number[])
          : [folderId]

        setFolders((current) =>
          current.filter((folder) => !deletedFolderIds.includes(folder.folder_id)),
        )
        setSelectedFolderId((current) =>
          typeof current === 'number' && deletedFolderIds.includes(current) ? 'all' : current,
        )

        return { success: true, deletedFolderIds }
      } catch (error) {
        console.error('Failed to delete folder.', error)
        return { success: false, message: 'Unable to delete folder' }
      }
    },
    [auth],
  )

  const value = useMemo<FoldersContextValue>(
    () => ({
      folders,
      isLoading,
      selectedFolderId,
      createFolderTargetParentId,
      renameTarget,
      deleteTarget,
      loadFolders,
      selectFolder: setSelectedFolderId,
      openCreateFolderModal: (parentId = null) => setCreateFolderTargetParentId(parentId),
      closeCreateFolderModal: () => setCreateFolderTargetParentId(undefined),
      openRenameFolderModal: (folder) => setRenameTarget(folder),
      closeRenameFolderModal: () => setRenameTarget(null),
      openDeleteFolderModal: (folder) => setDeleteTarget(folder),
      closeDeleteFolderModal: () => setDeleteTarget(null),
      createFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
    }),
    [
      folders,
      isLoading,
      selectedFolderId,
      createFolderTargetParentId,
      renameTarget,
      deleteTarget,
      loadFolders,
      createFolder,
      renameFolder,
      moveFolder,
      deleteFolder,
    ],
  )

  return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>
}

export function useFolders() {
  const context = useContext(FoldersContext)

  if (!context) {
    throw new Error('useFolders requires FoldersProvider')
  }

  return context
}
