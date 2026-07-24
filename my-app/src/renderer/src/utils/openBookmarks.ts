export async function openBookmarksInBrowser(urls: string[]) {
  const validUrls = urls.filter((url) => typeof url === 'string' && url.trim().length > 0)

  if (validUrls.length === 0) {
    return
  }

  const api = window.api

  if (api?.openExternalUrls) {
    await api.openExternalUrls(validUrls)
    return
  }

  for (const url of validUrls) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
