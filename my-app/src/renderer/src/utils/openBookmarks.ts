export function normalizeBookmarkUrl(url: string): string {
  const trimmed = url.trim()

  if (!trimmed) {
    return trimmed
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function openBookmarkUrl(url: string): void {
  const normalizedUrl = normalizeBookmarkUrl(url)

  if (!normalizedUrl) {
    return
  }

  const link = document.createElement('a')
  link.href = normalizedUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function openBookmarksInBrowser(urls: string[]): Promise<void> {
  const validUrls = urls.filter((url) => typeof url === 'string' && url.trim().length > 0)

  for (const url of validUrls) {
    openBookmarkUrl(url)
    await new Promise((resolve) => window.setTimeout(resolve, 75))
  }
}
