export interface BookmarkTimestamp {
  bookmark_id: number
  timestamp_value: string
  note_content: string
}

export interface BookmarkPageNumber {
  bookmark_id: number
  page_number: number
  note_content: string
}

export interface TimestampFormFields {
  timestamp_value: string
  note_content: string
}

export interface PageNumberFormFields {
  page_number: string
  note_content: string
}

export function createEmptyTimestampFormFields(): TimestampFormFields {
  return {
    timestamp_value: '',
    note_content: '',
  }
}

export function createEmptyPageNumberFormFields(): PageNumberFormFields {
  return {
    page_number: '',
    note_content: '',
  }
}

export function timestampToFormFields(timestamp: BookmarkTimestamp): TimestampFormFields {
  return {
    timestamp_value: timestamp.timestamp_value,
    note_content: timestamp.note_content,
  }
}

export function pageNumberToFormFields(pageNumber: BookmarkPageNumber): PageNumberFormFields {
  return {
    page_number: String(pageNumber.page_number),
    note_content: pageNumber.note_content,
  }
}

export function validateTimestampFormFields(fields: TimestampFormFields): string | null {
  const trimmed = fields.timestamp_value.trim()

  if (!trimmed) {
    return 'Timestamp is required.'
  }

  const partsMatch = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)

  if (partsMatch) {
    const hasHours = partsMatch[3] !== undefined
    const minutes = hasHours ? Number(partsMatch[2]) : Number(partsMatch[1])
    const seconds = hasHours ? Number(partsMatch[3]) : Number(partsMatch[2])

    if (minutes >= 60 || seconds >= 60) {
      return 'Minutes and seconds must be less than 60.'
    }

    return null
  }

  if (/^\d+$/.test(trimmed)) {
    return null
  }

  return 'Use HH:MM:SS, MM:SS, or total seconds.'
}

export function validatePageNumberFormFields(fields: PageNumberFormFields): string | null {
  const pageNumber = Number(fields.page_number.trim())

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return 'Page number must be a positive integer.'
  }

  return null
}

export function normalizeTimestampFormFields(fields: TimestampFormFields): TimestampFormFields {
  return {
    timestamp_value: fields.timestamp_value.trim(),
    note_content: fields.note_content.trim(),
  }
}

export function normalizePageNumberFormFields(fields: PageNumberFormFields): PageNumberFormFields {
  return {
    page_number: fields.page_number.trim(),
    note_content: fields.note_content.trim(),
  }
}

export function formatTimestampLabel(timestampValue: string) {
  const parts = timestampValue.split(':').map(Number)

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return timestampValue
  }

  const [hours, minutes, seconds] = parts

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
