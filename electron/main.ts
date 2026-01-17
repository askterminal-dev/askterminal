import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import { join } from 'path'
import * as ptyModule from 'node-pty'
import type { IPty } from 'node-pty'

let mainWindow: BrowserWindow | null = null
let pty: IPty | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()  // Uncomment to debug
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// PTY Management
function createPty() {
  // Try multiple shells
  const shells = ['/bin/zsh', '/bin/bash', '/bin/sh']
  const shell = shells.find(s => {
    try {
      require('fs').accessSync(s, require('fs').constants.X_OK)
      return true
    } catch {
      return false
    }
  }) || '/bin/sh'

  const home = process.env.HOME || app.getPath('home')

  console.log('Creating PTY with shell:', shell, 'cwd:', home)

  try {
    pty = ptyModule.spawn(shell, ['-l'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: home,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      } as { [key: string]: string }
    })

    pty.onData((data) => {
      mainWindow?.webContents.send('pty:data', data)
    })

    pty.onExit(({ exitCode }) => {
      mainWindow?.webContents.send('pty:exit', exitCode)
    })

    console.log('PTY created successfully, pid:', pty.pid)
    return pty
  } catch (error) {
    console.error('Failed to create PTY:', error)
    // Log more details
    console.error('Shell:', shell)
    console.error('Home:', home)
    console.error('Node version:', process.version)
    console.error('Electron version:', process.versions.electron)
    return null
  }
}

// IPC Handlers
ipcMain.handle('pty:spawn', () => {
  if (pty) {
    pty.kill()
  }
  createPty()
  return true
})

ipcMain.handle('pty:write', (_, data: string) => {
  pty?.write(data)
})

ipcMain.handle('pty:resize', (_, cols: number, rows: number) => {
  pty?.resize(cols, rows)
})

ipcMain.handle('pty:getCwd', () => {
  // This is approximate - getting actual CWD from PTY is complex
  return process.env.HOME
})

// Directory listing for autocomplete
ipcMain.handle('fs:listDir', async (_, dirPath: string) => {
  const fs = require('fs')
  const path = require('path')

  try {
    // Expand ~ to home directory
    const expandedPath = dirPath.replace(/^~/, process.env.HOME || '')
    const resolvedPath = path.resolve(expandedPath)

    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true })
    return entries.map((entry: any) => ({
      name: entry.name,
      isDirectory: entry.isDirectory()
    }))
  } catch (error) {
    return []
  }
})

// Get completions for a partial path
ipcMain.handle('fs:getCompletions', async (_, partialPath: string, cwd: string) => {
  const fs = require('fs')
  const path = require('path')

  try {
    // Expand ~ to home directory
    let expandedPath = partialPath.replace(/^~/, process.env.HOME || '')

    // If not absolute, resolve relative to cwd
    if (!path.isAbsolute(expandedPath)) {
      expandedPath = path.join(cwd.replace(/^~/, process.env.HOME || ''), expandedPath)
    }

    const dir = path.dirname(expandedPath)
    const prefix = path.basename(expandedPath)

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const matches = entries
      .filter((entry: any) => entry.name.startsWith(prefix))
      .map((entry: any) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        fullPath: path.join(dir, entry.name)
      }))

    return { dir, matches }
  } catch (error) {
    return { dir: '', matches: [] }
  }
})

// Application Menu
function createMenu() {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: 'About AskTerminal',
          click: () => {
            mainWindow?.webContents.send('show-about-modal')
          }
        },
        { type: 'separator' as const },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('show-settings-modal')
          }
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AskTerminal',
          click: () => {
            mainWindow?.webContents.send('show-about-modal')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// App lifecycle
app.whenReady().then(async () => {
  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        ]
      }
    })
  })

  createWindow()
  createMenu()

  // Delay PTY creation slightly to ensure window is ready
  setTimeout(() => {
    createPty()
  }, 500)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      setTimeout(() => createPty(), 500)
    }
  })
})

app.on('window-all-closed', () => {
  if (pty) {
    pty.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
