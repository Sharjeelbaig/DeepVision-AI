const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { setTimeout: delay } = require('node:timers/promises')

const isDev = !app.isPackaged
const devServerURL = process.env.ELECTRON_VITE_DEV_SERVER_URL ?? 'http://localhost:5173'
let devServerProcess

const startViteDevServer = () => {
  if (!isDev || devServerProcess) {
    return
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  devServerProcess = spawn(npmCommand, ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit'
  })

  devServerProcess.on('exit', (code, signal) => {
    devServerProcess = undefined
    if (code !== null && code !== 0) {
      console.warn(`Vite dev server exited with code ${code}`)
    }
    if (signal) {
      console.warn(`Vite dev server was killed via ${signal}`)
    }
  })
}

const stopViteDevServer = () => {
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill('SIGINT')
  }
}

const waitForDevServer = async (retries = 60, interval = 500) => {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(devServerURL, { method: 'HEAD' })
      if (response.ok) {
        return
      }
    } catch (error) {
      // Ignore until server is ready
    }

    await delay(interval)
  }

  throw new Error(`Timed out waiting for Vite dev server at ${devServerURL}`)
}

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  if (isDev) {
    await waitForDevServer()
    await mainWindow.loadURL(devServerURL)
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    await mainWindow.loadFile(indexPath)
  }

  // mainWindow.webContents.openDevTools()
}

if (isDev) {
  startViteDevServer()
}

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  stopViteDevServer()
})

process.on('exit', () => {
  stopViteDevServer()
})
