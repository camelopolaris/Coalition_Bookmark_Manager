/// <reference types="vite/client" />

interface CoalitionApi {
  getApiBaseUrl?: () => string
  openExternalUrls?: (urls: string[]) => Promise<void>
}

declare global {
  interface Window {
    api?: CoalitionApi
  }
}

export {}
