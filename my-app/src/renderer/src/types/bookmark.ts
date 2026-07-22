export interface Bookmark {
  bookmark_id: number
  name: string
  url: string
  user_id?: number
}

export interface CreateBookmarkInput {
  name: string
  url: string
}

export const BOOKMARK_NAME_MAX_LENGTH = 255
