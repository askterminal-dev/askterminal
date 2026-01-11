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

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  pty: ptyAPI
})

// Type declarations for renderer
declare global {
  interface Window {
    electron: {
      pty: typeof ptyAPI
    }
  }
}
