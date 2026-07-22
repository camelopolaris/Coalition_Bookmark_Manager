import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'
import {
  BookmarkPageNumber,
  BookmarkTimestamp,
  TimestampFormFields,
} from '@renderer/types/bookmarkAnnotation'

interface MutationResult {
  success: boolean
  message?: string
}

export function useBookmarkAnnotations(bookmarkId: number) {
  const auth = useAuth()
  const [timestamps, setTimestamps] = useState<BookmarkTimestamp[]>([])
  const [pageNumbers, setPageNumbers] = useState<BookmarkPageNumber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnnotations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [timestampsResponse, pageNumbersResponse] = await Promise.all([
        auth.fetchWithAuth(`/bookmarks/${bookmarkId}/timestamps`),
        auth.fetchWithAuth(`/bookmarks/${bookmarkId}/page-numbers`),
      ])

      if (!timestampsResponse?.ok || !pageNumbersResponse?.ok) {
        setTimestamps([])
        setPageNumbers([])
        setError('Unable to load bookmark notes.')
        return
      }

      const timestampsData = (await timestampsResponse.json()) as BookmarkTimestamp[]
      const pageNumbersData = (await pageNumbersResponse.json()) as BookmarkPageNumber[]

      setTimestamps(Array.isArray(timestampsData) ? timestampsData : [])
      setPageNumbers(Array.isArray(pageNumbersData) ? pageNumbersData : [])
    } catch (loadError) {
      console.error('Failed to load bookmark annotations.', loadError)
      setTimestamps([])
      setPageNumbers([])
      setError('Unable to load bookmark notes.')
    } finally {
      setIsLoading(false)
    }
  }, [auth, bookmarkId])

  useEffect(() => {
    loadAnnotations()
  }, [loadAnnotations])

  const createTimestamp = useCallback(
    async (fields: TimestampFormFields): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/timestamps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to add timestamp',
          }
        }

        const timestamp = responseJSON as BookmarkTimestamp
        setTimestamps((current) =>
          [...current, timestamp].sort((a, b) =>
            a.timestamp_value.localeCompare(b.timestamp_value),
          ),
        )
        return { success: true }
      } catch (createError) {
        console.error('Failed to create timestamp.', createError)
        return { success: false, message: 'Unable to add timestamp' }
      }
    },
    [auth, bookmarkId],
  )

  const updateTimestamp = useCallback(
    async (
      originalTimestampValue: string,
      fields: Partial<TimestampFormFields>,
    ): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/timestamps`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_timestamp_value: originalTimestampValue,
            ...fields,
          }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to update timestamp',
          }
        }

        const timestamp = responseJSON as BookmarkTimestamp
        setTimestamps((current) =>
          current
            .filter((item) => item.timestamp_value !== originalTimestampValue)
            .concat(timestamp)
            .sort((a, b) => a.timestamp_value.localeCompare(b.timestamp_value)),
        )
        return { success: true }
      } catch (updateError) {
        console.error('Failed to update timestamp.', updateError)
        return { success: false, message: 'Unable to update timestamp' }
      }
    },
    [auth, bookmarkId],
  )

  const deleteTimestamp = useCallback(
    async (timestampValue: string): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/timestamps`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp_value: timestampValue }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to delete timestamp',
          }
        }

        setTimestamps((current) =>
          current.filter((item) => item.timestamp_value !== timestampValue),
        )
        return { success: true }
      } catch (deleteError) {
        console.error('Failed to delete timestamp.', deleteError)
        return { success: false, message: 'Unable to delete timestamp' }
      }
    },
    [auth, bookmarkId],
  )

  const createPageNumber = useCallback(
    async (fields: { page_number: number; note_content: string }): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/page-numbers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to add page number',
          }
        }

        const pageNumber = responseJSON as BookmarkPageNumber
        setPageNumbers((current) =>
          [...current, pageNumber].sort((a, b) => a.page_number - b.page_number),
        )
        return { success: true }
      } catch (createError) {
        console.error('Failed to create page number.', createError)
        return { success: false, message: 'Unable to add page number' }
      }
    },
    [auth, bookmarkId],
  )

  const updatePageNumber = useCallback(
    async (
      originalPageNumber: number,
      fields: Partial<{ page_number: number; note_content: string }>,
    ): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/page-numbers`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_page_number: originalPageNumber,
            ...fields,
          }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to update page number',
          }
        }

        const pageNumber = responseJSON as BookmarkPageNumber
        setPageNumbers((current) =>
          current
            .filter((item) => item.page_number !== originalPageNumber)
            .concat(pageNumber)
            .sort((a, b) => a.page_number - b.page_number),
        )
        return { success: true }
      } catch (updateError) {
        console.error('Failed to update page number.', updateError)
        return { success: false, message: 'Unable to update page number' }
      }
    },
    [auth, bookmarkId],
  )

  const deletePageNumber = useCallback(
    async (pageNumber: number): Promise<MutationResult> => {
      try {
        const response = await auth.fetchWithAuth(`/bookmarks/${bookmarkId}/page-numbers`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_number: pageNumber }),
        })

        const responseJSON = await response?.json().catch(() => ({}))

        if (!response?.ok) {
          return {
            success: false,
            message: responseJSON?.message || 'Unable to delete page number',
          }
        }

        setPageNumbers((current) => current.filter((item) => item.page_number !== pageNumber))
        return { success: true }
      } catch (deleteError) {
        console.error('Failed to delete page number.', deleteError)
        return { success: false, message: 'Unable to delete page number' }
      }
    },
    [auth, bookmarkId],
  )

  return {
    timestamps,
    pageNumbers,
    isLoading,
    error,
    reload: loadAnnotations,
    createTimestamp,
    updateTimestamp,
    deleteTimestamp,
    createPageNumber,
    updatePageNumber,
    deletePageNumber,
  }
}
