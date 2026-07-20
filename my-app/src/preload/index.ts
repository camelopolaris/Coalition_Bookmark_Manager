import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

const api = {
  getApiBaseUrl: () => (process.env.EXPRESS_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/['"]/g, '').trim(),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
