export interface Bookmark {
  bookmark_id: number
  name: string
  url: string
  user_id?: number
}

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    bookmark_id: 1,
    name: 'PostgreSQL Home Page',
    url: 'https://www.postgresql.org/',
  },
  {
    bookmark_id: 2,
    name: 'University of Georgia',
    url: 'https://www.uga.edu/',
  },
  {
    bookmark_id: 3,
    name: 'React Documentation',
    url: 'https://react.dev/',
  },
]
