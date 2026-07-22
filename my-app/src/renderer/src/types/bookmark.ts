export interface Bookmark {
  bookmark_id: number
  name: string
  url: string
  user_id?: number
}

/** Editable bookmark columns — extend when new bookmark fields are added. */
export interface BookmarkFormFields {
  name: string
  url: string
}

export type CreateBookmarkInput = BookmarkFormFields
export type UpdateBookmarkInput = BookmarkFormFields

export const BOOKMARK_NAME_MAX_LENGTH = 255

/** Form field keys in display order — keep in sync with backend BOOKMARK_WRITABLE_FIELDS. */
export const BOOKMARK_FORM_FIELD_KEYS = ['name', 'url'] as const satisfies readonly (keyof BookmarkFormFields)[]

export function createEmptyBookmarkFormFields(): BookmarkFormFields {
  return {
    name: '',
    url: '',
  }
}

export function bookmarkToFormFields(bookmark: Bookmark): BookmarkFormFields {
  return {
    name: bookmark.name,
    url: bookmark.url,
  }
}

export function validateBookmarkFormFields(fields: BookmarkFormFields): string | null {
  const trimmedName = fields.name.trim()
  const trimmedUrl = fields.url.trim()

  if (!trimmedName || !trimmedUrl) {
    return 'Name and URL are required.'
  }

  if (trimmedName.length > BOOKMARK_NAME_MAX_LENGTH) {
    return `Name must be ${BOOKMARK_NAME_MAX_LENGTH} characters or fewer.`
  }

  return null
}

export function normalizeBookmarkFormFields(fields: BookmarkFormFields): BookmarkFormFields {
  return {
    name: fields.name.trim(),
    url: fields.url.trim(),
  }
}
