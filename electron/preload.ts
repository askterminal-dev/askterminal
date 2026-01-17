import { contextBridge, ipcRenderer } from 'electron'

// PTY API
const ptyAPI = {
  spawn: (): Promise<boolean> => ipcRenderer.invoke('pty:spawn'),
  write: (data: string): Promise<void> => ipcRenderer.invoke('pty:write', data),
  resize: (cols: number, rows: number): Promise<void> => ipcRenderer.invoke('pty:resize', cols, rows),
  getCwd: (): Promise<string> => ipcRenderer.invoke('pty:getCwd'),
  onData: (callback: (data: string) => void) => {
    ipcRenderer.on('pty:data', (_, data) => callback(data))
  },
  onExit: (callback: (code: number) => void) => {
    ipcRenderer.on('pty:exit', (_, code) => callback(code))
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('pty:data')
    ipcRenderer.removeAllListeners('pty:exit')
  }
}

// Filesystem API for autocomplete
interface DirEntry {
  name: string
  isDirectory: boolean
}

interface CompletionResult {
  dir: string
  matches: Array<{ name: string; isDirectory: boolean; fullPath: string }>
}

const fsAPI = {
  listDir: (dirPath: string): Promise<DirEntry[]> =>
    ipcRenderer.invoke('fs:listDir', dirPath),
  getCompletions: (partialPath: string, cwd: string): Promise<CompletionResult> =>
    ipcRenderer.invoke('fs:getCompletions', partialPath, cwd)
}

// App API for menu-triggered actions
const appAPI = {
  onShowAboutModal: (callback: () => void) => {
    ipcRenderer.on('show-about-modal', callback)
    return () => ipcRenderer.removeListener('show-about-modal', callback)
  },
  onShowSettingsModal: (callback: () => void) => {
    ipcRenderer.on('show-settings-modal', callback)
    return () => ipcRenderer.removeListener('show-settings-modal', callback)
  }
}

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  pty: ptyAPI,
  fs: fsAPI,
  app: appAPI
})

// Type declarations for renderer
declare global {
  interface Window {
    electron: {
      pty: typeof ptyAPI
      fs: typeof fsAPI
      app: typeof appAPI
    }
  }
}
